import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    bannerIcons: z.array(z.string()).default([]),
    colorBackground: z.string().default('#2b2b2b'),
    colorPrimary: z.string().default('#ffffff'),
    colorSecondary: z.string().default('#767676'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
