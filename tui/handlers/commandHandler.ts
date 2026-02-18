import chalk from 'chalk';
import { Client, ChannelType, TextChannel } from 'discord.js';
import type { Widgets } from 'blessed';

interface CommandContext{
	client: Client;
	chatBox: Widgets.Log;
	inputBox: Widgets.TextboxElement;
	sidebar: Widgets.ListElement;
	screen: Widgets.Screen;
	channelMap: Map<number, TextChannel>;
	getCurrentChannel: () => TextChannel | null;
	setCurrentChannel: (channel: TextChannel) => void;
}

type CommandHandler = (args: string[], ctx: CommandContext) => Promise<void> | void;

const commands: Record<string, CommandHandler> = {
	help: (args, { chatBox }) => {
		chatBox.log(chalk.yellow('--- Commands ---'));
		chatBox.log(chalk.cyan('/help')           + '              - show list of commands');
		chatBox.log(chalk.cyan('/goto <channel>') + '              - change channel');
		chatBox.log(chalk.cyan('/search <msg>')   + '              - search message');
		chatBox.log(chalk.cyan('/dm @user <msg>') + '              - send DM');
		chatBox.log(chalk.cyan('/members')        + '              - show list of members');
		chatBox.log(chalk.cyan('/clear')          + '              - clear chatbox');
		chatBox.log(chalk.cyan('/quit')           + '              - exit');
		chatBox.log('');
	},

	quit: () => {
		process.exit(0);
	}
};

export async function handleCommand(input: string, ctx: CommandContext): Promise<boolean>{
	if(!input.startsWith('/')){
		return false;
	}

	const [cmd, ...args] = input.slice(1).trim().split(/\s+/);
	const handler = commands[cmd.toLowerCase()];

	if(!handler){
		ctx.chatBox.log(chalk.red(`Unknown command: /${cmd}  (type /help)`));
		ctx.screen.render();
		return true;
	}

	await handler(args, ctx);
	return true;
}