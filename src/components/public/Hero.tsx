import React from 'react';
import { ChevronRight } from 'lucide-react';
import { FrameImageConfig, Profile } from '../../types';

interface HeroProps {
  profile: Profile | null;
  heroFrame?: FrameImageConfig;
}

export const Hero: React.FC<HeroProps> = ({ profile, heroFrame }) => {
  const name = profile?.name || 'SOBUR ALI KHAN';
  const title = profile?.title || 'INFLUENCER & PROFESSIONAL MODEL';
  const tagline =
    profile?.tagline ||
    'Embodying haute couture grace, international runway presence, and modern digital influence.';
  const heroImage =
    heroFrame?.imageSettings?.editedUrl ||
    profile?.heroImage ||
    '/src/assets/images/hero_sobur_portrait_1794476542316.jpg';
  const heroObjectPosition = heroFrame?.imageSettings?.objectPosition || '50% 20%';

  const stats = profile?.stats || {
    experienceYears: '7+',
    projectsCompleted: '120+',
    runwayShows: '45+',
    awardsWon: '12',
    audienceReach: '2.5M+',
  };

  return (
    <section className="relative overflow-hidden bg-[#080808] dark:bg-[#080808] light:bg-[#FAF9F6] border-b border-[#C9A45C]/20 transition-colors">
      {/* Background ambient gold gradient glow */}
      <div
        className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-[#C9A45C]/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-[#C9A45C]/5 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-16">
        {/* 2-Column Split: Typography Left, High-Fashion Visual Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Kicker - unboxed text */}
            <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A45C] mb-4">
              {title}
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-editorial font-bold tracking-tight text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] leading-[1.08] mb-6 [text-wrap:balance]">
              {name}
            </h1>

            {/* Lead Copy */}
            <p className="text-base sm:text-lg text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed max-w-xl mb-10">
              {tagline}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#portfolio"
                className="px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-all flex items-center gap-2 shadow-lg shadow-[#C9A45C]/10"
              >
                <span>Explore Portfolio</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                className="px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] border border-[#C9A45C]/40 hover:border-[#C9A45C] hover:bg-[#C9A45C]/10 transition-all"
              >
                <span>Get In Touch</span>
              </a>
            </div>

            {/* Editorial highlights text */}
            <div className="mt-12 pt-8 border-t border-[#C9A45C]/15 flex items-center gap-6 text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666]">
              <span>Haute Couture Catwalk</span>
              <span aria-hidden="true">·</span>
              <span>Global Brand Ambassador</span>
              <span aria-hidden="true">·</span>
              <span>Editorial Campaigns</span>
            </div>
          </div>

          {/* Right Column: Hero Fashion Frame */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full aspect-[4/5] overflow-hidden border border-[#C9A45C]/30 bg-[#121212] shadow-2xl">
              <img
                src={heroImage}
                alt="Sobur Ali Khan - Luxury Fashion Model & Influencer"
                referrerPolicy="no-referrer"
                style={{ objectPosition: heroObjectPosition }}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 p-4 border border-[#C9A45C]/20 bg-[#080808]/80 backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-widest text-[#C9A45C] font-semibold">
                  Couture Eveningwear
                </div>
                <div className="text-sm font-medium text-[#F5F5F5]">
                  Bespoke Black & Gold Velvet Series
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Row of Key Metrics Below the Split */}
        <div className="mt-16 pt-10 border-t border-[#C9A45C]/20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl md:text-4xl font-editorial font-bold text-[#E5C98A] tabular-nums">
              {stats.experienceYears}
            </div>
            <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mt-1">
              Years On Runway
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-editorial font-bold text-[#E5C98A] tabular-nums">
              {stats.runwayShows}
            </div>
            <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mt-1">
              Fashion Week Shows
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-editorial font-bold text-[#E5C98A] tabular-nums">
              {stats.projectsCompleted}
            </div>
            <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mt-1">
              Editorial & Campaigns
            </div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-editorial font-bold text-[#E5C98A] tabular-nums">
              {stats.audienceReach}
            </div>
            <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mt-1">
              Digital Audience Reach
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
