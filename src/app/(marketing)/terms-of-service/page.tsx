import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - BiasharaLedger',
  description: 'BiasharaLedger terms of service governing the use of our business management platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="prose prose-invert prose-sm max-w-none text-white/70 space-y-6">
        <p className="text-sm text-white/40">Last updated: July 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using BiasharaLedger (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. Description of Service</h2>
          <p>
            BiasharaLedger provides a cloud-based and desktop business management platform including accounting, inventory, sales, payroll, and reporting tools for businesses in Africa and beyond.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. User Responsibilities</h2>
          <p>As a user, you agree to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Use the Platform in compliance with all applicable laws and regulations</li>
            <li>Not misuse the Platform for any illegal or unauthorized purpose</li>
            <li>Not attempt to disrupt or compromise the Platform&apos;s security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Subscription and Billing</h2>
          <p>
            Certain features require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. Failure to pay may result in suspension or termination of your account. All fees are non-refundable except as expressly stated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Intellectual Property</h2>
          <p>
            The Platform and its original content, features, and functionality are owned by BiasharaLedger and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Limitation of Liability</h2>
          <p>
            BiasharaLedger shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Platform. The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the Platform will immediately cease. You may terminate your account at any time by contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Platform. Continued use after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">9. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@biasharaledger.com" className="text-brand hover:text-white transition-colors">support@biasharaledger.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
