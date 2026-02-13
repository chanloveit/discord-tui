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
const channelMap = new Map<number, TextChannel>();

screen.key(['C-c'], () => {
	return process.exit(0);
});


client.once(Events.ClientReady, (readyClient) => {
	const logo = `                         
	 ____  _                   _ 
	|    \\|_|___ ___ ___ ___ _| |
	|  |  | |_ -|  _| . |  _| . |
	|____/|_|___|___|___|_| |___|
                                                              
	`;
	
	chatBox.log(chalk.green(`✓ Logged in as ${readyClient.user?.tag}`))
	chatBox.log(chalk.blue(logo));
	const servers: string[]= [];
	let itemIndex = 0;
	
	client.guilds.cache.forEach(guild => {
		servers.push(`▶${guild.name}`);
		itemIndex++;
		
		const textChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
		textChannels.forEach(channel => {
			servers.push(`  #${channel.name}`);
			channelMap.set(itemIndex, channel as TextChannel);
			itemIndex++;
		});
		
		servers.push('')
		itemIndex++;
	});

	sidebar.setItems(servers);
	let firstChannelIndex = -1;
	for(let [index] of channelMap){
		firstChannelIndex = index;
		break;
	}

	if(firstChannelIndex !== -1){
		sidebar.select(firstChannelIndex);
	}
	
	screen.render();
});

sidebar.on('select', async(item, index) => {
	const channel = channelMap.get(index);

	if(!channel){
		const sortedIndices = Array.from(channelMap.keys()).sort((a, b) => a - b);
		const nextIndex = sortedIndices.find(i => i > index);

		if(nextIndex !== undefined){
			sidebar.select(nextIndex);
		}
		else{
			sidebar.select(sortedIndices[0]);
		}

		screen.render();
		return;
	}

	currentChannel = channel;
	
	try{
		const messages = await (currentChannel as TextChannel).messages.fetch({ limit: 10});
		chatBox.setContent('');
		
		chatBox.setLabel(`▶${channel.guild.name} - #${channel.name}`);
		
		chatBox.log(chalk.green(`✓ Joined #${channel.name}`));
		chatBox.log('');
		chatBox.log(chalk.yellow(`--- Recent messages ---`));
		
		messages.reverse().forEach(msg => {
			const time = new Date(msg.createdTimestamp).toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});

			chatBox.log(chalk.gray(`[${time}]`) + chalk.cyan(msg.author.username) + ': ' + msg.content);
		});
	}

	catch(error){
		chatBox.log(chalk.red('Failed to load messages'));
	}

	inputBox.focus();
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

inputBox.on('submit', async (msg) => {
	const message = msg.trim();

	if(!message){
		inputBox.clearValue();
		inputBox.focus();
		screen.render();
		return;
	}

	if(!currentChannel){
		chatBox.log(chalk.red('No channel selected!'));
		inputBox.clearValue();
		inputBox.focus();
		screen.render();
		return;
	}

	try{
		await currentChannel.send(message);
		inputBox.clearValue();

		const time = new Date().toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});

			chatBox.log(chalk.gray(`[${time}]`) + chalk.cyan(client.user.username) + ': ' + message);

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

client.on(Events.MessageCreate, (message) => {
	if(message.author.id === client.user.id){
		return;
	}

	if(currentChannel && message.channel.id === currentChannel.id){
		const time = new Date(message.createdTimestamp).toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});

			chatBox.log(chalk.gray(`[${time}]`) + chalk.cyan(message.author.username) + ': ' + message.content);
			screen.render();
	}
});

sidebar.focus();
screen.render();

client.login(process.env.DISCORD_TOKEN);