import { ChannelType, Client, TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';

export function populateSidebar(client: Client, sidebar: Widgets.ListElement, channelMap: Map<number, TextChannel>): number | undefined {
	const sidebarItems: string[] = [];
	let itemIndex = 0;

	channelMap.clear();

	client.guilds.cache.forEach((guild) => {
		sidebarItems.push(` ▶ ${guild.name}`);
		itemIndex++;

		const textChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
		textChannels.forEach((channel) => {
			sidebarItems.push(`   # ${channel.name}`);
			channelMap.set(itemIndex, channel as TextChannel);
			itemIndex++;
		});

		sidebarItems.push('');
		itemIndex++;
	});

	sidebar.setItems(sidebarItems);

	return Array.from(channelMap.keys())[0];
}