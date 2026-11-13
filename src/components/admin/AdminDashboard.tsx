import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  FolderKanban,
  Users,
  Calendar,
  Trophy,
  GraduationCap,
  Briefcase,
  Mail,
  Share2,
  Settings,
  KeyRound,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Scissors,
  Banknote,
  FileText,
  Sliders,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirebase } from '../../context/FirebaseContext';
import {
  fetchFirestoreStatusSummary,
  syncFullPortfolioToFirestore,
} from '../../services/firestoreSync';
import {
  fetchAdminOverview,
  fetchAdminProfile,
  updateAdminProfile,
  fetchAdminProjects,
  createAdminProject,
  updateAdminProject,
  deleteAdminProject,
  fetchAdminMedia,
  uploadAdminImage,
  deleteAdminMedia,
  updateAdminMedia,
  fetchAdminModelingGroups,
  createAdminModelingGroup,
  updateAdminModelingGroup,
  deleteAdminModelingGroup,
  fetchAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  fetchAdminAwards,
  createAdminAward,
  updateAdminAward,
  deleteAdminAward,
  fetchAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  fetchAdminRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
  fetchAdminCollaborations,
  updateCollaborationStatus,
  deleteCollaboration,
  fetchAdminMessages,
  updateMessageStatus,
  deleteMessage,
  fetchAdminSocialLinks,
  updateAdminSocialLinks,
  fetchAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
  fetchAdminImageFrames,
  updateAdminImageFrame,
  fetchAdminCurrencySettings,
  updateAdminCurrencySettings,
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  saveSectionImage,
} from '../../api/client';
import {
  Profile,
  PortfolioProject,
  MediaItem,
  ModelingGroup,
  EventItem,
  AwardItem,
  ModelingCourse,
  StudentRegistration,
  CollaborationInquiry,
  ContactMessage,
  SocialLinks,
  WebsiteSettings,
  PublicationStatus,
  FrameImageConfig,
  WebsiteFrameSlot,
  CurrencySettings,
  ServicePackage,
} from '../../types';
import { GalleryManager } from './GalleryManager';
import { PhotoEditorModal, PhotoEditorSaveResult } from './PhotoEditorModal';
import { SectionImageManagerModal } from './SectionImageManagerModal';
import { ReceiptInvoiceModal, ReceiptDocumentData } from './ReceiptInvoiceModal';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';
import { SectionImageScope } from '../../utils/imageDisplay';
import {
  formatBDT,
  calculateRegistrationTotals,
  calculateCollaborationTotals,
  localizeBDTString,
} from '../../utils/currency';

interface AdminDashboardProps {
  onReturnToPublic: () => void;
}

