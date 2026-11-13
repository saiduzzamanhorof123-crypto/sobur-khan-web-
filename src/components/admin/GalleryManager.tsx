import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Star,
  Eye,
  ArrowUp,
  ArrowDown,
  X,
  FileCheck,
  Download,
  UploadCloud,
  SlidersHorizontal,
  ExternalLink,
  Scissors,
} from 'lucide-react';
import {
  fetchAdminMedia,
  uploadMultipleAdminImages,
  replaceAdminImage,
  cropAdminMedia,
  deleteAdminMedia,
  updateAdminMedia,
  reorderAdminMedia,
  downloadDatabaseBackup,
  restoreDatabaseBackup,
} from '../../api/client';
import {
  MediaItem,
  MediaCategory,
  PublicationStatus,
  ImageCropMetadata,
} from '../../types';
import { PhotoEditorModal, PhotoEditorSaveResult } from './PhotoEditorModal';

const CATEGORIES: MediaCategory[] = [
  'Profile Photos',
  'Professional Modeling',
  'Fashion Photography',
  'Photoshoot',
  'Editorial Modeling',
  'Commercial Modeling',
  'Events & Experiences',
  'Modeling Group',
  'Awards & Achievements',
  'Featured Gallery',
];

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl: string;
  originalDataUrl: string;
  cropMetadata?: Partial<ImageCropMetadata>;
  title: string;
  category: MediaCategory;
  description: string;
  status: PublicationStatus;
  featured: boolean;
  fileSize: string;
}

