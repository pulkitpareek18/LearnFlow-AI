import Link from 'next/link';
import Navbar from '@/components/layouts/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted mb-8">Last updated: December 2024</p>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Introduction
              </h2>
              <p className="text-muted leading-relaxed">
                LearnFlow (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard
                your information when you use our AI-powered learning platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Information We Collect
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                <strong className="text-foreground">Personal Information:</strong> When you
                create an account, we collect your name, email address, and password. If
                you subscribe to a paid plan, we collect payment information through our
                secure payment processor.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <strong className="text-foreground">Learning Data:</strong> We collect
                information about your learning activities, including courses enrolled,
                progress data, quiz responses, time spent on content, and interactions with
                the AI tutor.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <strong className="text-foreground">Uploaded Content:</strong> If you are a
                teacher, we collect the educational materials (PDFs and other files) you
                upload to create courses.
              </p>
              <p className="text-muted leading-relaxed">
                <strong className="text-foreground">Usage Data:</strong> We automatically
                collect information about your device, browser, IP address, and how you
                interact with the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside space-y-2 text-muted">
                <li>Provide and maintain the Service</li>
                <li>Personalize your learning experience using AI</li>
                <li>Generate adaptive content and recommendations</li>
                <li>Track and display your learning progress</li>
                <li>Process payments and manage subscriptions</li>
                <li>Communicate with you about the Service</li>
                <li>Improve and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. AI and Data Processing
              </h2>
              <p className="text-muted leading-relaxed">
                Our AI systems process your learning data to provide personalized
                experiences. This includes analyzing your responses to adjust difficulty,
                generating tailored explanations, and predicting optimal review schedules.
                AI processing is performed securely, and we do not use your personal data
                to train our AI models in ways that could identify you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Information Sharing
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We do not sell your personal information. We may share your information
                with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted">
                <li>
                  <strong className="text-foreground">Service Providers:</strong> Third
                  parties who help us operate the Service (hosting, payment processing,
                  analytics)
                </li>
                <li>
                  <strong className="text-foreground">Teachers:</strong> If you are a
                  student, your teacher may see your progress and performance data
                </li>
                <li>
                  <strong className="text-foreground">Legal Requirements:</strong> When
                  required by law or to protect our rights
                </li>
                <li>
                  <strong className="text-foreground">Business Transfers:</strong> In
                  connection with a merger, acquisition, or sale of assets
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Data Security
              </h2>
              <p className="text-muted leading-relaxed">
                We implement industry-standard security measures to protect your
                information, including encryption in transit and at rest, secure
                authentication, and regular security audits. However, no method of
                transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Data Retention
              </h2>
              <p className="text-muted leading-relaxed">
                We retain your personal information for as long as your account is active
                or as needed to provide services. Learning data may be retained to support
                long-term progress tracking. You can request deletion of your data at any
                time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Your Rights
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Restrict certain data processing</li>
              </ul>
              <p className="text-muted leading-relaxed mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@learnflow.ai" className="text-primary hover:underline">
                  privacy@learnflow.ai
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Cookies and Tracking
              </h2>
              <p className="text-muted leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember
                your preferences, and analyze how you use the Service. You can control
                cookies through your browser settings, but some features may not function
                properly without them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-muted leading-relaxed">
                The Service is not intended for children under 13. We do not knowingly
                collect personal information from children under 13. If you believe we have
                collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. International Data Transfers
              </h2>
              <p className="text-muted leading-relaxed">
                Your information may be transferred to and processed in countries other
                than your own. We ensure appropriate safeguards are in place to protect
                your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Changes to This Policy
              </h2>
              <p className="text-muted leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of
                any material changes by posting the new policy on this page and updating
                the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Contact Us
              </h2>
              <p className="text-muted leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none space-y-1 text-muted mt-4">
                <li>
                  Email:{' '}
                  <a
                    href="mailto:privacy@learnflow.ai"
                    className="text-primary hover:underline"
                  >
                    privacy@learnflow.ai
                  </a>
                </li>
                <li>Address: 123 Learning Lane, San Francisco, CA 94102</li>
              </ul>
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
