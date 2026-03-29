import terminalImage from 'terminal-image';
import got from 'got';

function isImagePreviewSupported(): boolean {
	const terminalProgram = process.env.TERM_PROGRAM?.toLowerCase() ?? '';
	const isCodespaces = process.env.CODESPACES === 'true';

	if (isCodespaces || terminalProgram.includes('vscode')) {
		return false;
	}

	const terminalImageWithSupport = terminalImage as unknown as { isSupported?: boolean };
	return terminalImageWithSupport.isSupported !== false;
}

export async function displayImage(url: string): Promise<string | null> {
	if (!isImagePreviewSupported()) {
		return null;
	}

	try{
		const body = await got(url).buffer();
		const image = await terminalImage.buffer(body, {
			width: 20,
			height: 20,
			preserveAspectRatio: true
		});

		return image;
	}

	catch(error){
		return null;
	}
}