import chalk from 'chalk';
import { GuildMember, Message, TextChannel, User, VoiceChannel } from 'discord.js';
import { renderMessage } from '../utils/messageRenderer.js';
import { renderDateSeparator } from '../utils/formatters.js';
import { safeChannelName, safeGuildName, sanitizeUiText } from '../utils/uiText.js';
import type { UIBridge } from '../ui/types.js';

const RECENT_MESSAGE_LIMIT = 50;
let activeChannelLoadId = 0;

function presenceDot(member: GuildMember): string {
	const status = member.presence?.status ?? 'offline';
	if (status === 'online') return chalk.hex('#57F287')('●');
	if (status === 'idle')   return chalk.hex('#FEE75C')('◐');
	if (status === 'dnd')    return chalk.hex('#ED4245')('●');
	return chalk.hex('#747F8D')('○');
}

function formatVoiceMemberState(member: GuildMember, currentUser: User | null): string {
	const badges: string[] = [];

	if (member.id === currentUser?.id) {
		badges.push(chalk.hex('#5865F2').bold('you'));
	}
	if (member.voice.serverMute) {
		badges.push(chalk.hex('#ED4245')('server-muted'));
	} else if (member.voice.selfMute) {
		badges.push(chalk.hex('#ED4245')('muted'));
	}
	if (member.voice.serverDeaf) {
		badges.push(chalk.hex('#FEE75C')('server-deafened'));
	} else if (member.voice.selfDeaf) {
		badges.push(chalk.hex('#FEE75C')('deafened'));
	}
	if (member.voice.streaming) {
		badges.push(chalk.hex('#EB459E')('streaming'));
	}
	if (member.voice.selfVideo) {
		badges.push(chalk.hex('#00B0F4')('video'));
	}

	if (badges.length === 0) return '';
	return ' ' + badges.map(b => chalk.hex('#4F545C')('[') + b + chalk.hex('#4F545C')(']')).join(' ');
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
	ui.setStatusBar(chalk.hex('#57F287')(`◉ Voice: #${channelDisplayName}`));

	const bitrate = Math.round(channel.bitrate / 1000);
	const userLimit = channel.userLimit === 0 ? '∞' : String(channel.userLimit);

	ui.appendChat('');
	ui.appendChat(chalk.hex('#5865F2').bold(`  ◉ ${channelDisplayName}`));
	ui.appendChat(
		chalk.hex('#72767D')(`  ${guildDisplayName}`) +
		chalk.hex('#4F545C')('  ·  ') +
		chalk.hex('#72767D')(`${bitrate} kbps`) +
		chalk.hex('#4F545C')('  ·  ') +
		chalk.hex('#72767D')(`${members.length} / ${userLimit} users`)
	);
	ui.appendChat(chalk.hex('#4F545C')('  ' + '─'.repeat(38)));
	ui.appendChat('');

	if (members.length === 0) {
		ui.appendChat(chalk.hex('#72767D')('  No one is in this voice channel.'));
	} else {
		for (const member of members) {
			const memberName = sanitizeUiText(member.displayName || member.user.username, 'user');
			const dot = presenceDot(member);
			ui.appendChat(`  ${dot} ${chalk.hex('#DCDDDE')(memberName)}${formatVoiceMemberState(member, currentUser)}`);
		}
	}

	ui.appendChat('');
	ui.appendChat(chalk.hex('#4F545C')('  ' + '─'.repeat(38)));
	ui.appendChat(chalk.hex('#72767D')('  Tip: /voiceleave  to leave this channel'));
	ui.render();
}