export type PublicationStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export interface Profile {
  id: string;
  name: string;
  title: string;
  tagline: string;
  shortBio: string;
  fullBio: string;
  modelingJourney: string;
  influencerExperience: string;
  heroImage: string;
  profileImage: string;
  aboutBgImage: string;
  stats: {
    experienceYears: string;
    projectsCompleted: string;
    runwayShows: string;
    awardsWon: string;
    audienceReach: string;
  };
  status: PublicationStatus;
  updatedAt: string;
}

export type ProjectCategory = 'Editorial' | 'Commercial' | 'Runway' | 'Portrait' | 'Video' | 'Campaign';

export interface PortfolioProject {
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  client?: string;
  year: string;
  coverImage: string;
  coverImageSettings?: ImageCropMetadata | null;
  galleryImages: string[];
  galleryItems?: SectionImageItem[];
  videoUrl?: string;
  description: string;
  credits?: string;
  featured: boolean;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type MediaCategory =
  | 'Profile Photos'
  | 'Professional Modeling'
  | 'Fashion Photography'
  | 'Photoshoot'
  | 'Editorial Modeling'
  | 'Commercial Modeling'
  | 'Events & Experiences'
  | 'Modeling Group'
  | 'Awards & Achievements'
  | 'Featured Gallery'
  | 'Homepage'
  | 'About Me'
  | 'Portfolio'
  | 'Events'
  | 'Awards'
  | 'Courses'
  | 'Brand Collaboration'
  | 'General';

export type AspectRatioPreset =
  | 'free'
  | 'original'
  | '1:1'
  | '3:4'
  | '4:5'
  | '9:16'
  | '16:9'
  | 'custom';

export type ImageDisplaySize = 'small' | 'medium' | 'large';
export type ImageFitMode = 'cover' | 'contain';

export type WebsiteFrameSlot =
  | 'hero_bg'
  | 'profile_photo'
  | 'about_me'
  | 'portfolio_gallery'
  | 'modeling_photos'
  | 'event_gallery'
  | 'awards_achievements'
  | 'modeling_group'
  | 'course_cover'
  | 'featured_images';

export interface ImageCropMetadata {
  originalUrl: string;
  editedUrl: string;
  sectionName?: string;
  category?: string;
  zoom: number;
  rotation: number;
  crop: { x: number; y: number };
  croppedAreaPixels?: { x: number; y: number; width: number; height: number } | null;
  croppedAreaPercentages?: { x: number; y: number; width: number; height: number } | null;
  aspectPreset: AspectRatioPreset;
  customRatio: { width: number; height: number };
  resizeWidth?: number;
  resizeHeight?: number;
  position: { x: number; y: number };
  objectPosition: string;
  displaySize?: ImageDisplaySize;
  fitMode?: ImageFitMode;
  customDisplayWidth?: number | null;
  customDisplayHeight?: number | null;
  status?: PublicationStatus;
  isDefault?: boolean;
  updatedAt: string;
}

export interface SectionImageItem {
  id: string;
  url: string;
  originalUrl?: string;
  title?: string;
  isDefault?: boolean;
  featured?: boolean;
  order?: number;
  status?: PublicationStatus;
  cropMetadata?: ImageCropMetadata | null;
}

export interface FrameImageConfig {
  slot: WebsiteFrameSlot;
  label: string;
  description: string;
  defaultAspect: AspectRatioPreset;
  status: PublicationStatus;
  imageSettings: ImageCropMetadata;
}

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  originalUrl?: string;
  cropMetadata?: ImageCropMetadata;
  category: MediaCategory;
  description?: string;
  isDefault?: boolean;
  featured?: boolean;
  order?: number;
  fileSize?: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt?: string;
}

export type GroupPosition = 'Model' | 'Group Member' | 'Lead Model' | 'Team Member';

export interface ModelingGroup {
  id: string;
  groupName: string;
  logo: string;
  position: GroupPosition;
  groupDescription: string;
  experience: string;
  groupPhotos: string[];
  officialPageLink: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'Attended' | 'Worked At' | 'Modeling Show' | 'Brand Event' | 'Special Invitation';

export interface EventItem {
  id: string;
  title: string;
  role: EventType;
  date: string;
  location: string;
  description: string;
  coverImage: string;
  coverImageSettings?: ImageCropMetadata | null;
  images: string[];
  galleryItems?: SectionImageItem[];
  videoUrl?: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AwardItem {
  id: string;
  name: string;
  organization: string;
  date: string;
  certificateImage?: string;
  certificateImageSettings?: ImageCropMetadata | null;
  trophyImage?: string;
  trophyImageSettings?: ImageCropMetadata | null;
  galleryItems?: SectionImageItem[];
  description: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
  businessEmail: string;
  phone: string;
  status: PublicationStatus;
  updatedAt: string;
}

export type CourseTier = 'Beginner Modeling Course' | 'Professional Modeling Training' | 'Advanced Modeling Training';

export interface ModelingCourse {
  id: string;
  title: string;
  tier: CourseTier;
  fee?: string;
  feeAmount: number | null;
  currency: 'BDT';
  bdtConfirmed: boolean;
  legacyUsdFee?: string;
  schedule: string;
  duration: string;
  location: string;
  coverImage: string;
  coverImageSettings?: ImageCropMetadata | null;
  description: string;
  syllabus: string[];
  capacity: number;
  enrolledCount: number;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRegistration {
  id: string;
  courseId: string;
  courseTitle: string;
  fullName: string;
  email: string;
  phone: string;
  age: number | string;
  height: string;
  previousExperience: string;
  message?: string;
  receiptNumber?: string;
  feeAmountBdt?: number | null;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  currency?: 'BDT';
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  submittedAt: string;
}

export type CollaborationType =
  | 'Brand Promotion'
  | 'Sponsored Content'
  | 'Product Promotion'
  | 'Social Media Campaign'
  | 'Commercial Modeling'
  | 'Event Promotion'
  | 'Brand Ambassador';

export interface CollaborationInquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  collaborationType: CollaborationType;
  budgetRange: string;
  quotedAmountBdt?: number | null;
  currency?: 'BDT';
  legacyUsdBudget?: string;
  invoiceNumber?: string;
  details: string;
  timeline: string;
  status: 'new' | 'reviewed' | 'in_discussion' | 'closed';
  submittedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  submittedAt: string;
}

export interface CurrencySettings {
  code: 'BDT';
  symbol: '৳';
  name: 'Bangladeshi Taka';
  locale: 'en-BD' | 'bn-BD';
  digitStyle: 'en' | 'bn';
  budgetTiersBdt: string[];
  updatedAt: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  category: string;
  description: string;
  priceBdt: number | null;
  currency: 'BDT';
  bdtConfirmed: boolean;
  deliverables: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSettings {
  siteTitle: string;
  metaDescription: string;
  theme: 'dark' | 'light';
  showCourses: boolean;
  showCollaborations: boolean;
  brandTagline: string;
  copyrightNotice: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}
