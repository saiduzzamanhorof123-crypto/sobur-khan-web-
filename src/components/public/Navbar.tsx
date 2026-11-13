import React, { useState } from 'react';
import { Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onNavigateAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Runway Group', href: '#modeling-group' },
    { label: 'Events & Awards', href: '#events' },
    { label: 'Courses', href: '#courses' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080808]/90 dark:bg-[#080808]/90 light:bg-[#FAF9F6]/90 border-b border-[#C9A45C]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <a
          href="#"
          className="text-xl md:text-2xl font-editorial tracking-[0.2em] font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] hover:text-[#C9A45C] transition-colors whitespace-nowrap shrink-0"
        >
          SOBUR ALI KHAN
        </a>

        {/* Zone 2: Clean single-line text links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs uppercase tracking-[0.18em] font-medium text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-[#C9A45C] dark:hover:text-[#E5C98A] transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary action + Theme Toggle */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2 rounded-lg border border-[#C9A45C]/20 text-[#C9A45C] hover:bg-[#C9A45C]/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="#collaborate"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-colors rounded-none whitespace-nowrap shrink-0"
          >
            <span>Collaborate</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#C9A45C]/20 bg-[#0C0C0C] dark:bg-[#0C0C0C] light:bg-[#F3F1EC] px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-widest text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] hover:text-[#C9A45C] py-2"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#collaborate"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex w-full justify-center items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] mt-2"
          >
            <span>Book Collaboration</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </header>
  );
};
