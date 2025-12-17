import Link from 'next/link';
import {
  Upload,
  Brain,
  MessageSquare,
  Target,
  BarChart3,
  Zap,
  BookOpen,
  Users,
  Shield,
  Clock,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Navbar from '@/components/layouts/Navbar';

const mainFeatures = [
  {
    icon: Upload,
    title: 'PDF to Course Conversion',
    description:
      'Upload any PDF and our AI instantly transforms it into a structured course with chapters, modules, and interactive content.',
    benefits: [
      'Automatic chapter detection',
      'Smart content segmentation',
      'Key concept extraction',
      'Interactive element generation',
    ],
  },
  {
    icon: Brain,
    title: 'AI-Powered Course Generation',
    description:
      'Our advanced AI analyzes your content and creates comprehensive learning materials including summaries, quizzes, and explanations.',
    benefits: [
      'Intelligent summarization',
      'Auto-generated assessments',
      'Adaptive difficulty levels',
      'Learning objective mapping',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Personal AI Tutor',
    description:
      'Get instant help with your studies through our AI tutor that understands your course content and learning progress.',
    benefits: [
      '24/7 availability',
      'Context-aware responses',
      'Multiple explanation styles',
      'Follow-up question support',
    ],
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description:
      'The platform adapts to your unique learning style, pace, and preferences to maximize your educational outcomes.',
    benefits: [
      'Adaptive content delivery',
      'Customized difficulty',
      'Learning style analysis',
      'Progress-based adjustments',
    ],
  },
];

const additionalFeatures = [
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track your learning progress with comprehensive analytics and insights.',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Earn XP, badges, and maintain streaks to stay motivated.',
  },
  {
    icon: Clock,
    title: 'Spaced Repetition',
    description: 'Review items at optimal intervals for long-term retention.',
  },
  {
    icon: Zap,
    title: 'Interactive Assessments',
    description: 'Multiple question types with instant feedback and explanations.',
  },
  {
    icon: Users,
    title: 'Teacher Dashboard',
    description: 'Manage courses, track student progress, and analyze performance.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Your data is protected with enterprise-grade security.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powerful Features
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything You Need to{' '}
              <span className="text-primary">Learn Effectively</span>
            </h1>
            <p className="text-lg text-muted">
              Discover how LearnFlow&apos;s AI-powered features transform the way you learn and teach.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-muted mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 border border-border flex items-center justify-center">
                    <feature.icon className="w-24 h-24 text-primary/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              And Much More
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              LearnFlow is packed with features to enhance your learning experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-lg text-muted mb-8">
            Start your learning journey today with LearnFlow&apos;s powerful AI-driven platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} LearnFlow AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
