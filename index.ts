import 'dotenv/config';
import chalk from 'chalk';
import { Client, GatewayIntentBits, Events, ChannelType, TextChannel } from 'discord.js';
import { commands } from './command.js';
import * as readline from 'readline';


const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	]
});

const colors = {
	discord: chalk.hex('#5865F2'), 
	success: chalk.green,     
	danger: chalk.hex('#ED4245'),      
	warning: chalk.hex('#FEE75C'),     
	text: chalk.hex('#DBDEE1'),        
	username: chalk.cyan,     
	timestamp: chalk.gray,
	command: chalk.hex('#EB459E'),      
};


const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '',
	terminal: false
});

let currentChannel: TextChannel | null = null;

client.once(Events.ClientReady, (readyClient) => {
	console.log(colors.discord('Discord'));
	console.log(colors.success(`✓ Logged in as ${readyClient.user?.tag}\n`))
	commands();
})

client.on('messageCreate', (message) => {
  if (currentChannel && message.channel.id === currentChannel.id){
		const time: Date = new Date(message.createdTimestamp);
		const hours: string = time.getHours().toString().padStart(2, '0');
		const minutes: string = time.getMinutes().toString().padStart(2, '0');
		const timeStr: string = colors.timestamp(`[${hours}:${minutes}] `);
    console.log(timeStr + '[' + colors.username(message.author.username) + ']: ' + message.content);
  }
});

rl.on('line', async (input: string) => {
	const trimmed = input.trim();
	const [command, ...args] = trimmed.split(' ');

	if(!trimmed){
		return;
	}
	
	if(trimmed.startsWith('/')){
		if(command == '/servers'){
			console.log(`\n${client.guilds.cache.size} Servers.`);
			
			client.guilds.cache.forEach(guild => {
				console.log(`${guild.name} (ID: ${guild.id})`);
			});
		}
	
		else if(command == '/channels'){
			if(!args[0]){
				console.log('Usage: /channels <Server ID>');
				return;
			}
	
			const guild = client.guilds.cache.get(args[0]);
			if(!guild){
				console.log(colors.warning('Server not found'));
				return;
			}
			
			const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
			console.log(`\n${textChannels.size} text channels in ${guild.name}\n`);
			
			textChannels.forEach(channel => {
				console.log(`#${channel.name} (ID: ${channel.id})\n`);
			});
		}
	
		else if(command == '/join'){
			if(!args[0]){
				console.log('Usage: /join <Channel ID>');
				return;
			}
	
			const channel = client.channels.cache.get(args[0]);
			
			if(!(channel && channel.type === ChannelType.GuildText)){
				console.log(colors.warning('Channel not found.'));
				return;
			}
	
			currentChannel = channel;
			console.log(colors.success(`✓ Joined #${channel.name}`));
			
			const messages = await channel.messages.fetch({ limit: 10 });
	          console.log('\nRecent messages:');
	          messages.reverse().forEach(message => {
							const time: Date = new Date(message.createdTimestamp);
							const hours: string = time.getHours().toString().padStart(2, '0');
							const minutes: string = time.getMinutes().toString().padStart(2, '0');
							const timeStr: string = colors.timestamp(`[${hours}:${minutes}] `);
	            console.log(timeStr + '[' + colors.username(message.author.username) + ']: ' + message.content);
	          });
		}
	
		else if(command == '/leave'){
			if(!currentChannel){
				console.log(colors.warning('Not in a channel'));
				return;
			}
	
			console.log(`✓ Left #${currentChannel.name}`);
			currentChannel = null;
		}
	
		else if(command == '/help'){
			console.log('\n');
			commands();
			
		}
			
		else if(command == '/quit'){
			console.log('GoodBye!');
			process.exit(0);
		}

		else {
			console.log('Unknown command. Type /help for list of commands.');
		}
	}

	else{
		if(currentChannel){
			try{
				process.stdout.write('\u001b[1A\u001b[2K');
				await currentChannel.send(trimmed);
			}

			catch(error){
				console.log(colors.warning('Error'));
			}
		}

		else{
			console.log('Join a channel first to chat');
		}
	}
});

client.login(process.env.DISCORD_TOKEN);