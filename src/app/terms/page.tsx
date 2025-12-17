import Link from 'next/link';
import Navbar from '@/components/layouts/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-muted mb-8">Last updated: December 2024</p>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted leading-relaxed">
                By accessing or using LearnFlow (&quot;the Service&quot;), you agree to be bound by
                these Terms of Service. If you do not agree to these terms, please do not
                use the Service. We reserve the right to update these terms at any time,
                and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Description of Service
              </h2>
              <p className="text-muted leading-relaxed">
                LearnFlow is an AI-powered educational platform that provides personalized
                learning experiences. The Service includes course creation tools for
                teachers, interactive learning modules for students, AI tutoring features,
                progress tracking, and assessment tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. User Accounts
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                To access certain features of the Service, you must create an account. You
                agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. User Conduct
              </h2>
              <p className="text-muted leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload content that infringes on intellectual property rights</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use automated tools to scrape or collect data from the Service</li>
                <li>Interfere with the proper functioning of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Content and Intellectual Property
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                <strong className="text-foreground">User Content:</strong> You retain
                ownership of content you upload to the Service. By uploading content, you
                grant LearnFlow a non-exclusive, worldwide license to use, display, and
                distribute your content in connection with the Service.
              </p>
              <p className="text-muted leading-relaxed">
                <strong className="text-foreground">LearnFlow Content:</strong> All content
                provided by LearnFlow, including AI-generated materials, is owned by
                LearnFlow or its licensors. You may not copy, modify, or distribute this
                content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Payment and Subscriptions
              </h2>
              <p className="text-muted leading-relaxed">
                Certain features require a paid subscription. By subscribing, you agree to
                pay the applicable fees. Subscriptions automatically renew unless canceled
                before the renewal date. Refunds are provided in accordance with our refund
                policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Disclaimer of Warranties
              </h2>
              <p className="text-muted leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
                GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                AI-GENERATED CONTENT MAY CONTAIN INACCURACIES AND SHOULD NOT BE RELIED UPON
                AS THE SOLE SOURCE OF INFORMATION.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-muted leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEARNFLOW SHALL NOT BE LIABLE FOR
                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
                ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Termination
              </h2>
              <p className="text-muted leading-relaxed">
                We may terminate or suspend your account at any time for violation of these
                terms. Upon termination, your right to use the Service will immediately
                cease. You may also delete your account at any time through your account
                settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Governing Law
              </h2>
              <p className="text-muted leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws
                of the State of California, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Contact Us
              </h2>
              <p className="text-muted leading-relaxed">
                If you have any questions about these Terms of Service, please contact us
                at{' '}
                <a href="mailto:legal@learnflow.ai" className="text-primary hover:underline">
                  legal@learnflow.ai
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} LearnFlow AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
