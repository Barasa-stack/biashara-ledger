import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - BiasharaLedger',
  description: 'BiasharaLedger privacy policy explaining how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none text-white/70 space-y-6">
        <p className="text-sm text-white/40">Last updated: July 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Introduction</h2>
          <p>
            BiasharaLedger (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business management platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Account information: name, email address, phone number, and company details</li>
            <li>Financial data: transaction records, invoices, payment information, and accounting data</li>
            <li>Business information: client details, inventory data, employee records, and operational data</li>
            <li>Communications: support inquiries, feedback, and correspondence with our team</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide, maintain, and improve our business management platform</li>
            <li>Process transactions and manage your account</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your data, including encryption at rest and in transit, regular security audits, and access controls. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide you services. You can request deletion of your data at any time by contacting our support team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Third-Party Services</h2>
          <p>
            We may use third-party services for payment processing, email delivery, and analytics. These providers have access to your information only to perform specific tasks on our behalf and are obligated not to disclose or use it for other purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Access your personal data held by us</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:support@biasharaledger.com" className="text-brand hover:text-white transition-colors">support@biasharaledger.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
