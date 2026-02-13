import * as readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('Enter your Discord bot token --> ', (token) => {
	fs.writeFileSync('.env', `DISCORD_TOKEN = ${token}\n`);
	console.log('.env file created. Enter npm run dev to run Discord in Terminal.');
	rl.close();
});