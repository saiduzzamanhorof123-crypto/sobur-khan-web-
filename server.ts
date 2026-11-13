import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, DatabaseSchema, getDefaultSeedSnapshot } from './src/server/db';
import { verifyPassword, hashPassword, generateToken, verifyToken } from './src/utils/security';
import { filterOnlyPublished, isPubliclyVisible } from './src/utils/filterPublished';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Support large payload for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src', 'assets', 'images')));

/* ==========================================================================
   AUTHENTICATION MIDDLEWARE
   ========================================================================== */
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied: Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  req.user = verified;
  next();
}

/* ==========================================================================
   PUBLIC ENDPOINTS (STRICTLY READ-ONLY FOR PUBLISHED CONTENT + SUBMISSIONS)
   ========================================================================== */

// Public profile
app.get('/api/public/profile', (_req, res) => {
  const data = db.get();
  const profile = data.profiles.find((p) => p.status === 'published') || data.profiles[0];
  res.json({ profile });
});

// Public portfolio projects (strictly published)
app.get('/api/public/projects', (_req, res) => {
  const data = db.get();
  const publishedProjects = filterOnlyPublished(data.portfolio_projects);
  res.json({ projects: publishedProjects });
});

// Public media & gallery (strictly published)
app.get('/api/public/media', (_req, res) => {
  const data = db.get();
  const publishedMedia = filterOnlyPublished(data.media_library);
  res.json({ media: publishedMedia });
});

app.get('/api/public/gallery', (req, res) => {
  const data = db.get();
  let items = filterOnlyPublished(data.media_library);

  const { category, featured, search } = req.query;
  if (category && typeof category === 'string' && category !== 'All') {
    if (category === 'Featured Gallery') {
      items = items.filter((m) => m.featured || m.category === 'Featured Gallery');
    } else {
      items = items.filter((m) => m.category === category);
    }
  }

  if (featured === 'true') {
    items = items.filter((m) => m.featured);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        m.category.toLowerCase().includes(q)
    );
  }

  // Sort by order or createdAt descending
  items.sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ gallery: items });
});

// Public modeling groups
app.get('/api/public/modeling-groups', (_req, res) => {
  const data = db.get();
  const publishedGroups = filterOnlyPublished(data.modeling_groups);
  res.json({ groups: publishedGroups });
});

// Public events
app.get('/api/public/events', (_req, res) => {
  const data = db.get();
  const publishedEvents = filterOnlyPublished(data.events);
  res.json({ events: publishedEvents });
});

// Public awards
app.get('/api/public/awards', (_req, res) => {
  const data = db.get();
  const publishedAwards = filterOnlyPublished(data.awards);
  res.json({ awards: publishedAwards });
});

// Public social links
app.get('/api/public/social-links', (_req, res) => {
  const data = db.get();
  res.json({ socialLinks: data.social_links });
});

// Public courses
app.get('/api/public/courses', (_req, res) => {
  const data = db.get();
  const publishedCourses = filterOnlyPublished(data.courses);
  res.json({ courses: publishedCourses });
});

// Public website settings
app.get('/api/public/settings', (_req, res) => {
  const data = db.get();
  res.json({ settings: data.website_settings });
});

// Public currency settings & published service packages
app.get('/api/public/pricing', (_req, res) => {
  const data = db.get();
  const publishedPackages = filterOnlyPublished(data.service_packages || []);
  res.json({
    currencySettings: data.currency_settings,
    packages: publishedPackages,
  });
});

// Public published image frame settings
app.get('/api/public/image-frames', (_req, res) => {
  const data = db.get();
  const publishedFrames = filterOnlyPublished(data.image_frames || []);
  res.json({ frames: publishedFrames });
});

// Public visitor contact form submission
app.post('/api/public/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const newMessage = {
    id: 'msg-' + Date.now(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : undefined,
    subject: subject ? String(subject).trim() : 'General Inquiry',
    message: String(message).trim(),
    status: 'unread' as const,
    submittedAt: new Date().toISOString(),
  };

  db.update((d) => {
    d.contact_messages.unshift(newMessage);
  });

  res.json({ success: true, message: 'Message sent successfully. We will get back to you soon.' });
});

// Public visitor course registration
app.post('/api/public/register', (req, res) => {
  const { courseId, courseTitle, fullName, email, phone, age, height, previousExperience, message } = req.body;
  if (!fullName || !email || !phone || !courseId) {
    return res.status(400).json({ error: 'Full name, email, phone, and course selection are required.' });
  }

  let createdReg: any = null;
  db.update((d) => {
    const course = d.courses.find((c) => c.id === courseId);
    const feeAmountBdt =
      course && course.bdtConfirmed && typeof course.feeAmount === 'number' ? course.feeAmount : null;

    createdReg = {
      id: 'reg-' + Date.now(),
      courseId: String(courseId),
      courseTitle: courseTitle ? String(courseTitle) : course?.title || 'Modeling Course',
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      age: age ? Number(age) : '',
      height: height ? String(height).trim() : '',
      previousExperience: previousExperience ? String(previousExperience).trim() : 'None',
      message: message ? String(message).trim() : '',
      receiptNumber: `REC-SAK-${Date.now().toString().slice(-6)}`,
      feeAmountBdt,
      paymentStatus: 'pending' as const,
      currency: 'BDT' as const,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    };

    d.student_registrations.unshift(createdReg);
    if (course) {
      course.enrolledCount = (course.enrolledCount || 0) + 1;
    }
  });

  res.json({
    success: true,
    registration: createdReg,
    message: 'Registration submitted successfully. The team will contact you with batch details.',
  });
});

