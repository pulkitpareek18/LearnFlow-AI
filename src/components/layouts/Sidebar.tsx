'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  MessageSquare,
  Trophy,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: 'teacher' | 'student';
}

const teacherNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/teacher',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'My Courses',
    href: '/teacher/courses',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    label: 'Students',
    href: '/teacher/students',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    href: '/teacher/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/teacher/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

const studentNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/student',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'My Courses',
    href: '/student/courses',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    label: 'Browse Courses',
    href: '/student/browse',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    label: 'Assessments',
    href: '/student/assessments',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'AI Tutor',
    href: '/student/chat',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: 'Achievements',
    href: '/student/achievements',
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    href: '/student/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/student/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === `/${role}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)]
          bg-card border-r border-border
          transition-all duration-300
          flex flex-col
          z-40
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-border hover:text-foreground'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse button - hidden on mobile */}
      <div className="hidden lg:block p-2 border-t border-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted hover:bg-border hover:text-foreground transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}
