import blessed from 'blessed';

export function createSidebar(screen: blessed.Widgets.Screen){
	const sidebar = blessed.list({
		parent: screen,
		name: 'sidebar',
		width: '30%',
		height: '100%',
		border: {
			type: 'line'
		},
		style: {
			border: {
				fg: 'blue'
			}
		},
		label: 'Servers & Channels',
		keys: true,
		vi: true,
		mouse: true,
		tags: true,
		interactive: true,
		invertSelected: true,

		selected: {
			fg: 'blue'
		}
	});

	return sidebar;
}