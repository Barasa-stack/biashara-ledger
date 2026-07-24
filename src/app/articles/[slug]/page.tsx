import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { getArticleBySlug, getAllArticles } from '@/lib/articles';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} | BiasharaLedger`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      siteName: 'BiasharaLedger',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Person', name: article.author },
    datePublished: article.date,
    publisher: {
      '@type': 'Organization',
      name: 'BiasharaLedger',
      url: 'https://biasharaledger.qzz.io',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://biasharaledger.qzz.io/articles/${article.slug}` },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-brand bg-brand/5 px-3 py-1 rounded-full">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-6">{article.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {article.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {article.readTime}</span>
          </div>
        </header>

        <div className="prose prose-gray max-w-none">
          {article.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <strong key={i} className="font-semibold text-gray-900">{line.replace(/\*\*/g, '')}</strong>;
            }
            if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.+?)\*\*(.*)/);
              if (match) {
                return (
                  <li key={i} className="text-gray-600 ml-4 mb-1">
                    <strong className="font-semibold text-gray-900">{match[1]}</strong>{match[2]}
                  </li>
                );
              }
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-gray-600 ml-4 mb-1">{line.replace('- ', '')}</li>;
            }
            if (line.match(/^\d+\. /)) {
              return <li key={i} className="text-gray-600 ml-4 mb-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
            }
            if (line.startsWith('[') && line.includes('](')) {
              const match = line.match(/\[(.+?)\]\((.+?)\)/);
              if (match) {
                return <Link key={i} href={match[2]} className="text-brand font-semibold hover:underline">{match[1]}</Link>;
              }
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-gray-600 leading-relaxed mb-4">{line}</p>;
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          >
            Try BiasharaLedger Free
          </Link>
        </div>
      </article>
    </div>
  );
}
