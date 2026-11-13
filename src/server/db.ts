import fs from 'fs';
import path from 'path';
import { hashPassword } from '../utils/security';
import {
  Profile,
  PortfolioProject,
  MediaItem,
  ModelingGroup,
  EventItem,
  AwardItem,
  SocialLinks,
  ModelingCourse,
  StudentRegistration,
  CollaborationInquiry,
  ContactMessage,
  WebsiteSettings,
  CurrencySettings,
  ServicePackage,
  FrameImageConfig,
  WebsiteFrameSlot,
} from '../types';

export interface StoredAdminUser {
  id: string;
  email: string;
  salt: string;
  hash: string;
  role: 'owner' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}

export interface DatabaseSchema {
  admin_users: StoredAdminUser[];
  profiles: Profile[];
  portfolio_projects: PortfolioProject[];
  media_library: MediaItem[];
  modeling_groups: ModelingGroup[];
  events: EventItem[];
  awards: AwardItem[];
  social_links: SocialLinks;
  courses: ModelingCourse[];
  student_registrations: StudentRegistration[];
  collaboration_inquiries: CollaborationInquiry[];
  contact_messages: ContactMessage[];
  website_settings: WebsiteSettings;
  currency_settings: CurrencySettings;
  service_packages: ServicePackage[];
  image_frames: FrameImageConfig[];
  removed_default_urls: string[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const { salt, hash } = hashPassword('SoburKhan@2026!');

  return {
    admin_users: [
      {
        id: 'owner-sobur',
        email: 'sobur@owner.com',
        salt,
        hash,
        role: 'owner',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ],
    profiles: [
      {
        id: 'sobur-main-profile',
        name: 'SOBUR ALI KHAN',
        title: 'INFLUENCER & PROFESSIONAL MODEL',
        tagline: 'Embodying haute couture grace, international runway presence, and modern digital influence.',
        shortBio: 'International fashion model, commercial brand ambassador, and digital influencer known for bespoke high-fashion editorial aesthetics and runway commanding presence.',
        fullBio: 'With a discerning eye for luxury aesthetic and a commanding runway poise, Sobur Ali Khan has established himself as a distinguished force across high-fashion runways, luxury editorial spreads, and prestige brand campaigns. Rooted in disciplined physical training and an innate artistic sensibility, his work bridges timeless couture elegance with modern digital influence. Having fronted major fashion weeks and represented prestigious international brands, Sobur continues to redefine contemporary masculine luxury.',
        modelingJourney: 'Starting his journey through rigorous runway workshops and avant-garde photo shoots, Sobur swiftly caught the attention of leading fashion houses and creative directors. His portfolio encompasses prestigious runway walks at International Fashion Week, prime cover features in high-fashion periodicals, and multi-season brand campaigns across Dubai, Paris, and Southeast Asia.',
        influencerExperience: 'Boasting a highly engaged global audience across Instagram, Facebook, and contemporary social channels, Sobur collaborates directly with premier luxury timepiece makers, bespoke menswear ateliers, and lifestyle hospitality icons. He delivers authentic, high-impact brand narrative through cinematic visuals and refined storytelling.',
        heroImage: '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        profileImage: '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
        aboutBgImage: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        stats: {
          experienceYears: '7+',
          projectsCompleted: '120+',
          runwayShows: '45+',
          awardsWon: '12',
          audienceReach: '2.5M+',
        },
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
    ],
    portfolio_projects: [
      {
        id: 'proj-1',
        title: 'Milan Haute Couture Gold Collection',
        subtitle: 'High-Fashion Runway Showcase',
        category: 'Runway',
        client: 'Maison D’Or Paris',
        year: '2024',
        coverImage: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        galleryImages: [
          '/src/assets/images/about_fashion_runway_1794476556845.jpg',
          '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        ],
        description: 'Lead runway presentation featuring intricate hand-embroidered black and gold couture outerwear designed for Milan and Paris Fashion Week.',
        credits: 'Designer: Maison D’Or / Photographer: Laurent V. / Styling: Elena Ross',
        featured: true,
        status: 'published',
        createdAt: '2024-09-15T10:00:00Z',
        updatedAt: '2024-09-15T10:00:00Z',
        publishedAt: '2024-09-15T10:00:00Z',
      },
      {
        id: 'proj-2',
        title: 'Vogue Man Editorial Cover & Spread',
        subtitle: 'The Night’s Edge Luxury Feature',
        category: 'Editorial',
        client: 'Vogue Man International',
        year: '2024',
        coverImage: '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
        galleryImages: [
          '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
          '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        ],
        description: 'Oversized luxury magazine cover and 12-page editorial profile exploring contemporary masculinity, tailored silk silhouettes, and Swiss gold timepieces.',
        credits: 'Editorial Director: Marc Dupont / Photography: Studio Noir / Grooming: Sasha K.',
        featured: true,
        status: 'published',
        createdAt: '2024-10-01T12:00:00Z',
        updatedAt: '2024-10-01T12:00:00Z',
        publishedAt: '2024-10-01T12:00:00Z',
      },
      {
        id: 'proj-3',
        title: 'Royal Velvet Gala Campaign',
        subtitle: 'Bespoke Luxury Menswear',
        category: 'Commercial',
        client: 'Aureus Heritage London',
        year: '2024',
        coverImage: '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        galleryImages: [
          '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
          '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
        ],
        description: 'Flagship commercial campaign spotlighting baroque velvet tailored eveningwear, captured in low-key chiaroscuro lighting.',
        credits: 'Art Direction: Aureus Creative / Photography: Studio 99',
        featured: true,
        status: 'published',
        createdAt: '2024-10-20T14:00:00Z',
        updatedAt: '2024-10-20T14:00:00Z',
        publishedAt: '2024-10-20T14:00:00Z',
      },
      {
        id: 'proj-4',
        title: 'Winter Sovereign Lookbook [Unpublished Concept]',
        subtitle: 'Exclusive Upcoming Capsule',
        category: 'Campaign',
        client: 'Nocturne Atelier',
        year: '2025',
        coverImage: '/src/assets/images/event_award_gala_1794476585239.jpg',
        galleryImages: ['/src/assets/images/event_award_gala_1794476585239.jpg'],
        description: 'Upcoming unpublished winter collection preview held in draft status in the CMS.',
        credits: 'Internal Draft',
        featured: false,
        status: 'draft',
        createdAt: '2024-11-01T09:00:00Z',
        updatedAt: '2024-11-01T09:00:00Z',
      },
    ],
    media_library: [
      {
        id: 'media-1',
        title: 'Hero Sovereign Tuxedo Portrait',
        url: '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        category: 'Homepage',
        description: 'Main bespoke gold and black velvet portrait',
        isDefault: true,
        status: 'published',
        createdAt: '2024-10-01T00:00:00Z',
      },
      {
        id: 'media-2',
        title: 'Fashion Week Runway Walk',
        url: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        category: 'About Me',
        description: 'Runway spotlight couture presentation',
        isDefault: true,
        status: 'published',
        createdAt: '2024-10-01T00:00:00Z',
      },
      {
        id: 'media-3',
        title: 'Vogue Man Editorial Portrait',
        url: '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
        category: 'Portfolio',
        description: 'Silk shirt & luxury gold timepiece shoot',
        isDefault: true,
        status: 'published',
        createdAt: '2024-10-01T00:00:00Z',
      },
      {
        id: 'media-4',
        title: 'Global Gala Red Carpet Celebration',
        url: '/src/assets/images/event_award_gala_1794476585239.jpg',
        category: 'Awards',
        description: 'Global Influencer Awards red carpet stage',
        isDefault: true,
        status: 'published',
        createdAt: '2024-10-01T00:00:00Z',
      },
    ],
    modeling_groups: [
      {
        id: 'group-1',
        groupName: 'Vanguard Runway Collective',
        logo: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        position: 'Lead Model',
        groupDescription: 'A premier collective of international runway models delivering high-impact theatrical catwalk presentations and luxury brand activations worldwide.',
        experience: '4+ Years as Lead Model coordinating opening sequences and runway choreography.',
        groupPhotos: [
          '/src/assets/images/about_fashion_runway_1794476556845.jpg',
          '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        ],
        officialPageLink: 'https://instagram.com/isoburkhan',
        status: 'published',
        createdAt: '2024-05-10T00:00:00Z',
        updatedAt: '2024-05-10T00:00:00Z',
      },
    ],
    events: [
      {
        id: 'event-1',
        title: 'Global Influencer Awards 2024',
        role: 'Worked At',
        date: 'November 2024',
        location: 'Dubai Marina Luxury Convention, UAE',
        description: 'Honored as premier guest and runway ambassador at the international luxury creator awards.',
        coverImage: '/src/assets/images/event_award_gala_1794476585239.jpg',
        images: ['/src/assets/images/event_award_gala_1794476585239.jpg'],
        status: 'published',
        createdAt: '2024-11-05T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
      },
      {
        id: 'event-2',
        title: 'Paris Haute Couture Autumn Gala',
        role: 'Modeling Show',
        date: 'September 2024',
        location: 'Palais de Tokyo, Paris, France',
        description: 'Featured runway walk for premier eveningwear collection before international fashion buyers.',
        coverImage: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        images: ['/src/assets/images/about_fashion_runway_1794476556845.jpg'],
        status: 'published',
        createdAt: '2024-09-25T00:00:00Z',
        updatedAt: '2024-09-25T00:00:00Z',
      },
      {
        id: 'event-3',
        title: 'Doha Luxury Brand Showcase',
        role: 'Special Invitation',
        date: 'July 2024',
        location: 'The Ritz-Carlton, Doha, Qatar',
        description: 'Exclusive brand activation representing bespoke tailored heritage wear.',
        coverImage: '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        images: ['/src/assets/images/hero_sobur_portrait_1794476542316.jpg'],
        status: 'published',
        createdAt: '2024-07-14T00:00:00Z',
        updatedAt: '2024-07-14T00:00:00Z',
      },
    ],
    awards: [
      {
        id: 'award-1',
        name: 'International Fashion Icon of the Year',
        organization: 'Global Influencer Summit 2024',
        date: 'November 2024',
        trophyImage: '/src/assets/images/event_award_gala_1794476585239.jpg',
        certificateImage: '/src/assets/images/event_award_gala_1794476585239.jpg',
        description: 'Awarded for extraordinary runway elegance, high-fashion editorial presence, and digital style mentorship.',
        status: 'published',
        createdAt: '2024-11-06T00:00:00Z',
        updatedAt: '2024-11-06T00:00:00Z',
      },
      {
        id: 'award-2',
        name: 'Best Commercial Male Model 2023',
        organization: 'Asian Fashion Critics Circle',
        date: 'December 2023',
        trophyImage: '/src/assets/images/event_award_gala_1794476585239.jpg',
        description: 'Recognized for high-impact commercial campaigns and versatile brand representation in luxury menswear.',
        status: 'published',
        createdAt: '2023-12-10T00:00:00Z',
        updatedAt: '2023-12-10T00:00:00Z',
      },
    ],
    social_links: {
      facebook: 'https://www.facebook.com/profile.php?id=61591172602793',
      instagram: 'https://www.instagram.com/isoburkhan?psln=NTdxOGx1OHBsNXky',
      youtube: 'https://youtube.com/@isoburkhan',
      tiktok: 'https://tiktok.com/@isoburkhan',
      whatsapp: '+8801700000000',
      businessEmail: 'contact@soburkhan.com',
      phone: '+880 1700-000000',
      status: 'published',
      updatedAt: new Date().toISOString(),
    },
    courses: [
      {
        id: 'course-1',
        title: 'Beginner Modeling Course',
        tier: 'Beginner Modeling Course',
        fee: '',
        feeAmount: null,
        currency: 'BDT',
        bdtConfirmed: false,
        legacyUsdFee: '$350',
        schedule: 'Weekends (Saturday & Sunday, 10:00 AM - 1:00 PM)',
        duration: '4 Weeks (24 Hours In-Studio)',
        location: 'Sobur Khan Runway Studio, Fashion District',
        coverImage: '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
        description: 'A comprehensive foundational masterclass designed for aspiring models. Learn runway posture, camera angle mastery, facial expressions, and basic portfolio etiquette.',
        syllabus: [
          'Runway Posture, Balance & Core Poise',
          'Camera Angles & Facial Expression Control',
          'Basics of Lighting & Studio Etiquette',
          'Foundational Catwalk & Turn Techniques',
          'First Professional Headshot & Digitals Session',
        ],
        capacity: 15,
        enrolledCount: 9,
        status: 'published',
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-09-01T00:00:00Z',
      },
      {
        id: 'course-2',
        title: 'Professional Modeling Training',
        tier: 'Professional Modeling Training',
        fee: '',
        feeAmount: null,
        currency: 'BDT',
        bdtConfirmed: false,
        legacyUsdFee: '$750',
        schedule: 'Evenings (Tuesday, Thursday & Saturday, 6:00 PM - 9:00 PM)',
        duration: '8 Weeks (48 Hours In-Studio)',
        location: 'Grand Catwalk Academy, Studio 4',
        coverImage: '/src/assets/images/about_fashion_runway_1794476556845.jpg',
        description: 'Advanced runway pacing, live garment adaptation, commercial audition techniques, and brand ambassadorship coaching directly overseen by Sobur Ali Khan.',
        syllabus: [
          'High-Fashion vs. Commercial Catwalk Dynamics',
          'Haute Couture Garment Handling & Cape Movement',
          'Audition & Casting Call Simulation Workshops',
          'Working with High-Speed Flash & Motion Cameras',
          'Complete Editorial Modeling Portfolio Shoot',
        ],
        capacity: 12,
        enrolledCount: 7,
        status: 'published',
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-09-01T00:00:00Z',
      },
      {
        id: 'course-3',
        title: 'Advanced Modeling Training & Elite Mentorship',
        tier: 'Advanced Modeling Training',
        fee: '',
        feeAmount: null,
        currency: 'BDT',
        bdtConfirmed: false,
        legacyUsdFee: '$1,200',
        schedule: 'Intensive Masterclass Weekend Residencies',
        duration: '12 Weeks (Comprehensive Pro Pathway)',
        location: 'Sobur Khan Executive Studio & Runway Hall',
        coverImage: '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
        description: 'Elite mentorship for working models aiming for international agency contracts, luxury brand endorsements, and Paris/Milan fashion week readiness.',
        syllabus: [
          'International Agency Representation & Contracts',
          'Personal Brand Development & Influencer Strategy',
          'Complex Haute Couture Choreography & Show Closing',
          'Digital Presence & High-Ticket Brand Collaborations',
          'Agency-Ready Video Showreel & High-End Lookbook',
        ],
        capacity: 8,
        enrolledCount: 5,
        status: 'published',
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-09-01T00:00:00Z',
      },
    ],
    student_registrations: [
      {
        id: 'reg-1',
        courseId: 'course-1',
        courseTitle: 'Beginner Modeling Course',
        fullName: 'Tariq Rahman',
        email: 'tariq.rahman@example.com',
        phone: '+880 1812-345678',
        age: 22,
        height: "6'1\"",
        previousExperience: 'College fashion show participant',
        message: 'Aspiring to build a career in runway and commercial modeling.',
        receiptNumber: 'REC-SAK-1001',
        feeAmountBdt: null,
        paymentStatus: 'paid',
        currency: 'BDT',
        status: 'approved',
        submittedAt: '2024-10-15T11:20:00Z',
      },
      {
        id: 'reg-2',
        courseId: 'course-2',
        courseTitle: 'Professional Modeling Training',
        fullName: 'Ananya Chowdhury',
        email: 'ananya.c@example.com',
        phone: '+880 1912-987654',
        age: 24,
        height: "5'9\"",
        previousExperience: '2 commercial shoots completed',
        message: 'Looking to refine my runway poise and catwalk choreography.',
        receiptNumber: 'REC-SAK-1002',
        feeAmountBdt: null,
        paymentStatus: 'pending',
        currency: 'BDT',
        status: 'pending',
        submittedAt: '2024-11-02T14:10:00Z',
      },
    ],
    collaboration_inquiries: [
      {
        id: 'collab-1',
        companyName: 'Luxe Chrono Swiss Watches',
        contactPerson: 'David Miller',
        email: 'dmiller@luxechrono.ch',
        phone: '+41 22 900 1234',
        collaborationType: 'Brand Ambassador',
        budgetRange: 'Pending BDT Budget Confirmation',
        quotedAmountBdt: null,
        currency: 'BDT',
        legacyUsdBudget: '$10,000 - $25,000',
        invoiceNumber: 'INV-SAK-2001',
        details: 'Looking for Sobur Ali Khan to serve as our regional brand ambassador for our upcoming Royal Gold Tourbillon launch.',
        timeline: 'Q1 2025',
        status: 'in_discussion',
        submittedAt: '2024-10-28T09:45:00Z',
      },
    ],
    contact_messages: [
      {
        id: 'msg-1',
        name: 'Sara Lindqvist',
        email: 'sara@vogue-nordic.com',
        phone: '+46 8 123 4567',
        subject: 'Editorial Booking Request - Winter Issue',
        message: 'We are organizing an editorial spread in Stockholm and would like to check Sobur’s availability for December.',
        status: 'unread',
        submittedAt: '2024-11-09T16:30:00Z',
      },
    ],
    website_settings: {
      siteTitle: 'SOBUR ALI KHAN | Influencer & Professional Model',
      metaDescription: 'Official portfolio and brand website for Sobur Ali Khan, international fashion model and digital influencer.',
      theme: 'dark',
      showCourses: true,
      showCollaborations: true,
      brandTagline: 'Haute Couture Poise & Modern Influence',
      copyrightNotice: '© 2026 SOBUR ALI KHAN. All Rights Reserved. Luxury Editorial Rights Reserved.',
      updatedAt: new Date().toISOString(),
    },
    currency_settings: {
      code: 'BDT',
      symbol: '৳',
      name: 'Bangladeshi Taka',
      locale: 'en-BD',
      digitStyle: 'en',
      budgetTiersBdt: [
        '৳ 50,000 – ৳ 1,50,000',
        '৳ 1,50,000 – ৳ 3,50,000',
        '৳ 3,50,000 – ৳ 7,50,000',
        '৳ 7,50,000+ (Global Campaign)',
      ],
      updatedAt: new Date().toISOString(),
    },
    service_packages: [
      {
        id: 'pkg-1',
        name: 'Commercial Editorial Shoot',
        category: 'Commercial Modeling',
        description: 'Full-day studio or location fashion campaign shoot with usage licensing.',
        priceBdt: null,
        currency: 'BDT',
        bdtConfirmed: false,
        deliverables: 'Up to 8 hours on-set, 3 wardrobe changes, social media story tags',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pkg-2',
        name: 'Runway Show Lead Appearance',
        category: 'Runway Modeling',
        description: 'Opening or closing solo catwalk walk for luxury designers and fashion weeks.',
        priceBdt: null,
        currency: 'BDT',
        bdtConfirmed: false,
        deliverables: 'Rehearsal attendance, fittings, show-day appearance, press backdrop',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pkg-3',
        name: 'Digital Brand Ambassador Reel & Post',
        category: 'Influencer Campaign',
        description: 'Bespoke cinematic reel and editorial carousel across Instagram and Facebook.',
        priceBdt: null,
        currency: 'BDT',
        bdtConfirmed: false,
        deliverables: '1 cinematic HD Reel, 3 story frames with link sticker, 1 static post',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    image_frames: [],
    removed_default_urls: [],
  };
}

export function getDefaultSeedSnapshot() {
  const seed = getInitialData();
  return {
    portfolio_projects: seed.portfolio_projects,
    media_library: seed.media_library,
    events: seed.events,
    awards: seed.awards,
    courses: seed.courses,
  };
}

function buildDefaultImageFrames(data: {
  profiles?: Profile[];
  portfolio_projects?: PortfolioProject[];
  media_library?: MediaItem[];
  modeling_groups?: ModelingGroup[];
  events?: EventItem[];
  awards?: AwardItem[];
  courses?: ModelingCourse[];
  removed_default_urls?: string[];
}): FrameImageConfig[] {
  const now = new Date().toISOString();
  const profile = data.profiles?.[0];
  const media = data.media_library || [];
  const makeSettings = (url: string, aspectPreset: FrameImageConfig['defaultAspect'], objPos = '50% 20%') => ({
    originalUrl: url,
    editedUrl: url,
    zoom: 1,
    rotation: 0,
    crop: { x: 0, y: 0 },
    croppedAreaPixels: null,
    croppedAreaPercentages: null,
    aspectPreset,
    customRatio: { width: 4, height: 5 },
    resizeWidth: 1200,
    resizeHeight: 1500,
    position: { x: 50, y: 20 },
    objectPosition: objPos,
    updatedAt: now,
  });

  const defs: Array<{
    slot: WebsiteFrameSlot;
    label: string;
    description: string;
    defaultAspect: FrameImageConfig['defaultAspect'];
    url: string;
  }> = [
    {
      slot: 'hero_bg',
      label: 'Homepage Hero Background',
      description: 'Main right-column high-fashion hero portrait on the homepage.',
      defaultAspect: '4:5',
      url: profile?.heroImage || '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
    },
    {
      slot: 'profile_photo',
      label: 'Profile Photo',
      description: 'Official executive profile portrait used across brand features.',
      defaultAspect: '1:1',
      url: profile?.profileImage || '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
    },
    {
      slot: 'about_me',
      label: 'About Me Section',
      description: 'Full-length runway/editorial frame in the About Me section.',
      defaultAspect: '3:4',
      url: profile?.aboutBgImage || '/src/assets/images/about_fashion_runway_1794476556845.jpg',
    },
    {
      slot: 'portfolio_gallery',
      label: 'Portfolio Gallery',
      description: 'Primary highlight frame for Portfolio Works cards.',
      defaultAspect: '4:5',
      url: data.portfolio_projects?.[0]?.coverImage || '/src/assets/images/about_fashion_runway_1794476556845.jpg',
    },
    {
      slot: 'modeling_photos',
      label: 'Modeling Photos',
      description: 'Lead framing preset for High-Fashion & Editorial Gallery cards.',
      defaultAspect: '3:4',
      url: media[0]?.url || '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
    },
    {
      slot: 'event_gallery',
      label: 'Event Gallery',
      description: 'Landscape frame for Events & Modeling Shows cards.',
      defaultAspect: '16:9',
      url: data.events?.[0]?.coverImage || '/src/assets/images/event_award_gala_1794476585239.jpg',
    },
    {
      slot: 'awards_achievements',
      label: 'Awards & Achievements',
      description: 'Square trophy & certificate showcase frame.',
      defaultAspect: '1:1',
      url: data.awards?.[0]?.trophyImage || '/src/assets/images/event_award_gala_1794476585239.jpg',
    },
    {
      slot: 'modeling_group',
      label: 'Modeling Group Gallery',
      description: 'Collective ensemble visual frame in Modeling Group section.',
      defaultAspect: '4:5',
      url: data.modeling_groups?.[0]?.logo || '/src/assets/images/about_fashion_runway_1794476556845.jpg',
    },
    {
      slot: 'course_cover',
      label: 'Course Cover Images',
      description: 'Wide 16:9 cover image for Offline Modeling Courses.',
      defaultAspect: '16:9',
      url: data.courses?.[0]?.coverImage || '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
    },
    {
      slot: 'featured_images',
      label: 'Featured Images',
      description: 'Spotlight vertical / portrait showcase for Featured Gallery.',
      defaultAspect: '4:5',
      url: media.find((m) => m.featured)?.url || media[0]?.url || '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
    },
  ];

  return defs.map((d) => ({
    slot: d.slot,
    label: d.label,
    description: d.description,
    defaultAspect: d.defaultAspect,
    status: 'published',
    imageSettings: makeSettings(d.url, d.defaultAspect),
  }));
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const initial = getInitialData();
        let needsPersist = false;

        // Migrate courses away from unconfirmed USD ($) without inventing FX rates
        const rawCourses: any[] = parsed.courses || initial.courses;
        const migratedCourses: ModelingCourse[] = rawCourses.map((c) => {
          const hasUsd = typeof c.fee === 'string' && c.fee.includes('$');
          if (hasUsd && !c.bdtConfirmed) {
            needsPersist = true;
            return {
              ...c,
              legacyUsdFee: c.legacyUsdFee || c.fee,
              fee: '',
              feeAmount: null,
              currency: 'BDT',
              bdtConfirmed: false,
            };
          }
          return {
            ...c,
            currency: 'BDT',
            feeAmount: typeof c.feeAmount === 'number' ? c.feeAmount : null,
            bdtConfirmed: Boolean(c.bdtConfirmed),
          };
        });

        // Migrate collaborations away from unconfirmed USD ($) budget strings
        const rawCollabs: any[] = parsed.collaboration_inquiries || initial.collaboration_inquiries;
        const migratedCollabs: CollaborationInquiry[] = rawCollabs.map((col, idx) => {
          const hasUsd = typeof col.budgetRange === 'string' && col.budgetRange.includes('$');
          if (hasUsd) {
            needsPersist = true;
            return {
              ...col,
              legacyUsdBudget: col.legacyUsdBudget || col.budgetRange,
              budgetRange: 'Pending BDT Budget Confirmation',
              quotedAmountBdt: typeof col.quotedAmountBdt === 'number' ? col.quotedAmountBdt : null,
              currency: 'BDT',
              invoiceNumber: col.invoiceNumber || `INV-SAK-${2001 + idx}`,
            };
          }
          return {
            ...col,
            currency: 'BDT',
            invoiceNumber: col.invoiceNumber || `INV-SAK-${2001 + idx}`,
          };
        });

        // Ensure student registrations have receipt numbers & BDT currency
        const rawRegs: any[] = parsed.student_registrations || initial.student_registrations;
        const migratedRegs: StudentRegistration[] = rawRegs.map((reg, idx) => {
          if (!reg.receiptNumber || reg.currency !== 'BDT') {
            needsPersist = true;
          }
          return {
            ...reg,
            receiptNumber: reg.receiptNumber || `REC-SAK-${1001 + idx}`,
            paymentStatus: reg.paymentStatus || (reg.status === 'approved' ? 'paid' : 'pending'),
            currency: 'BDT',
          };
        });

        const merged: DatabaseSchema = {
          ...initial,
          ...parsed,
          profiles: parsed.profiles || initial.profiles,
          portfolio_projects: parsed.portfolio_projects || initial.portfolio_projects,
          media_library: parsed.media_library || initial.media_library,
          modeling_groups: parsed.modeling_groups || initial.modeling_groups,
          events: parsed.events || initial.events,
          awards: parsed.awards || initial.awards,
          courses: migratedCourses,
          student_registrations: migratedRegs,
          collaboration_inquiries: migratedCollabs,
          contact_messages: parsed.contact_messages || initial.contact_messages,
          website_settings: parsed.website_settings || initial.website_settings,
          currency_settings: parsed.currency_settings || initial.currency_settings,
          service_packages: parsed.service_packages || initial.service_packages,
          removed_default_urls: Array.isArray(parsed.removed_default_urls)
            ? parsed.removed_default_urls
            : [],
          image_frames:
            Array.isArray(parsed.image_frames) && parsed.image_frames.length > 0
              ? parsed.image_frames
              : buildDefaultImageFrames({
                  profiles: parsed.profiles || initial.profiles,
                  portfolio_projects: parsed.portfolio_projects || initial.portfolio_projects,
                  media_library: parsed.media_library || initial.media_library,
                  modeling_groups: parsed.modeling_groups || initial.modeling_groups,
                  events: parsed.events || initial.events,
                  awards: parsed.awards || initial.awards,
                  courses: migratedCourses,
                  removed_default_urls: Array.isArray(parsed.removed_default_urls)
                    ? parsed.removed_default_urls
                    : [],
                }),
        };

        if (!parsed.currency_settings || !parsed.image_frames?.length || !parsed.service_packages) {
          needsPersist = true;
        }

        if (needsPersist) {
          this.saveData(merged);
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to read db file, creating fresh initial database:', e);
    }

    const fresh = getInitialData();
    fresh.image_frames = buildDefaultImageFrames(fresh);
    this.saveData(fresh);
    return fresh;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public update(updater: (data: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveData(this.data);
    return this.data;
  }

  public replace(newData: DatabaseSchema): DatabaseSchema {
    this.data = newData;
    this.saveData(this.data);
    return this.data;
  }

  public reload(): DatabaseSchema {
    this.data = this.load();
    return this.data;
  }
}

export const db = new Database();
