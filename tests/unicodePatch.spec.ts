import blessed from 'blessed';
import { describe, expect, it } from 'vitest';
import stringWidth from 'string-width';

import { patchBlessedUnicode } from '../tui/utils/unicodePatch.js';

patchBlessedUnicode();

const unicode = (blessed as any).unicode;

function expectSingleGraphemeWidth(text: string): void {
	expect(unicode.charWidth(text, 0)).toBe(stringWidth(text));

	for (let index = 1; index < text.length; index += 1) {
		expect(unicode.charWidth(text, index)).toBe(0);
	}
}

describe('patchBlessedUnicode', () => {
	it('keeps ASCII width unchanged', () => {
		expect(unicode.charWidth('A', 0)).toBe(1);
		expect(unicode.strWidth('Hello')).toBe(5);
	});

	it('keeps non-emoji symbols like sidebar glyphs narrow', () => {
		expect(unicode.charWidth('☰', 0)).toBe(1);
		expect(unicode.strWidth(' ☰ Channels ')).toBe(12);
	});

	it('treats variation-selector emoji as a single grapheme', () => {
		expectSingleGraphemeWidth('❤️');
	});

	it('treats regional-indicator flags as a single grapheme', () => {
		expectSingleGraphemeWidth('🇰🇷');
	});

	it('treats ZWJ emoji sequences as a single grapheme', () => {
		expectSingleGraphemeWidth('👨‍👩‍👧‍👦');
	});
});