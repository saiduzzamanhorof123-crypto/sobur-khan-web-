import React from 'react';
import { FrameImageConfig, Profile } from '../../types';

interface AboutProps {
  profile: Profile | null;
  aboutFrame?: FrameImageConfig;
  profileFrame?: FrameImageConfig;
}

export const About: React.FC<AboutProps> = ({ profile, aboutFrame, profileFrame }) => {
  const fullBio =
    profile?.fullBio ||
    'With a discerning eye for luxury aesthetic and a commanding runway poise, Sobur Ali Khan has established himself as a distinguished force across high-fashion runways, luxury editorial spreads, and prestige brand campaigns. Rooted in disciplined physical training and an innate artistic sensibility, his work bridges timeless couture elegance with modern digital influence.';

  const modelingJourney =
    profile?.modelingJourney ||
    'Starting his journey through rigorous runway workshops and avant-garde photo shoots, Sobur swiftly caught the attention of leading fashion houses and creative directors. His portfolio encompasses prestigious runway walks at International Fashion Week, prime cover features in high-fashion periodicals, and multi-season brand campaigns across Dubai, Paris, and Southeast Asia.';

  const influencerExperience =
    profile?.influencerExperience ||
    'Boasting a highly engaged global audience across Instagram, Facebook, and contemporary social channels, Sobur collaborates directly with premier luxury timepiece makers, bespoke menswear ateliers, and lifestyle hospitality icons. He delivers authentic, high-impact brand narrative through cinematic visuals and refined storytelling.';

  const aboutImage =
    aboutFrame?.imageSettings?.editedUrl ||
    profile?.aboutBgImage ||
    '/src/assets/images/about_fashion_runway_1794476556845.jpg';
  const aboutObjectPosition = aboutFrame?.imageSettings?.objectPosition || '50% 20%';

  const profilePhotoUrl =
    profileFrame?.imageSettings?.editedUrl ||
    profile?.profileImage ||
    '/src/assets/images/editorial_photoshoot_1794476571514.jpg';
  const profileObjectPosition = profileFrame?.imageSettings?.objectPosition || '50% 20%';

  return (
    <section id="about" className="py-24 bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F3F1EC] border-b border-[#C9A45C]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
            About The Artist
          </div>
          <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
            The Journey of Poise & Distinction
          </h2>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image with luxury frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] overflow-hidden border border-[#C9A45C]/30 bg-[#121212] shadow-xl">
              <img
                src={aboutImage}
                alt="Sobur Ali Khan - Haute Couture Runway Walk"
                referrerPolicy="no-referrer"
                style={{ objectPosition: aboutObjectPosition }}
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#E5C98A]">
                  International Fashion Week
                </div>
                <div className="text-sm font-medium text-[#F5F5F5]">
                  Haute Couture Catwalk Solo Lead
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Core Chapters */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#C9A45C]/50 bg-[#121212] shrink-0">
                  <img
                    src={profilePhotoUrl}
                    alt="Sobur Ali Khan Profile"
                    referrerPolicy="no-referrer"
                    style={{ objectPosition: profileObjectPosition }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-editorial font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                  Personal Biography
                </h3>
              </div>
              <p className="text-sm md:text-base text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                {fullBio}
              </p>
            </div>

            <div className="pt-6 border-t border-[#C9A45C]/15">
              <h3 className="text-xl md:text-2xl font-editorial font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-4">
                Modeling Journey
              </h3>
              <p className="text-sm md:text-base text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                {modelingJourney}
              </p>
            </div>

            <div className="pt-6 border-t border-[#C9A45C]/15">
              <h3 className="text-xl md:text-2xl font-editorial font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-4">
                Digital Influence & Ambassadorship
              </h3>
              <p className="text-sm md:text-base text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                {influencerExperience}
              </p>
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6]">
                <div className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold mb-1">
                  Disciplined Poise
                </div>
                <div className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666]">
                  Precision catwalk posture & garment movement
                </div>
              </div>
              <div className="p-4 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6]">
                <div className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold mb-1">
                  Editorial Versatility
                </div>
                <div className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666]">
                  High-fashion couture, commercial & portraiture
                </div>
              </div>
              <div className="p-4 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6]">
                <div className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold mb-1">
                  Global Reach
                </div>
                <div className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666]">
                  High engagement across fashion demographics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
