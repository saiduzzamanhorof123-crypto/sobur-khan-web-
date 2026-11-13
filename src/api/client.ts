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
  ImageCropMetadata,
  PublicationStatus,
} from '../types';
import {
  syncCollaborationInquiryToFirestore,
  syncContactMessageToFirestore,
  syncStudentRegistrationToFirestore,
} from '../services/firestoreSync';

const TOKEN_KEY = 'sobur_admin_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/* ==========================================================================
   PUBLIC API CALLS (Visitors Only Access Published Content)
   ========================================================================== */

export async function fetchPublicProfile(): Promise<Profile> {
  const res = await fetch('/api/public/profile');
  if (!res.ok) throw new Error('Failed to load profile');
  const data = await res.json();
  return data.profile;
}

export async function fetchPublicProjects(): Promise<PortfolioProject[]> {
  const res = await fetch('/api/public/projects');
  if (!res.ok) throw new Error('Failed to load projects');
  const data = await res.json();
  return data.projects;
}

export async function fetchPublicMedia(): Promise<MediaItem[]> {
  const res = await fetch('/api/public/media');
  if (!res.ok) throw new Error('Failed to load media');
  const data = await res.json();
  return data.media;
}

export async function fetchPublicGallery(params?: {
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<MediaItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.featured) query.set('featured', 'true');
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/public/gallery?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load gallery');
  const data = await res.json();
  return data.gallery;
}

export async function fetchPublicModelingGroups(): Promise<ModelingGroup[]> {
  const res = await fetch('/api/public/modeling-groups');
  if (!res.ok) throw new Error('Failed to load modeling groups');
  const data = await res.json();
  return data.groups;
}

export async function fetchPublicEvents(): Promise<EventItem[]> {
  const res = await fetch('/api/public/events');
  if (!res.ok) throw new Error('Failed to load events');
  const data = await res.json();
  return data.events;
}

export async function fetchPublicAwards(): Promise<AwardItem[]> {
  const res = await fetch('/api/public/awards');
  if (!res.ok) throw new Error('Failed to load awards');
  const data = await res.json();
  return data.awards;
}

export async function fetchPublicSocialLinks(): Promise<SocialLinks> {
  const res = await fetch('/api/public/social-links');
  if (!res.ok) throw new Error('Failed to load social links');
  const data = await res.json();
  return data.socialLinks;
}

export async function fetchPublicCourses(): Promise<ModelingCourse[]> {
  const res = await fetch('/api/public/courses');
  if (!res.ok) throw new Error('Failed to load courses');
  const data = await res.json();
  return data.courses;
}

export async function fetchPublicSettings(): Promise<WebsiteSettings> {
  const res = await fetch('/api/public/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  const data = await res.json();
  return data.settings;
}

export async function fetchPublicPricing(): Promise<{
  currencySettings: CurrencySettings;
  packages: ServicePackage[];
}> {
  const res = await fetch('/api/public/pricing');
  if (!res.ok) throw new Error('Failed to load pricing');
  return res.json();
}

export async function fetchPublicImageFrames(): Promise<FrameImageConfig[]> {
  const res = await fetch('/api/public/image-frames');
  if (!res.ok) throw new Error('Failed to load image frames');
  const data = await res.json();
  return data.frames || [];
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/public/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  const result = await res.json();
  await syncContactMessageToFirestore(payload).catch((e) =>
    console.warn('Firestore contact mirror skipped:', e)
  );
  return result;
}

export async function submitStudentRegistration(payload: {
  courseId: string;
  courseTitle: string;
  fullName: string;
  email: string;
  phone: string;
  age?: number | string;
  height?: string;
  previousExperience?: string;
  message?: string;
}): Promise<{ success: boolean; message: string; registration?: StudentRegistration }> {
  const res = await fetch('/api/public/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit registration');
  }
  const result = await res.json();
  await syncStudentRegistrationToFirestore({
    ...payload,
    id: result?.registration?.id,
  }).catch((e) => console.warn('Firestore registration mirror skipped:', e));
  return result;
}

export async function submitCollaborationInquiry(payload: {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  collaborationType: string;
  budgetRange?: string;
  details: string;
  timeline?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/public/collaborate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit inquiry');
  }
  const result = await res.json();
  await syncCollaborationInquiryToFirestore(payload).catch((e) =>
    console.warn('Firestore inquiry mirror skipped:', e)
  );
  return result;
}

/* ==========================================================================
   ADMIN AUTH & CRUD API CALLS (Owner Access Only)
   ========================================================================== */

