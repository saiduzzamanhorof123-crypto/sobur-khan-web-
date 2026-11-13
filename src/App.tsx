import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/public/Navbar';
import { Hero } from './components/public/Hero';
import { About } from './components/public/About';
import { Portfolio } from './components/public/Portfolio';
import { GallerySection } from './components/public/GallerySection';
import { ModelingGroupSection } from './components/public/ModelingGroup';
import { EventsAwardsSection } from './components/public/EventsAwards';
import { CoursesSection } from './components/public/CoursesSection';
import { CollaborationContactSection } from './components/public/CollaborationContact';
import { Footer } from './components/public/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  fetchPublicProfile,
  fetchPublicProjects,
  fetchPublicModelingGroups,
  fetchPublicEvents,
  fetchPublicAwards,
  fetchPublicSocialLinks,
  fetchPublicCourses,
  fetchPublicSettings,
  fetchPublicPricing,
  fetchPublicImageFrames,
} from './api/client';
import {
  Profile,
  PortfolioProject,
  ModelingGroup,
  EventItem,
  AwardItem,
  SocialLinks,
  ModelingCourse,
  WebsiteSettings,
  CurrencySettings,
  ServicePackage,
  FrameImageConfig,
  WebsiteFrameSlot,
} from './types';
import { Shield, LayoutDashboard } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Navigation route: 'public' | 'admin-login' | 'admin-dashboard'
  const [route, setRoute] = useState<'public' | 'admin-login' | 'admin-dashboard'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('/admin/dashboard')) return 'admin-dashboard';
    if (hash.includes('/admin/login') || hash.includes('/admin')) return 'admin-login';
    return 'public';
  });

  // Public data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [groups, setGroups] = useState<ModelingGroup[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [courses, setCourses] = useState<ModelingCourse[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [imageFrames, setImageFrames] = useState<FrameImageConfig[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Sync route with window hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/admin/dashboard')) {
        setRoute('admin-dashboard');
      } else if (hash.includes('/admin/login') || hash.includes('/admin')) {
        setRoute('admin-login');
      } else {
        setRoute('public');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newRoute: 'public' | 'admin-login' | 'admin-dashboard') => {
    setRoute(newRoute);
    if (newRoute === 'admin-dashboard') {
      window.location.hash = '/admin/dashboard';
    } else if (newRoute === 'admin-login') {
      window.location.hash = '/admin/login';
    } else {
      window.location.hash = '';
    }
  };

  const loadPublicData = async () => {
    try {
      const [p, projs, grps, evs, awds, soc, crs, sett, pricing, frames] = await Promise.all([
        fetchPublicProfile().catch(() => null),
        fetchPublicProjects().catch(() => []),
        fetchPublicModelingGroups().catch(() => []),
        fetchPublicEvents().catch(() => []),
        fetchPublicAwards().catch(() => []),
        fetchPublicSocialLinks().catch(() => null),
        fetchPublicCourses().catch(() => []),
        fetchPublicSettings().catch(() => null),
        fetchPublicPricing().catch(() => null),
        fetchPublicImageFrames().catch(() => []),
      ]);
      if (p) setProfile(p);
      setProjects(projs || []);
      setGroups(grps || []);
      setEvents(evs || []);
      setAwards(awds || []);
      if (soc) setSocialLinks(soc);
      setCourses(crs || []);
      if (sett) setSettings(sett);
      if (pricing) {
        setCurrencySettings(pricing.currencySettings || null);
        setServicePackages(pricing.packages || []);
      }
      setImageFrames(frames || []);
    } catch (e) {
      console.warn('Error loading public portfolio data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const getFrame = (slot: WebsiteFrameSlot) => imageFrames.find((f) => f.slot === slot);

  useEffect(() => {
    loadPublicData();
  }, [route]);

  // Protected route guard
  if (route === 'admin-dashboard') {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#C9A45C]">
          <div className="text-center space-y-2">
            <div className="text-sm uppercase tracking-widest">Verifying Master Authorization...</div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login if unauthenticated
      return (
        <AdminLogin
          onBackToPublic={() => navigateTo('public')}
          onLoginSuccess={() => navigateTo('admin-dashboard')}
        />
      );
    }

    return (
      <AdminDashboard
        onReturnToPublic={() => {
          navigateTo('public');
          loadPublicData();
        }}
      />
    );
  }

  if (route === 'admin-login') {
    if (isAuthenticated) {
      // Already authenticated, forward to dashboard
      return (
        <AdminDashboard
          onReturnToPublic={() => {
            navigateTo('public');
            loadPublicData();
          }}
        />
      );
    }
    return (
      <AdminLogin
        onBackToPublic={() => navigateTo('public')}
        onLoginSuccess={() => navigateTo('admin-dashboard')}
      />
    );
  }

  // PUBLIC WEBSITE (Default)
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080808] text-[#F5F5F5] selection:bg-[#C9A45C]/30 selection:text-[#E5C98A]">
      {/* Floating Owner Quick Bar (Only visible when authenticated admin visits public site) */}
      {isAuthenticated && (
        <div className="bg-[#121212] border-b border-[#C9A45C]/40 px-6 py-2.5 flex items-center justify-between text-xs text-[#E5C98A] sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C9A45C]" />
            <span className="font-semibold uppercase tracking-wider">
              Owner Mode Active (Sobur Ali Khan)
            </span>
          </div>
          <button
            onClick={() => navigateTo('admin-dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#E5C98A]"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Open Dashboard</span>
          </button>
        </div>
      )}

      {/* Public Navbar */}
      <Navbar onNavigateAdmin={() => navigateTo('admin-login')} />

      {/* Public Hero */}
      <Hero profile={profile} heroFrame={getFrame('hero_bg')} />

      {/* Public About Me */}
      <About
        profile={profile}
        aboutFrame={getFrame('about_me')}
        profileFrame={getFrame('profile_photo')}
      />

      {/* Public Modeling Portfolio */}
      <Portfolio projects={projects} portfolioFrame={getFrame('portfolio_gallery')} />

      {/* Public Photo Gallery */}
      <GallerySection
        isOwner={isAuthenticated}
        onUpdated={loadPublicData}
        modelingFrame={getFrame('modeling_photos')}
        featuredFrame={getFrame('featured_images')}
      />

      {/* Public Modeling Group */}
      {groups.length > 0 && (
        <ModelingGroupSection
          groups={groups}
          isOwner={isAuthenticated}
          onUpdated={loadPublicData}
          groupFrame={getFrame('modeling_group')}
        />
      )}

      {/* Public Events & Awards */}
      <EventsAwardsSection
        events={events}
        awards={awards}
        isOwner={isAuthenticated}
        onUpdated={loadPublicData}
        eventFrame={getFrame('event_gallery')}
        awardFrame={getFrame('awards_achievements')}
      />

      {/* Public Offline Modeling Courses */}
      {settings?.showCourses !== false && courses.length > 0 && (
        <CoursesSection
          courses={courses}
          currencySettings={currencySettings}
          courseFrame={getFrame('course_cover')}
        />
      )}

      {/* Public Brand Collaboration & Contact */}
      <CollaborationContactSection
        socialLinks={socialLinks}
        currencySettings={currencySettings}
        packages={servicePackages}
      />

      {/* Public Footer */}
      <Footer onAdminClick={() => navigateTo('admin-login')} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
