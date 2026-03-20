import { getCollection } from 'astro:content';
import { getChapterSlug } from './verse-parser';

export const LANGUAGE_NAMES: Record<string, string> = {
  sa: 'Sanskrit',
  hi: 'Hindi',
  mr: 'Marathi',
  gu: 'Gujarati',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  en: 'English',
};

export const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  sa: 'संस्कृतम्',
  hi: 'हिन्दी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  bn: 'বাংলা',
  en: 'English',
};

export const RELIGION_NAMES: Record<string, string> = {
  hindu: 'Hindu',
  jain: 'Jain',
  buddhist: 'Buddhist',
  sikh: 'Sikh',
};

export async function getAllTexts() {
  return await getCollection('texts');
}

export async function getTextsByScripture(scriptureId: string) {
  const texts = await getAllTexts();
  return texts.filter(t => t.data.scripture === scriptureId);
}

export async function getTextsByCategory(category: string) {
  const texts = await getAllTexts();
  return texts.filter(t => t.data.category === category);
}

export async function getTextsByAuthor(authorId: string) {
  const texts = await getAllTexts();
  return texts.filter(t => t.data.author === authorId);
}

export async function getTextsByPanth(panthId: string) {
  const texts = await getAllTexts();
  return texts.filter(t => t.data.panth === panthId);
}

export async function getTextsByReligion(religion: string) {
  const texts = await getAllTexts();
  return texts.filter(t => t.data.religion === religion);
}

export interface ScriptureEntry {
  id: string;
  firstTextId: string;
  titleLatin: string;
  titles: Record<string, string>;
  category: string;
  author: string;
  panth: string;
  religion: string;
  languages: string[];
  description?: string;
  tags: string[];
  totalChapters?: number;
  hasChapters: boolean;
  /** For chapter entries: the chapter number */
  chapterNumber?: number;
  /** For chapter entries: the chapter title */
  chapterTitle?: string;
}

/** Get unique scriptures with their available languages.
 *  Multi-chapter texts produce one entry per chapter. */
export async function getScriptureIndex(): Promise<ScriptureEntry[]> {
  const texts = await getAllTexts();

  // Group texts by scripture
  const byScripture = new Map<string, typeof texts>();
  for (const text of texts) {
    const s = text.data.scripture;
    if (!byScripture.has(s)) byScripture.set(s, []);
    byScripture.get(s)!.push(text);
  }

  const results: ScriptureEntry[] = [];

  for (const [scripture, group] of byScripture) {
    const hasChapters = group.some(t => t.data.chapterNumber !== undefined);

    // Collect unique languages and titles across all versions
    const languages: string[] = [];
    const titles: Record<string, string> = {};
    for (const t of group) {
      if (!languages.includes(t.data.language)) languages.push(t.data.language);
      titles[t.data.language] = t.data.title;
    }

    const sample = group[0].data;

    if (!hasChapters) {
      // Single-entry scripture (aartis, abhangas, etc.)
      const slug = getChapterSlug(group[0].id);
      results.push({
        id: scripture,
        firstTextId: slug,
        titleLatin: sample.titleLatin.split(' - ')[0],
        titles,
        category: sample.category,
        author: sample.author,
        panth: sample.panth,
        religion: sample.religion,
        languages,
        description: sample.description,
        tags: sample.tags || [],
        hasChapters: false,
      });
    } else {
      // Multi-chapter: one entry per chapter
      // Group by chapter number to deduplicate language versions
      const byChapter = new Map<number, typeof texts>();
      for (const t of group) {
        const ch = t.data.chapterNumber;
        if (ch === undefined) continue;
        if (!byChapter.has(ch)) byChapter.set(ch, []);
        byChapter.get(ch)!.push(t);
      }

      const sortedChapters = Array.from(byChapter.entries()).sort((a, b) => a[0] - b[0]);

      for (const [chNum, chTexts] of sortedChapters) {
        const chLangs: string[] = [];
        const chTitles: Record<string, string> = {};
        for (const t of chTexts) {
          if (!chLangs.includes(t.data.language)) chLangs.push(t.data.language);
          chTitles[t.data.language] = t.data.title;
        }
        const chSample = chTexts[0].data;
        const chSlug = getChapterSlug(chTexts[0].id);
        const chapterLabel = chSample.chapterTitle || `Chapter ${chNum}`;
        const scriptureName = chSample.titleLatin.split(' - ')[0];

        results.push({
          id: `${scripture}/chapter-${String(chNum).padStart(2, '0')}`,
          firstTextId: chSlug,
          titleLatin: `${scriptureName} - ${chapterLabel}`,
          titles: chTitles,
          category: chSample.category,
          author: chSample.author,
          panth: chSample.panth,
          religion: chSample.religion,
          languages: chLangs,
          description: chSample.description,
          tags: chSample.tags || [],
          totalChapters: chSample.totalChapters,
          hasChapters: true,
          chapterNumber: chNum,
          chapterTitle: chapterLabel,
        });
      }
    }
  }

  return results;
}

/** Get chapters for a scripture */
export async function getChapters(scriptureId: string, language: string) {
  const texts = await getTextsByScripture(scriptureId);
  return texts
    .filter(t => t.data.language === language && t.data.chapterNumber !== undefined)
    .sort((a, b) => (a.data.chapterNumber || 0) - (b.data.chapterNumber || 0));
}
