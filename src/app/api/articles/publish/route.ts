import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const articlesDir = path.join(process.cwd(), 'content', 'articles');

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== process.env.ARTICLES_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, excerpt, author, category, readTime, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 });
    }

    const date = new Date().toISOString().split('T')[0];

    const frontmatter = `---
title: '${title.replace(/'/g, "\\'")}'
slug: ${slug}
excerpt: '${(excerpt || '').replace(/'/g, "\\'")}'
date: '${date}'
author: '${(author || 'BiasharaLedger').replace(/'/g, "\\'")}'
category: '${(category || 'General').replace(/'/g, "\\'")}'
readTime: '${readTime || '5 min read'}'
published: true
---

${content}`;

    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    const filePath = path.join(articlesDir, `${slug}.md`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Article with this slug already exists' }, { status: 409 });
    }

    fs.writeFileSync(filePath, frontmatter, 'utf-8');

    return NextResponse.json({ success: true, slug, url: `/articles/${slug}` }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
