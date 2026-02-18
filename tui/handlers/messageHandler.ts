import chalk from 'chalk';

import { handleCommand } from './commandHandler.js';
import { Client, Events, Message, TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';
import { formatTime } from '../utils/formatters.js';
import { renderMessage } from '../utils/messageRenderer.js';

export function setupMessageHandlers(client: Client, chatBox: Widgets.Log, inputBox: Widgets.TextboxElement, sidebar: Widgets.ListElement, screen: Widgets.Screen, channelMap: Map<number, TextChannel>, getCurrentChannel: () => TextChannel | null, setCurrentChannel: (channel: TextChannel) => void) {
	const commandCtx = {
		client,
		chatBox,
		inputBox,
		sidebar,
		screen,
		channelMap,
		getCurrentChannel,
		setCurrentChannel
	};
	
	client.on(Events.MessageCreate, async (message: Message) => {
		if(message.author.id === client.user?.id) return;

		const currentChannel = getCurrentChannel();
		if(currentChannel && message.channel.id === currentChannel.id){
			await renderMessage(message, chatBox, true);
			chatBox.log('');
			screen.render();
		}
	});

	inputBox.on('submit', async (text: string) => {
		const message = text.trim();

		if(!message){
			inputBox.clearValue();
			inputBox.focus();
			screen.render();
			return;
		}

		if (await handleCommand(message, commandCtx)) {
			inputBox.clearValue();
			inputBox.focus();
			screen.render();
			return;
		}
		
		const currentChannel = getCurrentChannel();
		if(!currentChannel){
			chatBox.log(chalk.red('No channel selected!'));
			inputBox.clearValue();
			inputBox.focus();
			screen.render();
			return;
		}

		try{
			await currentChannel.send(message);
			
			const time = formatTime(Date.now());
			chatBox.log(chalk.gray(`[${time}]`) + chalk.cyan(client.user?.username) + ': ' + message);

			inputBox.clearValue();
			inputBox.focus();
			screen.render();
		}
		
		catch(error){
			chatBox.log(chalk.red(`Failed to send message: ${error}`));
			inputBox.clearValue();
			inputBox.focus();
			screen.render();
		}
	});
}