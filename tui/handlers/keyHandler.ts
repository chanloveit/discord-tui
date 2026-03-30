import type { Widgets } from 'blessed';

export function setupKeyBindings(screen: Widgets.Screen, sidebar: Widgets.ListElement, chatBox: Widgets.Log, inputBox: Widgets.TextboxElement){
	const scrollChat = (delta: number): void => {
		chatBox.scroll(delta);
		screen.render();
	};

	screen.key(['C-c'], () => {
		process.exit(0);
	});

	sidebar.key(['C-d'], () => {
		inputBox.focus();
		screen.render();
	});

	inputBox.key(['up'], () => {
		scrollChat(-1);
	});

	inputBox.key(['down'], () => {
		scrollChat(1);
	});

	inputBox.key(['pageup'], () => {
		scrollChat(-(chatBox.height as number));
	});

	inputBox.key(['pagedown'], () => {
		scrollChat(chatBox.height as number);
	});

	inputBox.on('keypress', (ch) => {
		const value = inputBox.getValue();
		if(value.startsWith('/') || ch === '/'){
			inputBox.style.border.fg = 'yellow';
		}

		else{
			inputBox.style.border.fg = '#5865F2';
		}

		screen.render();
	});
}