export async function adminLogin(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  }
  const data = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function firebaseSessionLogin(idToken: string): Promise<{ token: string; user: any }> {
  const res = await fetch('/api/auth/firebase-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Firebase Google sign-in denied');
  }
  const data = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentAdmin(): Promise<any> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthenticated');
  const data = await res.json();
  return data.user;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to change password');
  }
}

export async function fetchAdminOverview(): Promise<any> {
  const res = await fetch('/api/admin/overview', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

// Profile
export async function fetchAdminProfile(): Promise<Profile> {
  const res = await fetch('/api/admin/profile', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch admin profile');
  const data = await res.json();
  return data.profile;
}

export async function updateAdminProfile(profile: Partial<Profile>): Promise<Profile> {
  const res = await fetch('/api/admin/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  const data = await res.json();
  return data.profile;
}

// Projects
export async function fetchAdminProjects(): Promise<PortfolioProject[]> {
  const res = await fetch('/api/admin/projects', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch admin projects');
  const data = await res.json();
  return data.projects;
}

export async function createAdminProject(project: Partial<PortfolioProject>): Promise<PortfolioProject> {
  const res = await fetch('/api/admin/projects', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to create project');
  const data = await res.json();
  return data.project;
}

export async function updateAdminProject(id: string, project: Partial<PortfolioProject>): Promise<PortfolioProject> {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to update project');
  const data = await res.json();
  return data.project;
}

export async function deleteAdminProject(id: string): Promise<void> {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

// Media
export async function fetchAdminMedia(params?: {
  category?: string;
  search?: string;
  status?: string;
}): Promise<MediaItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`/api/admin/media?${query.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch media library');
  const data = await res.json();
  return data.media;
}

export async function uploadAdminImage(payload: {
  dataUrl: string;
  originalDataUrl?: string;
  fileName?: string;
  title?: string;
  category?: string;
  description?: string;
  status?: string;
  featured?: boolean;
  cropMetadata?: Partial<ImageCropMetadata>;
}): Promise<{ url: string; originalUrl?: string; media: MediaItem }> {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload image');
  }
  return res.json();
}

export async function cropAdminMedia(
  id: string,
  payload: {
    editedDataUrl: string;
    fileName?: string;
    cropMetadata: Partial<ImageCropMetadata>;
    status?: PublicationStatus;
  }
): Promise<MediaItem> {
  const res = await fetch(`/api/admin/media/${id}/crop`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save cropped image');
  }
  const data = await res.json();
  return data.media;
}

export async function uploadMultipleAdminImages(images: Array<{
  dataUrl: string;
  originalDataUrl?: string;
  fileName?: string;
  title?: string;
  category?: string;
  description?: string;
  status?: string;
  featured?: boolean;
  fileSize?: string;
  cropMetadata?: Partial<ImageCropMetadata>;
}>): Promise<{ success: boolean; count: number; media: MediaItem[]; message: string }> {
  const res = await fetch('/api/admin/upload-multiple', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ images }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to batch upload images');
  }
  return res.json();
}

// Website Image Frames (Independent per-section memory)
export async function fetchAdminImageFrames(): Promise<FrameImageConfig[]> {
  const res = await fetch('/api/admin/image-frames', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch image frames');
  const data = await res.json();
  return data.frames || [];
}

export async function updateAdminImageFrame(
  slot: WebsiteFrameSlot,
  payload: {
    editedDataUrl?: string;
    originalDataUrl?: string;
    imageSettings: Partial<ImageCropMetadata>;
    status?: PublicationStatus;
    fileName?: string;
    applyToSection?: boolean;
  }
): Promise<FrameImageConfig> {
  const res = await fetch(`/api/admin/image-frames/${slot}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save frame settings');
  }
  const data = await res.json();
  return data.frame;
}

export async function replaceAdminImage(
  id: string,
  payload: { dataUrl: string; fileName?: string }
): Promise<MediaItem> {
  const res = await fetch(`/api/admin/media/${id}/replace`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to replace image');
  }
  const data = await res.json();
  return data.media;
}

export async function reorderAdminMedia(orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/admin/media-reorder', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to save media reordering');
}

export async function updateAdminMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
  const res = await fetch(`/api/admin/media/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update media');
  const data = await res.json();
  return data.media;
}

export interface ImageUsageRef {
  section: string;
  id: string;
  title: string;
  field: string;
}

export async function checkAdminImageUsage(url: string): Promise<{ url: string; usages: ImageUsageRef[] }> {
  const res = await fetch(`/api/admin/image-usage?url=${encodeURIComponent(url)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to check image usage');
  return res.json();
}

export async function deleteAdminMedia(id: string, force = false): Promise<void> {
  const res = await fetch(`/api/admin/media/${id}${force ? '?force=true' : ''}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error: any = new Error(err.error || 'Failed to delete media');
    error.status = res.status;
    error.usages = err.usages;
    throw error;
  }
}

export async function bulkDeleteAdminMedia(
  ids: string[],
  force = false
): Promise<{ success: boolean; deletedCount: number; message: string }> {
  const res = await fetch('/api/admin/media/bulk-delete', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ids, force }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error: any = new Error(err.error || 'Failed to bulk delete images');
    error.status = res.status;
    error.conflicts = err.conflicts;
    throw error;
  }
  return res.json();
}

export async function saveSectionImage(payload: {
  editedDataUrl?: string;
  originalDataUrl?: string;
  existingUrl?: string;
  existingOriginalUrl?: string;
  fileName?: string;
  title?: string;
  sectionName: string;
  category: string;
  cropMetadata: Partial<ImageCropMetadata>;
  status?: PublicationStatus;
  addToGallery?: boolean;
}): Promise<{ success: boolean; url: string; originalUrl: string; cropMetadata: ImageCropMetadata }> {
  const res = await fetch('/api/admin/section-image/save', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save section image');
  }
  return res.json();
}

export async function restoreDefaultImages(
  section: 'courses' | 'portfolio' | 'events' | 'awards' | 'all'
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/defaults/restore', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ section }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to restore default images');
  }
  return res.json();
}

// Modeling Groups
export async function fetchAdminModelingGroups(): Promise<ModelingGroup[]> {
  const res = await fetch('/api/admin/modeling-groups', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch modeling groups');
  const data = await res.json();
  return data.groups;
}

export async function createAdminModelingGroup(group: Partial<ModelingGroup>): Promise<ModelingGroup> {
  const res = await fetch('/api/admin/modeling-groups', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(group),
  });
  if (!res.ok) throw new Error('Failed to create group');
  const data = await res.json();
  return data.group;
}

export async function updateAdminModelingGroup(id: string, updates: Partial<ModelingGroup>): Promise<ModelingGroup> {
  const res = await fetch(`/api/admin/modeling-groups/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update group');
  const data = await res.json();
  return data.group;
}

export async function deleteAdminModelingGroup(id: string): Promise<void> {
  const res = await fetch(`/api/admin/modeling-groups/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete group');
}

// Events
export async function fetchAdminEvents(): Promise<EventItem[]> {
  const res = await fetch('/api/admin/events', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.events;
}

export async function createAdminEvent(event: Partial<EventItem>): Promise<EventItem> {
  const res = await fetch('/api/admin/events', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Failed to create event');
  const data = await res.json();
  return data.event;
}

export async function updateAdminEvent(id: string, updates: Partial<EventItem>): Promise<EventItem> {
  const res = await fetch(`/api/admin/events/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update event');
  const data = await res.json();
  return data.event;
}

export async function deleteAdminEvent(id: string): Promise<void> {
  const res = await fetch(`/api/admin/events/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete event');
}

// Awards
export async function fetchAdminAwards(): Promise<AwardItem[]> {
  const res = await fetch('/api/admin/awards', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch awards');
  const data = await res.json();
  return data.awards;
}

export async function createAdminAward(award: Partial<AwardItem>): Promise<AwardItem> {
  const res = await fetch('/api/admin/awards', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(award),
  });
  if (!res.ok) throw new Error('Failed to create award');
  const data = await res.json();
  return data.award;
}

export async function updateAdminAward(id: string, updates: Partial<AwardItem>): Promise<AwardItem> {
  const res = await fetch(`/api/admin/awards/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update award');
  const data = await res.json();
  return data.award;
}

export async function deleteAdminAward(id: string): Promise<void> {
  const res = await fetch(`/api/admin/awards/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete award');
}

// Courses
export async function fetchAdminCourses(): Promise<ModelingCourse[]> {
  const res = await fetch('/api/admin/courses', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch courses');
  const data = await res.json();
  return data.courses;
}

export async function createAdminCourse(course: Partial<ModelingCourse>): Promise<ModelingCourse> {
  const res = await fetch('/api/admin/courses', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(course),
  });
  if (!res.ok) throw new Error('Failed to create course');
  const data = await res.json();
  return data.course;
}

export async function updateAdminCourse(id: string, updates: Partial<ModelingCourse>): Promise<ModelingCourse> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update course');
  const data = await res.json();
  return data.course;
}

export async function deleteAdminCourse(id: string): Promise<void> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete course');
}

// Currency Settings & Service Packages
export async function fetchAdminCurrencySettings(): Promise<CurrencySettings> {
  const res = await fetch('/api/admin/currency-settings', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch currency settings');
  const data = await res.json();
  return data.currencySettings;
}

export async function updateAdminCurrencySettings(
  updates: Partial<CurrencySettings>
): Promise<CurrencySettings> {
  const res = await fetch('/api/admin/currency-settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update currency settings');
  const data = await res.json();
  return data.currencySettings;
}

export async function fetchAdminPackages(): Promise<ServicePackage[]> {
  const res = await fetch('/api/admin/packages', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch service packages');
  const data = await res.json();
  return data.packages || [];
}

export async function createAdminPackage(pkg: Partial<ServicePackage>): Promise<ServicePackage> {
  const res = await fetch('/api/admin/packages', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(pkg),
  });
  if (!res.ok) throw new Error('Failed to create package');
  const data = await res.json();
  return data.package;
}

export async function updateAdminPackage(
  id: string,
  updates: Partial<ServicePackage>
): Promise<ServicePackage> {
  const res = await fetch(`/api/admin/packages/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update package');
  const data = await res.json();
  return data.package;
}

export async function deleteAdminPackage(id: string): Promise<void> {
  const res = await fetch(`/api/admin/packages/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete package');
}

// Registrations
export async function fetchAdminRegistrations(): Promise<StudentRegistration[]> {
  const res = await fetch('/api/admin/registrations', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch registrations');
  const data = await res.json();
  return data.registrations;
}

export async function updateRegistrationStatus(
  id: string,
  status: string,
  extras?: { paymentStatus?: 'pending' | 'partial' | 'paid'; feeAmountBdt?: number | null }
): Promise<void> {
  const res = await fetch(`/api/admin/registrations/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, ...(extras || {}) }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

export async function deleteRegistration(id: string): Promise<void> {
  const res = await fetch(`/api/admin/registrations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete registration');
}

// Collaborations
export async function fetchAdminCollaborations(): Promise<CollaborationInquiry[]> {
  const res = await fetch('/api/admin/collaborations', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch collaborations');
  const data = await res.json();
  return data.collaborations;
}

export async function updateCollaborationStatus(
  id: string,
  status: string,
  extras?: { quotedAmountBdt?: number | null; budgetRange?: string }
): Promise<void> {
  const res = await fetch(`/api/admin/collaborations/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, ...(extras || {}) }),
  });
  if (!res.ok) throw new Error('Failed to update collaboration');
}

export async function deleteCollaboration(id: string): Promise<void> {
  const res = await fetch(`/api/admin/collaborations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete collaboration');
}

// Messages
export async function fetchAdminMessages(): Promise<ContactMessage[]> {
  const res = await fetch('/api/admin/messages', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  return data.messages;
}

export async function updateMessageStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`/api/admin/messages/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update message');
}

export async function deleteMessage(id: string): Promise<void> {
  const res = await fetch(`/api/admin/messages/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete message');
}

// Social Links & Settings
export async function fetchAdminSocialLinks(): Promise<SocialLinks> {
  const res = await fetch('/api/admin/social-links', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch admin social links');
  const data = await res.json();
  return data.socialLinks;
}

export async function updateAdminSocialLinks(links: Partial<SocialLinks>): Promise<SocialLinks> {
  const res = await fetch('/api/admin/social-links', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(links),
  });
  if (!res.ok) throw new Error('Failed to update social links');
  const data = await res.json();
  return data.socialLinks;
}

export async function fetchAdminSettings(): Promise<WebsiteSettings> {
  const res = await fetch('/api/admin/settings', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch admin settings');
  const data = await res.json();
  return data.settings;
}

export async function updateAdminSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  const data = await res.json();
  return data.settings;
}

// Backup & Recovery
export async function downloadDatabaseBackup(): Promise<Blob> {
  const res = await fetch('/api/admin/backup', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to download database backup');
  return res.blob();
}

export async function restoreDatabaseBackup(backupData: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/restore', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ backupData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to restore database from backup');
  }
  return res.json();
}
