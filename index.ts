import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';
import * as readline from 'readline';

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	]
});

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '>> '
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`✓ Logged in as ${readyClient.user?.tag}\n`);
	console.log('Commands: ');
	console.log('/servers - List all servers');
	console.log('/channels <Server ID> - List text channels in a server');
	console.log('/quit - Exit\n');

	rl.prompt();
})

rl.on('line', (input: string) => {
	const trimmed = input.trim();
	const [command, ...args] = trimmed.split(' ');
	
	if(command == '/servers'){
		console.log(`${client.guilds.cache.size} Servers.`);
		
		client.guilds.cache.forEach(guild => {
			console.log(`${guild.name} (ID: ${guild.id})`);
		});
	}

	else if(command == '/channels'){
		if(!args[0]){
			console.log('Usage: /channels <Server ID>');
			rl.prompt();
			return;
		}

		const guild = client.guilds.cache.get(args[0]);
		if(!guild){
			console.log('Server not found');
			rl.prompt();
			return;
		}
		
		const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
		console.log(`${textChannels.size} text channels in ${guild.name}\n`);
		
		textChannels.forEach(channel => {
			console.log(`#${channel.name} (ID: ${channel.id})`);
		});
	}
		
	else if(command == '/quit'){
		console.log('GoodBye!');
		process.exit(0);
	}

	else{
		console.log('Undefined command.');
	}

	rl.prompt();
});

client.login(process.env.DISCORD_TOKEN);