import * as readline from 'readline';
import fs from 'fs';
import { pathToFileURL } from 'url';

export function runSetup(): Promise<void> {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.question('Enter your Discord bot token --> ', (token) => {
			const trimmed = token.trim();
			if (!trimmed) {
				console.log('Token is empty. Setup cancelled.');
				rl.close();
				resolve();
				return;
			}

			fs.writeFileSync('.env', `DISCORD_TOKEN=${trimmed}\n`);
			console.log('.env file created. Enter npm run dev to run Discord in Terminal.');
			rl.close();
			resolve();
		});
	});
}

const isDirectRun = process.argv[1] !== undefined
	&& import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
	void runSetup();
}