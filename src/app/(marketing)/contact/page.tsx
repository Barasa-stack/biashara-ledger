import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';

const contactImages: CityImage[] = [
  { url: 'https://images.unsplash.com/photo-1725100609222-86a51bee3c3a?w=1920&q=80', label: 'Mombasa Port · Kenya' },
  { url: 'https://images.unsplash.com/photo-1712578585447-2bab142270b0?w=1920&q=80', label: 'Dar es Salaam · Tanzania' },
  { url: 'https://images.unsplash.com/photo-1574227492706-f65b24c3688a?w=1920&q=80', label: 'Marina Bay · Singapore' },
  { url: 'https://images.unsplash.com/photo-1749058388308-744fdc8991ed?w=1920&q=80', label: 'Victoria Island · Lagos' },
  { url: 'https://images.unsplash.com/photo-1680198276344-3e820e68c825?w=1920&q=80', label: 'Cancún Beach Resort · Mexico' },
  { url: 'https://images.unsplash.com/photo-X0zbDrDtXAw?w=1920&q=80', label: 'Cavo Tagoo · Mykonos' },
  { url: 'https://images.unsplash.com/photo-SkTAXVu4UfU?w=1920&q=80', label: 'Rodeo Drive · Beverly Hills' },
  { url: 'https://images.unsplash.com/photo-1765246312031-87e7a216a543?w=1920&q=80', label: 'Chicago Skyline · Lake Michigan' },
  { url: 'https://images.unsplash.com/photo-1746208440749-b25fcc19e025?w=1920&q=80', label: 'Antigua · Tropical Beach' },
  { url: 'https://images.unsplash.com/photo-1706921255467-4236b197b530?w=1920&q=80', label: 'Business Class · Starlux A350' },
];

export default function ContactPage() {
  return (
    <div>
      <PageHero
        images={contactImages}
        showTrustBanner={false}
        title={
          <>
            We'd Love to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-red-300 to-orange-200">Hear From You</span>
          </>
        }
        subtitle="Have a question, feedback, or need help? Our team is here for you."
        badge="Get in Touch"
        badgeWithoutTrust
      />

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-[#000000] mb-6">Send Us a Message</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#000000] mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="John Kamau"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#000000] mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#000000] mb-1">Subject</label>
                  <select
                    id="subject"
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    <option value="">Select a topic</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="partnership">Partnerships</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#000000] mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2"
                >
                  Send Message <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#000000] mb-6">Contact Information</h2>
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'hello@biasharaledger.com', desc: 'We reply within 24 hours' },
                  { icon: Phone, label: 'Phone', value: '+254715434805', desc: 'Call or WhatsApp' },
                  { icon: MapPin, label: 'Office', value: 'Nairobi, Kenya', desc: 'Virtual team serving businesses nationwide' },
                  { icon: Clock, label: 'Support Hours', value: 'Mon–Fri, 8AM–6PM EAT', desc: 'Weekend support available for premium plans' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#000000]">{item.label}</p>
                      <p className="text-sm text-brand">{item.value}</p>
                      <p className="text-xs text-[#000000]/50 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-brand/5 border border-brand/10 rounded-xl">
                <h3 className="text-base font-semibold text-[#000000] mb-2">Looking for support?</h3>
                <p className="text-sm text-[#000000]/60 mb-4">
                  If you're an existing customer, check our help center or log in to access in-app chat support.
                </p>
                <div className="flex gap-3">
                  <Link href="/sign-in" className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors">
                    Sign In →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#000000] mb-4">Ready to transform your accounting?</h2>
          <p className="text-lg text-[#000000]/60 mb-8">Start your free trial today. No credit card required.</p>
          <Link
            href="/sign-up"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
