import { NextRequest, NextResponse } from 'next/server';
import { getArticlesPage, getAllArticles } from '@/lib/articles';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const slug = searchParams.get('slug');

  if (slug) {
    const { getArticleBySlug } = await import('@/lib/articles');
    const article = getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  }

  const result = getArticlesPage(page, limit);
  return NextResponse.json(result);
}
