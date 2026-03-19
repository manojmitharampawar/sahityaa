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
  }>();

  for (const text of texts) {
    const d = text.data;
    const existing = scriptureMap.get(d.scripture);

    if (existing) {
      if (!existing.languages.includes(d.language)) {
        existing.languages.push(d.language);
      }
      existing.titles[d.language] = d.title;
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
      });
    }
  }

  return Array.from(scriptureMap.values());
}

/** Get chapters for a scripture */
export async function getChapters(scriptureId: string, language: string) {
  const texts = await getTextsByScripture(scriptureId);
  return texts
    .filter(t => t.data.language === language && t.data.chapterNumber !== undefined)
    .sort((a, b) => (a.data.chapterNumber || 0) - (b.data.chapterNumber || 0));
}
