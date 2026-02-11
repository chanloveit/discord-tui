import blessed from 'blessed';

export function createInputBox(screen: blessed.Widgets.Screen){
	const inputBox = blessed.textbox({
		parent: screen,
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
		inputOnFocus: true
	});
	
	return inputBox;
}