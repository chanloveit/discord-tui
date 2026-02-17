import terminalImage from 'terminal-image';
import got from 'got';

export async function displayImage(url: string): Promise<string | null> {
	try{
		const body = await got(url).buffer();
		const image = await terminalImage.buffer(body, {
			width: 50,
			height: 50,
			preserveAspectRatio: true
		});

		return image;
	}

	catch(error){
		return null;
	}
}