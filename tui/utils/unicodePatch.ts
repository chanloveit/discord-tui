import blessed from 'blessed';
import stringWidth from 'string-width';

const graphemeSegmenter = typeof Intl.Segmenter === 'function'
	? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
	: null;
const emojiClusterRegex = /^\p{RGI_Emoji}$/v;
const unqualifiedKeycapRegex = /^[\d#*]\uFE0F?\u20E3$/u;

function isZeroWidthCodePoint(point: number): boolean {
	return point === 0xFE0F || point === 0xFE0E || point === 0x200D;
}

function isEmojiLikeSegment(segment: string): boolean {
	return emojiClusterRegex.test(segment)
		|| unqualifiedKeycapRegex.test(segment);
}

function splitIntoSegments(text: string): Array<{ index: number; segment: string }> {
	if (graphemeSegmenter) {
		return Array.from(graphemeSegmenter.segment(text), ({ index, segment }) => ({ index, segment }));
	}

	const segments: Array<{ index: number; segment: string }> = [];
	let index = 0;

	for (const segment of text) {
		segments.push({ index, segment });
		index += segment.length;
	}

	return segments;
}


export function patchBlessedUnicode(): void {
	const unicode = (blessed as any).unicode;
	if (!unicode) return;

	const origCharWidth = unicode.charWidth;
	const origStrWidth = unicode.strWidth;
	let cachedText = '';
	let cachedSegments = splitIntoSegments('');

	function getSegmentWidth(segment: string): number {
		if (segment.length === 0) {
			return 0;
		}

		if (isEmojiLikeSegment(segment)) {
			return stringWidth(segment);
		}

		let width = 0;

		for (const char of segment) {
			const point = char.codePointAt(0);

			if (point === undefined) {
				continue;
			}

			width += origCharWidth.call(unicode, point);
		}

		return width;
	}

	function getCachedSegments(text: string): Array<{ index: number; segment: string }> {
		if (text !== cachedText) {
			cachedText = text;
			cachedSegments = splitIntoSegments(text);
		}

		return cachedSegments;
	}

	unicode.charWidth = function (str: string | number, i?: number) {
		if (typeof str === 'number') {
			if (isZeroWidthCodePoint(str)) {
				return 0;
			}

			const char = String.fromCodePoint(str);
			return isEmojiLikeSegment(char) ? stringWidth(char) : origCharWidth.call(this, str);
		}

		const index = i ?? 0;
		const segments = getCachedSegments(str);
		const point = unicode.codePointAt(str, index);

		if (point === undefined || point === null) {
			return origCharWidth.call(this, str, i);
		}

		if (isZeroWidthCodePoint(point)) {
			return 0;
		}

		for (const [segmentIndex, segmentInfo] of segments.entries()) {
			const currentIndex = segmentInfo.index;
			const nextIndex = segments[segmentIndex + 1]?.index ?? str.length;

			if (index < currentIndex || index >= nextIndex) {
				continue;
			}

			if (index !== currentIndex) {
				return 0;
			}

			return getSegmentWidth(segmentInfo.segment);
		}

		return origCharWidth.call(this, str, i);
	};

	unicode.strWidth = function (str: string) {
		if (typeof str !== 'string' || str.length === 0) {
			return origStrWidth.call(this, str);
		}

		let width = 0;

		for (const { segment } of getCachedSegments(str)) {
			width += getSegmentWidth(segment);
		}

		return width;
	};
}
