/**
 * Verse Parser — Extracts individual verses from raw markdown content.
 * Used to align and interleave multiple language versions of the same scripture.
 */

export interface VerseBlock {
  /** Normalized verse number (e.g., 1, 2, 21). For ranges like "21-22", uses the first number. */
  number: number;
  /** Original heading text (e.g., "श्लोक १", "मन्त्र ५") */
  heading: string;
  /** Raw markdown body lines (without the heading) */
  body: string;
}

export interface ParsedContent {
  /** Content before the first verse heading (title, subtitle, dividers) */
  preamble: string;
  /** Ordered list of verse blocks */
  verses: VerseBlock[];
  /** Content after the last verse (colophon, closing divider) */
  epilogue: string;
  /** Whether this content has recognizable verse structure */
  hasVerseStructure: boolean;
}

// Devanagari numerals → Arabic
const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function devanagariToArabic(str: string): number {
  const converted = str.replace(/[०-९]/g, ch => DEVANAGARI_DIGITS[ch] || ch);
  const match = converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Verse heading patterns (##, ###, or #### level):
 * - श्लोक X (shloka)
 * - मन्त्रः X or मन्त्र X (mantra)
 * - अभंग X (abhanga)
 * - दोहा X (doha/couplet)
 * - Verse X, Shloka X, Shlok X (English)
 * X can be Devanagari or Arabic numerals, optionally with ranges (X-Y)
 */
const VERSE_HEADING_RE = /^(#{2,4})\s+(श्लोक|मन्त्रः?|अभंग|दोहा|[Vv]erse|[Ss]hloka?)\s+([०-९0-9]+(?:\s*[-–—]\s*[०-९0-9]+)?)/;

/**
 * Parse raw markdown body into structured verse blocks.
 */
export function parseVerses(markdown: string): ParsedContent {
  const lines = markdown.split('\n');
  const preambleLines: string[] = [];
  const verses: VerseBlock[] = [];
  let currentVerse: { number: number; heading: string; bodyLines: string[] } | null = null;
  let foundFirstVerse = false;

  for (const line of lines) {
    const match = line.match(VERSE_HEADING_RE);

    if (match) {
      // Save previous verse
      if (currentVerse) {
        verses.push({
          number: currentVerse.number,
          heading: currentVerse.heading,
          body: currentVerse.bodyLines.join('\n').trim(),
        });
      }

      foundFirstVerse = true;
      const verseNum = devanagariToArabic(match[3]);
      const headingText = line.replace(/^#{2,3}\s+/, '').trim();
      currentVerse = { number: verseNum, heading: headingText, bodyLines: [] };
    } else if (!foundFirstVerse) {
      preambleLines.push(line);
    } else if (currentVerse) {
      currentVerse.bodyLines.push(line);
    }
  }

  // Push last verse
  if (currentVerse) {
    verses.push({
      number: currentVerse.number,
      heading: currentVerse.heading,
      body: currentVerse.bodyLines.join('\n').trim(),
    });
  }

  // Check if the last verse has trailing epilogue content (divider + colophon)
  let epilogue = '';
  if (verses.length > 0) {
    const lastVerse = verses[verses.length - 1];
    const dividerIdx = lastVerse.body.lastIndexOf('<div class="divider"></div>');
    if (dividerIdx !== -1) {
      epilogue = lastVerse.body.slice(dividerIdx).trim();
      lastVerse.body = lastVerse.body.slice(0, dividerIdx).trim();
    }
  }

  return {
    preamble: preambleLines.join('\n').trim(),
    verses,
    epilogue,
    hasVerseStructure: verses.length > 0,
  };
}

/**
 * Render a markdown fragment to HTML.
 * Handles the subset of markdown used in verse content:
 * - ## and ### headings
 * - *emphasis* (for meanings/translations)
 * - <div> pass-through (dividers)
 * - Line breaks within paragraphs
 * - Preserves Devanagari text
 */
export function renderVerseHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const result: string[] = [];
  let paraLines: string[] = [];

  function flushPara() {
    if (paraLines.length > 0) {
      let html = paraLines.join('<br>\n');
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      result.push(`<p>${html}</p>`);
      paraLines = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushPara();
    } else if (trimmed.startsWith('<div') || trimmed.startsWith('<p') || trimmed.startsWith('</')) {
      flushPara();
      result.push(trimmed);
    } else if (trimmed.startsWith('### ')) {
      flushPara();
      result.push(`<h3>${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      flushPara();
      result.push(`<h2>${trimmed.slice(3)}</h2>`);
    } else {
      paraLines.push(line);
    }
  }
  flushPara();

  return result.join('\n');
}

/**
 * Determine the "original" language for a set of language versions.
 * Priority: sa (Sanskrit) > mr (Marathi, for sant sahitya) > hi > en > others
 */
export function getOriginalLanguage(languages: string[]): string {
  const priority = ['sa', 'mr', 'hi', 'en', 'gu', 'ta', 'te', 'kn', 'bn'];
  for (const lang of priority) {
    if (languages.includes(lang)) return lang;
  }
  return languages[0] || 'sa';
}

/**
 * Derive the chapter/scripture slug from a text entry ID.
 * Removes the language suffix (last path segment).
 * e.g., "gitas/bhagavad-gita/chapter-01/sa" → "gitas/bhagavad-gita/chapter-01"
 * e.g., "aartis/sukhkarta-dukhharta/mr" → "aartis/sukhkarta-dukhharta"
 */
export function getChapterSlug(textId: string): string {
  const parts = textId.split('/');
  return parts.slice(0, -1).join('/');
}
