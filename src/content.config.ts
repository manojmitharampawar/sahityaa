import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const texts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/texts' }),
  schema: z.object({
    title: z.string(),
    titleLatin: z.string(),
    language: z.enum(['sa', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn', 'en']),
    scripture: z.string(),
    category: z.enum([
      'vedas', 'upanishads', 'puranas', 'epics', 'stotras',
      'gitas', 'smritis', 'tantras', 'agamas', 'sutras',
      'aartis', 'abhangas', 'dohas', 'sant-sahitya',
    ]),
    subcategory: z.string().optional(),
    author: z.string(),
    panth: z.enum([
      'shaiva', 'vaishnava', 'shakta', 'smarta',
      'saura', 'ganapatya', 'common', 'varkari',
    ]),
    religion: z.enum(['hindu', 'jain', 'buddhist', 'sikh']),
    chapterNumber: z.number().optional(),
    chapterTitle: z.string().optional(),
    totalChapters: z.number().optional(),
    verseRange: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const authors = defineCollection({
  loader: file('./src/content/authors/authors.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    nameLatin: z.string(),
    namesByLanguage: z.record(z.string(), z.string()).optional(),
    period: z.string().optional(),
    description: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: file('./src/content/categories/categories.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    nameLatin: z.string(),
    namesByLanguage: z.record(z.string(), z.string()).optional(),
    description: z.string().optional(),
    parentCategory: z.string().optional(),
    order: z.number().optional(),
  }),
});

const panths = defineCollection({
  loader: file('./src/content/panths/panths.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    nameLatin: z.string(),
    namesByLanguage: z.record(z.string(), z.string()).optional(),
    description: z.string().optional(),
    primaryDeity: z.string().optional(),
  }),
});

export const collections = { texts, authors, categories, panths };
