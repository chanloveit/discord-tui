import chalk from 'chalk';
import { GuildMember, Message, TextChannel, User, VoiceChannel } from 'discord.js';
import { renderMessage } from '../utils/messageRenderer.js';
import { renderDateSeparator } from '../utils/formatters.js';
import { safeChannelName, safeGuildName, sanitizeUiText } from '../utils/uiText.js';
import type { UIBridge } from '../ui/types.js';

const RECENT_MESSAGE_LIMIT = 50;
let activeChannelLoadId = 0;

function formatVoiceMemberState(member: GuildMember, currentUser: User | null): string {
	const states: string[] = [];
	const presenceStatus = member.presence?.status ?? 'offline';

	if (presenceStatus === 'online') {
		states.push(chalk.hex('#57F287')('online'));
	} else if (presenceStatus === 'idle') {
		states.push(chalk.hex('#FEE75C')('idle'));
	} else if (presenceStatus === 'dnd') {
		states.push(chalk.hex('#ED4245')('dnd'));
	} else {
		states.push(chalk.hex('#747F8D')('offline'));
	}

	if (member.id === currentUser?.id) {
		states.push(chalk.hex('#5865F2')('you'));
	}
	if (member.voice.selfMute || member.voice.serverMute) {
		states.push(chalk.hex('#ED4245')('muted'));
	}
	if (member.voice.selfDeaf || member.voice.serverDeaf) {
		states.push(chalk.hex('#FEE75C')('deafened'));
	}
	if (member.voice.streaming) {
		states.push(chalk.hex('#EB459E')('streaming'));
	}
	if (member.voice.selfVideo) {
		states.push(chalk.hex('#00B0F4')('video'));
	}

	if (states.length === 0) {
		return '';
	}

	return chalk.hex('#72767D')(` [${states.join(', ')}]`);
}

async function renderChannelMessages(channelName: string, messages: Message[], ui: Pick<UIBridge, 'clearChat' | 'appendChat'>, currentUser: User | null): Promise<void> {
	const channelDisplayName = safeChannelName(channelName);
	ui.clearChat();
	ui.appendChat('');
	ui.appendChat(chalk.hex('#5865F2').bold(`  # ${channelDisplayName}`));
	ui.appendChat(chalk.hex('#72767D')(`  Welcome to #${channelDisplayName}!`));
	ui.appendChat('');

	let lastAuthorId: string | null = null;
	let lastMessageTimestamp: number | null = null;
	let lastDateStr: string | null = null;

	for (const message of messages) {
		const msgDate = new Date(message.createdTimestamp).toDateString();
		if (msgDate !== lastDateStr) {
			ui.appendChat('');
			ui.appendChat(renderDateSeparator(message.createdTimestamp));
			ui.appendChat('');
			lastDateStr = msgDate;
			lastAuthorId = null;
			lastMessageTimestamp = null;
		}
		await renderMessage(message, ui, true, currentUser, lastAuthorId, lastMessageTimestamp);
		lastAuthorId = message.author.id;
		lastMessageTimestamp = message.createdTimestamp;
	}
}

export async function handleChannelSelect(
	channel: TextChannel,
	ui: Pick<UIBridge, 'showChatUI' | 'setChatLabel' | 'setInputLabel' | 'setTitleBar' | 'appendChat' | 'clearChat' | 'setChatContent' | 'setStatusBar' | 'clearInput' | 'hardRefresh' | 'render'>,
	currentUser: User | null = null
): Promise<void>{
	const loadId = ++activeChannelLoadId;
	const channelDisplayName = safeChannelName(channel.name);
	const guildDisplayName = safeGuildName(channel.guild.name);

	ui.hardRefresh();
	ui.showChatUI();
	ui.clearChat();
	ui.setChatContent('');
	ui.clearInput();
	ui.setChatLabel(` #${channelDisplayName} `);
	ui.setInputLabel(`Message #${channelDisplayName}`);
	ui.setTitleBar(guildDisplayName, channelDisplayName, 'connecting');
	ui.setStatusBar(chalk.hex('#99AAB5')(`Loading #${channelDisplayName}...`));
	ui.appendChat(chalk.hex('#99AAB5')(`Loading #${channelDisplayName}...`));
	ui.render();

	try{
		const messages = await channel.messages.fetch({ limit: RECENT_MESSAGE_LIMIT });
		const messagesArray = Array.from(messages.values()).reverse();
		if (loadId !== activeChannelLoadId) {
			return;
		}

		ui.setTitleBar(guildDisplayName, channelDisplayName, 'connected');
		ui.setStatusBar(chalk.hex('#57F287')(`Connected to #${channelDisplayName}`));
		await renderChannelMessages(channelDisplayName, messagesArray, ui, currentUser);
	}

	catch{
		if (loadId !== activeChannelLoadId) {
			return;
		}
		ui.setTitleBar(guildDisplayName, channelDisplayName, 'disconnected');
		ui.setStatusBar(chalk.hex('#ED4245')(`Failed to load #${channelDisplayName}`));
		ui.clearChat();
		ui.appendChat(chalk.hex('#ED4245')('  ⊗ Failed to load messages'));
	}

	ui.render();
}

export function handleVoiceChannelSelect(
	channel: VoiceChannel,
	ui: Pick<UIBridge, 'showChatUI' | 'setChatLabel' | 'setInputLabel' | 'setTitleBar' | 'appendChat' | 'clearChat' | 'setChatContent' | 'setStatusBar' | 'clearInput' | 'hardRefresh' | 'render'>,
	currentUser: User | null = null
): void {
	// Invalidate any in-flight text-channel load so stale messages do not overwrite voice view.
	activeChannelLoadId++;

	const channelDisplayName = safeChannelName(channel.name);
	const guildDisplayName = safeGuildName(channel.guild.name);
	const members = Array.from(channel.members.values()).sort((a, b) => {
		return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
	});

	ui.hardRefresh();
	ui.showChatUI();
	ui.clearChat();
	ui.setChatContent('');
	ui.clearInput();
	ui.setChatLabel(` #${channelDisplayName} `);
	ui.setInputLabel(' Voice channel ');
	ui.setTitleBar(guildDisplayName, channelDisplayName, 'connected');
	ui.setStatusBar(chalk.hex('#57F287')(`Connected to voice #${channelDisplayName}`));

	ui.appendChat('');
	ui.appendChat(chalk.hex('#72767D')(`  Server: ${guildDisplayName}`));
	ui.appendChat(chalk.hex('#5865F2').bold(`  ✦ Voice Members (${members.length})`));

	if (members.length === 0) {
		ui.appendChat(chalk.hex('#99AAB5')('  No one is in this voice channel right now.'));
	} else {
		for (const member of members) {
			const memberName = sanitizeUiText(member.displayName || member.user.username, 'user');
			const memberId = chalk.hex('#72767D')(` (${member.id})`);
			ui.appendChat(`  • ${chalk.hex('#DCDDDE')(memberName)}${memberId}${formatVoiceMemberState(member, currentUser)}`);
		}
	}

	ui.render();
}