type TabType =
  | 'overview'
  | 'frames'
  | 'profile'
  | 'portfolio'
  | 'media'
  | 'groups'
  | 'events'
  | 'awards'
  | 'courses'
  | 'pricing'
  | 'registrations'
  | 'collaborations'
  | 'messages'
  | 'social'
  | 'settings'
  | 'account';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onReturnToPublic }) => {
  const { user, logout } = useAuth();
  const {
    firebaseUser,
    isFirebaseOwner,
    projectId: firebaseProjectId,
    signInWithGoogle,
    signOutFirebase,
  } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSummary, setCloudSummary] = useState<{
    siteConfigUpdatedAt: string | null;
    projectsCount: number;
    coursesCount: number;
  } | null>(null);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [groups, setGroups] = useState<ModelingGroup[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [courses, setCourses] = useState<ModelingCourse[]>([]);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationInquiry[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [imageFrames, setImageFrames] = useState<FrameImageConfig[]>([]);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  const [loading, setLoading] = useState(false);

  // Modals / Item editors
  const [editingProject, setEditingProject] = useState<Partial<PortfolioProject> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem> | null>(null);
  const [editingAward, setEditingAward] = useState<Partial<AwardItem> | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<ModelingCourse> | null>(null);
  const [editingGroup, setEditingGroup] = useState<Partial<ModelingGroup> | null>(null);
  const [editingPackage, setEditingPackage] = useState<Partial<ServicePackage> | null>(null);
  const [activeFrameSlotEditor, setActiveFrameSlotEditor] = useState<WebsiteFrameSlot | null>(null);
  const [activeSectionImageManager, setActiveSectionImageManager] = useState<SectionImageScope | null>(null);
  const [inlineItemPhotoEditor, setInlineItemPhotoEditor] = useState<{
    section: SectionImageScope;
    field: 'cover' | 'trophy' | 'certificate';
    title: string;
    imageUrl: string;
    originalImageUrl?: string;
    initialMeta?: any;
  } | null>(null);
  const [receiptDoc, setReceiptDoc] = useState<ReceiptDocumentData | null>(null);
  const [draftCourseFees, setDraftCourseFees] = useState<Record<string, string>>({});
  const [draftPackageFees, setDraftPackageFees] = useState<Record<string, string>>({});
  const [draftCollabQuotes, setDraftCollabQuotes] = useState<Record<string, string>>({});

  // Password update state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        ovData,
        profData,
        projData,
        mediaData,
        grpData,
        evData,
        awData,
        crsData,
        regData,
        collabData,
        msgData,
        socData,
        settData,
        framesData,
        currData,
        pkgData,
      ] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminProfile(),
        fetchAdminProjects(),
        fetchAdminMedia(),
        fetchAdminModelingGroups(),
        fetchAdminEvents(),
        fetchAdminAwards(),
        fetchAdminCourses(),
        fetchAdminRegistrations(),
        fetchAdminCollaborations(),
        fetchAdminMessages(),
        fetchAdminSocialLinks(),
        fetchAdminSettings(),
        fetchAdminImageFrames().catch(() => []),
        fetchAdminCurrencySettings().catch(() => null),
        fetchAdminPackages().catch(() => []),
      ]);

      setOverview(ovData);
      setProfile(profData);
      setProjects(projData);
      setMedia(mediaData);
      setGroups(grpData);
      setEvents(evData);
      setAwards(awData);
      setCourses(crsData);
      setRegistrations(regData);
      setCollaborations(collabData);
      setMessages(msgData);
      setSocialLinks(socData);
      setSettings(settData);
      setImageFrames(framesData || []);
      if (currData) setCurrencySettings(currData);
      setPackages(pkgData || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to sync with master database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const digitStyle = currencySettings?.digitStyle || 'en';
  const unconfirmedBdtCourses = courses.filter((c) => !c.bdtConfirmed || c.feeAmount === null);
  const unconfirmedBdtPackages = packages.filter((p) => !p.bdtConfirmed || p.priceBdt === null);
  const totalUnconfirmedBdt = unconfirmedBdtCourses.length + unconfirmedBdtPackages.length;

  const handleSaveFrameEditor = async (result: PhotoEditorSaveResult) => {
    if (!activeFrameSlotEditor) return;
    const savedFrame = await updateAdminImageFrame(activeFrameSlotEditor, {
      editedDataUrl: result.editedDataUrl,
      originalDataUrl: result.originalDataUrl,
      imageSettings: result.cropMetadata,
      status: result.status,
      fileName: activeFrameSlotEditor,
      applyToSection: true,
    });
    setImageFrames((prev) =>
      prev.map((f) => (f.slot === savedFrame.slot ? savedFrame : f))
    );
    setActiveFrameSlotEditor(null);
    showNotification(
      'success',
      `Frame "${savedFrame.label}" updated (${savedFrame.status.toUpperCase()}). Original preserved.`
    );
    loadAllData();
  };

  // Handler for uploading files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetCategory: string = 'General') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await uploadAdminImage({
          dataUrl: base64,
          fileName: file.name.split('.')[0],
          title: file.name.split('.')[0],
          category: targetCategory,
        });
        showNotification('success', 'Photograph uploaded & stored in persistent cloud library.');
        loadAllData();
      } catch (err: any) {
        showNotification('error', err.message || 'Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const navItems: Array<{ id: TabType; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'media', label: 'My Gallery & Upload', icon: ImageIcon, count: media.length },
    { id: 'frames', label: 'Photo Studio & Frames', icon: Scissors, count: imageFrames.length },
    { id: 'profile', label: 'Profile & Hero', icon: User },
    { id: 'portfolio', label: 'Portfolio Works', icon: FolderKanban, count: projects.length },
    { id: 'groups', label: 'Modeling Group', icon: Users },
    { id: 'events', label: 'Events & Shows', icon: Calendar, count: events.length },
    { id: 'awards', label: 'Awards & Honors', icon: Trophy, count: awards.length },
    { id: 'courses', label: 'Offline Courses', icon: GraduationCap, count: courses.length },
    {
      id: 'pricing',
      label: 'Currency & BDT Pricing',
      icon: Banknote,
      count: totalUnconfirmedBdt > 0 ? totalUnconfirmedBdt : undefined,
    },
    {
      id: 'registrations',
      label: 'Registrations',
      icon: GraduationCap,
      count: registrations.filter((r) => r.status === 'pending').length,
    },
    {
      id: 'collaborations',
      label: 'Brand Inquiries',
      icon: Briefcase,
      count: collaborations.filter((c) => c.status === 'new').length,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: Mail,
      count: messages.filter((m) => m.status === 'unread').length,
    },
    { id: 'social', label: 'Social Channels', icon: Share2 },
    { id: 'settings', label: 'Appearance & SEO', icon: Settings },
    { id: 'account', label: 'Account Security', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col md:flex-row antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-[#0D0D0D] border-r border-[#C9A45C]/20 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#C9A45C]/20">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold">
              Owner Management
            </div>
            <div className="text-xl font-editorial font-bold text-[#F5F5F5] tracking-wider mt-1">
              SOBUR ALI KHAN
            </div>
            <div className="text-xs text-[#A7A7A7] mt-0.5">Signed in as {user?.email}</div>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs uppercase tracking-wider font-medium transition-all ${
                    isActive
                      ? 'bg-[#C9A45C] text-[#080808] font-bold shadow-sm'
                      : 'text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#080808]' : 'text-[#C9A45C]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                        isActive ? 'bg-[#080808] text-[#C9A45C]' : 'bg-[#1F1F1F] text-[#E5C98A]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-[#C9A45C]/20 space-y-2 bg-[#0A0A0A]">
          <button
            onClick={onReturnToPublic}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-wider text-[#E5C98A] border border-[#C9A45C]/30 hover:bg-[#C9A45C]/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-wider text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto max-h-screen bg-[#080808]">
        {/* Top Header bar */}
        <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#C9A45C]/20 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#C9A45C]">Private Administrative Suite</div>
            <h1 className="text-xl font-editorial font-bold text-[#F5F5F5] uppercase tracking-wide">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2 border border-[#C9A45C]/30 text-[#C9A45C] hover:bg-[#C9A45C]/10 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-xs text-[#A7A7A7]">
              Role: <span className="text-[#E5C98A] font-semibold uppercase">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div
            className={`m-6 p-4 border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'border-[#C9A45C] bg-[#C9A45C]/10 text-[#E5C98A]'
                : 'border-red-500 bg-red-950/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-[#C9A45C]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        <div className="p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-6 border border-[#C9A45C]/25 bg-[#121212]">
                  <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mb-1">
                    Published Photos
                  </div>
                  <div className="text-3xl font-editorial font-bold text-[#E5C98A] tabular-nums">
                    {overview?.metrics?.totalPublishedPhotos ?? 0}
                  </div>
                  <div className="text-[11px] text-[#A7A7A7] mt-2">Active in gallery</div>
                </div>

                <div className="p-6 border border-[#C9A45C]/25 bg-[#121212]">
                  <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mb-1">
                    Portfolio Works
                  </div>
                  <div className="text-3xl font-editorial font-bold text-[#E5C98A] tabular-nums">
                    {overview?.metrics?.totalPublishedProjects ?? 0} / {overview?.metrics?.totalProjects ?? 0}
                  </div>
                  <div className="text-[11px] text-[#A7A7A7] mt-2">Published / Total</div>
                </div>

                <div className="p-6 border border-[#C9A45C]/25 bg-[#121212]">
                  <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mb-1">
                    New Brand Inquiries
                  </div>
                  <div className="text-3xl font-editorial font-bold text-[#E5C98A] tabular-nums">
                    {overview?.metrics?.newCollaborations ?? 0}
                  </div>
                  <div className="text-[11px] text-[#A7A7A7] mt-2">Awaiting owner review</div>
                </div>

                <div className="p-6 border border-[#C9A45C]/25 bg-[#121212]">
                  <div className="text-xs uppercase tracking-wider text-[#A7A7A7] mb-1">
                    Unpublished Drafts
                  </div>
                  <div className="text-3xl font-editorial font-bold text-[#E5C98A] tabular-nums">
                    {overview?.metrics?.unpublishedCount ?? 0}
                  </div>
                  <div className="text-[11px] text-[#A7A7A7] mt-2">Private in CMS only</div>
                </div>
              </div>

              {/* BDT Financial & Pricing Summary */}
              <div className="border border-[#C9A45C]/30 bg-[#121212] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[#C9A45C] font-semibold">
                      Bangladeshi Taka (BDT · ৳) Financial Summary
                    </div>
                    <h3 className="text-base font-editorial font-bold text-[#F5F5F5]">
                      Academy Revenue & Campaign Pipeline
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#C9A45C] text-[#080808] hover:bg-[#E5C98A]"
                  >
                    Manage BDT Pricing
                  </button>
                </div>

                {totalUnconfirmedBdt > 0 && (
                  <div className="p-3.5 border border-amber-500/50 bg-amber-950/25 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
                    <span>
                      Action Required: {totalUnconfirmedBdt} course/package item(s) await your exact BDT (৳) fee confirmation.
                    </span>
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="px-3 py-1 bg-amber-400 text-[#080808] font-bold uppercase tracking-wider text-[10px]"
                    >
                      Confirm BDT Prices Now
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 border border-[#C9A45C]/20 bg-[#0B0B0B]">
                    <div className="text-[#A7A7A7] uppercase tracking-wider text-[10px]">
                      Confirmed Tuition Revenue (BDT)
                    </div>
                    <div className="text-2xl font-editorial font-bold text-[#E5C98A] mt-1">
                      {formatBDT(overview?.metrics?.confirmedRevenueBdt ?? 0, digitStyle)}
                    </div>
                  </div>
                  <div className="p-4 border border-[#C9A45C]/20 bg-[#0B0B0B]">
                    <div className="text-[#A7A7A7] uppercase tracking-wider text-[10px]">
                      Pending Tuition Pipeline (BDT)
                    </div>
                    <div className="text-2xl font-editorial font-bold text-[#F5F5F5] mt-1">
                      {formatBDT(overview?.metrics?.pendingRevenueBdt ?? 0, digitStyle)}
                    </div>
                  </div>
                  <div className="p-4 border border-[#C9A45C]/20 bg-[#0B0B0B]">
                    <div className="text-[#A7A7A7] uppercase tracking-wider text-[10px]">
                      Quoted Brand Collaborations (BDT)
                    </div>
                    <div className="text-2xl font-editorial font-bold text-[#C9A45C] mt-1">
                      {formatBDT(overview?.metrics?.collaborationPipelineBdt ?? 0, digitStyle)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Brand Collaborations */}
                <div className="border border-[#C9A45C]/25 bg-[#121212] p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C9A45C]/20">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-[#F5F5F5]">
                      Recent Collaboration Proposals
                    </h3>
                    <button
                      onClick={() => setActiveTab('collaborations')}
                      className="text-xs text-[#C9A45C] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {collaborations.length === 0 ? (
                    <p className="text-xs text-[#A7A7A7]">No collaboration inquiries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {collaborations.slice(0, 4).map((collab) => (
                        <div
                          key={collab.id}
                          className="p-3 border border-[#C9A45C]/15 bg-[#181818] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#F5F5F5]">{collab.companyName}</div>
                            <div className="text-[#A7A7A7]">
                              {collab.contactPerson} · {collab.collaborationType}
                            </div>
                          </div>
                          <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 bg-[#C9A45C]/20 text-[#E5C98A]">
                            {collab.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Student Course Registrations */}
                <div className="border border-[#C9A45C]/25 bg-[#121212] p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C9A45C]/20">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-[#F5F5F5]">
                      Recent Academy Registrations
                    </h3>
                    <button
                      onClick={() => setActiveTab('registrations')}
                      className="text-xs text-[#C9A45C] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {registrations.length === 0 ? (
                    <p className="text-xs text-[#A7A7A7]">No academy registrations yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {registrations.slice(0, 4).map((reg) => (
                        <div
                          key={reg.id}
                          className="p-3 border border-[#C9A45C]/15 bg-[#181818] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#F5F5F5]">{reg.fullName}</div>
                            <div className="text-[#A7A7A7]">
                              {reg.courseTitle} · {reg.phone}
                            </div>
                          </div>
                          <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 bg-[#C9A45C]/20 text-[#E5C98A]">
                            {reg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & HERO MANAGEMENT */}
          {activeTab === 'profile' && profile && (
            <div className="max-w-4xl border border-[#C9A45C]/25 bg-[#121212] p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Profile, Hero & Bio Management
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Update your public identity, introductory statements, and key statistics.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-[#A7A7A7]">Status:</span>
                  <select
                    value={profile.status}
                    onChange={(e) => setProfile({ ...profile, status: e.target.value as PublicationStatus })}
                    className="bg-[#181818] border border-[#C9A45C]/30 text-xs px-3 py-1.5 text-[#E5C98A]"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                  Hero Tagline / Punchline
                </label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                />
              </div>

              {/* Full Biography */}
              <div className="text-xs">
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                  Full Personal Biography
                </label>
                <textarea
                  rows={4}
                  value={profile.fullBio}
                  onChange={(e) => setProfile({ ...profile, fullBio: e.target.value })}
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5] leading-relaxed"
                />
              </div>

              {/* Modeling Journey */}
              <div className="text-xs">
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                  Modeling Journey & Runway Background
                </label>
                <textarea
                  rows={3}
                  value={profile.modelingJourney}
                  onChange={(e) => setProfile({ ...profile, modelingJourney: e.target.value })}
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5] leading-relaxed"
                />
              </div>

              {/* Influencer Experience */}
              <div className="text-xs">
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1 font-medium">
                  Influencer Experience & Brand Narrative
                </label>
                <textarea
                  rows={3}
                  value={profile.influencerExperience}
                  onChange={(e) => setProfile({ ...profile, influencerExperience: e.target.value })}
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5] leading-relaxed"
                />
              </div>

              {/* Key Statistics */}
              <div className="pt-4 border-t border-[#C9A45C]/20">
                <h4 className="text-xs uppercase tracking-widest text-[#E5C98A] font-semibold mb-4">
                  Key Career Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[#A7A7A7] mb-1">Runway Experience</label>
                    <input
                      type="text"
                      value={profile.stats.experienceYears}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          stats: { ...profile.stats, experienceYears: e.target.value },
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A7A7] mb-1">Fashion Shows</label>
                    <input
                      type="text"
                      value={profile.stats.runwayShows}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          stats: { ...profile.stats, runwayShows: e.target.value },
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A7A7] mb-1">Projects Completed</label>
                    <input
                      type="text"
                      value={profile.stats.projectsCompleted}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          stats: { ...profile.stats, projectsCompleted: e.target.value },
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A7A7] mb-1">Audience Reach</label>
                    <input
                      type="text"
                      value={profile.stats.audienceReach}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          stats: { ...profile.stats, audienceReach: e.target.value },
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>

              {/* Images configuration */}
              <div className="pt-4 border-t border-[#C9A45C]/20 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="uppercase tracking-wider text-[#A7A7A7] font-medium">
                      Hero Main Photo URL
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveFrameSlotEditor('hero_bg')}
                      className="text-[10px] uppercase tracking-wider text-[#C9A45C] hover:underline flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Crop & Position</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={profile.heroImage}
                    onChange={(e) => setProfile({ ...profile, heroImage: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5] mb-2"
                  />
                  <div className="aspect-[4/5] border border-[#C9A45C]/30 overflow-hidden bg-[#181818]">
                    <img
                      src={profile.heroImage}
                      alt="Hero Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="uppercase tracking-wider text-[#A7A7A7] font-medium">
                      About Section Photo URL
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveFrameSlotEditor('about_me')}
                      className="text-[10px] uppercase tracking-wider text-[#C9A45C] hover:underline flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Crop & Position</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={profile.aboutBgImage}
                    onChange={(e) => setProfile({ ...profile, aboutBgImage: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5] mb-2"
                  />
                  <div className="aspect-[4/5] border border-[#C9A45C]/30 overflow-hidden bg-[#181818]">
                    <img
                      src={profile.aboutBgImage}
                      alt="About Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="uppercase tracking-wider text-[#A7A7A7] font-medium">
                      Profile Editorial Photo URL
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveFrameSlotEditor('profile_photo')}
                      className="text-[10px] uppercase tracking-wider text-[#C9A45C] hover:underline flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Crop & Position</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={profile.profileImage}
                    onChange={(e) => setProfile({ ...profile, profileImage: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5] mb-2"
                  />
                  <div className="aspect-[4/5] border border-[#C9A45C]/30 overflow-hidden bg-[#181818]">
                    <img
                      src={profile.profileImage}
                      alt="Profile Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#C9A45C]/20 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setProfile({ ...profile, status: 'draft' });
                    updateAdminProfile({ ...profile, status: 'draft' }).then(() => {
                      showNotification('success', 'Profile saved as Draft (Hidden from public).');
                    });
                  }}
                  className="px-5 py-2.5 text-xs uppercase tracking-wider border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/10"
                >
                  Save As Draft
                </button>
                <button
                  onClick={async () => {
                    await updateAdminProfile(profile);
                    showNotification('success', 'Profile updated & published successfully.');
                  }}
                  className="px-6 py-2.5 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                >
                  Publish / Update Profile
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIO MANAGEMENT */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Modeling Projects & Campaigns
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Manage high-fashion runway shows, editorial covers, and commercial shoots.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSectionImageManager('portfolio')}
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C]/15"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button
                    onClick={() =>
                      setEditingProject({
                        title: '',
                        subtitle: '',
                        category: 'Runway',
                        client: '',
                        year: new Date().getFullYear().toString(),
                        coverImage: '',
                        galleryImages: [],
                        description: '',
                        credits: '',
                        featured: true,
                        status: 'published',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Project</span>
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="border border-[#C9A45C]/25 bg-[#121212] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-[16/10] bg-[#181818] relative overflow-hidden flex items-center justify-center">
                      {proj.coverImage ? (
                        <img
                          src={proj.coverImage}
                          alt={proj.title}
                          referrerPolicy="no-referrer"
                          style={{
                            objectFit: proj.coverImageSettings?.fitMode || 'cover',
                            objectPosition: proj.coverImageSettings?.objectPosition || '50% 50%',
                          }}
                          className="w-full h-full"
                        />
                      ) : (
                        <span className="text-[11px] uppercase tracking-wider text-[#666]">
                          No Cover Image
                        </span>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold ${
                            proj.status === 'published'
                              ? 'bg-[#C9A45C] text-[#080808]'
                              : 'bg-[#222] text-[#A7A7A7]'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#C9A45C] font-semibold">
                          {proj.category} · {proj.year}
                        </div>
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5] mt-1">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-[#A7A7A7] line-clamp-2 mt-1">
                          {proj.description}
                        </p>
                      </div>

                      {/* Publishing & Action Controls */}
                      <div className="pt-4 border-t border-[#C9A45C]/15 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {proj.status === 'published' ? (
                            <button
                              onClick={async () => {
                                await updateAdminProject(proj.id, { status: 'unpublished' });
                                showNotification('success', 'Project unpublished from public view.');
                                loadAllData();
                              }}
                              className="px-2 py-1 text-[11px] text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/20"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                await updateAdminProject(proj.id, { status: 'published' });
                                showNotification('success', 'Project published live.');
                                loadAllData();
                              }}
                              className="px-2 py-1 text-[11px] text-[#080808] bg-[#C9A45C] font-semibold"
                            >
                              Publish Live
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 text-[#C9A45C] hover:bg-[#C9A45C]/10 border border-[#C9A45C]/20"
                            title="Edit Project"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete project "${proj.title}"?`)) {
                                await deleteAdminProject(proj.id);
                                showNotification('success', 'Project deleted.');
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-950/20 border border-red-500/20"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT MODAL EDITOR */}
          {editingProject && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#121212] border border-[#C9A45C]/40 p-8 space-y-5 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-lg font-editorial font-bold">
                    {editingProject.id ? 'Edit Modeling Project' : 'New Modeling Project'}
                  </h3>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="text-[#A7A7A7] hover:text-[#F5F5F5]"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      placeholder="e.g. Paris Autumn Gala"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={editingProject.subtitle || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, subtitle: e.target.value })}
                      placeholder="e.g. Haute Couture Catwalk"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Category</label>
                    <select
                      value={editingProject.category || 'Runway'}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    >
                      <option value="Runway">Runway</option>
                      <option value="Editorial">Editorial</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Campaign">Campaign</option>
                      <option value="Portrait">Portrait</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Client / Atelier</label>
                    <input
                      type="text"
                      value={editingProject.client || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                      placeholder="e.g. Vogue / Dior"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Year</label>
                    <input
                      type="text"
                      value={editingProject.year || '2024'}
                      onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Cover Image</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingProject.coverImage || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                      placeholder="Upload below or paste image URL (optional)"
                      className="flex-1 min-w-[200px] bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#C9A45C] text-[#080808] font-semibold flex items-center gap-1.5 hover:bg-[#E5C98A]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Crop</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          const dataUrl = await readImageFileAsDataUrl(file);
                          setInlineItemPhotoEditor({
                            section: 'portfolio',
                            field: 'cover',
                            title: editingProject.title || file.name,
                            imageUrl: dataUrl,
                            originalImageUrl: dataUrl,
                            initialMeta: editingProject.coverImageSettings || { aspectPreset: '4:5', fitMode: 'cover' },
                          });
                        }}
                      />
                    </label>
                    {editingProject.coverImage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setInlineItemPhotoEditor({
                              section: 'portfolio',
                              field: 'cover',
                              title: editingProject.title || 'Project Cover',
                              imageUrl: editingProject.coverImage!,
                              originalImageUrl: editingProject.coverImageSettings?.originalUrl || editingProject.coverImage!,
                              initialMeta: editingProject.coverImageSettings || { aspectPreset: '4:5', fitMode: 'cover' },
                            })
                          }
                          className="px-3 py-2 border border-[#C9A45C]/50 text-[#E5C98A] flex items-center gap-1"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProject({
                              ...editingProject,
                              coverImage: '',
                              coverImageSettings: null,
                            })
                          }
                          className="px-2.5 py-2 border border-red-500/40 text-red-400"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Project Description</label>
                  <textarea
                    rows={3}
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Production Credits</label>
                  <input
                    type="text"
                    value={editingProject.credits || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, credits: e.target.value })}
                    placeholder="Photographer, styling, makeup..."
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Publication Status</label>
                  <select
                    value={editingProject.status || 'published'}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as PublicationStatus,
                      })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#E5C98A]"
                  >
                    <option value="published">Published (Visible on Public Website)</option>
                    <option value="draft">Draft (Private in CMS Only)</option>
                    <option value="unpublished">Unpublished (Temporarily Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingProject.title?.trim()) {
                        showNotification('error', 'Project title is required.');
                        return;
                      }
                      if (editingProject.id) {
                        await updateAdminProject(editingProject.id, editingProject);
                        showNotification('success', 'Project updated successfully.');
                      } else {
                        await createAdminProject(editingProject);
                        showNotification('success', 'Project created successfully.');
                      }
                      setEditingProject(null);
                      loadAllData();
                    }}
                    className="px-6 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY & PHOTO UPLOAD MANAGEMENT */}
          {activeTab === 'media' && (
            <GalleryManager onRefreshParent={loadAllData} />
          )}

          {/* PHOTO STUDIO & INDEPENDENT WEBSITE IMAGE FRAMES TAB */}
          {activeTab === 'frames' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C9A45C]/20 gap-3">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Website Photo Studio & Section Image Frames
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Independently crop, zoom, rotate, resize, and position images for every section of your website. Each frame remembers its own settings without altering other frames.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageFrames.map((frame) => (
                  <div
                    key={frame.slot}
                    className="border border-[#C9A45C]/25 bg-[#121212] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] bg-[#181818] relative overflow-hidden">
                      <img
                        src={frame.imageSettings.editedUrl || frame.imageSettings.originalUrl}
                        alt={frame.label}
                        style={{ objectPosition: frame.imageSettings.objectPosition || '50% 20%' }}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold ${
                          frame.status === 'published'
                            ? 'bg-[#C9A45C] text-[#080808]'
                            : 'bg-[#222] text-[#A7A7A7]'
                        }`}
                      >
                        {frame.status}
                      </span>
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-[#080808]/85 border border-[#C9A45C]/30 px-2 py-0.5 text-[#E5C98A]">
                        Ratio: {frame.imageSettings.aspectPreset} · Zoom: {frame.imageSettings.zoom.toFixed(2)}x
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
                      <div>
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5]">
                          {frame.label}
                        </h4>
                        <p className="text-[#A7A7A7] mt-1 leading-relaxed">{frame.description}</p>
                        <div className="mt-2 text-[10px] font-mono text-[#777]">
                          Pos: {frame.imageSettings.objectPosition} · Rot: {frame.imageSettings.rotation}°
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveFrameSlotEditor(frame.slot)}
                        className="w-full py-2.5 px-3 bg-[#C9A45C] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#E5C98A] flex items-center justify-center gap-2"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Crop, Zoom & Position</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MODELING GROUP */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Modeling Group Affiliation
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Manage ensemble associations, lead model roles, and group portfolios.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingGroup({
                      groupName: '',
                      logo: media[0]?.url || '',
                      position: 'Lead Model',
                      groupDescription: '',
                      experience: '',
                      groupPhotos: [],
                      officialPageLink: '',
                      status: 'published',
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Group Affiliation</span>
                </button>
              </div>

              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-[#C9A45C]/25 bg-[#121212] p-6 flex flex-col md:flex-row gap-6 justify-between items-start"
                  >
                    <div className="flex gap-4">
                      {group.logo && (
                        <div className="w-24 h-24 shrink-0 border border-[#C9A45C]/30 overflow-hidden bg-[#181818]">
                          <img
                            src={group.logo}
                            alt={group.groupName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#C9A45C] font-semibold">
                          Position: {group.position}
                        </div>
                        <h4 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                          {group.groupName}
                        </h4>
                        <p className="text-xs text-[#A7A7A7] mt-1 max-w-xl">
                          {group.groupDescription}
                        </p>
                        <div className="text-xs text-[#E5C98A] mt-2 font-medium">
                          Experience: {group.experience}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="p-2 border border-[#C9A45C]/30 text-[#C9A45C] hover:bg-[#C9A45C]/10"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete group affiliation "${group.groupName}"?`)) {
                            await deleteAdminModelingGroup(group.id);
                            showNotification('success', 'Group deleted.');
                            loadAllData();
                          }
                        }}
                        className="p-2 border border-red-500/30 text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP MODAL EDITOR */}
          {editingGroup && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-xl w-full bg-[#121212] border border-[#C9A45C]/40 p-6 space-y-4 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-base font-editorial font-bold">
                    {editingGroup.id ? 'Edit Modeling Group' : 'New Modeling Group'}
                  </h3>
                  <button onClick={() => setEditingGroup(null)}>✕</button>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={editingGroup.groupName || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, groupName: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Position</label>
                    <select
                      value={editingGroup.position || 'Lead Model'}
                      onChange={(e) =>
                        setEditingGroup({ ...editingGroup, position: e.target.value as any })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    >
                      <option value="Model">Model</option>
                      <option value="Group Member">Group Member</option>
                      <option value="Lead Model">Lead Model</option>
                      <option value="Team Member">Team Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Publication Status</label>
                    <select
                      value={editingGroup.status || 'published'}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          status: e.target.value as PublicationStatus,
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#E5C98A]"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="unpublished">Unpublished</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Photo / Logo URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingGroup.logo || ''}
                      onChange={(e) => setEditingGroup({ ...editingGroup, logo: e.target.value })}
                      className="flex-1 bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#C9A45C] text-[#080808] font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[#E5C98A]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async () => {
                            try {
                              const res = await uploadAdminImage({
                                dataUrl: reader.result as string,
                                fileName: file.name,
                                title: editingGroup.groupName || file.name,
                                category: 'Modeling Group',
                              });
                              setEditingGroup((prev) => (prev ? { ...prev, logo: res.url } : prev));
                              showNotification('success', 'Group photo uploaded.');
                            } catch (err: any) {
                              showNotification('error', err.message || 'Upload failed');
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingGroup.groupDescription || ''}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, groupDescription: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Experience Note</label>
                  <input
                    type="text"
                    value={editingGroup.experience || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, experience: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Official Page Link</label>
                  <input
                    type="text"
                    value={editingGroup.officialPageLink || ''}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, officialPageLink: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingGroup(null)}
                    className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingGroup.groupName?.trim()) {
                        alert('Group name is required.');
                        return;
                      }
                      if (editingGroup.id) {
                        await updateAdminModelingGroup(editingGroup.id, editingGroup);
                      } else {
                        await createAdminModelingGroup(editingGroup);
                      }
                      setEditingGroup(null);
                      loadAllData();
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save Group
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EVENTS MANAGEMENT */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Events & Appearances
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Manage fashion week showcases, brand galas, and special invitations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSectionImageManager('events')}
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C]/15"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button
                    onClick={() =>
                      setEditingEvent({
                        title: '',
                        role: 'Modeling Show',
                        date: '2025',
                        location: '',
                        description: '',
                        coverImage: '',
                        images: [],
                        status: 'published',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Event</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-[#C9A45C]/25 bg-[#121212] overflow-hidden flex flex-col justify-between"
                  >
                    {ev.coverImage && (
                      <div className="aspect-[16/10] bg-[#181818] relative overflow-hidden">
                        <img
                          src={ev.coverImage}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          style={{
                            objectFit: ev.coverImageSettings?.fitMode || 'cover',
                            objectPosition: ev.coverImageSettings?.objectPosition || '50% 40%',
                          }}
                          className="w-full h-full"
                        />
                        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#C9A45C] text-[#080808] font-bold">
                          {ev.status}
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-xs uppercase text-[#E5C98A] font-semibold">
                          {ev.role} · {ev.date}
                        </div>
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5] mt-1">
                          {ev.title}
                        </h4>
                        <div className="text-xs text-[#A7A7A7] mt-1">{ev.location}</div>
                        <p className="text-xs text-[#A7A7A7] line-clamp-2 mt-2">{ev.description}</p>
                      </div>

                      <div className="pt-3 border-t border-[#C9A45C]/15 flex items-center justify-between">
                        <button
                          onClick={async () => {
                            const newStatus = ev.status === 'published' ? 'unpublished' : 'published';
                            await updateAdminEvent(ev.id, { status: newStatus });
                            loadAllData();
                          }}
                          className="text-[11px] uppercase tracking-wider text-[#C9A45C] hover:underline"
                        >
                          {ev.status === 'published' ? 'Unpublish' : 'Publish Live'}
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEvent(ev)}
                            className="p-1 text-[#C9A45C]"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete event "${ev.title}"?`)) {
                                await deleteAdminEvent(ev.id);
                                loadAllData();
                              }
                            }}
                            className="p-1 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENT MODAL EDITOR */}
          {editingEvent && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-xl w-full bg-[#121212] border border-[#C9A45C]/40 p-6 space-y-4 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-base font-editorial font-bold">
                    {editingEvent.id ? 'Edit Event' : 'New Event'}
                  </h3>
                  <button onClick={() => setEditingEvent(null)}>✕</button>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.title || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Role</label>
                    <select
                      value={editingEvent.role || 'Modeling Show'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, role: e.target.value as any })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    >
                      <option value="Attended">Attended</option>
                      <option value="Worked At">Worked At</option>
                      <option value="Modeling Show">Modeling Show</option>
                      <option value="Brand Event">Brand Event</option>
                      <option value="Special Invitation">Special Invitation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Date</label>
                    <input
                      type="text"
                      value={editingEvent.date || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      placeholder="e.g. October 2024"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Location</label>
                  <input
                    type="text"
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    placeholder="e.g. Paris, France"
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Cover Image</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingEvent.coverImage || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, coverImage: e.target.value })}
                      placeholder="Upload or enter image URL"
                      className="flex-1 min-w-[180px] bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#C9A45C] text-[#080808] font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[#E5C98A]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Crop</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          const dataUrl = await readImageFileAsDataUrl(file);
                          setInlineItemPhotoEditor({
                            section: 'events',
                            field: 'cover',
                            title: editingEvent.title || file.name,
                            imageUrl: dataUrl,
                            originalImageUrl: dataUrl,
                            initialMeta: editingEvent.coverImageSettings || { aspectPreset: '16:9', fitMode: 'cover' },
                          });
                        }}
                      />
                    </label>
                    {editingEvent.coverImage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setInlineItemPhotoEditor({
                              section: 'events',
                              field: 'cover',
                              title: editingEvent.title || 'Event Cover',
                              imageUrl: editingEvent.coverImage!,
                              originalImageUrl: editingEvent.coverImageSettings?.originalUrl || editingEvent.coverImage!,
                              initialMeta: editingEvent.coverImageSettings || { aspectPreset: '16:9', fitMode: 'cover' },
                            })
                          }
                          className="px-3 py-2 border border-[#C9A45C]/50 text-[#E5C98A] flex items-center gap-1"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingEvent({
                              ...editingEvent,
                              coverImage: '',
                              coverImageSettings: null,
                            })
                          }
                          className="px-2.5 py-2 border border-red-500/40 text-red-400"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingEvent.description || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Publication Status</label>
                  <select
                    value={editingEvent.status || 'published'}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, status: e.target.value as PublicationStatus })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#E5C98A]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end gap-3">
                  <button onClick={() => setEditingEvent(null)} className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingEvent.title?.trim()) return;
                      if (editingEvent.id) {
                        await updateAdminEvent(editingEvent.id, editingEvent);
                      } else {
                        await createAdminEvent(editingEvent);
                      }
                      setEditingEvent(null);
                      loadAllData();
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AWARDS MANAGEMENT */}
          {activeTab === 'awards' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Awards & Honors
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Certificates, trophies, and formal industry recognitions.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSectionImageManager('awards')}
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C]/15"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button
                    onClick={() =>
                      setEditingAward({
                        name: '',
                        organization: '',
                        date: '2025',
                        trophyImage: '',
                        certificateImage: '',
                        description: '',
                        status: 'published',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Award</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {awards.map((award) => (
                  <div
                    key={award.id}
                    className="border border-[#C9A45C]/25 bg-[#121212] p-5 flex gap-4 items-start justify-between"
                  >
                    <div className="flex gap-4">
                      {award.trophyImage && (
                        <div className="w-20 h-20 shrink-0 border border-[#C9A45C]/30 overflow-hidden bg-[#181818]">
                          <img
                            src={award.trophyImage}
                            alt={award.name}
                            referrerPolicy="no-referrer"
                            style={{
                              objectFit: award.trophyImageSettings?.fitMode || 'contain',
                              objectPosition: award.trophyImageSettings?.objectPosition || '50% 50%',
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-xs uppercase text-[#C9A45C] font-semibold">
                          {award.organization} · {award.date}
                        </div>
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5] mt-1">
                          {award.name}
                        </h4>
                        <p className="text-xs text-[#A7A7A7] mt-1">{award.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingAward(award)}
                        className="p-1.5 text-[#C9A45C]"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete award "${award.name}"?`)) {
                            await deleteAdminAward(award.id);
                            loadAllData();
                          }
                        }}
                        className="p-1.5 text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AWARD MODAL EDITOR */}
          {editingAward && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-xl w-full bg-[#121212] border border-[#C9A45C]/40 p-6 space-y-4 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-base font-editorial font-bold">
                    {editingAward.id ? 'Edit Award' : 'New Award'}
                  </h3>
                  <button onClick={() => setEditingAward(null)}>✕</button>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Award Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAward.name || ''}
                    onChange={(e) => setEditingAward({ ...editingAward, name: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Organization</label>
                    <input
                      type="text"
                      value={editingAward.organization || ''}
                      onChange={(e) => setEditingAward({ ...editingAward, organization: e.target.value })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Date</label>
                    <input
                      type="text"
                      value={editingAward.date || ''}
                      onChange={(e) => setEditingAward({ ...editingAward, date: e.target.value })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Trophy / Award Image</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingAward.trophyImage || ''}
                      onChange={(e) => setEditingAward({ ...editingAward, trophyImage: e.target.value })}
                      placeholder="Upload trophy/award photo or enter URL"
                      className="flex-1 min-w-[180px] bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#C9A45C] text-[#080808] font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[#E5C98A]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Fit</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          const dataUrl = await readImageFileAsDataUrl(file);
                          setInlineItemPhotoEditor({
                            section: 'awards',
                            field: 'trophy',
                            title: editingAward.name || file.name,
                            imageUrl: dataUrl,
                            originalImageUrl: dataUrl,
                            initialMeta: editingAward.trophyImageSettings || { aspectPreset: '1:1', fitMode: 'contain' },
                          });
                        }}
                      />
                    </label>
                    {editingAward.trophyImage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setInlineItemPhotoEditor({
                              section: 'awards',
                              field: 'trophy',
                              title: editingAward.name || 'Award Photo',
                              imageUrl: editingAward.trophyImage!,
                              originalImageUrl: editingAward.trophyImageSettings?.originalUrl || editingAward.trophyImage!,
                              initialMeta: editingAward.trophyImageSettings || { aspectPreset: '1:1', fitMode: 'contain' },
                            })
                          }
                          className="px-3 py-2 border border-[#C9A45C]/50 text-[#E5C98A]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAward({
                              ...editingAward,
                              trophyImage: '',
                              trophyImageSettings: null,
                            })
                          }
                          className="px-2.5 py-2 border border-red-500/40 text-red-400"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Certificate / Diploma Photo</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingAward.certificateImage || ''}
                      onChange={(e) => setEditingAward({ ...editingAward, certificateImage: e.target.value })}
                      placeholder="Optional certificate image URL"
                      className="flex-1 min-w-[180px] bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 border border-[#C9A45C] text-[#E5C98A] font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[#C9A45C]/15">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Cert</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          const dataUrl = await readImageFileAsDataUrl(file);
                          setInlineItemPhotoEditor({
                            section: 'awards',
                            field: 'certificate',
                            title: `${editingAward.name || 'Award'} Certificate`,
                            imageUrl: dataUrl,
                            originalImageUrl: dataUrl,
                            initialMeta: editingAward.certificateImageSettings || { aspectPreset: 'original', fitMode: 'contain' },
                          });
                        }}
                      />
                    </label>
                    {editingAward.certificateImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAward({
                            ...editingAward,
                            certificateImage: '',
                            certificateImageSettings: null,
                          })
                        }
                        className="px-2.5 py-2 border border-red-500/40 text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingAward.description || ''}
                    onChange={(e) => setEditingAward({ ...editingAward, description: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end gap-3">
                  <button onClick={() => setEditingAward(null)} className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingAward.name?.trim()) return;
                      if (editingAward.id) {
                        await updateAdminAward(editingAward.id, editingAward);
                      } else {
                        await createAdminAward(editingAward);
                      }
                      setEditingAward(null);
                      loadAllData();
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save Award
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: OFFLINE COURSES MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C9A45C]/20">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Offline Modeling Courses (BDT · ৳)
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Configure training tiers, curriculum, tuition fees in Bangladeshi Taka (BDT), and physical studio locations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSectionImageManager('courses')}
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C]/15"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button
                    onClick={() =>
                      setEditingCourse({
                        title: '',
                        tier: 'Beginner Modeling Course',
                        feeAmount: null,
                        currency: 'BDT',
                        bdtConfirmed: false,
                        schedule: 'Weekends',
                        duration: '4 Weeks',
                        location: 'Sobur Khan Studio',
                        coverImage: '',
                        description: '',
                        syllabus: ['Catwalk Dynamics', 'Camera Angles', 'Posture'],
                        capacity: 12,
                        status: 'published',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Course</span>
                  </button>
                </div>
              </div>

              {unconfirmedBdtCourses.length > 0 && (
                <div className="p-4 border border-amber-500/50 bg-amber-950/20 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
                  <span>
                    {unconfirmedBdtCourses.length} course(s) have legacy pricing that requires explicit BDT (৳) confirmation. Edit each course or open Currency & BDT Pricing to enter exact Taka amounts.
                  </span>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="px-3 py-1.5 bg-amber-400 text-[#080808] font-bold uppercase tracking-wider text-[10px]"
                  >
                    Confirm BDT Fees
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((crs) => (
                  <div
                    key={crs.id}
                    className="border border-[#C9A45C]/25 bg-[#121212] overflow-hidden flex flex-col justify-between"
                  >
                    {crs.coverImage && (
                      <div className="aspect-[16/9] bg-[#181818] overflow-hidden">
                        <img
                          src={crs.coverImage}
                          alt={crs.title}
                          referrerPolicy="no-referrer"
                          style={{
                            objectFit: crs.coverImageSettings?.fitMode || 'cover',
                            objectPosition: crs.coverImageSettings?.objectPosition || '50% 50%',
                          }}
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#E5C98A] font-semibold">
                          <span>{crs.tier}</span>
                          <span className="text-sm font-bold text-[#C9A45C]">
                            {crs.bdtConfirmed && crs.feeAmount !== null
                              ? formatBDT(crs.feeAmount, digitStyle)
                              : 'Pending BDT'}
                          </span>
                        </div>
                        {!crs.bdtConfirmed && crs.legacyUsdFee && (
                          <div className="text-[10px] text-amber-300 mt-1">
                            Legacy entry ({crs.legacyUsdFee}) awaiting exact BDT confirmation
                          </div>
                        )}
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5] mt-1">
                          {crs.title}
                        </h4>
                        <div className="text-xs text-[#A7A7A7] mt-1">{crs.schedule}</div>
                        <p className="text-xs text-[#A7A7A7] line-clamp-2 mt-2">
                          {crs.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#C9A45C]/15 flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-[#A7A7A7]">
                          Enrolled: {crs.enrolledCount || 0} / {crs.capacity}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCourse(crs)}
                            className="p-1.5 text-[#C9A45C]"
                            title="Edit Course & BDT Tuition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete course "${crs.title}"?`)) {
                                await deleteAdminCourse(crs.id);
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COURSE MODAL EDITOR */}
          {editingCourse && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto bg-[#121212] border border-[#C9A45C]/40 p-6 space-y-4 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-base font-editorial font-bold">
                    {editingCourse.id ? 'Edit Modeling Course' : 'New Modeling Course'}
                  </h3>
                  <button onClick={() => setEditingCourse(null)}>✕</button>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Course Tier</label>
                    <select
                      value={editingCourse.tier || 'Beginner Modeling Course'}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, tier: e.target.value as any })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    >
                      <option value="Beginner Modeling Course">Beginner Modeling Course</option>
                      <option value="Professional Modeling Training">Professional Modeling Training</option>
                      <option value="Advanced Modeling Training">Advanced Modeling Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">
                      Tuition Fee (BDT ৳)
                    </label>
                    <div className="flex items-center bg-[#181818] border border-[#C9A45C]/30">
                      <span className="px-3 py-2 text-[#C9A45C] font-bold border-r border-[#C9A45C]/20">
                        ৳
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={editingCourse.feeAmount ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? null : Number(raw);
                          setEditingCourse({
                            ...editingCourse,
                            feeAmount: num,
                            bdtConfirmed: num !== null && !Number.isNaN(num),
                            currency: 'BDT',
                          });
                        }}
                        placeholder="Enter exact BDT amount"
                        className="w-full bg-transparent p-2 text-[#F5F5F5] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Duration</label>
                    <input
                      type="text"
                      value={editingCourse.duration || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                      placeholder="4 Weeks"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Schedule</label>
                    <input
                      type="text"
                      value={editingCourse.schedule || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, schedule: e.target.value })}
                      placeholder="Weekends 10 AM - 1 PM"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Location</label>
                  <input
                    type="text"
                    value={editingCourse.location || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, location: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Course Cover Image</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={editingCourse.coverImage || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, coverImage: e.target.value })}
                      placeholder="Upload or enter cover image URL"
                      className="flex-1 min-w-[180px] bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#C9A45C] text-[#080808] font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[#E5C98A]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Crop</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          const dataUrl = await readImageFileAsDataUrl(file);
                          setInlineItemPhotoEditor({
                            section: 'courses',
                            field: 'cover',
                            title: editingCourse.title || file.name,
                            imageUrl: dataUrl,
                            originalImageUrl: dataUrl,
                            initialMeta: editingCourse.coverImageSettings || { aspectPreset: '16:9', fitMode: 'cover' },
                          });
                        }}
                      />
                    </label>
                    {editingCourse.coverImage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setInlineItemPhotoEditor({
                              section: 'courses',
                              field: 'cover',
                              title: editingCourse.title || 'Course Cover',
                              imageUrl: editingCourse.coverImage!,
                              originalImageUrl: editingCourse.coverImageSettings?.originalUrl || editingCourse.coverImage!,
                              initialMeta: editingCourse.coverImageSettings || { aspectPreset: '16:9', fitMode: 'cover' },
                            })
                          }
                          className="px-3 py-2 border border-[#C9A45C]/50 text-[#E5C98A]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCourse({
                              ...editingCourse,
                              coverImage: '',
                              coverImageSettings: null,
                            })
                          }
                          className="px-2.5 py-2 border border-red-500/40 text-red-400"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingCourse.description || ''}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, description: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end gap-3">
                  <button onClick={() => setEditingCourse(null)} className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingCourse.title?.trim()) return;
                      if (editingCourse.id) {
                        await updateAdminCourse(editingCourse.id, editingCourse);
                      } else {
                        await createAdminCourse(editingCourse);
                      }
                      setEditingCourse(null);
                      loadAllData();
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save Course (BDT)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CURRENCY & BDT PRICING MANAGEMENT TAB */}
          {activeTab === 'pricing' && currencySettings && (
            <div className="space-y-8 text-xs">
              {/* Currency Locale & Digit Format Card */}
              <div className="border border-[#C9A45C]/30 bg-[#121212] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#C9A45C]/20">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[#C9A45C] font-semibold">
                      Default System Currency
                    </div>
                    <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                      Bangladeshi Taka (BDT · ৳) Configuration
                    </h3>
                    <p className="text-[#A7A7A7] mt-1">
                      All public courses, packages, receipts, invoices, and reports render exclusively in ৳ BDT.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#A7A7A7] uppercase tracking-wider text-[10px]">
                      Number Format:
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await updateAdminCurrencySettings({ digitStyle: 'en' });
                        setCurrencySettings(updated);
                        showNotification('success', 'Display format set to English numerals (৳ 1,500).');
                      }}
                      className={`px-3 py-1.5 font-semibold border ${
                        currencySettings.digitStyle === 'en'
                          ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                          : 'bg-[#181818] text-[#A7A7A7] border-[#C9A45C]/30'
                      }`}
                    >
                      English (৳ 1,500)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await updateAdminCurrencySettings({ digitStyle: 'bn' });
                        setCurrencySettings(updated);
                        showNotification('success', 'Display format set to Bengali numerals (৳ ১,৫০০).');
                      }}
                      className={`px-3 py-1.5 font-semibold border ${
                        currencySettings.digitStyle === 'bn'
                          ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                          : 'bg-[#181818] text-[#A7A7A7] border-[#C9A45C]/30'
                      }`}
                    >
                      Bengali (৳ ১,৫০০)
                    </button>
                  </div>
                </div>

                {/* Course BDT Fee Confirmation Panel */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-[#E5C98A] font-semibold">
                    Course Tuition Fees (Confirm Exact BDT Amounts)
                  </div>
                  <div className="space-y-3">
                    {courses.map((crs) => {
                      const val =
                        draftCourseFees[crs.id] !== undefined
                          ? draftCourseFees[crs.id]
                          : crs.feeAmount !== null
                          ? String(crs.feeAmount)
                          : '';
                      return (
                        <div
                          key={crs.id}
                          className="p-4 border border-[#C9A45C]/20 bg-[#0B0B0B] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="font-semibold text-sm text-[#F5F5F5]">{crs.title}</div>
                            <div className="text-[#A7A7A7]">
                              {crs.bdtConfirmed && crs.feeAmount !== null ? (
                                <span className="text-emerald-400">
                                  Confirmed: {formatBDT(crs.feeAmount, digitStyle)}
                                </span>
                              ) : (
                                <span className="text-amber-300">
                                  Pending BDT Confirmation {crs.legacyUsdFee ? `(Previous legacy value: ${crs.legacyUsdFee})` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-[#181818] border border-[#C9A45C]/30">
                              <span className="px-2.5 py-1.5 text-[#C9A45C] font-bold">৳</span>
                              <input
                                type="number"
                                min={0}
                                value={val}
                                onChange={(e) =>
                                  setDraftCourseFees((prev) => ({
                                    ...prev,
                                    [crs.id]: e.target.value,
                                  }))
                                }
                                placeholder="e.g. 15000"
                                className="w-36 bg-transparent px-2 py-1.5 text-[#F5F5F5] focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const parsed = Number(val);
                                if (!val.trim() || Number.isNaN(parsed) || parsed < 0) {
                                  showNotification('error', 'Please enter a valid positive BDT amount.');
                                  return;
                                }
                                await updateAdminCourse(crs.id, {
                                  feeAmount: parsed,
                                  bdtConfirmed: true,
                                  currency: 'BDT',
                                });
                                showNotification('success', `Confirmed ${crs.title} fee: ${formatBDT(parsed, digitStyle)}`);
                                loadAllData();
                              }}
                              className="px-3.5 py-1.5 bg-[#C9A45C] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#E5C98A]"
                            >
                              Confirm BDT
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Service Charges & Influencer Packages (BDT) */}
              <div className="border border-[#C9A45C]/30 bg-[#121212] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C9A45C]/20">
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                      Service Charges, Modeling & Influencer Packages (BDT)
                    </h3>
                    <p className="text-[#A7A7A7]">
                      Set exact Bangladeshi Taka rates for brand promotions, commercial shoots, and runway bookings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPackage({
                        name: '',
                        category: 'Commercial Modeling',
                        description: '',
                        priceBdt: null,
                        currency: 'BDT',
                        bdtConfirmed: false,
                        deliverables: '',
                        status: 'published',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Service Package</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => {
                    const feeVal =
                      draftPackageFees[pkg.id] !== undefined
                        ? draftPackageFees[pkg.id]
                        : pkg.priceBdt !== null
                        ? String(pkg.priceBdt)
                        : '';
                    return (
                      <div
                        key={pkg.id}
                        className="border border-[#C9A45C]/20 bg-[#0B0B0B] p-4 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-[#C9A45C] font-semibold">
                              {pkg.category}
                            </span>
                            <span
                              className={`text-[10px] uppercase px-2 py-0.5 font-bold ${
                                pkg.status === 'published'
                                  ? 'bg-[#C9A45C] text-[#080808]'
                                  : 'bg-[#222] text-[#A7A7A7]'
                              }`}
                            >
                              {pkg.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-editorial font-bold text-[#F5F5F5]">{pkg.name}</h4>
                          <p className="text-[#A7A7A7]">{pkg.description}</p>
                          <div className="text-base font-editorial font-bold text-[#E5C98A]">
                            {formatBDT(pkg.priceBdt, digitStyle, 'Pending BDT Entry')}
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-[#C9A45C]/15">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 flex items-center bg-[#181818] border border-[#C9A45C]/30">
                              <span className="px-2 text-[#C9A45C] font-bold">৳</span>
                              <input
                                type="number"
                                min={0}
                                value={feeVal}
                                onChange={(e) =>
                                  setDraftPackageFees((prev) => ({
                                    ...prev,
                                    [pkg.id]: e.target.value,
                                  }))
                                }
                                placeholder="Amount BDT"
                                className="w-full bg-transparent px-1.5 py-1 text-[#F5F5F5] focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const parsed = Number(feeVal);
                                if (!feeVal.trim() || Number.isNaN(parsed) || parsed < 0) return;
                                await updateAdminPackage(pkg.id, {
                                  priceBdt: parsed,
                                  bdtConfirmed: true,
                                  status: 'published',
                                });
                                showNotification('success', `Saved & published ${pkg.name} in BDT.`);
                                loadAllData();
                              }}
                              className="px-2.5 py-1 bg-[#C9A45C] text-[#080808] font-bold uppercase text-[10px]"
                            >
                              Publish
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setEditingPackage(pkg)}
                              className="text-[11px] text-[#C9A45C] hover:underline"
                            >
                              Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Delete package "${pkg.name}"?`)) {
                                  await deleteAdminPackage(pkg.id);
                                  loadAllData();
                                }
                              }}
                              className="text-[11px] text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brand Collaboration BDT Budget Tiers */}
              <div className="border border-[#C9A45C]/30 bg-[#121212] p-6 space-y-4">
                <h3 className="text-base font-editorial font-bold text-[#F5F5F5]">
                  Public Collaboration Form Budget Tiers (BDT)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currencySettings.budgetTiersBdt.map((tier, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={tier}
                      onChange={(e) => {
                        const next = [...currencySettings.budgetTiersBdt];
                        next[idx] = e.target.value;
                        setCurrencySettings({ ...currencySettings, budgetTiersBdt: next });
                      }}
                      className="bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await updateAdminCurrencySettings({
                        budgetTiersBdt: currencySettings.budgetTiersBdt,
                      });
                      setCurrencySettings(updated);
                      showNotification('success', 'BDT budget tiers saved for public collaboration form.');
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                  >
                    Save BDT Budget Tiers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SERVICE PACKAGE MODAL */}
          {editingPackage && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="max-w-lg w-full bg-[#121212] border border-[#C9A45C]/40 p-6 space-y-4 text-xs text-[#F5F5F5]">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
                  <h3 className="text-base font-editorial font-bold">
                    {editingPackage.id ? 'Edit Service Package' : 'New Service Package (BDT)'}
                  </h3>
                  <button onClick={() => setEditingPackage(null)}>✕</button>
                </div>
                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Package Name *</label>
                  <input
                    type="text"
                    value={editingPackage.name || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Category</label>
                    <input
                      type="text"
                      value={editingPackage.category || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1">Rate (BDT ৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingPackage.priceBdt ?? ''}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          priceBdt: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Deliverables</label>
                  <input
                    type="text"
                    value={editingPackage.deliverables || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, deliverables: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingPackage.description || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, description: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2 text-[#F5F5F5]"
                  />
                </div>
                <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingPackage.name?.trim()) return;
                      if (editingPackage.id) {
                        await updateAdminPackage(editingPackage.id, editingPackage);
                      } else {
                        await createAdminPackage(editingPackage);
                      }
                      setEditingPackage(null);
                      loadAllData();
                    }}
                    className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-semibold"
                  >
                    Save Package
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: STUDENT REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#C9A45C]/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Student Registrations & BDT Receipts
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Review applicant profiles, payment status in BDT, and printable tuition receipts.
                  </p>
                </div>
                <div className="text-xs text-[#E5C98A] font-semibold">
                  Confirmed Tuition: {formatBDT(calculateRegistrationTotals(registrations, courses).confirmedRevenueBdt, digitStyle)}
                </div>
              </div>

              {registrations.length === 0 ? (
                <p className="text-xs text-[#A7A7A7]">No student registrations received yet.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => {
                    const linkedCourse = courses.find((c) => c.id === reg.courseId);
                    const amountBdt =
                      typeof reg.feeAmountBdt === 'number'
                        ? reg.feeAmountBdt
                        : linkedCourse?.bdtConfirmed
                        ? linkedCourse.feeAmount
                        : null;
                    return (
                      <div
                        key={reg.id}
                        className="border border-[#C9A45C]/25 bg-[#121212] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#F5F5F5]">{reg.fullName}</span>
                            <span className="text-[#C9A45C]">·</span>
                            <span className="text-[#E5C98A] font-medium">{reg.courseTitle}</span>
                            <span className="px-2 py-0.5 bg-[#181818] border border-[#C9A45C]/30 text-[#C9A45C] font-semibold">
                              {formatBDT(amountBdt, digitStyle, 'Pending BDT Fee')}
                            </span>
                          </div>
                          <div className="text-[#A7A7A7]">
                            Receipt: {reg.receiptNumber || reg.id} | Email: {reg.email} | Phone: {reg.phone} | Age: {reg.age || 'N/A'} | Height: {reg.height || 'N/A'}
                          </div>
                          <div className="text-[#666]">
                            Experience: {reg.previousExperience} | Notes: {reg.message || 'None'}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setReceiptDoc({
                                type: 'registration_receipt',
                                documentNumber: reg.receiptNumber || `REC-${reg.id}`,
                                issuedDate: reg.submittedAt,
                                recipientName: reg.fullName,
                                recipientEmail: reg.email,
                                recipientPhone: reg.phone,
                                lineItemTitle: reg.courseTitle,
                                lineItemDescription: `Offline Modeling Academy Tuition (${reg.status.toUpperCase()})`,
                                amountBdt,
                                statusLabel: `${reg.status} / ${reg.paymentStatus || 'pending'}`,
                                digitStyle,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1 border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/15"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>

                          <select
                            value={reg.status}
                            onChange={async (e) => {
                              await updateRegistrationStatus(reg.id, e.target.value, {
                                paymentStatus: e.target.value === 'approved' ? 'paid' : 'pending',
                                feeAmountBdt: amountBdt,
                              });
                              loadAllData();
                            }}
                            className="bg-[#181818] border border-[#C9A45C]/30 text-xs px-2.5 py-1 text-[#E5C98A]"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved (Paid)</option>
                            <option value="contacted">Contacted</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          <button
                            onClick={async () => {
                              if (confirm('Delete registration record?')) {
                                await deleteRegistration(reg.id);
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-950/20 border border-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: BRAND COLLABORATIONS */}
          {activeTab === 'collaborations' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#C9A45C]/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Brand Collaboration Inquiries & BDT Invoices
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Commercial brand proposals, quoted BDT fees, and printable client invoices.
                  </p>
                </div>
                <div className="text-xs text-[#E5C98A] font-semibold">
                  Quoted Pipeline: {formatBDT(calculateCollaborationTotals(collaborations).totalQuotedBdt, digitStyle)}
                </div>
              </div>

              {collaborations.length === 0 ? (
                <p className="text-xs text-[#A7A7A7]">No brand collaboration inquiries yet.</p>
              ) : (
                <div className="space-y-4">
                  {collaborations.map((collab) => {
                    const quoteVal =
                      draftCollabQuotes[collab.id] !== undefined
                        ? draftCollabQuotes[collab.id]
                        : collab.quotedAmountBdt !== null && collab.quotedAmountBdt !== undefined
                        ? String(collab.quotedAmountBdt)
                        : '';
                    return (
                      <div
                        key={collab.id}
                        className="border border-[#C9A45C]/25 bg-[#121212] p-6 space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#C9A45C]/15">
                          <div>
                            <span className="text-sm font-bold text-[#F5F5F5]">
                              {collab.companyName}
                            </span>
                            <span className="text-[#C9A45C] mx-2">·</span>
                            <span className="text-[#E5C98A] font-semibold">
                              {collab.collaborationType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setReceiptDoc({
                                  type: 'collaboration_invoice',
                                  documentNumber: collab.invoiceNumber || `INV-${collab.id}`,
                                  issuedDate: collab.submittedAt,
                                  recipientName: collab.contactPerson,
                                  recipientOrg: collab.companyName,
                                  recipientEmail: collab.email,
                                  recipientPhone: collab.phone || 'N/A',
                                  lineItemTitle: collab.collaborationType,
                                  lineItemDescription: collab.details,
                                  amountBdt: collab.quotedAmountBdt ?? null,
                                  statusLabel: collab.status,
                                  digitStyle,
                                })
                              }
                              className="flex items-center gap-1 px-2.5 py-1 border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/15"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Invoice (BDT)</span>
                            </button>

                            <select
                              value={collab.status}
                              onChange={async (e) => {
                                await updateCollaborationStatus(collab.id, e.target.value);
                                loadAllData();
                              }}
                              className="bg-[#181818] border border-[#C9A45C]/30 px-2.5 py-1 text-[#E5C98A]"
                            >
                              <option value="new">New Proposal</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="in_discussion">In Discussion</option>
                              <option value="closed">Closed / Signed</option>
                            </select>
                            <button
                              onClick={async () => {
                                if (confirm('Delete collaboration inquiry?')) {
                                  await deleteCollaboration(collab.id);
                                  loadAllData();
                                }
                              }}
                              className="p-1.5 text-red-400 border border-red-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[#A7A7A7]">
                          <div>
                            Representative:{' '}
                            <span className="text-[#F5F5F5] font-medium">{collab.contactPerson}</span>
                          </div>
                          <div>
                            Email: <span className="text-[#F5F5F5]">{collab.email}</span>
                          </div>
                          <div>
                            Phone: <span className="text-[#F5F5F5]">{collab.phone || 'N/A'}</span>
                          </div>
                          <div>
                            Budget (BDT):{' '}
                            <span className="text-[#E5C98A] font-bold">
                              {localizeBDTString(collab.budgetRange, digitStyle)}
                            </span>
                          </div>
                        </div>

                        {collab.legacyUsdBudget && !collab.quotedAmountBdt && (
                          <div className="text-[11px] text-amber-300">
                            Legacy proposal budget ({collab.legacyUsdBudget}) awaits exact BDT quote confirmation below.
                          </div>
                        )}

                        <div className="p-3 bg-[#181818] border border-[#C9A45C]/15 text-[#F5F5F5] leading-relaxed">
                          {collab.details}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[#A7A7A7]">Quoted Campaign Fee (BDT):</span>
                          <div className="flex items-center bg-[#181818] border border-[#C9A45C]/30">
                            <span className="px-2 text-[#C9A45C] font-bold">৳</span>
                            <input
                              type="number"
                              min={0}
                              value={quoteVal}
                              onChange={(e) =>
                                setDraftCollabQuotes((prev) => ({
                                  ...prev,
                                  [collab.id]: e.target.value,
                                }))
                              }
                              placeholder="Enter quoted BDT"
                              className="w-36 bg-transparent px-1.5 py-1 text-[#F5F5F5] focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const parsed = Number(quoteVal);
                              if (!quoteVal.trim() || Number.isNaN(parsed) || parsed < 0) return;
                              await updateCollaborationStatus(collab.id, collab.status, {
                                quotedAmountBdt: parsed,
                                budgetRange: formatBDT(parsed, 'en'),
                              });
                              showNotification('success', `Saved BDT quote: ${formatBDT(parsed, digitStyle)}`);
                              loadAllData();
                            }}
                            className="px-3 py-1 bg-[#C9A45C] text-[#080808] font-bold uppercase text-[10px]"
                          >
                            Save Quote
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 11: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#C9A45C]/20">
                <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                  Contact Messages
                </h3>
                <p className="text-xs text-[#A7A7A7]">
                  General inquiries, press questions, and direct notes from visitors.
                </p>
              </div>

              {messages.length === 0 ? (
                <p className="text-xs text-[#A7A7A7]">No contact messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border border-[#C9A45C]/25 bg-[#121212] p-5 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-[#C9A45C]/15">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5F5F5]">{msg.name}</span>
                          <span className="text-[#C9A45C]">·</span>
                          <span className="text-[#E5C98A]">{msg.subject}</span>
                          <span className="text-[#666]">({msg.email})</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={msg.status}
                            onChange={async (e) => {
                              await updateMessageStatus(msg.id, e.target.value);
                              loadAllData();
                            }}
                            className="bg-[#181818] border border-[#C9A45C]/30 px-2 py-1 text-[#E5C98A]"
                          >
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (confirm('Delete message?')) {
                                await deleteMessage(msg.id);
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[#F5F5F5] leading-relaxed pt-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 12: SOCIAL CHANNELS */}
          {activeTab === 'social' && socialLinks && (
            <div className="max-w-2xl border border-[#C9A45C]/25 bg-[#121212] p-8 space-y-6 text-xs">
              <div className="pb-4 border-b border-[#C9A45C]/20">
                <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                  Official Social Media Channels
                </h3>
                <p className="text-xs text-[#A7A7A7]">
                  Configure your verified social media profile links and contact numbers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    Facebook Profile Link
                  </label>
                  <input
                    type="text"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    Instagram Profile Link
                  </label>
                  <input
                    type="text"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    YouTube Channel Link
                  </label>
                  <input
                    type="text"
                    value={socialLinks.youtube}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    TikTok Profile Link
                  </label>
                  <input
                    type="text"
                    value={socialLinks.tiktok}
                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                      Official Hotline / Phone
                    </label>
                    <input
                      type="text"
                      value={socialLinks.phone}
                      onChange={(e) => setSocialLinks({ ...socialLinks, phone: e.target.value })}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={socialLinks.businessEmail}
                      onChange={(e) =>
                        setSocialLinks({ ...socialLinks, businessEmail: e.target.value })
                      }
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end">
                <button
                  onClick={async () => {
                    await updateAdminSocialLinks(socialLinks);
                    showNotification('success', 'Social links updated successfully.');
                  }}
                  className="px-6 py-2.5 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                >
                  Save Links
                </button>
              </div>
            </div>
          )}

          {/* TAB 13: SETTINGS & APPEARANCE */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-2xl border border-[#C9A45C]/25 bg-[#121212] p-8 space-y-6 text-xs">
              <div className="pb-4 border-b border-[#C9A45C]/20">
                <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                  Website Appearance & SEO Settings
                </h3>
                <p className="text-xs text-[#A7A7A7]">
                  Configure global metadata, search engine tags, and public module visibility.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    Public Website Title
                  </label>
                  <input
                    type="text"
                    value={settings.siteTitle}
                    onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                    Search Engine Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.metaDescription}
                    onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                  />
                </div>

                <div className="pt-4 border-t border-[#C9A45C]/20 space-y-3">
                  <div className="font-semibold uppercase tracking-wider text-[#E5C98A]">
                    Module Visibility Toggles
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showCourses}
                      onChange={(e) => setSettings({ ...settings, showCourses: e.target.checked })}
                      className="accent-[#C9A45C]"
                    />
                    <span>Publish Offline Modeling Courses section on website</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showCollaborations}
                      onChange={(e) =>
                        setSettings({ ...settings, showCollaborations: e.target.checked })
                      }
                      className="accent-[#C9A45C]"
                    />
                    <span>Publish Brand Collaboration proposal system on website</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#C9A45C]/20 flex justify-end">
                <button
                  onClick={async () => {
                    await updateAdminSettings(settings);
                    showNotification('success', 'Website settings saved.');
                  }}
                  className="px-6 py-2.5 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 14: ACCOUNT SECURITY & FIREBASE SYNC */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl text-xs">
              <div className="border border-[#C9A45C]/25 bg-[#121212] p-8 space-y-6">
                <div className="pb-4 border-b border-[#C9A45C]/20">
                  <h3 className="text-lg font-editorial font-bold text-[#F5F5F5]">
                    Account Security
                  </h3>
                  <p className="text-xs text-[#A7A7A7]">
                    Update your private master password using PBKDF2 cryptographic salt hashing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                      New Master Password (Min 8 chars) *
                    </label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-[#A7A7A7] mb-1 font-medium">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 p-2.5 text-[#F5F5F5]"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!currentPass || !newPass) {
                        showNotification('error', 'Please fill all password fields.');
                        return;
                      }
                      if (newPass !== confirmPass) {
                        showNotification('error', 'New passwords do not match.');
                        return;
                      }
                      try {
                        await changeAdminPassword(currentPass, newPass);
                        showNotification('success', 'Master password updated securely.');
                        setCurrentPass('');
                        setNewPass('');
                        setConfirmPass('');
                      } catch (err: any) {
                        showNotification('error', err.message || 'Failed to update password');
                      }
                    }}
                    className="w-full py-3 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                  >
                    Update Master Password
                  </button>
                </div>
              </div>

              <div className="border border-[#C9A45C]/25 bg-[#121212] p-8 space-y-5">
                <div className="pb-4 border-b border-[#C9A45C]/20 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-[#F5F5F5] flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#C9A45C]" />
                      <span>Firebase Cloud Firestore</span>
                    </h3>
                    <p className="text-xs text-[#A7A7A7] mt-1">
                      Project: {firebaseProjectId}
                    </p>
                  </div>
                </div>

                {firebaseUser ? (
                  <div className="space-y-4">
                    <div className="p-3.5 border border-[#C9A45C]/30 bg-[#181818] space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[#C9A45C] font-semibold">
                        Connected Google Account
                      </div>
                      <div className="text-[#F5F5F5] font-medium">{firebaseUser.email}</div>
                      <div className="text-[11px] text-[#A7A7A7]">
                        {isFirebaseOwner
                          ? 'Verified Owner write privileges active.'
                          : 'Read-only account. Sign in with owner email to push Firestore writes.'}
                      </div>
                    </div>

                    {cloudSummary && (
                      <div className="p-3 border border-[#C9A45C]/20 bg-[#0B0B0B] space-y-1 text-[11px] text-[#A7A7A7]">
                        <div>Cloud Projects: {cloudSummary.projectsCount}</div>
                        <div>Cloud Courses: {cloudSummary.coursesCount}</div>
                        {cloudSummary.siteConfigUpdatedAt && (
                          <div>Last Cloud Sync: {new Date(cloudSummary.siteConfigUpdatedAt).toLocaleString()}</div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={cloudSyncing || !isFirebaseOwner}
                        onClick={async () => {
                          if (!firebaseUser) return;
                          setCloudSyncing(true);
                          try {
                            const res = await syncFullPortfolioToFirestore(firebaseUser.uid, {
                              profile,
                              projects,
                              media,
                              groups,
                              events,
                              awards,
                              courses,
                              packages,
                              frames: imageFrames,
                              socialLinks,
                              websiteSettings: settings,
                              currencySettings,
                            });
                            const summary = await fetchFirestoreStatusSummary();
                            setCloudSummary(summary);
                            showNotification(
                              'success',
                              `Synced ${res.syncedCount} document(s) to Cloud Firestore.`
                            );
                          } catch (err: any) {
                            showNotification('error', err.message || 'Firestore sync failed.');
                          } finally {
                            setCloudSyncing(false);
                          }
                        }}
                        className="flex-1 py-2.5 px-4 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider disabled:opacity-50"
                      >
                        {cloudSyncing ? 'Syncing...' : 'Sync Portfolio to Firestore'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await signOutFirebase();
                          setCloudSummary(null);
                          showNotification('success', 'Disconnected Google Firebase session.');
                        }}
                        className="py-2.5 px-4 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[#A7A7A7] leading-relaxed">
                      Connect your verified Google Owner account via Firebase Authentication to push and synchronize portfolio collections directly into Cloud Firestore.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signInWithGoogle();
                          const summary = await fetchFirestoreStatusSummary().catch(() => null);
                          if (summary) setCloudSummary(summary);
                          showNotification('success', 'Google Firebase account connected.');
                        } catch (err: any) {
                          showNotification('error', err.message || 'Failed to sign in with Google.');
                        }
                      }}
                      className="w-full py-3 bg-[#C9A45C] text-[#080808] font-semibold uppercase tracking-wider"
                    >
                      Connect Google Account (Firebase)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* WEBSITE FRAME PHOTO EDITOR MODAL */}
      {activeFrameSlotEditor && (() => {
        const frame = imageFrames.find((f) => f.slot === activeFrameSlotEditor);
        if (!frame) return null;
        return (
          <PhotoEditorModal
            isOpen={true}
            title={`Frame Editor: ${frame.label}`}
            imageUrl={frame.imageSettings.editedUrl || frame.imageSettings.originalUrl}
            originalImageUrl={frame.imageSettings.originalUrl}
            initialMetadata={frame.imageSettings}
            defaultAspectPreset={frame.defaultAspect}
            frameSlots={imageFrames}
            activeFrameSlot={activeFrameSlotEditor}
            onChangeFrameSlot={(slot) => setActiveFrameSlotEditor(slot)}
            onSave={handleSaveFrameEditor}
            onClose={() => setActiveFrameSlotEditor(null)}
          />
        );
      })()}

      {/* PER-SECTION IMAGE MANAGER MODAL (Courses, Portfolio, Events, Awards) */}
      {activeSectionImageManager && (
        <SectionImageManagerModal
          isOpen={true}
          section={activeSectionImageManager}
          courses={courses}
          projects={projects}
          events={events}
          awards={awards}
          mediaLibrary={media}
          onRefreshData={loadAllData}
          onNotify={showNotification}
          onClose={() => setActiveSectionImageManager(null)}
        />
      )}

      {/* INLINE ITEM PHOTO EDITOR MODAL */}
      {inlineItemPhotoEditor && (
        <PhotoEditorModal
          isOpen={true}
          title={inlineItemPhotoEditor.title}
          imageUrl={inlineItemPhotoEditor.imageUrl}
          originalImageUrl={inlineItemPhotoEditor.originalImageUrl}
          initialMetadata={inlineItemPhotoEditor.initialMeta}
          defaultAspectPreset={
            inlineItemPhotoEditor.field === 'certificate'
              ? 'original'
              : inlineItemPhotoEditor.section === 'courses' || inlineItemPhotoEditor.section === 'events'
              ? '16:9'
              : inlineItemPhotoEditor.section === 'awards'
              ? '1:1'
              : '4:5'
          }
          defaultFitMode={inlineItemPhotoEditor.section === 'awards' ? 'contain' : 'cover'}
          sectionScope={inlineItemPhotoEditor.section}
          sectionName={inlineItemPhotoEditor.section.toUpperCase()}
          onSave={async (result) => {
            const saved = await saveSectionImage({
              editedDataUrl: result.editedDataUrl.startsWith('data:') ? result.editedDataUrl : undefined,
              originalDataUrl: result.originalDataUrl,
              existingUrl: result.editedDataUrl.startsWith('data:') ? undefined : result.editedDataUrl,
              existingOriginalUrl: inlineItemPhotoEditor.originalImageUrl,
              fileName: `${inlineItemPhotoEditor.section}_${Date.now()}`,
              title: inlineItemPhotoEditor.title,
              sectionName: inlineItemPhotoEditor.section,
              category:
                inlineItemPhotoEditor.section === 'courses'
                  ? 'Courses'
                  : inlineItemPhotoEditor.section === 'events'
                  ? 'Events & Experiences'
                  : inlineItemPhotoEditor.section === 'awards'
                  ? 'Awards & Achievements'
                  : 'Portfolio',
              cropMetadata: result.cropMetadata,
              status: result.status,
              addToGallery: Boolean(result.originalDataUrl),
            });

            if (inlineItemPhotoEditor.section === 'portfolio' && editingProject) {
              setEditingProject({
                ...editingProject,
                coverImage: saved.url,
                coverImageSettings: saved.cropMetadata,
              });
            } else if (inlineItemPhotoEditor.section === 'events' && editingEvent) {
              setEditingEvent({
                ...editingEvent,
                coverImage: saved.url,
                coverImageSettings: saved.cropMetadata,
              });
            } else if (inlineItemPhotoEditor.section === 'courses' && editingCourse) {
              setEditingCourse({
                ...editingCourse,
                coverImage: saved.url,
                coverImageSettings: saved.cropMetadata,
              });
            } else if (inlineItemPhotoEditor.section === 'awards' && editingAward) {
              if (inlineItemPhotoEditor.field === 'certificate') {
                setEditingAward({
                  ...editingAward,
                  certificateImage: saved.url,
                  certificateImageSettings: saved.cropMetadata,
                });
              } else {
                setEditingAward({
                  ...editingAward,
                  trophyImage: saved.url,
                  trophyImageSettings: saved.cropMetadata,
                });
              }
            }
            setInlineItemPhotoEditor(null);
            showNotification('success', 'Image cropped and staged. Click Save to persist changes.');
          }}
          onClose={() => setInlineItemPhotoEditor(null)}
        />
      )}

      {/* BDT RECEIPT / INVOICE MODAL */}
      <ReceiptInvoiceModal
        document={receiptDoc}
        onClose={() => setReceiptDoc(null)}
      />
    </div>
  );
};
