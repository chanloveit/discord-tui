import blessed from 'blessed';
import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType, TextChannel } from 'discord.js';
import { createSidebar } from './components/sidebar.js';
import { createChatBox } from './components/chatbox.js';
import { createInputBox } from './components/inputbox.js';
import chalk from 'chalk';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

const screen = blessed.screen({
	smartCSR : true,
	title: 'Discord',
	fullUnicode: true,
});

const sidebar = createSidebar(screen);
const chatBox = createChatBox(screen);
const inputBox = createInputBox(screen);


let currentChannel: TextChannel | null = null;

screen.key(['C-c'], () => {
	return process.exit(0);
});


client.once(Events.ClientReady, (readyClient) => {
	chatBox.log(chalk.green(`✓ Logged in as ${readyClient.user?.tag}`))
	const servers: string[]= [];
	client.guilds.cache.forEach(guild => {
		servers.push(`▶${guild.name}`);
		const textChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
		textChannels.forEach(channel => {
			servers.push(`  #${channel.name}`);
		});
		servers.push('')
	});

	sidebar.setItems(servers);
	screen.render();
});

sidebar.on('select', async(item, index) => {
	const selectedText = item.getText();

	if(selectedText.trim().startsWith('#')){
		const channelName = selectedText.trim().replace(/^#\s*/, '');

		let found: TextChannel | null = null;
		client.guilds.cache.forEach(guild => {
			const channel = guild.channels.cache.find(ch => (
				ch.type === ChannelType.GuildText && ch.name === channelName
			));

			if(channel && !found){
				found = channel as TextChannel;
			}
		});

		if(found){
			currentChannel = found;
			const channelName = (found as TextChannel).name;
			const guildName = (found as TextChannel).guild.name;
			
			chatBox.setLabel(`channel - #${channelName}`);
			chatBox.log(`{green-fg}✓ Joined #${channelName} in ${guildName}{/green-fg}`);
			chatBox.log('');

			try{
				const messages = await (found as TextChannel).messages.fetch({ limit: 10});
				chatBox.log(`{yellow-fg}--- Recent messages ---{/yellow-fg}`);
				messages.reverse().forEach(msg => {
					const time = new Date(msg.createdTimestamp).toLocaleTimeString(undefined, {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					});

					chatBox.log(`{gray-fg}[${time}]{/gray-fg} {cyan-fg}${msg.author.username}{/cyan-fg}: ${msg.content}`);
				});
				chatBox.log('');
			}

			catch(error){
				chatBox.log(`{red-fg}Failed to load messages{/red-fg}`);
			}
			inputBox.focus();
			screen.render();
		}
	}

	else{
		sidebar.down(1);
		screen.render();
	}
});

sidebar.on('select', (item, index) => {
	chatBox.log('SELECT EVENT TRIGGERED!!!');
	screen.render();
});

sidebar.on('action', () => {
	chatBox.log('ACTION EVENT TRIGGERED!!!');
	screen.render();
});

sidebar.on('element click', () => {
	chatBox.log('CLICK EVENT!!!');
	screen.render();
});

// keypress도 다시 확인
sidebar.on('keypress', (ch, key) => {
	chatBox.log(`Key: ${key.name}, full: ${key.full}`);
	screen.render();
});

inputBox.on('cancel', () => {
	sidebar.focus();
	chatBox.log(chalk.yellow('selecting channels...'));
	screen.render();
});

sidebar.key(['C-d'], () => {
	inputBox.focus();
	chatBox.log(chalk.yellow('on chat'));
	screen.render();
});


sidebar.focus();
screen.render();

client.login(process.env.DISCORD_TOKEN);