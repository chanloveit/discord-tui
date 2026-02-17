import chalk from 'chalk';
import { Client, Events, Message, TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';
import { formatTime } from '../utils/formatters.js';
import { renderMessage } from '../utils/messageRenderer.js';

export async function handleChannelSelect(channel: TextChannel, chatBox: Widgets.Log, inputBox: Widgets.TextElement, screen: Widgets.Screen): Promise<void>{
	try{
		const messages = await channel.messages.fetch({ limit: 10 });

		chatBox.setContent('');
		chatBox.setLabel(`▶${channel.guild.name} - #${channel.name}`);
		chatBox.log(chalk.green(`✓ Joined #${channel.name}`));
		chatBox.log('');
		chatBox.log(chalk.yellow('--- Recent messages ---'));

		const messagesArray = Array.from(messages.values()).reverse();
		for (const message of messagesArray) {
			await renderMessage(message, chatBox, true);
		}
	}

	catch(error){
		chatBox.log(chalk.red('Failed to load messages'));
	}

	inputBox.focus();
	screen.render();
}