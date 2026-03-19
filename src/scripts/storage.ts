/**
 * Sahityaa Storage Layer
 * - localStorage for simple preferences (theme, font size, language)
 * - IndexedDB via idb-keyval for structured data (bookmarks, reading lists, progress)
 */
import { get, set, del, keys } from 'idb-keyval';

// ─── Types ───────────────────────────────────────────────

export interface Bookmark {
  id: string;
  scriptureId: string;
  language: string;
  pageSlug: string;
  scrollPercent: number;
  note: string;
  title: string;
  createdAt: number;
}

export interface ReadingProgress {
  scriptureId: string;
  language: string;
  lastPageSlug: string;
  currentPage: number;
  totalPages: number;
  scrollPercent: number;
  percentComplete: number;
  lastReadAt: number;
}

export interface ReadingList {
  id: string;
  name: string;
  items: string[]; // scripture IDs
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = 'sepia' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

// ─── Preferences (localStorage - synchronous) ───────────

const PREFIX = 'sahityaa_';

export const prefs = {
  getTheme(): ThemeMode {
    return (localStorage.getItem(`${PREFIX}theme`) as ThemeMode) || 'sepia';
  },
  setTheme(theme: ThemeMode) {
    localStorage.setItem(`${PREFIX}theme`, theme);
  },

  getFontSize(): FontSize {
    return (localStorage.getItem(`${PREFIX}font_size`) as FontSize) || 'md';
  },
  setFontSize(size: FontSize) {
    localStorage.setItem(`${PREFIX}font_size`, size);
  },

  getPreferredLanguage(): string {
    return localStorage.getItem(`${PREFIX}pref_lang`) || 'sa';
  },
  setPreferredLanguage(lang: string) {
    localStorage.setItem(`${PREFIX}pref_lang`, lang);
  },
};

// ─── Favorites (IndexedDB) ──────────────────────────────

export const favorites = {
  async getAll(): Promise<string[]> {
    return (await get(`${PREFIX}favorites`)) || [];
  },
  async toggle(scriptureId: string): Promise<boolean> {
    const favs = await this.getAll();
    const idx = favs.indexOf(scriptureId);
    if (idx >= 0) {
      favs.splice(idx, 1);
      await set(`${PREFIX}favorites`, favs);
      return false;
    } else {
      favs.push(scriptureId);
      await set(`${PREFIX}favorites`, favs);
      return true;
    }
  },
  async isFavorite(scriptureId: string): Promise<boolean> {
    const favs = await this.getAll();
    return favs.includes(scriptureId);
  },
};

// ─── Read Later (IndexedDB) ─────────────────────────────

export const readLater = {
  async getAll(): Promise<string[]> {
    return (await get(`${PREFIX}read_later`)) || [];
  },
  async toggle(scriptureId: string): Promise<boolean> {
    const items = await this.getAll();
    const idx = items.indexOf(scriptureId);
    if (idx >= 0) {
      items.splice(idx, 1);
      await set(`${PREFIX}read_later`, items);
      return false;
    } else {
      items.push(scriptureId);
      await set(`${PREFIX}read_later`, items);
      return true;
    }
  },
  async isInList(scriptureId: string): Promise<boolean> {
    const items = await this.getAll();
    return items.includes(scriptureId);
  },
};

// ─── Bookmarks (IndexedDB) ──────────────────────────────

export const bookmarks = {
  async getAll(): Promise<Bookmark[]> {
    return (await get(`${PREFIX}bookmarks`)) || [];
  },
  async add(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    const items = await this.getAll();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    items.push(newBookmark);
    await set(`${PREFIX}bookmarks`, items);
    return newBookmark;
  },
  async remove(id: string): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter(b => b.id !== id);
    await set(`${PREFIX}bookmarks`, filtered);
  },
  async getForPage(pageSlug: string): Promise<Bookmark | undefined> {
    const items = await this.getAll();
    return items.find(b => b.pageSlug === pageSlug);
  },
  async toggleForPage(pageSlug: string, data: Omit<Bookmark, 'id' | 'createdAt' | 'pageSlug'>): Promise<boolean> {
    const existing = await this.getForPage(pageSlug);
    if (existing) {
      await this.remove(existing.id);
      return false;
    } else {
      await this.add({ ...data, pageSlug });
      return true;
    }
  },
};

// ─── Reading Progress (IndexedDB) ───────────────────────

export const progress = {
  async get(scriptureId: string, language: string): Promise<ReadingProgress | undefined> {
    return await get(`${PREFIX}progress_${scriptureId}_${language}`);
  },
  async save(data: ReadingProgress): Promise<void> {
    await set(`${PREFIX}progress_${data.scriptureId}_${data.language}`, data);
  },
  async getAll(): Promise<ReadingProgress[]> {
    const allKeys = await keys();
    const progressKeys = allKeys.filter(k => String(k).startsWith(`${PREFIX}progress_`));
    const results: ReadingProgress[] = [];
    for (const key of progressKeys) {
      const val = await get(key);
      if (val) results.push(val);
    }
    return results.sort((a, b) => b.lastReadAt - a.lastReadAt);
  },
  async remove(scriptureId: string, language: string): Promise<void> {
    await del(`${PREFIX}progress_${scriptureId}_${language}`);
  },
};

// ─── Reading Lists (IndexedDB) ──────────────────────────

export const readingLists = {
  async getAll(): Promise<ReadingList[]> {
    return (await get(`${PREFIX}reading_lists`)) || [];
  },
  async create(name: string): Promise<ReadingList> {
    const lists = await this.getAll();
    const newList: ReadingList = {
      id: `rl_${Date.now()}`,
      name,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    lists.push(newList);
    await set(`${PREFIX}reading_lists`, lists);
    return newList;
  },
  async rename(id: string, name: string): Promise<void> {
    const lists = await this.getAll();
    const list = lists.find(l => l.id === id);
    if (list) {
      list.name = name;
      list.updatedAt = Date.now();
      await set(`${PREFIX}reading_lists`, lists);
    }
  },
  async remove(id: string): Promise<void> {
    const lists = await this.getAll();
    await set(`${PREFIX}reading_lists`, lists.filter(l => l.id !== id));
  },
  async addItem(listId: string, scriptureId: string): Promise<void> {
    const lists = await this.getAll();
    const list = lists.find(l => l.id === listId);
    if (list && !list.items.includes(scriptureId)) {
      list.items.push(scriptureId);
      list.updatedAt = Date.now();
      await set(`${PREFIX}reading_lists`, lists);
    }
  },
  async removeItem(listId: string, scriptureId: string): Promise<void> {
    const lists = await this.getAll();
    const list = lists.find(l => l.id === listId);
    if (list) {
      list.items = list.items.filter(i => i !== scriptureId);
      list.updatedAt = Date.now();
      await set(`${PREFIX}reading_lists`, lists);
    }
  },
  async getListsForScripture(scriptureId: string): Promise<ReadingList[]> {
    const lists = await this.getAll();
    return lists.filter(l => l.items.includes(scriptureId));
  },
};
