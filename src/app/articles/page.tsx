import Link from 'next/link';
import { ArrowRight, Calendar, User as UserIcon, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';

export const metadata: Metadata = {
  title: 'Articles & Insights',
  description: 'Tips, guides, and best practices for accounting, payroll, KRA compliance, inventory management, and growing your Kenyan business.',
  openGraph: {
    title: 'Articles & Insights | BiasharaLedger',
    description: 'Practical business advice for Kenyan SMEs — accounting, tax compliance, payroll, and growth strategies.',
    type: 'website',
  },
};

const ITEMS_PER_PAGE = 10;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const all = getAllArticles();
  const total = all.length;
  const pages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const articles = all.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white">
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-semibold text-brand">Latest insights</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Articles & Insights</h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Practical tips and guides for Kenyan business owners — from accounting and tax compliance to inventory management and growth.
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">No articles yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/articles/${article.slug}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-brand/20 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-brand bg-brand/5 px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-brand transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {article.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={p === 1 ? '/articles' : `/articles?page=${p}`}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold flex items-center justify-center transition-all ${
                        p === page
                          ? 'bg-brand text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="text-center mt-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
