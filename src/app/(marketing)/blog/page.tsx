import Link from 'next/link';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const blogImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-sunset.jpg', label: 'City Skyline Sunset' },
];

const posts = [
  {
    slug: 'kenya-small-business-accounting-guide-2025',
    title: 'The Complete Guide to Small Business Accounting in Kenya (2025)',
    excerpt: 'Everything you need to know about bookkeeping, KRA compliance, PAYE, and financial management for Kenyan SMEs.',
    author: 'Edward Moodley',
    date: 'June 15, 2025',
    readTime: '8 min read',
    category: 'Accounting',
  },
  {
    slug: 'mpesa-reconciliation-made-easy',
    title: 'M-Pesa Reconciliation Made Easy: Automate Your Payment Matching',
    excerpt: 'Stop manually matching M-Pesa statements to invoices. Learn how automated reconciliation saves hours every week.',
    author: 'Muthoni Wanjiku',
    date: 'June 8, 2025',
    readTime: '5 min read',
    category: 'Product',
  },
  {
    slug: 'kra-compliance-tips-2025',
    title: 'KRA Compliance Tips Every Business Owner Should Know',
    excerpt: 'Stay on the right side of KRA with these essential compliance tips for VAT, income tax, and payroll reporting.',
    author: 'Edward Moodley',
    date: 'June 1, 2025',
    readTime: '6 min read',
    category: 'Tax',
  },
  {
    slug: 'moving-from-spreadsheets-to-accounting-software',
    title: 'Moving from Spreadsheets to Accounting Software: A Transition Guide',
    excerpt: 'Is your business outgrowing Excel? Here\'s how to migrate to proper accounting software without losing data.',
    author: 'Kevin Omondi',
    date: 'May 25, 2025',
    readTime: '7 min read',
    category: 'Guides',
  },
  {
    slug: 'understanding-paye-nhif-nssf-calculations',
    title: 'Understanding PAYE, NHIF, and NSSF Calculations in Kenya',
    excerpt: 'A breakdown of how employee deductions work in Kenya and how to calculate them correctly every month.',
    author: 'Amina Hassan',
    date: 'May 18, 2025',
    readTime: '10 min read',
    category: 'Payroll',
  },
  {
    slug: 'inventory-management-best-practices',
    title: 'Inventory Management Best Practices for Kenyan Retailers',
    excerpt: 'Reduce stockouts, minimize waste, and improve cash flow with these inventory management strategies.',
    author: 'Muthoni Wanjiku',
    date: 'May 10, 2025',
    readTime: '6 min read',
    category: 'Business',
  },
];

export default function BlogPage() {
  return (
    <div>
      <PageHero
        images={blogImages}
        title={
          <>
            Insights for
            <br />
            <span className="text-white">Kenyan Business Owners</span>
          </>
        }
        subtitle="Tips, guides, and best practices for accounting, payroll, tax compliance, and growing your business."
        badge="Blog"
        badgeWithoutTrust
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-brand/30 transition-colors">
                <div className="h-40 bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
                  <span className="text-4xl">📊</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-brand bg-brand/20 px-2 py-0.5 rounded-full">{post.category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 leading-snug">{post.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Want more insights?</h2>
          <p className="text-lg text-white/60 mb-8">Subscribe to our newsletter for weekly tips and updates.</p>
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <button className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors shrink-0">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-white/50 mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
