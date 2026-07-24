'use client';

import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
  content: string;
};

const POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Ultimate Guide to Small Business Accounting in Kenya',
    excerpt: 'Learn the essential accounting principles every small business owner in Kenya needs to know, from tax compliance to cash flow management.',
    date: '2025-12-15',
    readTime: '8 min read',
    category: 'Accounting',
    slug: 'small-business-accounting-kenya',
    content: `Running a small business in Kenya comes with unique accounting challenges. From understanding VAT requirements to managing mobile money transactions, getting your books right is crucial for success.

## Why Accounting Matters for Kenyan SMEs

Many small business owners in Kenya view accounting as a tedious chore, but it's actually one of the most important aspects of running a successful business. Proper accounting helps you:

- Track your business performance
- Make informed decisions
- Stay compliant with KRA requirements
- Secure funding from banks and investors
- Plan for growth and expansion

## Key Accounting Principles for Kenyan Businesses

### 1. Separate Personal and Business Finances
One of the most common mistakes we see is mixing personal and business money. Open a dedicated business bank account and use it for all business transactions. This makes tax filing much easier and gives you a clear picture of your business performance.

### 2. Track Every Transaction
In Kenya's cash-heavy economy, it's easy to lose track of transactions. Use digital tools to record every sale, expense, and transfer. Mobile money transactions (M-Pesa, Airtel Money) should be reconciled daily.

### 3. Understand KRA Requirements
Kenya Revenue Authority requires businesses to:
- Register for income tax
- File monthly VAT returns (if registered for VAT)
- File annual returns
- Maintain records for at least 5 years

### 4. Embrace Digital Tools
Manual bookkeeping is error-prone and time-consuming. Modern accounting software like BiasharaLedger can automate much of the work, from invoice generation to tax calculations.

## Common Accounting Mistakes to Avoid

1. **Not reconciling bank statements** — Reconcile your accounts monthly to catch errors early
2. **Ignoring petty cash** — Small expenses add up; track everything
3. **Mixing VAT and non-VAT items** — Keep them separate for accurate VAT returns
4. **Not backing up data** — Always maintain digital backups of your financial records

## Conclusion

Good accounting is the foundation of a successful business. By following these principles and using the right tools, you can keep your finances in order and focus on growing your business.`,
  },
  {
    id: '2',
    title: 'How to Streamline Your Inventory Management with Technology',
    excerpt: 'Discover how modern inventory management systems can help you reduce costs, prevent stockouts, and optimize your supply chain.',
    date: '2025-11-28',
    readTime: '6 min read',
    category: 'Inventory',
    slug: 'streamline-inventory-management',
    content: `Inventory management is a critical aspect of any business that deals with physical products. Poor inventory management can lead to stockouts, overstocking, and lost revenue. Here's how technology can help.

## The Cost of Poor Inventory Management

Businesses lose significant revenue due to inventory mismanagement:
- Stockouts result in lost sales and damaged customer trust
- Overstocking ties up capital that could be used elsewhere
- Expired or obsolete inventory represents pure loss
- Manual counting is time-consuming and error-prone

## How Technology Transforms Inventory Management

### Real-time Tracking
Modern inventory systems provide real-time visibility into your stock levels across all locations. You can see exactly what you have, where it is, and when you need to reorder.

### Automated Reordering
Set minimum stock levels and let the system automatically generate purchase orders when inventory drops below the threshold. This prevents stockouts without requiring constant manual monitoring.

### Barcode and QR Code Scanning
Speed up receiving, picking, and counting operations with barcode scanning. Reduce errors and save hours of manual work each week.

### Multi-location Management
If you have multiple stores or warehouses, a good inventory system lets you manage all locations from a single dashboard. Transfer stock between locations with a few clicks.

## Best Practices for Inventory Management

1. **Regular cycle counting** — Count high-value items more frequently
2. **ABC analysis** — Focus on your most valuable inventory items
3. **Demand forecasting** — Use historical data to predict future needs
4. **Supplier management** — Track supplier performance and lead times

## Conclusion

Technology has made inventory management easier and more accurate than ever. By implementing a modern inventory management system like BiasharaLedger, you can reduce costs, improve efficiency, and grow your business.`,
  },
  {
    id: '3',
    title: 'Understanding KRA Tax Compliance for Small Businesses',
    excerpt: 'A comprehensive overview of tax obligations for small businesses in Kenya, including VAT, income tax, and how to stay compliant.',
    date: '2025-11-10',
    readTime: '10 min read',
    category: 'Tax',
    slug: 'kra-tax-compliance-small-businesses',
    content: `Tax compliance is one of the biggest challenges for small businesses in Kenya. This guide breaks down everything you need to know.

## Types of Taxes for Small Businesses in Kenya

### Income Tax
All businesses in Kenya must pay income tax on their profits. The current corporate tax rate is 30% for resident companies. Small businesses can opt for:
- **Turnover tax** (3% of gross sales, for businesses with turnover under KES 50 million)
- **Presumptive tax** (for specific trades)
- **Corporate tax** (30% of net profits)

### VAT (Value Added Tax)
Businesses with annual turnover exceeding KES 8 million must register for VAT. The standard VAT rate is 16%, with some goods and services at 8% or zero-rated.

### Withholding Tax
When you pay certain suppliers (e.g., consultants, contractors), you may need to withhold tax and remit it to KRA.

## Key Compliance Deadlines

- **Monthly VAT returns** — Due by the 20th of the following month
- **Monthly PAYE** — Due by the 9th of the following month
- **Annual income tax returns** — Due by June 30th each year
- **Instalment tax** — Due in four instalments throughout the year

## How to Stay Compliant

1. **Keep accurate records** — Maintain detailed records of all income and expenses
2. **File on time** — Late filing attracts penalties and interest
3. **Use accounting software** — Automate tax calculations and reports
4. **Work with a tax professional** — Especially for complex tax situations
5. **Plan for tax payments** — Set aside money for taxes throughout the year

## Conclusion

Tax compliance doesn't have to be complicated. With the right systems and support, you can meet your tax obligations without stress. BiasharaLedger includes built-in tax calculation and reporting features to help you stay compliant.`,
  },
  {
    id: '4',
    title: 'The Benefits of Cloud-Based Business Management Software',
    excerpt: 'Why modern businesses are moving to cloud-based solutions for greater flexibility, security, and cost savings.',
    date: '2025-10-22',
    readTime: '7 min read',
    category: 'Technology',
    slug: 'benefits-cloud-business-software',
    content: `Cloud technology has revolutionized how businesses operate. Here's why cloud-based business management software is the right choice for your business.

## What is Cloud-Based Software?

Cloud-based software runs on remote servers and is accessed via the internet. You don't need to install or maintain any hardware — everything is managed by the software provider.

## Key Benefits

### 1. Access Anywhere, Anytime
Access your business data from any device with an internet connection. Work from the office, home, or on the go. This flexibility is essential for modern businesses.

### 2. Automatic Updates
Your software is always up to date. No more manual updates, security patches, or version management. New features are available as soon as they're released.

### 3. Lower Costs
No upfront investment in servers, hardware, or IT infrastructure. Pay a predictable monthly subscription that includes maintenance, support, and updates.

### 4. Enhanced Security
Cloud providers invest heavily in security. Your data is encrypted, backed up, and protected by enterprise-grade security measures that most businesses couldn't afford on their own.

### 5. Scalability
Start small and scale as your business grows. Add users, features, or storage capacity with a few clicks. No need to replace your system when you outgrow it.

## Is Cloud Software Right for Your Business?

Cloud software is suitable for businesses of all sizes. However, consider:
- **Internet reliability** — You need a stable internet connection
- **Data sovereignty** — Ensure your data is stored in compliance with local regulations
- **Vendor lock-in** — Choose software that allows easy data export

## Conclusion

Cloud-based business management software offers flexibility, security, and cost savings that traditional on-premise solutions cannot match. BiasharaLedger is built from the ground up as a cloud-native platform.`,
  },
  {
    id: '5',
    title: 'Mobile Money Reconciliation: A Complete Guide for Businesses',
    excerpt: 'Master the art of reconciling mobile money transactions with practical tips and tools for accuracy.',
    date: '2025-10-05',
    readTime: '6 min read',
    category: 'Finance',
    slug: 'mobile-money-reconciliation-guide',
    content: `Mobile money has become the backbone of financial transactions in Kenya. But reconciling hundreds of M-Pesa transactions can be a nightmare. Here's how to do it right.

## The Scale of Mobile Money in Kenya

With over 30 million active M-Pesa users and billions of shillings transacted daily, mobile money is integral to the Kenyan economy. For businesses, this means:
- High transaction volumes
- Multiple payment channels (M-Pesa, Airtel Money, T-Kash)
- Need for accurate reconciliation

## Common Reconciliation Challenges

1. **High volume** — Hundreds of transactions daily
2. **Manual entry** — Prone to human error
3. **Delayed settlements** — Transactions don't always post immediately
4. **Discrepancies** — Customer payments that don't match invoice amounts
5. **Chargebacks and reversals** — Need to track and account for reversals

## How to Reconcile Mobile Money Effectively

### 1. Automate Where Possible
Use software that integrates with mobile money APIs to automatically import and match transactions. BiasharaLedger offers direct M-Pesa integration.

### 2. Match Transactions Systematically
Match each mobile money credit to a customer invoice or sales order. Flag unmatched transactions for investigation.

### 3. Reconcile Daily
Don't let reconciliation pile up. Daily reconciliation catches errors early and reduces the backlog.

### 4. Track Fees and Charges
Mobile money transactions attract fees. Ensure your system accounts for these fees accurately.

### 5. Maintain an Audit Trail
Keep records of all reconciliation steps for audit purposes. This is especially important for KRA compliance.

## Conclusion

Mobile money reconciliation doesn't have to be a headache. With the right processes and tools, you can achieve near-perfect accuracy with minimal effort.`,
  },
  {
    id: '6',
    title: 'Tips for Managing Business Finances During Economic Uncertainty',
    excerpt: 'Practical strategies for maintaining financial health and resilience when the economic outlook is uncertain.',
    date: '2025-09-18',
    readTime: '9 min read',
    category: 'Finance',
    slug: 'managing-finances-economic-uncertainty',
    content: `Economic uncertainty is a reality that every business owner must navigate. Here are practical strategies to keep your business financially healthy.

## 1. Build a Cash Reserve

Aim to maintain 3-6 months of operating expenses in cash reserves. This buffer helps you weather downturns without taking on expensive debt.

## 2. Reduce Fixed Costs

Review your fixed costs and look for savings:
- Renegotiate supplier contracts
- Consider remote work to reduce office costs
- Switch to pay-as-you-go services where possible
- Consolidate software subscriptions

## 3. Improve Accounts Receivable

Slow-paying customers can cripple your cash flow:
- Invoice promptly and follow up on overdue accounts
- Offer discounts for early payment
- Implement stricter credit terms
- Use automated reminders

## 4. Manage Inventory Carefully

Excess inventory ties up cash. In uncertain times:
- Reduce order quantities
- Focus on fast-moving items
- Implement just-in-time inventory
- Negotiate better payment terms with suppliers

## 5. Diversify Revenue Streams

Don't rely on a single revenue source. Explore:
- New products or services
- Different customer segments
- Recurring revenue models
- Strategic partnerships

## Conclusion

Economic uncertainty is challenging, but it also presents opportunities. Businesses that manage their finances wisely during tough times emerge stronger when conditions improve. BiasharaLedger's financial management tools can help you maintain visibility and control over your business finances.`,
  },
];

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-brand/30">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
        </div>
        <div className="inline-flex items-center gap-1 bg-brand/5 border border-brand/10 rounded-full px-2.5 py-0.5 mb-3">
          <Tag className="h-3 w-3 text-brand" />
          <span className="text-[10px] font-semibold text-brand">{post.category}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand transition-colors">{post.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{post.excerpt}</p>
        <span className="text-xs font-semibold text-brand inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read More <ArrowRight className="h-3 w-3" /></span>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = Array.from(new Set(POSTS.map(p => p.category)));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach((el) => { observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const filteredPosts = selectedCategory ? POSTS.filter(p => p.category === selectedCategory) : POSTS;

  return (
    <div>
      <style jsx>{`
        .animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
        .stagger-children > * { opacity: 0; transform: translateY(20px); transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(5) { transition-delay: 0.5s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(6) { transition-delay: 0.6s; opacity: 1; transform: translateY(0); }
      `}</style>
      <section className="py-20 bg-gradient-to-b from-brand/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll"><span className="text-xs font-semibold text-brand">Blog</span></div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-on-scroll">BiasharaLedger Blog</h1>
            <p className="text-lg text-gray-600 animate-on-scroll">Tips, guides, and insights to help you manage and grow your business.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-10 animate-on-scroll">
            <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCategory === null ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand/50'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCategory === cat ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand/50'}`}>{cat}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children animate-on-scroll">
            {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