// Public brand collaboration submission
app.post('/api/public/collaborate', (req, res) => {
  const { companyName, contactPerson, email, phone, collaborationType, budgetRange, details, timeline } = req.body;
  if (!companyName || !contactPerson || !email || !details) {
    return res.status(400).json({ error: 'Company name, contact person, email, and proposal details are required.' });
  }

  const newInquiry = {
    id: 'collab-' + Date.now(),
    companyName: String(companyName).trim(),
    contactPerson: String(contactPerson).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : '',
    collaborationType: collaborationType || 'Brand Promotion',
    budgetRange: budgetRange || 'Negotiable (BDT)',
    quotedAmountBdt: null,
    currency: 'BDT' as const,
    invoiceNumber: `INV-SAK-${Date.now().toString().slice(-6)}`,
    details: String(details).trim(),
    timeline: timeline ? String(timeline).trim() : 'Flexible',
    status: 'new' as const,
    submittedAt: new Date().toISOString(),
  };

  db.update((d) => {
    d.collaboration_inquiries.unshift(newInquiry);
  });

  res.json({ success: true, message: 'Collaboration proposal received. Sobur Ali Khan’s management team will review your inquiry.' });
});

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const data = db.get();
  const user = data.admin_users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    return res.status(401).json({ error: 'Invalid owner credentials. Access restricted.' });
  }

  // Update last login
  db.update((d) => {
    const u = d.admin_users.find((usr) => usr.id === user.id);
    if (u) u.lastLoginAt = new Date().toISOString();
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

app.post('/api/auth/firebase-session', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'Firebase ID token is required.' });
  }

  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) {
      return res.status(503).json({ error: 'Firebase is not configured on the server.' });
    }
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!lookupRes.ok) {
      return res.status(401).json({ error: 'Unable to verify Firebase Google token.' });
    }
    const lookupJson: any = await lookupRes.json();
    const fbUser = lookupJson?.users?.[0];
    const email = String(fbUser?.email || '').toLowerCase();
    const emailVerified = Boolean(fbUser?.emailVerified);

    if (!email || !emailVerified) {
      return res.status(403).json({ error: 'Verified Google email is required for owner access.' });
    }

    const data = db.get();
    const allowedEmails = new Set([
      'gpthorof@gmail.com',
      ...data.admin_users.map((u) => u.email.toLowerCase()),
    ]);
    if (!allowedEmails.has(email)) {
      return res.status(403).json({ error: 'Access denied: This Google account is not an authorized owner.' });
    }

    const matched = data.admin_users.find((u) => u.email.toLowerCase() === email);
    const sessionUser = {
      id: matched?.id || String(fbUser.localId || 'owner-firebase'),
      email,
      role: 'owner' as const,
    };
    const token = generateToken(sessionUser);
    res.json({ token, user: sessionUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to establish Firebase owner session.' });
  }
});

app.get('/api/auth/me', requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const data = db.get();
  const user = data.admin_users.find((u) => u.id === req.user?.id);
  if (!user || !verifyPassword(currentPassword, user.salt, user.hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const { salt, hash } = hashPassword(newPassword);
  db.update((d) => {
    const u = d.admin_users.find((usr) => usr.id === user.id);
    if (u) {
      u.salt = salt;
      u.hash = hash;
    }
  });

  res.json({ success: true, message: 'Password updated securely.' });
});

/* ==========================================================================
   ADMIN MANAGEMENT ENDPOINTS (PROTECTED BY REQUIREADMIN)
   ========================================================================== */

// Dashboard Overview metrics
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const data = db.get();

  const totalPublishedPhotos = data.media_library.filter((m) => m.status === 'published').length;
  const totalProjects = data.portfolio_projects.length;
  const totalPublishedProjects = data.portfolio_projects.filter((p) => p.status === 'published').length;
  const totalEvents = data.events.length;
  const totalAwards = data.awards.length;
  const activeCourses = data.courses.filter((c) => c.status === 'published').length;
  const newRegistrations = data.student_registrations.filter((r) => r.status === 'pending').length;
  const newCollaborations = data.collaboration_inquiries.filter((c) => c.status === 'new').length;
  const unreadMessages = data.contact_messages.filter((m) => m.status === 'unread').length;

  const unpublishedCount =
    data.portfolio_projects.filter((p) => p.status !== 'published').length +
    data.events.filter((e) => e.status !== 'published').length +
    data.awards.filter((a) => a.status !== 'published').length +
    data.courses.filter((c) => c.status !== 'published').length +
    data.media_library.filter((m) => m.status !== 'published').length;

  const unconfirmedBdtCount =
    data.courses.filter((c) => !c.bdtConfirmed || c.feeAmount === null).length +
    (data.service_packages || []).filter((p) => !p.bdtConfirmed || p.priceBdt === null).length;

  let confirmedRevenueBdt = 0;
  let pendingRevenueBdt = 0;
  for (const reg of data.student_registrations) {
    const course = data.courses.find((c) => c.id === reg.courseId);
    const fee =
      typeof reg.feeAmountBdt === 'number'
        ? reg.feeAmountBdt
        : course?.bdtConfirmed && typeof course.feeAmount === 'number'
        ? course.feeAmount
        : null;
    if (fee !== null) {
      if (reg.paymentStatus === 'paid' || reg.status === 'approved') {
        confirmedRevenueBdt += fee;
      } else if (reg.status === 'pending' || reg.status === 'contacted') {
        pendingRevenueBdt += fee;
      }
    }
  }

  const collaborationPipelineBdt = data.collaboration_inquiries.reduce(
    (sum, col) => sum + (typeof col.quotedAmountBdt === 'number' ? col.quotedAmountBdt : 0),
    0
  );

  res.json({
    metrics: {
      totalPublishedPhotos,
      totalProjects,
      totalPublishedProjects,
      totalEvents,
      totalAwards,
      activeCourses,
      newRegistrations,
      newCollaborations,
      unreadMessages,
      unpublishedCount,
      confirmedRevenueBdt,
      pendingRevenueBdt,
      collaborationPipelineBdt,
      unconfirmedBdtCount,
    },
    recentRegistrations: data.student_registrations.slice(0, 5),
    recentCollaborations: data.collaboration_inquiries.slice(0, 5),
    recentMessages: data.contact_messages.slice(0, 5),
  });
});

// Profile Management
app.get('/api/admin/profile', requireAdmin, (_req, res) => {
  const data = db.get();
  res.json({ profile: data.profiles[0] });
});

app.put('/api/admin/profile', requireAdmin, (req, res) => {
  const updatedProfile = req.body;
  db.update((d) => {
    d.profiles[0] = {
      ...d.profiles[0],
      ...updatedProfile,
      updatedAt: new Date().toISOString(),
    };
  });
  res.json({ success: true, profile: db.get().profiles[0] });
});

// Portfolio Projects Management
app.get('/api/admin/projects', requireAdmin, (_req, res) => {
  res.json({ projects: db.get().portfolio_projects });
});

