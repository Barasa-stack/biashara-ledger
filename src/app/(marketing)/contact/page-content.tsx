'use client';

import { Mail, MapPin, Clock, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'hello@biasharaledger.com', href: 'mailto:hello@biasharaledger.com' },
  { icon: Phone, label: 'Phone', value: '+254 700 123 456', href: 'tel:+254700123456' },
  { icon: MapPin, label: 'Location', value: 'Nairobi, Kenya', href: '#' },
  { icon: Clock, label: 'Hours', value: 'Mon-Fri, 8:00 AM - 6:00 PM EAT', href: '#' },
];

const SUPPORT_OPTIONS = [
  {
    title: 'Email Support',
    desc: 'Get a response within 24 hours. We typically respond much faster.',
    icon: Mail,
    action: 'Send Email',
    href: 'mailto:hello@biasharaledger.com',
  },
  {
    title: 'Live Chat',
    desc: 'Chat with our support team during business hours for quick answers.',
    icon: MessageSquare,
    action: 'Start Chat',
    href: '#',
  },
  {
    title: 'Help Center',
    desc: 'Browse our documentation and FAQs for answers to common questions.',
    icon: Clock,
    action: 'Visit Help Center',
    href: '#',
  },
];

export default function ContactPage() {
  return (
    <div>
      <section className="py-20 bg-gradient-to-b from-brand/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4"><span className="text-xs font-semibold text-brand">Contact</span></div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Get in Touch</h1>
            <p className="text-lg text-gray-600">Have a question, feedback, or want to learn more? We'd love to hear from you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
            {CONTACT_INFO.map((info) => {
              const Icon = info.icon;
              return (
                <Link key={info.label} href={info.href} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all hover:border-brand/30 group">
                  <Icon className="h-5 w-5 text-brand mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-gray-900">{info.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{info.value}</p>
                </Link>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {SUPPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Link key={option.title} href={option.href} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-all hover:border-brand/30 group">
                  <Icon className="h-8 w-8 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base font-bold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{option.desc}</p>
                  <span className="text-sm font-semibold text-brand group-hover:underline">{option.action} →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Send Us a Message</h2>
              <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" id="name" name="name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" id="email" name="email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" id="subject" name="subject" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all" placeholder="How can we help?" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="message" name="message" rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none" placeholder="Tell us more about your inquiry..." />
              </div>
              <button type="submit" className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand/25">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
