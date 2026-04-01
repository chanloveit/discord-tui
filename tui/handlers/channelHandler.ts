import chalk from 'chalk';
import { Message, TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';
import { renderMessage } from '../utils/messageRenderer.js';

const RECENT_MESSAGE_LIMIT = 10;

async function renderChannelMessages(channelName: string, messages: Message[], chatBox: Widgets.Log): Promise<void> {
	chatBox.setContent('');
	chatBox.log(chalk.green(`✓ Joined #${channelName}`));
	chatBox.log('');
	chatBox.log(chalk.yellow('--- Recent messages ---'));

	for (const message of messages) {
		await renderMessage(message, chatBox, true);
	}
}

export async function handleChannelSelect(channel: TextChannel, chatBox: Widgets.Log, inputBox: Widgets.TextElement, screen: Widgets.Screen): Promise<void>{
	try{
		const messages = await channel.messages.fetch({ limit: RECENT_MESSAGE_LIMIT });
		const messagesArray = Array.from(messages.values()).reverse();

		chatBox.setLabel(`▶${channel.guild.name} - #${channel.name}`);
		await renderChannelMessages(channel.name, messagesArray, chatBox);
	}

	catch{
		chatBox.log(chalk.red('Failed to load messages'));
	}

	screen.render();
}