app.post('/api/admin/projects', requireAdmin, (req, res) => {
  const project = req.body;
  const newProject = {
    ...project,
    id: 'proj-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: project.status === 'published' ? new Date().toISOString() : undefined,
  };
  db.update((d) => {
    d.portfolio_projects.unshift(newProject);
  });
  res.json({ success: true, project: newProject });
});

app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updatedItem = null;

  db.update((d) => {
    const idx = d.portfolio_projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const existing = d.portfolio_projects[idx];
      if (updates.coverImage === '' && isDefaultAssetUrl(existing.coverImage)) {
        recordRemovedDefaultUrl(d, existing.coverImage);
      }
      const nextGalleryItems = Array.isArray(updates.galleryItems)
        ? updates.galleryItems
        : existing.galleryItems;
      const syncedGalleryImages = Array.isArray(updates.galleryItems)
        ? updates.galleryItems.map((gi: any) => gi.url).filter(Boolean)
        : updates.galleryImages !== undefined
        ? updates.galleryImages
        : existing.galleryImages;

      d.portfolio_projects[idx] = {
        ...existing,
        ...updates,
        galleryItems: nextGalleryItems,
        galleryImages: syncedGalleryImages,
        updatedAt: new Date().toISOString(),
        publishedAt:
          updates.status === 'published'
            ? existing.publishedAt || new Date().toISOString()
            : existing.publishedAt,
      };
      updatedItem = d.portfolio_projects[idx];
    }
  });

  if (!updatedItem) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true, project: updatedItem });
});

app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    const target = d.portfolio_projects.find((p) => p.id === id);
    if (target && isDefaultAssetUrl(target.coverImage)) {
      recordRemovedDefaultUrl(d, target.coverImage);
    }
    d.portfolio_projects = d.portfolio_projects.filter((p) => p.id !== id);
  });
  res.json({ success: true, message: 'Project deleted' });
});

function isDefaultAssetUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('/src/assets/images/');
}

function recordRemovedDefaultUrl(d: DatabaseSchema, url?: string | null): void {
  if (!url || !isDefaultAssetUrl(url)) return;
  if (!Array.isArray(d.removed_default_urls)) {
    d.removed_default_urls = [];
  }
  if (!d.removed_default_urls.includes(url)) {
    d.removed_default_urls.push(url);
  }
}

export interface ImageUsageRef {
  section: string;
  id: string;
  title: string;
  field: string;
}

function collectImageUsage(url: string, d: DatabaseSchema): ImageUsageRef[] {
  if (!url) return [];
  const usages: ImageUsageRef[] = [];

  d.profiles.forEach((p) => {
    if (p.heroImage === url) usages.push({ section: 'profile', id: p.id, title: p.name, field: 'heroImage' });
    if (p.profileImage === url) usages.push({ section: 'profile', id: p.id, title: p.name, field: 'profileImage' });
    if (p.aboutBgImage === url) usages.push({ section: 'profile', id: p.id, title: p.name, field: 'aboutBgImage' });
  });

  d.portfolio_projects.forEach((proj) => {
    if (proj.coverImage === url) usages.push({ section: 'portfolio', id: proj.id, title: proj.title, field: 'coverImage' });
    else if (proj.galleryImages?.includes(url) || proj.galleryItems?.some((gi) => gi.url === url)) {
      usages.push({ section: 'portfolio', id: proj.id, title: proj.title, field: 'gallery' });
    }
  });

  d.modeling_groups.forEach((g) => {
    if (g.logo === url || g.groupPhotos?.includes(url)) {
      usages.push({ section: 'groups', id: g.id, title: g.groupName, field: 'groupPhoto' });
    }
  });

  d.events.forEach((ev) => {
    if (ev.coverImage === url) usages.push({ section: 'events', id: ev.id, title: ev.title, field: 'coverImage' });
    else if (ev.images?.includes(url) || ev.galleryItems?.some((gi) => gi.url === url)) {
      usages.push({ section: 'events', id: ev.id, title: ev.title, field: 'gallery' });
    }
  });

  d.awards.forEach((aw) => {
    if (aw.trophyImage === url) usages.push({ section: 'awards', id: aw.id, title: aw.name, field: 'trophyImage' });
    if (aw.certificateImage === url) usages.push({ section: 'awards', id: aw.id, title: aw.name, field: 'certificateImage' });
    if (aw.galleryItems?.some((gi) => gi.url === url)) {
      usages.push({ section: 'awards', id: aw.id, title: aw.name, field: 'gallery' });
    }
  });

  d.courses.forEach((crs) => {
    if (crs.coverImage === url) usages.push({ section: 'courses', id: crs.id, title: crs.title, field: 'coverImage' });
  });

  (d.image_frames || []).forEach((fr) => {
    if (fr.imageSettings?.editedUrl === url || fr.imageSettings?.originalUrl === url) {
      usages.push({ section: 'frames', id: fr.slot, title: fr.label, field: fr.slot });
    }
  });

  return usages;
}

