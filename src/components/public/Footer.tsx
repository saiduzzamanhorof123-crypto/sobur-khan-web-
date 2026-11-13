import React from 'react';
import { Lock } from 'lucide-react';

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="py-12 bg-[#050505] dark:bg-[#050505] light:bg-[#EFECE6] border-t border-[#C9A45C]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666]">
        <div>
          <div className="font-editorial font-bold text-sm text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-wider mb-1">
            SOBUR ALI KHAN
          </div>
          <div>
            © 2026 Sobur Ali Khan. All Rights Reserved. Luxury Editorial & Runway Rights Protected.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2">
          <a href="#about" className="hover:text-[#C9A45C] transition-colors">
            About
          </a>
          <a href="#portfolio" className="hover:text-[#C9A45C] transition-colors">
            Portfolio
          </a>
          <a href="#gallery" className="hover:text-[#C9A45C] transition-colors">
            Gallery
          </a>
          <a href="#courses" className="hover:text-[#C9A45C] transition-colors">
            Academy
          </a>
          <a href="#contact" className="hover:text-[#C9A45C] transition-colors">
            Inquiries
          </a>
          {/* Discreet Owner Portal Access */}
          <button
            onClick={onAdminClick}
            aria-label="Owner Admin Portal Login"
            className="flex items-center gap-1.5 text-[#C9A45C]/70 hover:text-[#C9A45C] transition-colors sm:ml-2 sm:pl-4 sm:border-l border-[#C9A45C]/20"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Owner Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
