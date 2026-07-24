'use client';

import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Send, Phone } from 'lucide-react';
import PageHero from '@/components/PageHero';
import type { CityImage } from '@/components/PageHero';
import { useEffect, useState } from 'react';

const contactImages: CityImage[] = [
  { url: '/images/hero/hero-skyscraper-glass-modern.jpg', label: 'Contact Us' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .stagger-children > * {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .stagger-children.visible > *:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        
        .gradient-text-shine {
          background: linear-gradient(90deg, #df1c1c, #ff6b6b, #feca57, #df1c1c);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shine 4s ease-in-out infinite;
        }
        
        @keyframes gradient-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .floating-text {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0px); }
        }
        
        .contact-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .contact-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        
        .cta-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
        }
        
        .cta-button:active {
          transform: scale(0.95);
        }
        
        .form-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .form-input:focus {
          border-color: #df1c1c;
          box-shadow: 0 0 0 3px rgba(223, 28, 28, 0.1);
        }
      `}</style>

      <PageHero
        images={contactImages}
        title={
          <div className="floating-text">
            Let's Build Your
            <br />
            <span className="gradient-text-shine">Business Success</span>
          </div>
        }
        subtitle="Have a question, feedback, or want to learn more? We'd love to hear from you."
        badge="Contact Us"
        badgeWithoutTrust
      />

      {/* Contact Information */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 stagger-children animate-on-scroll">
            <div className="bg-white rounded-xl p-8 border border-gray-100 contact-card">
              <Mail className="h-8 w-8 text-brand mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-sm text-gray-600 mb-4">Our support team typically responds within 24 hours.</p>
              <a href="mailto:support@biasharaledger.com" className="text-brand font-semibold text-sm hover:underline">support@biasharaledger.com</a>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 contact-card">
              <MapPin className="h-8 w-8 text-brand mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-sm text-gray-600 mb-4">Come say hello at our office.</p>
              <p className="text-gray-900 font-medium text-sm">Nairobi, Kenya</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 contact-card">
              <Phone className="h-8 w-8 text-brand mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-sm text-gray-600 mb-4">Mon-Fri 8:00 AM - 6:00 PM EAT</p>
              <a href="tel:+254115804761" className="text-brand font-semibold text-sm hover:underline">+254 115 804 761</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5 mb-4 animate-on-scroll">
                <span className="text-xs font-semibold text-brand">Get in Touch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-on-scroll">Send Us a Message</h2>
              <p className="text-gray-600 animate-on-scroll">Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 stagger-children animate-on-scroll">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none transition-all"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none transition-all"
                  placeholder="How can we help?"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none transition-all resize-none"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>
              
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 inline-flex items-center gap-2 cta-button"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center bg-brand/5 rounded-2xl p-12 border border-brand/10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-on-scroll">Stay Updated</h2>
            <p className="text-gray-600 mb-8 animate-on-scroll">Subscribe to our newsletter for the latest features, tips, and business insights.</p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto animate-on-scroll">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