// Helper function to write base64 image data to persistent disk
function writeImageToDisk(dataUrl: string, fileName?: string): { url: string; fileSize: string } {
  if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/src/assets/'))) {
    return { url: dataUrl, fileSize: 'Asset' };
  }

  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('/uploads/')) {
      return { url: dataUrl, fileSize: 'Local' };
    }
    throw new Error('Invalid image format: must be valid base64 or file URL');
  }

  const rawExt = matches[1].split('/')[1] || 'jpg';
  const cleanExt = rawExt === 'jpeg' ? 'jpg' : rawExt.split('+')[0];
  const buffer = Buffer.from(matches[2], 'base64');
  const sizeBytes = buffer.length;
  const fileSize =
    sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(sizeBytes / 1024)} KB`;

  const cleanName = (fileName || 'gallery_photo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const diskFileName = `${cleanName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${cleanExt}`;
  const filePath = path.join(UPLOADS_DIR, diskFileName);

  fs.writeFileSync(filePath, buffer);
  return { url: `/uploads/${diskFileName}`, fileSize };
}

// Media Library Management
app.get('/api/admin/media', requireAdmin, (req, res) => {
  let media = [...db.get().media_library];
  const { category, search, status } = req.query;

  if (category && typeof category === 'string' && category !== 'All') {
    if (category === 'Featured Gallery') {
      media = media.filter((m) => m.featured || m.category === 'Featured Gallery');
    } else {
      media = media.filter((m) => m.category === category);
    }
  }

  if (status && typeof status === 'string' && status !== 'All') {
    media = media.filter((m) => m.status === status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    media = media.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        m.category.toLowerCase().includes(q)
    );
  }

  media.sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ media });
});

app.post('/api/admin/media', requireAdmin, (req, res) => {
  const item = req.body;
  const newItem = {
    ...item,
    id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
    featured: !!item.featured,
    status: item.status || 'published',
    createdAt: new Date().toISOString(),
  };
  db.update((d) => {
    d.media_library.unshift(newItem);
  });
  res.json({ success: true, media: newItem });
});

app.put('/api/admin/media/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated = null;
  db.update((d) => {
    const idx = d.media_library.findIndex((m) => m.id === id);
    if (idx !== -1) {
      d.media_library[idx] = {
        ...d.media_library[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updated = d.media_library[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Media not found' });
  res.json({ success: true, media: updated });
});

// Replace an existing photo with a newly uploaded file
app.put('/api/admin/media/:id/replace', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { dataUrl, fileName } = req.body;
  if (!dataUrl) return res.status(400).json({ error: 'No replacement image data provided' });

  try {
    const data = db.get();
    const existing = data.media_library.find((m) => m.id === id);
    if (!existing) return res.status(404).json({ error: 'Media item not found' });

    // Clean up old file if stored on disk
    if (existing.url && existing.url.startsWith('/uploads/')) {
      const oldDiskPath = path.join(process.cwd(), 'public', existing.url);
      if (fs.existsSync(oldDiskPath)) {
        try {
          fs.unlinkSync(oldDiskPath);
        } catch (e) {
          console.warn('Could not remove old file:', e);
        }
      }
    }

    const { url, fileSize } = writeImageToDisk(dataUrl, fileName);

    let updated = null;
    db.update((d) => {
      const idx = d.media_library.findIndex((m) => m.id === id);
      if (idx !== -1) {
        d.media_library[idx] = {
          ...d.media_library[idx],
          url,
          fileSize,
          updatedAt: new Date().toISOString(),
        };
        updated = d.media_library[idx];
      }
    });

    res.json({ success: true, media: updated });
  } catch (err: any) {
    console.error('Failed to replace image:', err);
    res.status(500).json({ error: err.message || 'Failed to replace image' });
  }
});

// Reorder media items
app.put('/api/admin/media-reorder', requireAdmin, (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });

  db.update((d) => {
    orderedIds.forEach((id, index) => {
      const item = d.media_library.find((m) => m.id === id);
      if (item) {
        item.order = index;
      }
    });
  });

  res.json({ success: true });
});

// Check where an image URL is currently used across all sections
app.get('/api/admin/image-usage', requireAdmin, (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  const usages = collectImageUsage(url, db.get());
  res.json({ url, usages });
});

// Delete photo with cross-section reference check & disk cleanup only when unused
app.delete('/api/admin/media/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true';
  const data = db.get();
  const item = data.media_library.find((m) => m.id === id);
  if (!item) return res.status(404).json({ error: 'Media item not found' });

  const usages = collectImageUsage(item.url, data);
  if (!force && usages.length > 0) {
    return res.status(409).json({
      error: `This image is currently used in ${usages.length} other website section(s).`,
      usages,
    });
  }

  db.update((d) => {
    if (item.isDefault || isDefaultAssetUrl(item.url)) {
      recordRemovedDefaultUrl(d, item.url);
    }
    d.media_library = d.media_library.filter((m) => m.id !== id);
  });

  const remainingRefs = collectImageUsage(item.url, db.get());
  const inLibraryElsewhere = db.get().media_library.some((m) => m.url === item.url);
  if (item.url && item.url.startsWith('/uploads/') && remainingRefs.length === 0 && !inLibraryElsewhere) {
    const diskPath = path.join(process.cwd(), 'public', item.url);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn('Failed to remove disk file:', e);
      }
    }
  }

  res.json({ success: true, message: 'Photo deleted permanently from storage and database.' });
});

// Bulk delete media items with cross-section safety check
app.post('/api/admin/media/bulk-delete', requireAdmin, (req, res) => {
  const { ids, force } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' });
  }

  const data = db.get();
  const targets = data.media_library.filter((m) => ids.includes(m.id));
  const conflicts: Array<{ id: string; title: string; url: string; usages: ImageUsageRef[] }> = [];

  targets.forEach((item) => {
    const usages = collectImageUsage(item.url, data);
    if (usages.length > 0) {
      conflicts.push({ id: item.id, title: item.title, url: item.url, usages });
    }
  });

  if (!force && conflicts.length > 0) {
    return res.status(409).json({
      error: `${conflicts.length} selected photo(s) are used in other sections.`,
      conflicts,
    });
  }

  db.update((d) => {
    targets.forEach((item) => {
      if (item.isDefault || isDefaultAssetUrl(item.url)) {
        recordRemovedDefaultUrl(d, item.url);
      }
    });
    d.media_library = d.media_library.filter((m) => !ids.includes(m.id));
  });

  targets.forEach((item) => {
    const remainingRefs = collectImageUsage(item.url, db.get());
    const inLib = db.get().media_library.some((m) => m.url === item.url);
    if (item.url?.startsWith('/uploads/') && remainingRefs.length === 0 && !inLib) {
      const diskPath = path.join(process.cwd(), 'public', item.url);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn('Failed to remove bulk disk file:', e);
        }
      }
    }
  });

  res.json({
    success: true,
    deletedCount: targets.length,
    message: `Removed ${targets.length} selected image(s).`,
  });
});

// Explicitly save an edited image for any section item (courses, portfolio, events, awards)
app.post('/api/admin/section-image/save', requireAdmin, (req, res) => {
  const {
    editedDataUrl,
    originalDataUrl,
    existingUrl,
    existingOriginalUrl,
    fileName,
    title,
    sectionName,
    category,
    cropMetadata,
    status,
    addToGallery,
  } = req.body;

  try {
    let originalUrl = existingOriginalUrl || existingUrl || '';
    if (originalDataUrl && typeof originalDataUrl === 'string' && originalDataUrl.startsWith('data:')) {
      originalUrl = writeImageToDisk(originalDataUrl, `orig_${sectionName || 'sec'}_${fileName || 'photo'}`).url;
    }

    let editedUrl = existingUrl || originalUrl;
    let fileSize = 'Saved';
    if (editedDataUrl && typeof editedDataUrl === 'string' && editedDataUrl.startsWith('data:')) {
      const saved = writeImageToDisk(editedDataUrl, `edited_${sectionName || 'sec'}_${fileName || 'photo'}`);
      editedUrl = saved.url;
      fileSize = saved.fileSize;
    }

    if (!originalUrl) originalUrl = editedUrl;

    const mergedMeta = {
      ...(cropMetadata || {}),
      originalUrl,
      editedUrl,
      sectionName: sectionName || cropMetadata?.sectionName || 'General',
      category: category || cropMetadata?.category || 'General',
      status: status || cropMetadata?.status || 'published',
      isDefault: isDefaultAssetUrl(originalUrl) || isDefaultAssetUrl(editedUrl),
      updatedAt: new Date().toISOString(),
    };

    if (addToGallery && editedUrl) {
      const mediaRecord = {
        id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        title: title || fileName || `${sectionName || 'Section'} Photo`,
        url: editedUrl,
        originalUrl,
        cropMetadata: mergedMeta,
        category: (category || 'General') as any,
        description: `Uploaded via ${sectionName || 'Section'} Image Manager`,
        isDefault: false,
        fileSize,
        featured: false,
        status: (status || 'published') as any,
        createdAt: new Date().toISOString(),
      };
      db.update((d) => {
        d.media_library.unshift(mediaRecord);
      });
    }

    res.json({
      success: true,
      url: editedUrl,
      originalUrl,
      cropMetadata: mergedMeta,
    });
  } catch (err: any) {
    console.error('Failed to save section image:', err);
    res.status(500).json({ error: err.message || 'Failed to save section image' });
  }
});

// Explicitly restore default images ONLY when requested by owner
app.post('/api/admin/defaults/restore', requireAdmin, (req, res) => {
  const { section } = req.body;
  const seed = getDefaultSeedSnapshot();
  const targetSection = section || 'all';

  db.update((d) => {
    if (!Array.isArray(d.removed_default_urls)) d.removed_default_urls = [];

    if (targetSection === 'courses' || targetSection === 'all') {
      seed.courses.forEach((sc) => {
        const existing = d.courses.find((c) => c.id === sc.id);
        if (existing) {
          existing.coverImage = sc.coverImage;
          existing.coverImageSettings = undefined;
        } else {
          d.courses.push(sc);
        }
        d.removed_default_urls = d.removed_default_urls.filter((u) => u !== sc.coverImage);
      });
    }

    if (targetSection === 'portfolio' || targetSection === 'all') {
      seed.portfolio_projects.forEach((sp) => {
        const existing = d.portfolio_projects.find((p) => p.id === sp.id);
        if (existing) {
          existing.coverImage = sp.coverImage;
          existing.galleryImages = [...sp.galleryImages];
          existing.coverImageSettings = undefined;
          existing.galleryItems = undefined;
        } else {
          d.portfolio_projects.push(sp);
        }
        d.removed_default_urls = d.removed_default_urls.filter((u) => u !== sp.coverImage);
      });
    }

    if (targetSection === 'events' || targetSection === 'all') {
      seed.events.forEach((se) => {
        const existing = d.events.find((e) => e.id === se.id);
        if (existing) {
          existing.coverImage = se.coverImage;
          existing.images = [...se.images];
          existing.coverImageSettings = undefined;
          existing.galleryItems = undefined;
        } else {
          d.events.push(se);
        }
        d.removed_default_urls = d.removed_default_urls.filter((u) => u !== se.coverImage);
      });
    }

    if (targetSection === 'awards' || targetSection === 'all') {
      seed.awards.forEach((sa) => {
        const existing = d.awards.find((a) => a.id === sa.id);
        if (existing) {
          existing.trophyImage = sa.trophyImage;
          existing.certificateImage = sa.certificateImage;
          existing.trophyImageSettings = undefined;
          existing.certificateImageSettings = undefined;
          existing.galleryItems = undefined;
        } else {
          d.awards.push(sa);
        }
        d.removed_default_urls = d.removed_default_urls.filter(
          (u) => u !== sa.trophyImage && u !== sa.certificateImage
        );
      });
    }

    if (targetSection === 'all') {
      seed.media_library.forEach((sm) => {
        if (!d.media_library.some((m) => m.id === sm.id || m.url === sm.url)) {
          d.media_library.push(sm);
        }
      });
      d.removed_default_urls = [];
    }
  });

  res.json({ success: true, message: `Restored default images for ${targetSection}.` });
});

// Single image upload (optionally preserves originalUrl & cropMetadata)
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const { dataUrl, originalDataUrl, fileName, title, category, description, status, featured, cropMetadata } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const { url, fileSize } = writeImageToDisk(dataUrl, fileName);
    let originalUrl = url;
    if (originalDataUrl && originalDataUrl !== dataUrl) {
      const origSaved = writeImageToDisk(originalDataUrl, `orig_${fileName || 'photo'}`);
      originalUrl = origSaved.url;
    }

    const mediaRecord = {
      id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      title: title || (fileName ? fileName.split('.')[0] : 'Gallery Photo'),
      url,
      originalUrl,
      cropMetadata: cropMetadata
        ? {
            ...cropMetadata,
            originalUrl,
            editedUrl: url,
            updatedAt: new Date().toISOString(),
          }
        : undefined,
      category: category || 'Photoshoot',
      description: description || '',
      fileSize,
      featured: !!featured,
      status: (status as any) || 'published',
      createdAt: new Date().toISOString(),
    };

    db.update((d) => {
      d.media_library.unshift(mediaRecord);
    });

    res.json({ success: true, url, originalUrl, media: mediaRecord });
  } catch (err: any) {
    console.error('Failed to save uploaded image:', err);
    res.status(500).json({ error: err.message || 'Failed to process image upload' });
  }
});

// Crop / Edit an existing MediaItem while preserving originalUrl separately
app.post('/api/admin/media/:id/crop', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { editedDataUrl, fileName, cropMetadata, status } = req.body;
  if (!editedDataUrl) {
    return res.status(400).json({ error: 'No cropped image data provided' });
  }

  try {
    const existing = db.get().media_library.find((m) => m.id === id);
    if (!existing) return res.status(404).json({ error: 'Media item not found' });

    const originalUrl = existing.originalUrl || existing.url;
    const { url: editedUrl, fileSize } = writeImageToDisk(editedDataUrl, `edited_${fileName || existing.title}`);

    let updated: any = null;
    db.update((d) => {
      const idx = d.media_library.findIndex((m) => m.id === id);
      if (idx !== -1) {
        d.media_library[idx] = {
          ...d.media_library[idx],
          originalUrl,
          url: editedUrl,
          fileSize,
          status: status || d.media_library[idx].status,
          cropMetadata: {
            ...(cropMetadata || {}),
            originalUrl,
            editedUrl,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };
        updated = d.media_library[idx];
      }
    });

    res.json({ success: true, media: updated });
  } catch (err: any) {
    console.error('Failed to save cropped media image:', err);
    res.status(500).json({ error: err.message || 'Failed to save cropped image' });
  }
});

// Multiple images batch upload
app.post('/api/admin/upload-multiple', requireAdmin, (req, res) => {
  const { images } = req.body;
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'No images array provided' });
  }

  try {
    const createdItems: any[] = [];

    images.forEach((img: any, idx: number) => {
      if (!img.dataUrl) return;
      const { url, fileSize } = writeImageToDisk(img.dataUrl, img.fileName);
      let originalUrl = url;
      if (img.originalDataUrl && img.originalDataUrl !== img.dataUrl) {
        const origSaved = writeImageToDisk(img.originalDataUrl, `orig_${img.fileName || 'photo'}`);
        originalUrl = origSaved.url;
      }

      const mediaRecord = {
        id: 'media-' + (Date.now() + idx) + '-' + Math.random().toString(36).slice(2, 5),
        title: img.title || (img.fileName ? img.fileName.split('.')[0] : `Photo ${idx + 1}`),
        url,
        originalUrl,
        cropMetadata: img.cropMetadata
          ? {
              ...img.cropMetadata,
              originalUrl,
              editedUrl: url,
              updatedAt: new Date().toISOString(),
            }
          : undefined,
        category: img.category || 'Photoshoot',
        description: img.description || '',
        fileSize: img.fileSize || fileSize,
        featured: !!img.featured,
        status: (img.status as any) || 'published',
        createdAt: new Date().toISOString(),
      };
      createdItems.push(mediaRecord);
    });

    db.update((d) => {
      d.media_library.unshift(...createdItems);
    });

    res.json({
      success: true,
      count: createdItems.length,
      media: createdItems,
      message: `Successfully uploaded and saved ${createdItems.length} photos.`,
    });
  } catch (err: any) {
    console.error('Failed in batch upload:', err);
    res.status(500).json({ error: err.message || 'Failed to process batch upload' });
  }
});

// Independent Website Section Image Frame Management
app.get('/api/admin/image-frames', requireAdmin, (_req, res) => {
  res.json({ frames: db.get().image_frames || [] });
});

app.put('/api/admin/image-frames/:slot', requireAdmin, (req, res) => {
  const { slot } = req.params;
  const { editedDataUrl, originalDataUrl, imageSettings, status, fileName, applyToSection } = req.body;

  try {
    const frames = db.get().image_frames || [];
    const targetFrame = frames.find((f) => f.slot === slot);
    if (!targetFrame) return res.status(404).json({ error: 'Image frame slot not found' });

    let originalUrl = imageSettings?.originalUrl || targetFrame.imageSettings.originalUrl;
    if (originalDataUrl && originalDataUrl.startsWith('data:')) {
      originalUrl = writeImageToDisk(originalDataUrl, `orig_${slot}_${fileName || 'frame'}`).url;
    }

    let editedUrl = imageSettings?.editedUrl || targetFrame.imageSettings.editedUrl || originalUrl;
    if (editedDataUrl && editedDataUrl.startsWith('data:')) {
      editedUrl = writeImageToDisk(editedDataUrl, `edited_${slot}_${fileName || 'frame'}`).url;
    }

    const updatedSettings = {
      ...targetFrame.imageSettings,
      ...(imageSettings || {}),
      originalUrl,
      editedUrl,
      updatedAt: new Date().toISOString(),
    };

    const nextStatus = status || targetFrame.status;

    let updatedFrame: any = null;
    db.update((d) => {
      const idx = d.image_frames.findIndex((f) => f.slot === slot);
      if (idx !== -1) {
        d.image_frames[idx] = {
          ...d.image_frames[idx],
          status: nextStatus,
          imageSettings: updatedSettings,
        };
        updatedFrame = d.image_frames[idx];
      }

      // Propagate to the matching public website section when published
      if (nextStatus === 'published' && applyToSection !== false) {
        if (slot === 'hero_bg' && d.profiles[0]) {
          d.profiles[0].heroImage = editedUrl;
          d.profiles[0].updatedAt = new Date().toISOString();
        } else if (slot === 'profile_photo' && d.profiles[0]) {
          d.profiles[0].profileImage = editedUrl;
          d.profiles[0].updatedAt = new Date().toISOString();
        } else if (slot === 'about_me' && d.profiles[0]) {
          d.profiles[0].aboutBgImage = editedUrl;
          d.profiles[0].updatedAt = new Date().toISOString();
        } else if (slot === 'portfolio_gallery' && d.portfolio_projects[0]) {
          d.portfolio_projects[0].coverImage = editedUrl;
        } else if (slot === 'modeling_group' && d.modeling_groups[0]) {
          d.modeling_groups[0].logo = editedUrl;
        } else if (slot === 'event_gallery' && d.events[0]) {
          d.events[0].coverImage = editedUrl;
        } else if (slot === 'awards_achievements' && d.awards[0]) {
          d.awards[0].trophyImage = editedUrl;
        } else if (slot === 'course_cover' && d.courses[0]) {
          d.courses[0].coverImage = editedUrl;
        }
      }
    });

    res.json({ success: true, frame: updatedFrame });
  } catch (err: any) {
    console.error('Failed to update image frame:', err);
    res.status(500).json({ error: err.message || 'Failed to save frame settings' });
  }
});

// Modeling Groups Management
app.get('/api/admin/modeling-groups', requireAdmin, (_req, res) => {
  res.json({ groups: db.get().modeling_groups });
});

app.post('/api/admin/modeling-groups', requireAdmin, (req, res) => {
  const item = req.body;
  const newGroup = {
    ...item,
    id: 'group-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.update((d) => d.modeling_groups.unshift(newGroup));
  res.json({ success: true, group: newGroup });
});

app.put('/api/admin/modeling-groups/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated = null;
  db.update((d) => {
    const idx = d.modeling_groups.findIndex((g) => g.id === id);
    if (idx !== -1) {
      d.modeling_groups[idx] = { ...d.modeling_groups[idx], ...updates, updatedAt: new Date().toISOString() };
      updated = d.modeling_groups[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Group not found' });
  res.json({ success: true, group: updated });
});

app.delete('/api/admin/modeling-groups/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    d.modeling_groups = d.modeling_groups.filter((g) => g.id !== id);
  });
  res.json({ success: true, message: 'Group deleted' });
});

// Events Management
app.get('/api/admin/events', requireAdmin, (_req, res) => {
  res.json({ events: db.get().events });
});

app.post('/api/admin/events', requireAdmin, (req, res) => {
  const item = req.body;
  const newEvent = {
    ...item,
    id: 'event-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.update((d) => d.events.unshift(newEvent));
  res.json({ success: true, event: newEvent });
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated = null;
  db.update((d) => {
    const idx = d.events.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const existing = d.events[idx];
      if (updates.coverImage === '' && isDefaultAssetUrl(existing.coverImage)) {
        recordRemovedDefaultUrl(d, existing.coverImage);
      }
      const nextGalleryItems = Array.isArray(updates.galleryItems)
        ? updates.galleryItems
        : existing.galleryItems;
      const syncedImages = Array.isArray(updates.galleryItems)
        ? updates.galleryItems.map((gi: any) => gi.url).filter(Boolean)
        : updates.images !== undefined
        ? updates.images
        : existing.images;

      d.events[idx] = {
        ...existing,
        ...updates,
        galleryItems: nextGalleryItems,
        images: syncedImages,
        updatedAt: new Date().toISOString(),
      };
      updated = d.events[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true, event: updated });
});

app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    const target = d.events.find((e) => e.id === id);
    if (target && isDefaultAssetUrl(target.coverImage)) {
      recordRemovedDefaultUrl(d, target.coverImage);
    }
    d.events = d.events.filter((e) => e.id !== id);
  });
  res.json({ success: true, message: 'Event deleted' });
});

// Awards Management
app.get('/api/admin/awards', requireAdmin, (_req, res) => {
  res.json({ awards: db.get().awards });
});

app.post('/api/admin/awards', requireAdmin, (req, res) => {
  const item = req.body;
  const newAward = {
    ...item,
    id: 'award-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.update((d) => d.awards.unshift(newAward));
  res.json({ success: true, award: newAward });
});

app.put('/api/admin/awards/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated = null;
  db.update((d) => {
    const idx = d.awards.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const existing = d.awards[idx];
      if (updates.trophyImage === '' && isDefaultAssetUrl(existing.trophyImage)) {
        recordRemovedDefaultUrl(d, existing.trophyImage);
      }
      if (updates.certificateImage === '' && isDefaultAssetUrl(existing.certificateImage)) {
        recordRemovedDefaultUrl(d, existing.certificateImage);
      }
      d.awards[idx] = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      updated = d.awards[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Award not found' });
  res.json({ success: true, award: updated });
});

app.delete('/api/admin/awards/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    const target = d.awards.find((a) => a.id === id);
    if (target) {
      if (isDefaultAssetUrl(target.trophyImage)) recordRemovedDefaultUrl(d, target.trophyImage);
      if (isDefaultAssetUrl(target.certificateImage)) recordRemovedDefaultUrl(d, target.certificateImage);
    }
    d.awards = d.awards.filter((a) => a.id !== id);
  });
  res.json({ success: true, message: 'Award deleted' });
});

// Courses Management (with strict numeric BDT validation)
app.get('/api/admin/courses', requireAdmin, (_req, res) => {
  res.json({ courses: db.get().courses });
});

app.post('/api/admin/courses', requireAdmin, (req, res) => {
  const item = req.body;
  const parsedAmount =
    item.feeAmount !== null && item.feeAmount !== undefined && item.feeAmount !== ''
      ? Number(item.feeAmount)
      : null;
  const bdtConfirmed = parsedAmount !== null && !Number.isNaN(parsedAmount) && parsedAmount >= 0;
  const newCourse = {
    ...item,
    id: 'course-' + Date.now(),
    feeAmount: bdtConfirmed ? Math.round(parsedAmount!) : null,
    currency: 'BDT' as const,
    bdtConfirmed,
    fee: bdtConfirmed ? `৳ ${new Intl.NumberFormat('en-IN').format(Math.round(parsedAmount!))}` : '',
    enrolledCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.update((d) => d.courses.unshift(newCourse));
  res.json({ success: true, course: newCourse });
});

app.put('/api/admin/courses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated = null;

  db.update((d) => {
    const idx = d.courses.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const existing = d.courses[idx];
      if (updates.coverImage === '' && isDefaultAssetUrl(existing.coverImage)) {
        recordRemovedDefaultUrl(d, existing.coverImage);
      }

      const nextAmount =
        updates.feeAmount !== undefined
          ? updates.feeAmount === null || updates.feeAmount === ''
            ? null
            : Number(updates.feeAmount)
          : existing.feeAmount;
      const bdtConfirmed =
        updates.bdtConfirmed !== undefined
          ? Boolean(updates.bdtConfirmed) && nextAmount !== null && !Number.isNaN(nextAmount)
          : nextAmount !== null && !Number.isNaN(nextAmount);
      const formattedFee =
        bdtConfirmed && nextAmount !== null
          ? `৳ ${new Intl.NumberFormat('en-IN').format(Math.round(nextAmount))}`
          : '';

      d.courses[idx] = {
        ...existing,
        ...updates,
        feeAmount: bdtConfirmed ? Math.round(nextAmount!) : null,
        currency: 'BDT',
        bdtConfirmed,
        fee: formattedFee,
        updatedAt: new Date().toISOString(),
      };
      updated = d.courses[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Course not found' });
  res.json({ success: true, course: updated });
});

app.delete('/api/admin/courses/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    const target = d.courses.find((c) => c.id === id);
    if (target && isDefaultAssetUrl(target.coverImage)) {
      recordRemovedDefaultUrl(d, target.coverImage);
    }
    d.courses = d.courses.filter((c) => c.id !== id);
  });
  res.json({ success: true, message: 'Course deleted' });
});

// Currency Settings & Service Packages (BDT)
app.get('/api/admin/currency-settings', requireAdmin, (_req, res) => {
  res.json({ currencySettings: db.get().currency_settings });
});

app.put('/api/admin/currency-settings', requireAdmin, (req, res) => {
  const updates = req.body;
  db.update((d) => {
    d.currency_settings = {
      ...d.currency_settings,
      ...updates,
      code: 'BDT',
      symbol: '৳',
      name: 'Bangladeshi Taka',
      updatedAt: new Date().toISOString(),
    };
  });
  res.json({ success: true, currencySettings: db.get().currency_settings });
});

app.get('/api/admin/packages', requireAdmin, (_req, res) => {
  res.json({ packages: db.get().service_packages || [] });
});

app.post('/api/admin/packages', requireAdmin, (req, res) => {
  const pkg = req.body;
  const priceBdt =
    pkg.priceBdt !== null && pkg.priceBdt !== undefined && pkg.priceBdt !== ''
      ? Math.round(Number(pkg.priceBdt))
      : null;
  const newPkg = {
    ...pkg,
    id: 'pkg-' + Date.now(),
    priceBdt,
    currency: 'BDT' as const,
    bdtConfirmed: priceBdt !== null && !Number.isNaN(priceBdt),
    status: pkg.status || 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.update((d) => {
    if (!d.service_packages) d.service_packages = [];
    d.service_packages.unshift(newPkg);
  });
  res.json({ success: true, package: newPkg });
});

app.put('/api/admin/packages/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let updated: any = null;
  db.update((d) => {
    const idx = (d.service_packages || []).findIndex((p) => p.id === id);
    if (idx !== -1) {
      const priceBdt =
        updates.priceBdt !== undefined
          ? updates.priceBdt === null || updates.priceBdt === ''
            ? null
            : Math.round(Number(updates.priceBdt))
          : d.service_packages[idx].priceBdt;
      const bdtConfirmed = priceBdt !== null && !Number.isNaN(priceBdt);
      d.service_packages[idx] = {
        ...d.service_packages[idx],
        ...updates,
        priceBdt,
        currency: 'BDT',
        bdtConfirmed,
        updatedAt: new Date().toISOString(),
      };
      updated = d.service_packages[idx];
    }
  });
  if (!updated) return res.status(404).json({ error: 'Package not found' });
  res.json({ success: true, package: updated });
});

app.delete('/api/admin/packages/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    d.service_packages = (d.service_packages || []).filter((p) => p.id !== id);
  });
  res.json({ success: true });
});

// Student Registrations Management
app.get('/api/admin/registrations', requireAdmin, (_req, res) => {
  res.json({ registrations: db.get().student_registrations });
});

app.put('/api/admin/registrations/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, feeAmountBdt } = req.body;
  db.update((d) => {
    const r = d.student_registrations.find((item) => item.id === id);
    if (r) {
      if (status !== undefined) r.status = status;
      if (paymentStatus !== undefined) r.paymentStatus = paymentStatus;
      if (feeAmountBdt !== undefined) r.feeAmountBdt = feeAmountBdt === null ? null : Number(feeAmountBdt);
    }
  });
  res.json({ success: true });
});

app.delete('/api/admin/registrations/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    d.student_registrations = d.student_registrations.filter((r) => r.id !== id);
  });
  res.json({ success: true });
});

// Brand Collaborations Management
app.get('/api/admin/collaborations', requireAdmin, (_req, res) => {
  res.json({ collaborations: db.get().collaboration_inquiries });
});

app.put('/api/admin/collaborations/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, quotedAmountBdt, budgetRange } = req.body;
  db.update((d) => {
    const c = d.collaboration_inquiries.find((item) => item.id === id);
    if (c) {
      if (status !== undefined) c.status = status;
      if (quotedAmountBdt !== undefined) c.quotedAmountBdt = quotedAmountBdt === null ? null : Number(quotedAmountBdt);
      if (budgetRange !== undefined) c.budgetRange = budgetRange;
    }
  });
  res.json({ success: true });
});

app.delete('/api/admin/collaborations/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    d.collaboration_inquiries = d.collaboration_inquiries.filter((c) => c.id !== id);
  });
  res.json({ success: true });
});

// Contact Messages Management
app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  res.json({ messages: db.get().contact_messages });
});

app.put('/api/admin/messages/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.update((d) => {
    const m = d.contact_messages.find((item) => item.id === id);
    if (m) m.status = status;
  });
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.update((d) => {
    d.contact_messages = d.contact_messages.filter((m) => m.id !== id);
  });
  res.json({ success: true });
});

// Social Links & Settings Management
app.get('/api/admin/social-links', requireAdmin, (_req, res) => {
  res.json({ socialLinks: db.get().social_links });
});

app.put('/api/admin/social-links', requireAdmin, (req, res) => {
  const links = req.body;
  db.update((d) => {
    d.social_links = { ...d.social_links, ...links, updatedAt: new Date().toISOString() };
  });
  res.json({ success: true, socialLinks: db.get().social_links });
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json({ settings: db.get().website_settings });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const settings = req.body;
  db.update((d) => {
    d.website_settings = { ...d.website_settings, ...settings, updatedAt: new Date().toISOString() };
  });
  res.json({ success: true, settings: db.get().website_settings });
});

// Database Backup & Restore Management
app.get('/api/admin/backup', requireAdmin, (_req, res) => {
  const data = db.get();
  const backupJson = JSON.stringify(data, null, 2);
  const fileName = `sobur_ali_khan_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(backupJson);
});

app.post('/api/admin/restore', requireAdmin, (req, res) => {
  const { backupData } = req.body;
  if (!backupData || !Array.isArray(backupData.admin_users) || !Array.isArray(backupData.media_library)) {
    return res.status(400).json({ error: 'Invalid database backup structure' });
  }

  try {
    // Save backup of current DB before replacing
    const currentData = db.get();
    const backupDir = path.resolve(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(backupDir, `pre_restore_snapshot_${Date.now()}.json`),
      JSON.stringify(currentData, null, 2),
      'utf-8'
    );

    db.replace(backupData);
    res.json({ success: true, message: 'Database successfully restored from backup snapshot.' });
  } catch (err: any) {
    console.error('Failed to restore database:', err);
    res.status(500).json({ error: err.message || 'Failed to restore database' });
  }
});

/* ==========================================================================
   VITE DEV MIDDLEWARE / STATIC ASSETS
   ========================================================================== */
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sobur Ali Khan Luxury Brand Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
