import blessed from 'blessed';

export function createChatBox(screen: blessed.Widgets.Screen){
	const chatBox = blessed.log({
		parent: screen,
		top: 0,
		left: '30%',
		width: '70%',
		height: '100%-3',
		border: {
			type: 'line'
		},
		style: {
			border: {
				fg: 'blue'
			}
		},
		label: 'Chat',
		scrollable: true,
		scrollbar: {
			ch: '█',
			style: {
				fg: 'blue'
			}
		},
		alwaysScroll: true
	});

	return chatBox;
}