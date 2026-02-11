import blessed from 'blessed';
import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';
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

screen.key(['escape', 'C-c'], () => {
	return process.exit(0);
});

screen.key(['tab'], () => {
	if(screen.focused === sidebar) {
		inputBox.focus();
	} 
	else {
		sidebar.focus();
	}
	screen.render();
});

client.once(Events.ClientReady, (readyClient) => {
	chatBox.log(chalk.green(`✓ Logged in as ${readyClient.user?.tag}`))
	const servers = [];
	client.guilds.cache.forEach(guild => {
		servers.push(`▶${guild.name}`);
		const textChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
		textChannels.forEach(channel => {
			servers.push(`  #${channel.name}`);
		});
	});

	sidebar.setItems(servers);
	screen.render();
});

inputBox.focus();
screen.render();

client.login(process.env.DISCORD_TOKEN);