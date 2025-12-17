import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary opacity-90" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-12 h-12" />
            <span className="text-3xl font-bold">LearnFlow</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Learn at Your Own Pace
          </h1>
          <p className="text-lg text-white/80 mb-8">
            AI-powered personalized learning platform that adapts to your style,
            pace, and goals. Transform any PDF into an interactive learning experience.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-semibold">1</span>
              </div>
              <span>Upload PDFs and let AI create courses</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-semibold">2</span>
              </div>
              <span>Learn with personalized AI tutoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-semibold">3</span>
              </div>
              <span>Track progress and master concepts</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">LearnFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
