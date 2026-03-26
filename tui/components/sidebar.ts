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
		scrollbar: {
			ch: '█',
			style: { fg: '#5865F2' }
		},
		style: {
			border: {
				fg: '#5865F2'
			},
			selected: {
				fg: '#FFFFFF',
				bg: '#5865F2',
				bold: true
			},
			item: {
				fg: '#B9BBBE'
			}
		},
		label: ' Servers & Channels ',

		keys: false,
		vi: true,
		mouse: true,
		tags: false,
		interactive: true,
		invertSelected: false
	});
	
	return sidebar;
}