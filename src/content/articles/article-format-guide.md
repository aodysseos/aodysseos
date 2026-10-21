---
title: "Article format guide"
subtitle: "A showcase of every frontmatter field and content pattern"
date: 2026-06-13
tags: ["astro", "markdown", "writing"]
colorBackground: "#1a3a4a"
colorPrimary: "#4ecdc4"
colorSecondary: "#1b6b5a"
bannerIcons:
  - "https://cdn.worldvectorlogo.com/logos/astro-1.svg"
  - "https://cdn.worldvectorlogo.com/logos/typescript.svg"
---

This article demonstrates every frontmatter field and content pattern supported by the Astro writing template. Use it as a reference when authoring new posts.

## Frontmatter fields

Articles are defined in `src/content/articles/` and validated by the schema in `src/content.config.ts`. The following fields are available:

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | Shown in the title card and page `<title>` |
| `subtitle` | No | Shown below the title in the title card |
| `date` | Yes | Used to sort articles on `/writing` (newest first) |
| `tags` | No | Rendered as links in the title card |
| `bannerIcons` | No | Icon URLs shown in the article hero and writing card |
| `colorBackground` | No | Hero background, card background, gradient start (default: `#2b2b2b`) |
| `colorPrimary` | No | Link underlines and accent color (default: `#ffffff`) |
| `colorSecondary` | No | Subtitle color and gradient middle (default: `#767676`) |
| `heroImage` | No | Listing card thumbnail when `bannerIcons` is empty — not shown on the article page |
| `draft` | No | Set to `true` to hide from `/writing` (default: `false`) |

This article uses `bannerIcons` for the hero. If you omit `bannerIcons` and provide `heroImage` instead (e.g. `heroImage: "/images/statue-render.jpg"`), the image appears as a background thumbnail on the writing listing page only.

### Typography

Paragraphs support **bold text**, *italic text*, and `inline code`. Links like [Astro](https://astro.build) get a hover underline styled with the article's `colorPrimary`.

### Headings

#### Heading level 4

##### Heading level 5

###### Heading level 6

### Lists

Unordered list:

- First item
- Second item with **bold**
- Third item with a [link](https://example.com)

Ordered list:

1. Step one
2. Step two
3. Step three

### Blockquote

> Good design is as little design as possible. Less, but better — because it concentrates on the essential aspects, and the products are not burdened with non-essentials.

## Code samples

Fenced code blocks are syntax-highlighted by Astro (Shiki). Use a language tag after the opening fence:

```javascript
export function greet(name) {
  return `Hello, ${name}!`;
}
```

```typescript
type Article = {
  title: string;
  date: Date;
  tags: string[];
};
```

```bash
npm run dev
```

```json
{
  "draft": false,
  "tags": ["astro", "markdown"]
}
```

## Article images

Standard Markdown images render without the gradient frame. To get the styled image wrapper, use raw HTML with the `article-image` class:

<div class="article-image">
  <img src="/images/statue-render.jpg" alt="Sample article image" />
</div>

## GFM extras

Astro enables [GitHub Flavored Markdown](https://github.github.com/gfm/) via remark-gfm. These features work but have no dedicated article styles yet:

| Feature | Supported | Custom styles |
| --- | --- | --- |
| Tables | Yes | No |
| Strikethrough | Yes | No |
| Task lists | Yes | No |

Strikethrough example: ~~deprecated API~~.

Task list example:

- [x] Frontmatter configured
- [x] Code samples added
- [ ] Your article here

## Not supported

The previous Gatsby site supported GitHub Gist embeds, CodeSandbox iframes, and video blocks via Contentful rich text. These are **not** available in the current Astro Markdown pipeline. Use fenced code blocks and static images instead.
