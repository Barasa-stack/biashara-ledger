import fs from 'fs';
import path from 'path';

export type ArticleMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  published: boolean;
};

export type Article = ArticleMeta & {
  content: string;
};

const articlesDir = path.join(process.cwd(), 'content', 'articles');

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(': ');
    if (sep > 0) {
      meta[line.slice(0, sep).trim()] = line.slice(sep + 2).trim();
    }
  }
  return { meta, content: match[2].trim() };
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  const articles = files.map((file) => {
    const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
    const { meta, content } = parseFrontmatter(raw);
    return {
      slug: meta.slug || file.replace('.md', ''),
      title: meta.title || '',
      excerpt: meta.excerpt || '',
      date: meta.date || '',
      author: meta.author || '',
      category: meta.category || '',
      readTime: meta.readTime || '',
      published: meta.published !== 'false',
      content,
    };
  });

  return articles
    .filter(a => a.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string): Article | null {
  return getAllArticles().find(a => a.slug === slug) || null;
}

export function getArticlesPage(page: number, limit: number = 10): {
  articles: Article[];
  total: number;
  pages: number;
  page: number;
} {
  const all = getAllArticles();
  const total = all.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    articles: all.slice(start, start + limit),
    total,
    pages,
    page,
  };
}
