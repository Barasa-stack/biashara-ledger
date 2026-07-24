import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - BiasharaLedger',
  description: 'BiasharaLedger cookie policy explaining how we use cookies and similar tracking technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Cookie Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none text-white/70 space-y-6">
        <p className="text-sm text-white/40">Last updated: July 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. How We Use Cookies</h2>
          <p>BiasharaLedger uses cookies for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Essential cookies:</strong> Required for the Platform to function properly, including session management and security</li>
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Analytics cookies:</strong> Help us understand how you use the Platform so we can improve it</li>
            <li><strong>Authentication cookies:</strong> Keep you signed in and secure during your session</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. Types of Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white font-medium">Cookie</th>
                  <th className="text-left py-2 pr-4 text-white font-medium">Purpose</th>
                  <th className="text-left py-2 text-white font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">bl_session</td>
                  <td className="py-2 pr-4">Authentication session token</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">user_plan</td>
                  <td className="py-2 pr-4">User subscription plan</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4">bl_device_token</td>
                  <td className="py-2 pr-4">Trusted device (skips OTP)</td>
                  <td className="py-2">3 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Managing Cookies</h2>
          <p>
            You can control and manage cookies through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies may affect the functionality of the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Third-Party Cookies</h2>
          <p>
            We may use third-party services such as analytics providers that set their own cookies. These third parties have their own privacy policies governing their use of cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Contact</h2>
          <p>
            For questions about our use of cookies, contact us at{' '}
            <a href="mailto:support@biasharaledger.com" className="text-brand hover:text-white transition-colors">support@biasharaledger.com</a>{' '}
            or call{' '}
            <a href="tel:+254115804761" className="text-brand hover:text-white transition-colors">+254 115 804 761</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
