import chalk from 'chalk';
import { Message, User } from 'discord.js';
import { formatTime } from './formatters.js';
import { displayImage } from './imageRenderer.js';
import type { Widgets } from 'blessed';

function highlightMentions(content: string, currentUser: User | null): string {
	if (!currentUser) return content;
	
	const userMentionPattern = new RegExp(`<@${currentUser.id}>`, 'g');
	
	return content.replace(userMentionPattern, chalk.bgYellow.black(`@${currentUser.username}`));
}

function getMessageStatus(message: Message): string {
	const status: string[] = [];
	if (!message.content && message.attachments.size === 0) {
		status.push(chalk.red('(message deleted)'));
	}

	else if (message.editedTimestamp) {
		status.push(chalk.dim('(edited)'));
	}
	
	return status.length > 0 ? ' ' + status.join(' ') : '';
}

export async function renderMessage(
	message: Message, 
	chatBox: Widgets.Log, 
	showImages: boolean = false, 
	currentUser: User | null = null,
	lastAuthorId: string | null = null
): Promise<void> {
	const time = formatTime(message.createdTimestamp);
	const author = chalk.cyan(message.author.username);
	const timestamp = chalk.gray(`[${time}]`);
	const isGrouped = lastAuthorId === message.author.id;

	if (!isGrouped) {
		chatBox.log(`${timestamp} ${author}`);
	}

	if(message.content){
		const highlightedContent = highlightMentions(message.content, currentUser);
		const messageStatus = getMessageStatus(message);
		chatBox.log(`${highlightedContent}${messageStatus}`);
	}

	if(message.attachments?.size > 0){
		for(const attachment of message.attachments.values()){
			chatBox.log(`  ${chalk.blue(`${attachment.name}`)}`);
			chatBox.log(`  ${chalk.dim(`→ ${attachment.url}`)}`);

			if(showImages && attachment.contentType?.startsWith('image/')){
				try{
					const preview = await displayImage(attachment.url);
					if(preview){
						chatBox.log(preview + '\n');
					}
					else{
						chatBox.log(chalk.dim('[Image preview unavailable in this terminal]') + '\n');
					}
				}
				catch(error){
					chatBox.log(chalk.red('Failed to load image') + '\n');
				}
			}
		}
	}

	chatBox.log('');
}