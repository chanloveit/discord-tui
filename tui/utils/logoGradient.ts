function hexToRgb(hex: string): [number, number, number] {
	const normalizedHex = hex.replace('#', '');
	return [
		parseInt(normalizedHex.substring(0, 2), 16),
		parseInt(normalizedHex.substring(2, 4), 16),
		parseInt(normalizedHex.substring(4, 6), 16)
	];
}

function rgbToHex(red: number, green: number, blue: number): string {
	return '#' + [red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function interpolateHex(startHex: string, endHex: string, ratio: number): string {
	const [startRed, startGreen, startBlue] = hexToRgb(startHex);
	const [endRed, endGreen, endBlue] = hexToRgb(endHex);

	return rgbToHex(
		Math.round(startRed + (endRed - startRed) * ratio),
		Math.round(startGreen + (endGreen - startGreen) * ratio),
		Math.round(startBlue + (endBlue - startBlue) * ratio)
	);
}

export function createGradientLogo(logo: string, startColor: string, endColor: string, colorize: (color: string, text: string) => string): string {
	const logoLines = logo.split('\n');
	const nonEmptyLineIndexes = logoLines.reduce<number[]>((indexes, line, index) => {
		if (line.trim() !== '') {
			indexes.push(index);
		}

		return indexes;
	}, []);
	const midpoint = Math.ceil(nonEmptyLineIndexes.length / 2);

	return logoLines.map((line, index) => {
		if (line.trim() === '') {
			return line;
		}

		const position = nonEmptyLineIndexes.indexOf(index);
		if (position >= midpoint) {
			return colorize(endColor, line);
		}

		const ratio = midpoint > 1 ? position / (midpoint - 1) : 0;
		return colorize(interpolateHex(startColor, endColor, ratio), line);
	}).join('\n');
}