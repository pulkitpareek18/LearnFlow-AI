import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Target,
  Heart,
  Globe,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/layouts/Navbar';

const team = [
  {
    name: 'Alex Thompson',
    role: 'CEO & Co-Founder',
    description: 'Former educator with 15+ years in EdTech.',
  },
  {
    name: 'Sarah Chen',
    role: 'CTO & Co-Founder',
    description: 'AI researcher specializing in personalized learning.',
  },
  {
    name: 'Michael Rivera',
    role: 'Head of Product',
    description: 'Product leader passionate about educational innovation.',
  },
  {
    name: 'Emily Watson',
    role: 'Head of Design',
    description: 'UX expert focused on accessible learning experiences.',
  },
];

const values = [
  {
    icon: Target,
    title: 'Learner-First',
    description: 'Every decision we make prioritizes the learning experience.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We push the boundaries of what AI can do for education.',
  },
  {
    icon: Heart,
    title: 'Accessibility',
    description: 'Quality education should be available to everyone.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'We aim to transform education worldwide.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About LearnFlow
            </h1>
            <p className="text-lg text-muted">
              We&apos;re on a mission to revolutionize education through artificial intelligence,
              making personalized learning accessible to everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted mb-4">
                LearnFlow was founded with a simple yet powerful vision: to harness the
                power of artificial intelligence to create personalized learning
                experiences that adapt to each individual&apos;s needs.
              </p>
              <p className="text-muted mb-4">
                We believe that traditional one-size-fits-all education fails too many
                learners. By leveraging cutting-edge AI technology, we create courses
                that understand how you learn, adapt to your pace, and help you achieve
                your goals more effectively.
              </p>
              <p className="text-muted">
                Our platform empowers teachers to create rich, interactive content from
                any material, while giving students access to personalized tutoring
                available 24/7.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 border border-border flex items-center justify-center">
                <GraduationCap className="w-32 h-32 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 rounded-xl border border-border bg-card text-center"
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Team</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Meet the passionate people behind LearnFlow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-xl border border-border bg-background text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-sm text-muted">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Join Us on Our Mission
          </h2>
          <p className="text-lg text-muted mb-8">
            Be part of the education revolution. Start learning or teaching with
            LearnFlow today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
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
