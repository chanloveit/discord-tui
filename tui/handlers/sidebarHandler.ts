import { TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';

type SidebarState = Widgets.ListElement & {
	items: unknown[];
	selected: number;
};

function getSidebarState(sidebar: Widgets.ListElement): SidebarState {
	return sidebar as SidebarState;
}

function getNextSelectableIndex(sidebar: Widgets.ListElement, channelMap: Map<number, TextChannel>, step: 1 | -1): number {
	const { items, selected } = getSidebarState(sidebar);
	const totalItems = items.length;
	let nextIndex = (selected + step + totalItems) % totalItems;

	while (!channelMap.has(nextIndex) && nextIndex !== selected) {
		nextIndex = (nextIndex + step + totalItems) % totalItems;
	}

	return nextIndex;
}

export function setupSidebarHandlers(sidebar: Widgets.ListElement, inputBox: Widgets.TextboxElement, screen: Widgets.Screen, channelMap: Map<number, TextChannel>, onChannelSelect: (channel: TextChannel) => Promise<void>): void {
	sidebar.key(['down'], () => {
		sidebar.select(getNextSelectableIndex(sidebar, channelMap, 1));
		screen.render();
	});

	sidebar.key(['up'], () => {
		sidebar.select(getNextSelectableIndex(sidebar, channelMap, -1));
		screen.render();
	});

	sidebar.key(['enter'], async () => {
		const { selected } = getSidebarState(sidebar);
		const channel = channelMap.get(selected);
		if (!channel) {
			return;
		}

		inputBox.setLabel(` # ${channel.name} `);
		await onChannelSelect(channel);
	});
}