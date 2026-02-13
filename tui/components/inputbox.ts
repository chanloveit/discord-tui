import blessed from 'blessed';

export function createInputBox(screen: blessed.Widgets.Screen){
	const inputBox = blessed.textbox({
		parent: screen,
		name: 'inputBox',
		bottom: 0,
		left: '30%',
		width: '70%',
		height: 3,
		border: {
			type: 'line'
		},
		style: {
			border: {
				fg: 'blue'
			}
		},
		keys: true,
		inputOnFocus: true
	});

	inputBox.on('keypress', (ch, key) => {
		if (key.ctrl && key.name === 'd'){
			inputBox.cancel();
			return false;
		}
	});
	return inputBox;
}