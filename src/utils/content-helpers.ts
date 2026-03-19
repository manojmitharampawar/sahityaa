import { getCollection } from 'astro:content';

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

/** Get unique scriptures with their available languages */
export async function getScriptureIndex() {
  const texts = await getAllTexts();
  const scriptureMap = new Map<string, {
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
    langUrls: Record<string, string>;
  }>();

  // First pass: collect all texts per scripture per language, pick best (chapter 1)
  const langBest = new Map<string, Map<string, { id: string; chapter: number }>>();

  for (const text of texts) {
    const d = text.data;
    const key = d.scripture;
    if (!langBest.has(key)) langBest.set(key, new Map());
    const byLang = langBest.get(key)!;
    const ch = d.chapterNumber ?? 0;
    const existing = byLang.get(d.language);
    if (!existing || ch < existing.chapter) {
      byLang.set(d.language, { id: text.id, chapter: ch });
    }
  }

  for (const text of texts) {
    const d = text.data;
    const existing = scriptureMap.get(d.scripture);
    const byLang = langBest.get(d.scripture)!;
    const langUrls: Record<string, string> = {};
    for (const [lang, best] of byLang) {
      langUrls[lang] = best.id;
    }

    if (existing) {
      if (!existing.languages.includes(d.language)) {
        existing.languages.push(d.language);
      }
      existing.titles[d.language] = d.title;
      existing.langUrls = langUrls;
      // Prefer chapter 1 (or lowest chapter), and prefer sa > hi > first found
      const existingChapter = _extractChapterFromId(existing.firstTextId);
      const thisChapter = d.chapterNumber ?? 0;
      const isBetterChapter = thisChapter < existingChapter ||
        (thisChapter === existingChapter && _langPriority(d.language) < _langPriority(_extractLangFromId(existing.firstTextId)));
      if (isBetterChapter) {
        existing.firstTextId = text.id;
      }
    } else {
      scriptureMap.set(d.scripture, {
        id: d.scripture,
        firstTextId: text.id,
        titleLatin: d.titleLatin.split(' - ')[0], // Remove chapter info
        titles: { [d.language]: d.title },
        category: d.category,
        author: d.author,
        panth: d.panth,
        religion: d.religion,
        languages: [d.language],
        description: d.description,
        tags: d.tags || [],
        totalChapters: d.totalChapters,
        hasChapters: d.chapterNumber !== undefined,
        langUrls,
      });
    }
  }

  return Array.from(scriptureMap.values());
}

function _langPriority(lang: string): number {
  const order: Record<string, number> = { sa: 0, hi: 1, mr: 2, en: 3 };
  return order[lang] ?? 9;
}

function _extractChapterFromId(id: string): number {
  const match = id.match(/chapter-(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function _extractLangFromId(id: string): string {
  const parts = id.split('/');
  const last = parts[parts.length - 1];
  return last.replace('.md', '').replace('.mdx', '') || 'sa';
}

/** Get chapters for a scripture */
export async function getChapters(scriptureId: string, language: string) {
  const texts = await getTextsByScripture(scriptureId);
  return texts
    .filter(t => t.data.language === language && t.data.chapterNumber !== undefined)
    .sort((a, b) => (a.data.chapterNumber || 0) - (b.data.chapterNumber || 0));
}
