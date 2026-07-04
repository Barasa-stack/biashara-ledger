'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
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
        
        .gradient-text-shine {
          background: linear-gradient(90deg, #your-brand-color, #ff6b6b, #feca57, #your-brand-color);
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
        }
        
        .contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        
        .form-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .form-input:focus {
          border-color: #your-brand-color;
          box-shadow: 0 0 0 3px rgba(#your-brand-color, 0.1);
        }
      `}</style>

      <PageHero
        images={contactImages}
        title={
          <div className="floating-text">
            Get in
            <br />
            <span className="gradient-text-shine">Touch</span>
          </div>
        }
        subtitle="Have questions? We'd love to hear from you. Reach out and we'll get back to you as soon as possible."
        badge="Contact"
        badgeWithoutTrust
      />

      {/* ─── CONTACT INFO & FORM ─── */}
      <section className="py-20 bg-gray-50" aria-labelledby="contact-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6 animate-on-scroll">
              <div className="contact-card bg-white rounded-xl p-6 border border-gray-100">
                <div className="bg-brand/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-sm text-gray-600">support@biasharaledger.com</p>
              </div>
              
              <div className="contact-card bg-white rounded-xl p-6 border border-gray-100">
                <div className="bg-brand/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Phone</h3>
                <p className="text-sm text-gray-600">+254 700 123 456</p>
              </div>
              
              <div className="contact-card bg-white rounded-xl p-6 border border-gray-100">
                <div className="bg-brand/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Location</h3>
                <p className="text-sm text-gray-600">Global Headquarters</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 animate-on-scroll">
              <div className="bg-white rounded-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-brand/25 flex items-center justify-center gap-2"
                  >
                    Send Message <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