interface GalleryManagerProps {
  onRefreshParent?: () => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ onRefreshParent }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Staged uploads for batch workflow
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modals
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deleteConfirmationItem, setDeleteConfirmationItem] = useState<MediaItem | null>(null);
  const [deleteUsageWarning, setDeleteUsageWarning] = useState<Array<{ section: string; id: string; title: string; field: string }>>([]);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [photoEditorTarget, setPhotoEditorTarget] = useState<
    | { kind: 'staged'; staged: StagedFile }
    | { kind: 'media'; item: MediaItem }
    | null
  >(null);

  // DOM file input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const mainUploadId = useId();
  const dropzoneUploadId = useId();

  const loadMedia = async () => {
    try {
      setLoading(true);
      const items = await fetchAdminMedia();
      setMediaList(items || []);
      if (onRefreshParent) onRefreshParent();
    } catch (e: any) {
      showNotice('error', e.message || 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Convert File to Base64 Data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection from native picker or drag-drop
  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = [];
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowed.includes(file.type.toLowerCase())) {
        showNotice('error', `Skipped "${file.name}": Only JPG, PNG, and WEBP formats supported.`);
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const cleanTitle = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);

        newStaged.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: dataUrl,
          dataUrl,
          originalDataUrl: dataUrl,
          title: cleanTitle,
          category: 'Fashion Photography',
          description: '',
          status: 'published',
          featured: false,
          fileSize: formatBytes(file.size),
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
      if (newStaged.length === 1) {
        setPhotoEditorTarget({ kind: 'staged', staged: newStaged[0] });
      }
      showNotice(
        'info',
        `${newStaged.length} image(s) staged. Crop, zoom & position each image before publishing.`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateStagedFile = (id: string, updates: Partial<StagedFile>) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Perform upload of staged files
  const handleBatchUpload = async () => {
    if (stagedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const payload = stagedFiles.map((sf) => ({
        dataUrl: sf.dataUrl,
        originalDataUrl: sf.originalDataUrl,
        cropMetadata: sf.cropMetadata,
        fileName: sf.file.name,
        title: sf.title.trim() || 'Sobur Ali Khan - Luxury Portrait',
        category: sf.category,
        description: sf.description.trim(),
        status: sf.status,
        featured: sf.featured,
        fileSize: sf.fileSize,
      }));

      setUploadProgress(50);
      const res = await uploadMultipleAdminImages(payload);
      setUploadProgress(100);

      setStagedFiles([]);

      showNotice('success', `Success! ${res.count} image(s) uploaded and saved to persistent database.`);
      await loadMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Upload failed. Please check network connection.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePhotoEditorSave = async (result: PhotoEditorSaveResult) => {
    if (!photoEditorTarget) return;

    if (photoEditorTarget.kind === 'staged') {
      const targetId = photoEditorTarget.staged.id;
      updateStagedFile(targetId, {
        dataUrl: result.editedDataUrl,
        previewUrl: result.editedDataUrl,
        originalDataUrl: result.originalDataUrl || photoEditorTarget.staged.originalDataUrl,
        cropMetadata: result.cropMetadata,
        status: result.status,
      });
      setPhotoEditorTarget(null);
      showNotice(
        'success',
        `Crop & framing applied (${result.cropMetadata.aspectPreset}). Click "Confirm & Upload" to publish.`
      );
      return;
    }

    const updated = await cropAdminMedia(photoEditorTarget.item.id, {
      editedDataUrl: result.editedDataUrl,
      fileName: photoEditorTarget.item.title,
      cropMetadata: result.cropMetadata,
      status: result.status,
    });
    setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setPhotoEditorTarget(null);
    showNotice(
      'success',
      `Photo crop & positioning saved (${updated.status.toUpperCase()}). Original image preserved.`
    );
    if (onRefreshParent) onRefreshParent();
  };

  // Single file replacement
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingItemId) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      await replaceAdminImage(replacingItemId, {
        dataUrl,
        fileName: file.name,
      });

      showNotice('success', 'Image successfully replaced on disk and in database.');
      setReplacingItemId(null);
      await loadMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Replacement failed.');
    } finally {
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Quick toggle publication status
  const handleToggleStatus = async (item: MediaItem) => {
    try {
      const newStatus: PublicationStatus = item.status === 'published' ? 'draft' : 'published';
      await updateAdminMedia(item.id, { status: newStatus });
      showNotice(
        'success',
        `Image "${item.title}" set to ${newStatus.toUpperCase()}.${
          newStatus === 'draft' ? ' (Hidden from public website)' : ' (Live on public website)'
        }`
      );
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, status: newStatus } : m))
      );
    } catch (err: any) {
      showNotice('error', err.message || 'Status update failed.');
    }
  };

  // Quick toggle featured status
  const handleToggleFeatured = async (item: MediaItem) => {
    try {
      const newFeatured = !item.featured;
      await updateAdminMedia(item.id, { featured: newFeatured });
      showNotice(
        'success',
        `"${item.title}" ${newFeatured ? 'marked as Featured highlight' : 'removed from Featured'}`
      );
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, featured: newFeatured } : m))
      );
    } catch (err: any) {
      showNotice('error', err.message || 'Featured update failed.');
    }
  };

  // Execute deletion after confirmation
  const handleConfirmDelete = async (force = false) => {
    if (!deleteConfirmationItem) return;
    try {
      await deleteAdminMedia(deleteConfirmationItem.id, force);
      showNotice(
        'success',
        `Image "${deleteConfirmationItem.title}" removed from gallery.`
      );
      setDeleteConfirmationItem(null);
      setDeleteUsageWarning([]);
      await loadMedia();
    } catch (err: any) {
      if (err?.status === 409 && Array.isArray(err.usages)) {
        setDeleteUsageWarning(err.usages);
        return;
      }
      showNotice('error', err.message || 'Delete operation failed.');
    }
  };

  // Save edited metadata
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateAdminMedia(editingItem.id, {
        title: editingItem.title,
        category: editingItem.category,
        description: editingItem.description,
        status: editingItem.status,
        featured: editingItem.featured,
      });
      showNotice('success', 'Image details updated successfully.');
      setEditingItem(null);
      await loadMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Update failed.');
    }
  };

  // Reorder items
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const newOrder = [...mediaList];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setMediaList(newOrder);

    try {
      await reorderAdminMedia(newOrder.map((m) => m.id));
      showNotice('success', 'Gallery order updated.');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to persist order.');
      loadMedia();
    }
  };

  // Backup & Recovery
  const handleExportBackup = async () => {
    try {
      await downloadDatabaseBackup();
      showNotice('success', 'Database JSON backup successfully downloaded.');
    } catch (err: any) {
      showNotice('error', err.message || 'Backup download failed.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring a backup replaces current database state. Proceed?')) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      await restoreDatabaseBackup(snapshot);
      showNotice('success', 'Database successfully restored from JSON snapshot.');
      await loadMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to restore backup snapshot.');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  // Filtered list
  const filteredList = mediaList.filter((item) => {
    const matchCategory =
      activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
    const matchStatus =
      activeStatusFilter === 'all' || item.status === activeStatusFilter;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        onChange={(e) => handleFilesAdded(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleReplaceFile}
        className="hidden"
      />
      <input
        ref={backupInputRef}
        type="file"
        accept=".json"
        onChange={handleImportBackup}
        className="hidden"
      />

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div
          className={`p-4 border text-xs flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#E5C98A]'
              : notification.type === 'error'
              ? 'border-red-500 bg-red-950/40 text-red-300'
              : 'border-[#C9A45C]/40 bg-[#121212] text-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#C9A45C] shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <UploadCloud className="w-4 h-4 text-[#C9A45C] shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs uppercase tracking-wider text-[#A7A7A7] hover:text-[#F5F5F5] ml-4"
          >
            Close
          </button>
        </div>
      )}

      {/* HEADER SECTION WITH HERO UPLOAD BUTTON */}
      <div className="bg-gradient-to-r from-[#121212] via-[#161616] to-[#121212] border border-[#C9A45C]/30 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C9A45C] font-semibold">
              <ImageIcon className="w-4 h-4" />
              <span>Professional Portfolio Gallery & Media Vault</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-editorial font-bold text-[#F5F5F5]">
              Upload & Manage High-Fashion Photographs
            </h2>
            <p className="text-xs md:text-sm text-[#A7A7A7] max-w-2xl leading-relaxed">
              Directly select photos from your mobile phone Gallery or computer folder. Support for multi-file batch upload, drag-and-drop, category assignment, draft/published protection, and persistent server storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Primary Big Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-6 py-3.5 text-xs md:text-sm uppercase tracking-widest font-bold text-[#080808] bg-gradient-to-r from-[#C9A45C] via-[#E5C98A] to-[#C9A45C] hover:opacity-95 transition-all shadow-[0_0_20px_rgba(201,164,92,0.3)] active:scale-95"
            >
              <Upload className="w-5 h-5 text-[#080808]" />
              <span>Upload Photos</span>
            </button>

            {/* Backup & Recovery Button */}
            <button
              onClick={handleExportBackup}
              title="Download Full Database Backup Snapshot"
              className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider text-[#E5C98A] border border-[#C9A45C]/30 hover:bg-[#C9A45C]/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Backup</span>
            </button>

            <button
              onClick={() => backupInputRef.current?.click()}
              title="Restore Database from JSON Snapshot"
              className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/20 hover:bg-[#181818] transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* DRAG & DROP ZONE (Collapsible or Always Active) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesAdded(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#C9A45C] bg-[#C9A45C]/10 scale-[1.01]'
            : 'border-[#C9A45C]/25 bg-[#0F0F0F] hover:border-[#C9A45C]/50 hover:bg-[#121212]'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#181818] border border-[#C9A45C]/30 flex items-center justify-center text-[#C9A45C]">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider">
              Drag & Drop Images Here, or <span className="text-[#C9A45C] underline">Browse Files</span>
            </div>
            <div className="text-xs text-[#A7A7A7] mt-1">
              Supports JPG, JPEG, PNG, WEBP · Select multiple files at once · Native camera and gallery support on mobile
            </div>
          </div>
        </div>
      </div>

      {/* STAGED FILES REVIEW QUEUE (Shows when files are picked but not yet uploaded) */}
      {stagedFiles.length > 0 && (
        <div className="border border-[#C9A45C]/40 bg-[#121212] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C9A45C]/20 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#C9A45C]" />
                <h3 className="text-base font-editorial font-bold text-[#F5F5F5]">
                  Staged Upload Queue ({stagedFiles.length} Image{stagedFiles.length > 1 ? 's' : ''})
                </h3>
              </div>
              <p className="text-xs text-[#A7A7A7]">
                Configure titles, categories, and publication state before saving permanently.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStagedFiles([])}
                disabled={isUploading}
                className="px-3 py-1.5 text-xs text-[#A7A7A7] hover:text-red-400 border border-transparent hover:border-red-900/40"
              >
                Clear All
              </button>

              <button
                onClick={handleBatchUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest font-bold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#080808]" />
                    <span>Uploading... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Upload ({stagedFiles.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="w-full bg-[#1F1F1F] h-2 overflow-hidden border border-[#C9A45C]/20">
              <div
                className="bg-[#C9A45C] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Staged Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stagedFiles.map((sf) => (
              <div
                key={sf.id}
                className="border border-[#C9A45C]/20 bg-[#0A0A0A] p-4 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] bg-[#181818] relative overflow-hidden border border-[#C9A45C]/15">
                    <img
                      src={sf.previewUrl}
                      alt={sf.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoEditorTarget({ kind: 'staged', staged: sf })}
                      className="absolute top-2 left-2 px-2.5 py-1 bg-[#C9A45C] text-[#080808] text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 hover:bg-[#E5C98A]"
                      title="Crop, Zoom & Position before uploading"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Crop & Edit</span>
                    </button>
                    <button
                      onClick={() => removeStagedFile(sf.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white hover:bg-red-600"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#080808]/80 text-[10px] text-[#A7A7A7]">
                      {sf.fileSize} {sf.cropMetadata ? `· Cropped (${sf.cropMetadata.aspectPreset})` : ''}
                    </div>
                  </div>

                  {/* Title input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={sf.title}
                      onChange={(e) => updateStagedFile(sf.id, { title: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141414] border border-[#C9A45C]/30 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      placeholder="e.g. Paris Runway Special"
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                      Category
                    </label>
                    <select
                      value={sf.category}
                      onChange={(e) =>
                        updateStagedFile(sf.id, { category: e.target.value as MediaCategory })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141414] border border-[#C9A45C]/30 text-[#E5C98A] focus:outline-none focus:border-[#C9A45C]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#121212] text-[#F5F5F5]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={sf.description}
                      onChange={(e) => updateStagedFile(sf.id, { description: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141414] border border-[#C9A45C]/30 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      placeholder="Event credits, designer, location..."
                    />
                  </div>

                  {/* Publication status & Featured */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <select
                        value={sf.status}
                        onChange={(e) =>
                          updateStagedFile(sf.id, {
                            status: e.target.value as PublicationStatus,
                          })
                        }
                        className="text-[11px] px-2 py-1 bg-[#141414] border border-[#C9A45C]/30 text-[#F5F5F5]"
                      >
                        <option value="published">Published (Public)</option>
                        <option value="draft">Draft (Private)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-[#E5C98A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sf.featured}
                        onChange={(e) => updateStagedFile(sf.id, { featured: e.target.checked })}
                        className="accent-[#C9A45C]"
                      />
                      <span>Featured</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[#121212] border border-[#C9A45C]/20 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#C9A45C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by photo title, category, description..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#0A0A0A] border border-[#C9A45C]/25 text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#C9A45C]"
            />
          </div>

          {/* Quick status filters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A7A7A7] uppercase tracking-wider text-[10px]">Status:</span>
            {['all', 'published', 'draft', 'archived'].map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-3 py-1 uppercase tracking-wider text-[11px] font-semibold transition-colors ${
                  activeStatusFilter === st
                    ? 'bg-[#C9A45C] text-[#080808]'
                    : 'text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/20'
                }`}
              >
                {st}
              </button>
            ))}

            <button
              onClick={loadMedia}
              disabled={loading}
              className="p-1.5 border border-[#C9A45C]/30 text-[#C9A45C] hover:bg-[#C9A45C]/10 ml-2"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#A7A7A7] uppercase tracking-wider text-[10px] shrink-0">Category:</span>
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1 whitespace-nowrap uppercase tracking-wider text-[10px] font-semibold shrink-0 transition-colors ${
              activeCategoryFilter === 'all'
                ? 'bg-[#C9A45C] text-[#080808]'
                : 'bg-[#181818] text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/15'
            }`}
          >
            All Categories ({mediaList.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = mediaList.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 whitespace-nowrap uppercase tracking-wider text-[10px] font-semibold shrink-0 transition-colors ${
                  activeCategoryFilter === cat
                    ? 'bg-[#C9A45C] text-[#080808]'
                    : 'bg-[#181818] text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/15'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* GALLERY GRID VIEW */}
      {loading ? (
        <div className="py-20 text-center text-[#C9A45C] space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C9A45C]" />
          <div className="text-xs uppercase tracking-widest">Loading High-Fashion Media...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="border border-dashed border-[#C9A45C]/30 p-12 text-center bg-[#101010] space-y-3">
          <ImageIcon className="w-10 h-10 text-[#C9A45C]/50 mx-auto" />
          <div className="text-sm font-editorial text-[#F5F5F5]">No Photographs Match Filter</div>
          <p className="text-xs text-[#A7A7A7] max-w-md mx-auto">
            Click "Upload Photos" above to select images from your mobile gallery or computer files.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map((item, index) => (
            <div
              key={item.id}
              className={`border transition-all flex flex-col justify-between overflow-hidden bg-[#121212] group ${
                item.featured ? 'border-[#C9A45C] shadow-[0_0_15px_rgba(201,164,92,0.15)]' : 'border-[#C9A45C]/25'
              }`}
            >
              {/* Image Preview & Hover Actions */}
              <div className="aspect-[4/3] bg-[#181818] relative overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-bold ${
                      item.status === 'published'
                        ? 'bg-[#C9A45C] text-[#080808]'
                        : item.status === 'draft'
                        ? 'bg-[#252525] text-[#A7A7A7] border border-[#555]'
                        : 'bg-red-950 text-red-300'
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.featured && (
                    <span className="p-1 bg-[#C9A45C] text-[#080808]" title="Featured Highlight">
                      <Star className="w-3 h-3 fill-current" />
                    </span>
                  )}
                </div>

                {/* Quick overlay controls */}
                <div className="absolute inset-0 bg-[#080808]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-1.5 ${
                        item.featured
                          ? 'text-[#E5C98A] bg-[#080808]/80'
                          : 'text-[#A7A7A7] hover:text-[#E5C98A] bg-[#080808]/60'
                      }`}
                      title={item.featured ? 'Unmark Featured' : 'Mark Featured'}
                    >
                      <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-[#080808]/80 text-[#F5F5F5] hover:text-[#C9A45C] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === mediaList.length - 1}
                        className="p-1.5 bg-[#080808]/80 text-[#F5F5F5] hover:text-[#C9A45C] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setPhotoEditorTarget({ kind: 'media', item })}
                      className="w-full py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold bg-[#C9A45C] text-[#080808] hover:bg-[#E5C98A] flex items-center justify-center gap-1.5"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Crop, Zoom & Position</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setReplacingItemId(item.id);
                          replaceInputRef.current?.click();
                        }}
                        className="flex-1 py-1 px-2 text-[10px] uppercase tracking-wider font-semibold bg-[#1F1F1F] text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] transition-colors border border-[#C9A45C]/30 text-center"
                      >
                        Replace Image
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 bg-[#1F1F1F] text-[#C9A45C] hover:bg-[#C9A45C] hover:text-[#080808] border border-[#C9A45C]/30"
                        title="Edit Info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmationItem(item)}
                        className="p-1.5 bg-red-950/80 text-red-300 hover:bg-red-600 hover:text-white border border-red-800/40"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.url);
                        showNotice('success', 'Image URL copied to clipboard.');
                      }}
                      className="w-full py-1 text-[10px] uppercase tracking-wider text-[#A7A7A7] hover:text-[#F5F5F5] bg-[#0A0A0A]/90"
                    >
                      Copy Path
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#C9A45C] font-semibold truncate">
                    {item.category}
                  </span>
                  {item.fileSize && (
                    <span className="text-[9px] text-[#777] font-mono">{item.fileSize}</span>
                  )}
                </div>

                <div className="font-medium text-[#F5F5F5] truncate font-editorial text-sm">
                  {item.title}
                </div>

                {item.description && (
                  <p className="text-[11px] text-[#888] line-clamp-1">{item.description}</p>
                )}

                {/* Publish / Draft Quick Toggle Bar */}
                <div className="pt-2 border-t border-[#C9A45C]/15 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${
                      item.status === 'published'
                        ? 'border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]'
                        : 'border-[#C9A45C] bg-[#C9A45C] text-[#080808]'
                    }`}
                  >
                    {item.status === 'published' ? 'Set to Draft' : 'Publish Live'}
                  </button>

                  <span className="text-[10px] text-[#555] font-mono">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#C9A45C] max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#C9A45C]/20">
              <h3 className="text-base font-editorial font-bold text-[#F5F5F5]">
                Edit Photograph Metadata
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#A7A7A7] hover:text-[#F5F5F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="aspect-[16/9] bg-[#181818] overflow-hidden border border-[#C9A45C]/20">
                <img
                  src={editingItem.url}
                  alt={editingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#C9A45C]/30 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Category
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value as MediaCategory })
                  }
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#C9A45C]/30 text-[#E5C98A] focus:outline-none focus:border-[#C9A45C]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#121212]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#C9A45C]/30 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                    Publication Status
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value as PublicationStatus,
                      })
                    }
                    className="px-3 py-1.5 bg-[#0A0A0A] border border-[#C9A45C]/30 text-[#F5F5F5]"
                  >
                    <option value="published">Published (Visible to public)</option>
                    <option value="draft">Draft (Private admin only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-4 text-[#E5C98A]">
                  <input
                    type="checkbox"
                    checked={editingItem.featured || false}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, featured: e.target.checked })
                    }
                    className="accent-[#C9A45C]"
                  />
                  <span>Mark as Featured</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C9A45C]/20">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-[#A7A7A7] hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs uppercase tracking-widest font-bold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmationItem && (
        <div className="fixed inset-0 z-50 bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-red-700/60 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-editorial font-bold text-[#F5F5F5]">
                Confirm Permanent Deletion
              </h3>
            </div>

            <p className="text-xs text-[#A7A7A7] leading-relaxed">
              Are you sure you want to delete <span className="text-[#F5F5F5] font-semibold">"{deleteConfirmationItem.title}"</span>?
            </p>

            {deleteUsageWarning.length > 0 ? (
              <div className="p-3 bg-amber-950/30 border border-amber-500/60 text-[11px] text-amber-200 space-y-1.5">
                <div className="font-bold uppercase tracking-wider text-amber-300">
                  Cross-Section Usage Warning
                </div>
                <p>
                  This image is still used in {deleteUsageWarning.length} active section(s):
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {deleteUsageWarning.slice(0, 5).map((u, i) => (
                    <li key={i}>
                      {u.section}: {u.title} ({u.field})
                    </li>
                  ))}
                </ul>
                <p className="text-[10px]">
                  Deleting from Gallery will keep the image file intact for those other sections.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-red-950/20 border border-red-900/40 text-[11px] text-red-300">
                Notice: Deleting removes this image from the gallery and cleans up unused files from server storage.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setDeleteConfirmationItem(null);
                  setDeleteUsageWarning([]);
                }}
                className="px-4 py-2 text-xs uppercase tracking-wider text-[#A7A7A7] hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteUsageWarning.length > 0)}
                className="px-5 py-2 text-xs uppercase tracking-widest font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                {deleteUsageWarning.length > 0 ? 'Remove Anyway' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO CROP, ZOOM & POSITION EDITOR MODAL */}
      {photoEditorTarget && (
        <PhotoEditorModal
          isOpen={true}
          title={
            photoEditorTarget.kind === 'staged'
              ? `Edit Staged Photo: ${photoEditorTarget.staged.title}`
              : `Edit Gallery Photo: ${photoEditorTarget.item.title}`
          }
          imageUrl={
            photoEditorTarget.kind === 'staged'
              ? photoEditorTarget.staged.dataUrl
              : photoEditorTarget.item.url
          }
          originalImageUrl={
            photoEditorTarget.kind === 'staged'
              ? photoEditorTarget.staged.originalDataUrl
              : photoEditorTarget.item.originalUrl || photoEditorTarget.item.url
          }
          initialMetadata={
            photoEditorTarget.kind === 'staged'
              ? photoEditorTarget.staged.cropMetadata
              : photoEditorTarget.item.cropMetadata
          }
          defaultAspectPreset="3:4"
          onSave={handlePhotoEditorSave}
          onClose={() => setPhotoEditorTarget(null)}
        />
      )}
    </div>
  );
};
