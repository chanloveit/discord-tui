import 'dotenv/config';
import { colors } from './utils/colors.js';
import { findChannelByPath } from './utils/channelFinder.js';
import { Client, GatewayIntentBits, Events, ChannelType, TextChannel } from 'discord.js';
import { commands } from './utils/command.js';
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
		const time = new Date(message.createdTimestamp).toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		
		const timeStr = colors.timestamp(`[${time}] `);
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
				const textChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
				console.log(colors.discord(`${guild.name}: `));
				textChannels.forEach(channel => {
					console.log(`${guild.name}:${channel.name}`);
				});

				console.log('');
			});
		}
	
	
		else if(command == '/join'){
			if(!args[0]){
				console.log('Usage: /join <server>:<channel>');
				console.log('Tip: Use /servers to list all available paths');
				return;
			}
	
			const path = args.join(' ');
			const channel = findChannelByPath(client, path);

			if(!channel){
				console.log(colors.warning('Channel Not Found'));
				return;
			}
	
			currentChannel = channel;
			console.log(colors.success(`✓ Joined #${channel.name}`));
			
			const messages = await channel.messages.fetch({ limit: 10 });
	          console.log('\nRecent messages:');
	          messages.reverse().forEach(message => {
							const time = new Date(message.createdTimestamp).toLocaleTimeString(undefined, {
								hour: '2-digit',
								minute: '2-digit',
								hour12: false
							});
							
							const timeStr = colors.timestamp(`[${time}] `);
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