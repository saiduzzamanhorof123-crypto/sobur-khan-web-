import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AwardItem,
  CurrencySettings,
  EventItem,
  FrameImageConfig,
  MediaItem,
  ModelingCourse,
  ModelingGroup,
  PortfolioProject,
  Profile,
  ServicePackage,
  SocialLinks,
  WebsiteSettings,
} from '../types';

function sanitizeId(raw: string, fallbackPrefix = 'item'): string {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .slice(0, 120);
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

function clampStr(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen);
}

function safeImageUrl(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Never store giant base64 blobs inside Firestore documents (1MB limit)
  if (val.startsWith('data:') && val.length > 1900) return '';
  return val.slice(0, 2000);
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export async function registerAdminRecordInFirestore(
  uid: string,
  email: string
): Promise<void> {
  const safeUid = sanitizeId(uid, 'admin');
  const path = `admins/${safeUid}`;
  try {
    await setDoc(doc(db, 'admins', safeUid), {
      uid: safeUid,
      email: clampStr(email, 200),
      role: 'owner',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncContactMessageToFirestore(payload: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const id = sanitizeId(payload.id || `msg-${Date.now()}`, 'msg');
  const path = `contact_messages/${id}`;
  const docData = stripUndefined({
    id,
    name: clampStr(payload.name.trim(), 160, 'Visitor'),
    email: clampStr(payload.email.trim(), 200, 'unknown@example.com'),
    phone: payload.phone ? clampStr(payload.phone.trim(), 40) : undefined,
    subject: clampStr((payload.subject || 'General Inquiry').trim(), 240, 'General Inquiry'),
    message: clampStr(payload.message.trim(), 4000, '-'),
    status: 'unread' as const,
    submittedAt: new Date().toISOString(),
  });
  try {
    await setDoc(doc(db, 'contact_messages', id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncCollaborationInquiryToFirestore(payload: {
  id?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  collaborationType: string;
  budgetRange?: string;
  details: string;
  timeline?: string;
}): Promise<void> {
  const id = sanitizeId(payload.id || `inq-${Date.now()}`, 'inq');
  const path = `collaboration_inquiries/${id}`;
  const docData = stripUndefined({
    id,
    companyName: clampStr(payload.companyName.trim(), 200, 'Brand'),
    contactPerson: clampStr(payload.contactPerson.trim(), 160, 'Representative'),
    email: clampStr(payload.email.trim(), 200, 'unknown@example.com'),
    phone: payload.phone ? clampStr(payload.phone.trim(), 40) : undefined,
    collaborationType: clampStr(payload.collaborationType.trim(), 120, 'Partnership'),
    budgetRange: payload.budgetRange ? clampStr(payload.budgetRange.trim(), 120) : undefined,
    details: clampStr(payload.details.trim(), 4000, '-'),
    timeline: payload.timeline ? clampStr(payload.timeline.trim(), 160) : undefined,
    status: 'new' as const,
    submittedAt: new Date().toISOString(),
  });
  try {
    await setDoc(doc(db, 'collaboration_inquiries', id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncStudentRegistrationToFirestore(payload: {
  id?: string;
  courseId: string;
  courseTitle: string;
  fullName: string;
  email: string;
  phone: string;
  age?: number | string;
  height?: string;
  previousExperience?: string;
  message?: string;
}): Promise<void> {
  const id = sanitizeId(payload.id || `reg-${Date.now()}`, 'reg');
  const path = `student_registrations/${id}`;
  const docData = stripUndefined({
    id,
    courseId: sanitizeId(payload.courseId, 'course'),
    courseTitle: clampStr(payload.courseTitle.trim(), 240, 'Modeling Course'),
    fullName: clampStr(payload.fullName.trim(), 160, 'Student'),
    email: clampStr(payload.email.trim(), 200, 'unknown@example.com'),
    phone: clampStr(payload.phone.trim(), 40, '00000'),
    age: payload.age !== undefined && payload.age !== '' ? clampStr(String(payload.age), 16) : undefined,
    height: payload.height ? clampStr(payload.height.trim(), 40) : undefined,
    previousExperience: payload.previousExperience
      ? clampStr(payload.previousExperience.trim(), 2000)
      : undefined,
    message: payload.message ? clampStr(payload.message.trim(), 2000) : undefined,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  });
  try {
    await setDoc(doc(db, 'student_registrations', id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface PortfolioCloudSnapshot {
  profile: Profile | null;
  projects: PortfolioProject[];
  media: MediaItem[];
  groups: ModelingGroup[];
  events: EventItem[];
  awards: AwardItem[];
  courses: ModelingCourse[];
  packages: ServicePackage[];
  frames: FrameImageConfig[];
  socialLinks: SocialLinks | null;
  websiteSettings: WebsiteSettings | null;
  currencySettings: CurrencySettings | null;
}

export async function syncFullPortfolioToFirestore(
  ownerUid: string,
  snapshot: PortfolioCloudSnapshot
): Promise<{ syncedCount: number; syncedAt: string }> {
  const uid = sanitizeId(ownerUid, 'owner');
  const now = new Date().toISOString();
  let syncedCount = 0;

  if (snapshot.profile) {
    const id = sanitizeId(snapshot.profile.id || 'sobur-main-profile', 'profile');
    const path = `profiles/${id}`;
    try {
      await setDoc(
        doc(db, 'profiles', id),
        stripUndefined({
          id,
          ownerId: uid,
          name: clampStr(snapshot.profile.name, 160, 'SOBUR ALI KHAN'),
          title: clampStr(snapshot.profile.title, 200, 'INFLUENCER & PROFESSIONAL MODEL'),
          tagline: clampStr(snapshot.profile.tagline, 500),
          shortBio: clampStr(snapshot.profile.shortBio, 1200),
          fullBio: clampStr(snapshot.profile.fullBio, 6000),
          modelingJourney: clampStr(snapshot.profile.modelingJourney, 4000),
          influencerExperience: clampStr(snapshot.profile.influencerExperience, 4000),
          heroImage: safeImageUrl(snapshot.profile.heroImage),
          profileImage: safeImageUrl(snapshot.profile.profileImage),
          aboutBgImage: safeImageUrl(snapshot.profile.aboutBgImage),
          stats: snapshot.profile.stats || {},
          status: snapshot.profile.status || 'published',
          updatedAt: snapshot.profile.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const proj of snapshot.projects) {
    const id = sanitizeId(proj.id, 'proj');
    const path = `portfolio_projects/${id}`;
    try {
      await setDoc(
        doc(db, 'portfolio_projects', id),
        stripUndefined({
          id,
          ownerId: uid,
          title: clampStr(proj.title, 240, 'Untitled Project'),
          subtitle: clampStr(proj.subtitle || '', 300),
          category: clampStr(proj.category, 80, 'Editorial'),
          client: clampStr(proj.client || '', 200),
          year: clampStr(proj.year || '', 20),
          coverImage: safeImageUrl(proj.coverImage),
          coverImageSettings: proj.coverImageSettings || undefined,
          galleryImages: (proj.galleryImages || []).slice(0, 40).map(safeImageUrl).filter(Boolean),
          galleryItems: (proj.galleryItems || []).slice(0, 40),
          description: clampStr(proj.description || '', 4000),
          credits: clampStr(proj.credits || '', 1000),
          featured: !!proj.featured,
          status: proj.status || 'published',
          createdAt: proj.createdAt || now,
          updatedAt: proj.updatedAt || now,
          publishedAt: proj.publishedAt || undefined,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const item of snapshot.media) {
    const url = safeImageUrl(item.url);
    if (!url) continue;
    const id = sanitizeId(item.id, 'media');
    const path = `media_library/${id}`;
    try {
      await setDoc(
        doc(db, 'media_library', id),
        stripUndefined({
          id,
          ownerId: uid,
          title: clampStr(item.title, 240, 'Portfolio Asset'),
          category: clampStr(item.category, 100, 'Portfolio'),
          url,
          originalUrl: safeImageUrl(item.originalUrl) || undefined,
          description: clampStr(item.description || '', 2000),
          featured: !!item.featured,
          order: typeof item.order === 'number' ? item.order : 0,
          fileSize: item.fileSize ? clampStr(item.fileSize, 64) : undefined,
          cropMetadata: item.cropMetadata || undefined,
          status: item.status || 'published',
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const grp of snapshot.groups) {
    const id = sanitizeId(grp.id, 'group');
    const path = `modeling_groups/${id}`;
    try {
      await setDoc(
        doc(db, 'modeling_groups', id),
        stripUndefined({
          id,
          ownerId: uid,
          name: clampStr(grp.groupName, 240, 'Modeling Collective'),
          role: clampStr(grp.position || '', 200),
          experience: clampStr(grp.experience || '', 2000),
          description: clampStr(grp.groupDescription || '', 4000),
          coverImage: safeImageUrl(grp.logo),
          galleryImages: (grp.groupPhotos || []).slice(0, 20).map(safeImageUrl).filter(Boolean),
          externalLink: grp.officialPageLink ? clampStr(grp.officialPageLink, 1000) : undefined,
          status: grp.status || 'published',
          createdAt: grp.createdAt || now,
          updatedAt: grp.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const ev of snapshot.events) {
    const id = sanitizeId(ev.id, 'event');
    const path = `events/${id}`;
    try {
      await setDoc(
        doc(db, 'events', id),
        stripUndefined({
          id,
          ownerId: uid,
          title: clampStr(ev.title, 240, 'Event'),
          role: clampStr(ev.role || '', 200),
          date: clampStr(ev.date || '', 120),
          location: clampStr(ev.location || '', 300),
          description: clampStr(ev.description || '', 4000),
          coverImage: safeImageUrl(ev.coverImage),
          coverImageSettings: ev.coverImageSettings || undefined,
          images: (ev.images || []).slice(0, 40).map(safeImageUrl).filter(Boolean),
          galleryItems: (ev.galleryItems || []).slice(0, 40),
          status: ev.status || 'published',
          createdAt: ev.createdAt || now,
          updatedAt: ev.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const aw of snapshot.awards) {
    const id = sanitizeId(aw.id, 'award');
    const path = `awards/${id}`;
    try {
      await setDoc(
        doc(db, 'awards', id),
        stripUndefined({
          id,
          ownerId: uid,
          name: clampStr(aw.name, 300, 'Honor'),
          organization: clampStr(aw.organization || '', 300),
          date: clampStr(aw.date || '', 120),
          description: clampStr(aw.description || '', 4000),
          trophyImage: safeImageUrl(aw.trophyImage),
          trophyImageSettings: aw.trophyImageSettings || undefined,
          certificateImage: safeImageUrl(aw.certificateImage),
          certificateImageSettings: aw.certificateImageSettings || undefined,
          galleryItems: (aw.galleryItems || []).slice(0, 20),
          status: aw.status || 'published',
          createdAt: aw.createdAt || now,
          updatedAt: aw.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const crs of snapshot.courses) {
    const id = sanitizeId(crs.id, 'course');
    const path = `courses/${id}`;
    try {
      await setDoc(
        doc(db, 'courses', id),
        stripUndefined({
          id,
          ownerId: uid,
          title: clampStr(crs.title, 240, 'Modeling Course'),
          tier: clampStr(crs.tier || '', 120),
          description: clampStr(crs.description || '', 4000),
          duration: clampStr(crs.duration || '', 160),
          schedule: clampStr(crs.schedule || '', 240),
          location: clampStr(crs.location || '', 300),
          fee: clampStr(crs.fee || '', 120),
          feeBdt: typeof crs.feeAmount === 'number' ? crs.feeAmount : undefined,
          bdtConfirmed: typeof crs.bdtConfirmed === 'boolean' ? crs.bdtConfirmed : undefined,
          coverImage: safeImageUrl(crs.coverImage),
          coverImageSettings: crs.coverImageSettings || undefined,
          curriculum: (crs.syllabus || []).slice(0, 30).map((c: string) => clampStr(c, 300)),
          maxStudents: typeof crs.capacity === 'number' ? crs.capacity : 20,
          enrolledCount: typeof crs.enrolledCount === 'number' ? crs.enrolledCount : 0,
          status: crs.status || 'published',
          createdAt: crs.createdAt || now,
          updatedAt: crs.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const pkg of snapshot.packages) {
    const id = sanitizeId(pkg.id, 'pkg');
    const path = `service_packages/${id}`;
    const deliverableList = String(pkg.deliverables || '')
      .split(/[\n,]+/)
      .map((d) => clampStr(d.trim(), 300))
      .filter(Boolean)
      .slice(0, 20);
    try {
      await setDoc(
        doc(db, 'service_packages', id),
        stripUndefined({
          id,
          ownerId: uid,
          name: clampStr(pkg.name, 200, 'Package'),
          category: clampStr(pkg.category || '', 120),
          priceBdt: typeof pkg.priceBdt === 'number' ? pkg.priceBdt : undefined,
          bdtConfirmed: typeof pkg.bdtConfirmed === 'boolean' ? pkg.bdtConfirmed : undefined,
          description: clampStr(pkg.description || '', 2000),
          deliverables: deliverableList,
          status: pkg.status || 'published',
          createdAt: pkg.createdAt || now,
          updatedAt: pkg.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const frame of snapshot.frames) {
    const id = sanitizeId(frame.slot, 'frame');
    const path = `image_frames/${id}`;
    try {
      await setDoc(
        doc(db, 'image_frames', id),
        stripUndefined({
          id,
          ownerId: uid,
          slot: clampStr(frame.slot, 80, 'hero_bg'),
          label: clampStr(frame.label || '', 160),
          imageUrl: safeImageUrl(frame.imageSettings?.editedUrl || frame.imageSettings?.originalUrl),
          originalUrl: safeImageUrl(frame.imageSettings?.originalUrl) || undefined,
          cropMetadata: frame.imageSettings || undefined,
          status: frame.status || 'published',
          updatedAt: frame.imageSettings?.updatedAt || now,
        })
      );
      syncedCount++;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Site Config ('main')
  const configPath = 'site_config/main';
  try {
    await setDoc(
      doc(db, 'site_config', 'main'),
      stripUndefined({
        id: 'main',
        ownerId: uid,
        socialLinks: snapshot.socialLinks || {},
        websiteSettings: snapshot.websiteSettings || {},
        currencySettings: snapshot.currencySettings || {},
        updatedAt: now,
      })
    );
    syncedCount++;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, configPath);
  }

  return { syncedCount, syncedAt: now };
}

export async function fetchFirestoreStatusSummary(): Promise<{
  siteConfigUpdatedAt: string | null;
  projectsCount: number;
  coursesCount: number;
}> {
  let siteConfigUpdatedAt: string | null = null;
  try {
    const snap = await getDoc(doc(db, 'site_config', 'main'));
    if (snap.exists()) {
      siteConfigUpdatedAt = (snap.data() as any)?.updatedAt || null;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'site_config/main');
  }

  let projectsCount = 0;
  try {
    const snap = await getDocs(collection(db, 'portfolio_projects'));
    projectsCount = snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'portfolio_projects');
  }

  let coursesCount = 0;
  try {
    const snap = await getDocs(collection(db, 'courses'));
    coursesCount = snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'courses');
  }

  return { siteConfigUpdatedAt, projectsCount, coursesCount };
}
