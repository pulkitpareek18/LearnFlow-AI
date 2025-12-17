import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Brain,
  BarChart3,
  MessageSquare,
  Zap,
  CheckCircle,
  ArrowRight,
  Upload,
  Sparkles,
  Target,
} from 'lucide-react';
import Navbar from '@/components/layouts/Navbar';

const features = [
  {
    icon: Upload,
    title: 'Upload PDFs',
    description: 'Simply upload your learning materials and let AI do the rest.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Courses',
    description: 'Automatically generate chapters, modules, and assessments from your content.',
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor Chat',
    description: 'Get instant explanations and answers from your personal AI tutor.',
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description: 'Content adapts to your pace, style, and difficulty preferences.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed analytics and insights.',
  },
  {
    icon: Zap,
    title: 'Interactive Assessments',
    description: 'Test your knowledge with AI-generated quizzes and get instant feedback.',
  },
];

const benefits = [
  'AI generates courses from any PDF in minutes',
  'Personalized learning paths based on your pace',
  'Interactive AI tutor available 24/7',
  'Track progress with detailed analytics',
  'Adaptive difficulty adjustments',
  'Comprehensive assessments with explanations',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Learn Smarter with{' '}
              <span className="text-primary">Personalized AI</span>
            </h1>
            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Upload any PDF and watch AI transform it into interactive courses
              tailored to your learning style. Learn at your own pace with your
              personal AI tutor.
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
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>

          {/* Hero Image/Illustration Placeholder */}
          <div className="mt-16 relative">
            <div className="aspect-video max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 border border-border shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="w-24 h-24 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted">Platform Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Learn
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Powerful AI-driven features that make learning effective and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
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

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Your Content',
                description: 'Teachers upload PDFs or learning materials to the platform.',
                icon: Upload,
              },
              {
                step: '2',
                title: 'AI Creates Courses',
                description: 'Our AI analyzes content and generates structured courses with assessments.',
                icon: Brain,
              },
              {
                step: '3',
                title: 'Start Learning',
                description: 'Students enroll and learn with personalized AI tutoring support.',
                icon: BookOpen,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose LearnFlow?
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Experience the future of education with AI-powered personalization
                that adapts to how you learn best.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">95%</div>
                  <p className="text-white/80">of students report improved learning outcomes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-muted mb-8">
            Join thousands of students and teachers using LearnFlow to achieve
            their educational goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=student"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              <GraduationCap className="w-5 h-5" />
              Start Learning
            </Link>
            <Link
              href="/register?role=teacher"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-dark transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Start Teaching
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-foreground">LearnFlow</span>
              </div>
              <p className="text-muted text-sm">
                AI-powered personalized learning platform for the modern learner.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/features" className="hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/courses" className="hover:text-primary">Courses</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/about" className="hover:text-primary">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted">
            &copy; {new Date().getFullYear()} LearnFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
