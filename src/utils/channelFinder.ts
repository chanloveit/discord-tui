import { Client, ChannelType, TextChannel } from 'discord.js';

export function findChannelByPath(client: Client, path: string): TextChannel | null{
	const parts = path.split(':');

	if(parts.length !== 2){
		return null;
	}

	const [serverName, channelName] = parts;

	const guild = client.guilds.cache.find(g => 
		g.name === serverName ||
		g.id === serverName);

	if(!guild){
		return null;
	}

	const channel = guild.channels.cache.find(ch =>
		ch.type === ChannelType.GuildText && (
			ch.name === channelName
		));

	if(channel && channel.type === ChannelType.GuildText){
		return channel as TextChannel;
	}

	return null;
}