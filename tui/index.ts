#!/usr/bin/env node
import blessed from 'blessed';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import { ChannelType, Client, DMChannel, GatewayIntentBits, Events, TextChannel, VoiceChannel } from 'discord.js';
import { entersState, joinVoiceChannel, VoiceConnectionStatus, type VoiceConnection } from '@discordjs/voice';
import { patchBlessedUnicode } from './utils/unicodePatch.js';
import { setupKeyBindings } from './handlers/keyHandler.js';
import { setupMessageHandlers } from './handlers/messageHandler.js';
import { handleChannelSelect, handleVoiceChannelSelect } from './handlers/channelHandler.js';
import { setupSidebarHandlers } from './handlers/sidebarHandler.js';
import { runSetup } from './setup.js';
import { createBlessedUIBridge } from './ui/blessedBridge.js';
import { buildSidebarModel } from './utils/channelList.js';
import type { SelectableChannel } from './utils/channelList.js';
import { showLauncher } from './ui/launcher.js';
import { clear } from 'console';

const launcherResult = await showLauncher();
const keepAlive = setInterval(() => {}, 1000);

if (launcherResult === 'setup') {
	await runSetup();
	clearInterval(keepAlive);
	process.exit(0);
} else if (launcherResult === 'exit') {
	clearInterval(keepAlive);
	process.exit(0);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
	]
});

patchBlessedUnicode();

const screen = blessed.screen({
	smartCSR: true,
	title: 'Discord TUI',
	fullUnicode: true,
	terminal: 'xterm-256color',
	sendFocus: true
});

const ui = createBlessedUIBridge(screen);

let currentChannel: TextChannel | null = null;
let currentDMChannel: DMChannel | null = null;
let currentVoiceChannel: VoiceChannel | null = null;
let activeVoiceConnection: VoiceConnection | null = null;
let channelMap = new Map<number, SelectableChannel>();
let unreadChannels = new Set<string>();
let mentionChannels = new Set<string>();

function disconnectVoiceConnection(): void {
	if (!activeVoiceConnection) {
		return;
	}

	activeVoiceConnection.destroy();
	activeVoiceConnection = null;
}

async function connectVoiceChannel(channel: VoiceChannel): Promise<void> {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
		selfDeaf: false,
		selfMute: false,
	});

	activeVoiceConnection = connection;
	await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
}

function updateSidebarWithUnreads(): void {
	const selectedIndex = ui.getSidebarSelectedIndex();
	const model = buildSidebarModel(client, unreadChannels, mentionChannels);
	channelMap = model.channelMap;
	ui.setSidebarItems(model.items);

	if (selectedIndex >= 0 && selectedIndex < model.items.length) {
		ui.selectSidebar(selectedIndex);
	}
	else if (model.firstChannelIndex !== undefined) {
		ui.selectSidebar(model.firstChannelIndex);
	}

	ui.render();
}

function markChannelAsUnread(channelId: string, isMention: boolean): void {
	unreadChannels.add(channelId);
	if (isMention) {
		mentionChannels.add(channelId);
	}
	updateSidebarWithUnreads();
}

function markChannelAsRead(channelId: string): void {
	unreadChannels.delete(channelId);
	mentionChannels.delete(channelId);
	updateSidebarWithUnreads();
}

setupKeyBindings(ui);
setupMessageHandlers(
	client, ui, channelMap,
	() => currentChannel,
	(channel) => { currentChannel = channel; },
	() => currentDMChannel,
	(channel) => { currentDMChannel = channel; },
	markChannelAsUnread
);

client.once(Events.ClientReady, () => {
	clearInterval(keepAlive);
	const model = buildSidebarModel(client, unreadChannels, mentionChannels);
	channelMap = model.channelMap;
	ui.setSidebarItems(model.items);

	setupSidebarHandlers(ui, channelMap, model.items.length, async (channel) => {
		if (channel.type === ChannelType.GuildText) {
			disconnectVoiceConnection();
			currentChannel = channel;
			currentDMChannel = null;
			currentVoiceChannel = null;
			markChannelAsRead(channel.id);
			await handleChannelSelect(channel, ui, client.user);
			return;
		}

		disconnectVoiceConnection();
		currentChannel = null;
		currentDMChannel = null;
		currentVoiceChannel = channel;
		handleVoiceChannelSelect(channel, ui, client.user);

		try {
			await connectVoiceChannel(channel);
			ui.setStatusBar(chalk.hex('#57F287')(`Joined voice #${channel.name}`));
			ui.render();
		}
		catch (error) {
			if (currentVoiceChannel?.id === channel.id) {
				ui.setTitleBar(channel.guild.name, channel.name, 'disconnected');
				ui.setStatusBar(chalk.hex('#ED4245')(`Failed to join voice #${channel.name}`));
				ui.appendChat(chalk.hex('#ED4245')(`  ⊗ Failed to join voice: ${(error as Error).message}`));
				ui.render();
			}
		}
	});

	client.on(Events.VoiceStateUpdate, (oldState, newState) => {
		if (!currentVoiceChannel) {
			return;
		}

		if (oldState.channelId === currentVoiceChannel.id || newState.channelId === currentVoiceChannel.id) {
			handleVoiceChannelSelect(currentVoiceChannel, ui, client.user);
		}
	});

	client.on(Events.PresenceUpdate, (_oldPresence, newPresence) => {
		if (!currentVoiceChannel) {
			return;
		}

		if (newPresence && currentVoiceChannel.members.has(newPresence.userId)) {
			handleVoiceChannelSelect(currentVoiceChannel, ui, client.user);
		}
	});

	if(model.firstChannelIndex !== undefined){
		ui.selectSidebar(model.firstChannelIndex);
	}

	ui.clearChat();
	ui.focusSidebar();
	ui.render();
});

ui.showChatUI();
ui.setTitleBar(null, null, 'connecting');
ui.setChatContent(chalk.hex('#99AAB5')('Connecting to Discord...'));
ui.render();

void client.login(process.env.DISCORD_TOKEN).catch(err => {
	ui.setTitleBar(null, null, 'disconnected');
	ui.setChatContent(chalk.hex('#FF0000')(`Failed to connect: ${err.message}`));
	ui.render();
});