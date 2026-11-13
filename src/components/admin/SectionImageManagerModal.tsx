import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Scissors,
  Trash2,
  Eye,
  RotateCcw,
  Star,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Plus,
  CheckSquare,
  Square,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  AwardItem,
  EventItem,
  ImageCropMetadata,
  ImageDisplaySize,
  ImageFitMode,
  MediaItem,
  ModelingCourse,
  PortfolioProject,
  SectionImageItem,
} from '../../types';
import {
  checkAdminImageUsage,
  ImageUsageRef,
  restoreDefaultImages,
  saveSectionImage,
  updateAdminAward,
  updateAdminCourse,
  updateAdminEvent,
  updateAdminProject,
} from '../../api/client';
import {
  formatAspectLabel,
  formatDisplaySizeLabel,
  getSectionImageContainerProps,
  isDefaultAssetUrl,
  reorderSectionImages,
  SectionImageScope,
} from '../../utils/imageDisplay';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';
import { PhotoEditorModal, PhotoEditorSaveResult } from './PhotoEditorModal';

interface SectionImageManagerModalProps {
  isOpen: boolean;
  section: SectionImageScope;
  courses: ModelingCourse[];
  projects: PortfolioProject[];
  events: EventItem[];
  awards: AwardItem[];
  mediaLibrary: MediaItem[];
  onRefreshData: () => Promise<void> | void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onClose: () => void;
}

type EditorTarget = {
  itemId: string;
  itemTitle: string;
  slotType: 'cover' | 'trophy' | 'certificate' | 'gallery_item';
  galleryIndex?: number;
  imageUrl: string;
  originalImageUrl?: string;
  initialMeta?: Partial<ImageCropMetadata> | null;
  isNewUpload?: boolean;
};

type ConfirmDeleteState = {
  title: string;
  description: string;
  usages: ImageUsageRef[];
  onConfirm: () => Promise<void>;
};

const SECTION_META: Record<
  SectionImageScope,
  {
    title: string;
    subtitle: string;
    category: string;
    defaultAspect: '16:9' | '4:5' | '1:1' | 'original';
    defaultFit: ImageFitMode;
  }
> = {
  courses: {
    title: 'Offline Courses — Image Manager',
    subtitle:
      'Upload, crop, resize (Small/Medium/Large), preview, or remove cover images for each course independently.',
    category: 'Courses',
    defaultAspect: '16:9',
    defaultFit: 'cover',
  },
  portfolio: {
    title: 'Portfolio Work — Image & Gallery Manager',
    subtitle:
      'Edit project covers, upload multiple portfolio photos, adjust frame ratios per photo, reorder, and mark featured.',
    category: 'Portfolio',
    defaultAspect: '4:5',
    defaultFit: 'cover',
  },
  events: {
    title: 'Events & Experiences — Image & Gallery Manager',
    subtitle:
      'Manage event cover images and full event photo galleries independently without affecting other sections.',
    category: 'Events & Experiences',
    defaultAspect: '16:9',
    defaultFit: 'cover',
  },
  awards: {
    title: 'Award & Honors — Image & Certificate Manager',
    subtitle:
      'Upload trophy photos and full award certificates with Fit-to-Frame so certificate text is never clipped.',
    category: 'Awards & Achievements',
    defaultAspect: '1:1',
    defaultFit: 'contain',
  },
};

export const SectionImageManagerModal: React.FC<SectionImageManagerModalProps> = ({
  isOpen,
  section,
  courses,
  projects,
  events,
  awards,
  mediaLibrary,
  onRefreshData,
  onNotify,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<{
    itemId: string;
    itemTitle: string;
    slotType: 'cover' | 'trophy' | 'certificate' | 'add_gallery';
  } | null>(null);
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    imageUrl: string;
    meta?: Partial<ImageCropMetadata> | null;
    gallery?: SectionImageItem[];
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const meta = SECTION_META[section];

  const items: Array<{
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    settings?: ImageCropMetadata | null;
    secondaryImageUrl?: string;
    secondarySettings?: ImageCropMetadata | null;
    galleryItems: SectionImageItem[];
    status: string;
    featured?: boolean;
  }> =
    section === 'courses'
      ? courses.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.tier,
          imageUrl: c.coverImage || '',
          settings: c.coverImageSettings || null,
          galleryItems: [],
          status: c.status,
        }))
      : section === 'portfolio'
      ? projects.map((p) => {
          const gItems: SectionImageItem[] =
            p.galleryItems && p.galleryItems.length > 0
              ? p.galleryItems
              : (p.galleryImages || []).map((url, idx) => ({
                  id: `${p.id}-img-${idx}`,
                  url,
                  order: idx,
                  featured: p.featured && idx === 0,
                  status: p.status,
                }));
          return {
            id: p.id,
            title: p.title,
            subtitle: `${p.category} · ${p.year}`,
            imageUrl: p.coverImage || '',
            settings: p.coverImageSettings || null,
            galleryItems: gItems,
            status: p.status,
            featured: p.featured,
          };
        })
      : section === 'events'
      ? events.map((ev) => {
          const gItems: SectionImageItem[] =
            ev.galleryItems && ev.galleryItems.length > 0
              ? ev.galleryItems
              : (ev.images || []).map((url, idx) => ({
                  id: `${ev.id}-img-${idx}`,
                  url,
                  order: idx,
                  status: ev.status,
                }));
          return {
            id: ev.id,
            title: ev.title,
            subtitle: `${ev.role} · ${ev.date}`,
            imageUrl: ev.coverImage || '',
            settings: ev.coverImageSettings || null,
            galleryItems: gItems,
            status: ev.status,
          };
        })
      : awards.map((aw) => ({
          id: aw.id,
          title: aw.name,
          subtitle: `${aw.organization} · ${aw.date}`,
          imageUrl: aw.trophyImage || '',
          settings: aw.trophyImageSettings || null,
          secondaryImageUrl: aw.certificateImage || '',
          secondarySettings: aw.certificateImageSettings || null,
          galleryItems: aw.galleryItems || [],
          status: aw.status,
        }));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.id));
    }
  };

  // Upload a new file from phone gallery or computer and open PhotoEditorModal before saving/publishing
  const handleUploadNewForItem = async (
    item: (typeof items)[number],
    slotType: 'cover' | 'trophy' | 'certificate' | 'gallery_item',
    file?: File | null
  ) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const baseMeta =
        slotType === 'certificate' ? item.secondarySettings : item.settings;
      setEditorTarget({
        itemId: item.id,
        itemTitle: item.title,
        slotType,
        imageUrl: dataUrl,
        originalImageUrl: dataUrl,
        initialMeta: baseMeta || {
          aspectPreset: slotType === 'certificate' ? 'original' : meta.defaultAspect,
          fitMode: meta.defaultFit,
          displaySize: 'medium',
        },
        isNewUpload: true,
      });
    } catch (err: any) {
      onNotify('error', err?.message || 'Could not load image file.');
    }
  };

  // Multi-file upload into Portfolio / Event / Award gallery
  const handleBatchAddGallery = async (
    item: (typeof items)[number],
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const created: SectionImageItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await readImageFileAsDataUrl(file);
        const saved = await saveSectionImage({
          editedDataUrl: dataUrl,
          originalDataUrl: dataUrl,
          fileName: file.name.split('.')[0],
          title: `${item.title} (${i + 1})`,
          sectionName: section,
          category: meta.category,
          cropMetadata: {
            aspectPreset: meta.defaultAspect,
            fitMode: meta.defaultFit,
            displaySize: 'medium',
            zoom: 1,
            rotation: 0,
            crop: { x: 0, y: 0 },
            position: { x: 50, y: 50 },
            objectPosition: '50% 50%',
            customRatio: { width: 4, height: 5 },
          },
          status: 'published',
          addToGallery: true,
        });
        created.push({
          id: `${item.id}-g-${Date.now()}-${i}`,
          url: saved.url,
          originalUrl: saved.originalUrl,
          title: file.name.split('.')[0],
          order: item.galleryItems.length + i,
          status: 'published',
          cropMetadata: saved.cropMetadata,
        });
      }

      const nextGallery = [...item.galleryItems, ...created];
      if (section === 'portfolio') {
        await updateAdminProject(item.id, {
          galleryItems: nextGallery,
          galleryImages: nextGallery.map((g) => g.url),
        });
      } else if (section === 'events') {
        await updateAdminEvent(item.id, {
          galleryItems: nextGallery,
          images: nextGallery.map((g) => g.url),
        });
      } else if (section === 'awards') {
        await updateAdminAward(item.id, { galleryItems: nextGallery });
      }
      await onRefreshData();
      onNotify(
        'success',
        `Added ${created.length} gallery image(s) to "${item.title}". Click any photo to crop/zoom/position individually.`
      );
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to upload gallery images.');
    } finally {
      setBusy(false);
    }
  };

  // Save handler when user finishes editing in PhotoEditorModal
  const handleSaveFromPhotoEditor = async (result: PhotoEditorSaveResult) => {
    if (!editorTarget) return;
    setBusy(true);
    try {
      const saved = await saveSectionImage({
        editedDataUrl: result.editedDataUrl.startsWith('data:')
          ? result.editedDataUrl
          : undefined,
        originalDataUrl: result.originalDataUrl,
        existingUrl: result.editedDataUrl.startsWith('data:')
          ? undefined
          : result.editedDataUrl,
        existingOriginalUrl:
          editorTarget.originalImageUrl || result.cropMetadata.originalUrl,
        fileName: `${section}_${editorTarget.itemId}`,
        title: editorTarget.itemTitle,
        sectionName: section,
        category: meta.category,
        cropMetadata: result.cropMetadata,
        status: result.status,
        addToGallery: Boolean(editorTarget.isNewUpload),
      });

      const targetItem = items.find((i) => i.id === editorTarget.itemId);
      if (section === 'courses') {
        await updateAdminCourse(editorTarget.itemId, {
          coverImage: saved.url,
          coverImageSettings: saved.cropMetadata,
          status: result.status,
        });
      } else if (section === 'portfolio' && targetItem) {
        if (editorTarget.slotType === 'gallery_item' && editorTarget.galleryIndex !== undefined) {
          const updatedGallery = targetItem.galleryItems.map((gi, idx) =>
            idx === editorTarget.galleryIndex
              ? {
                  ...gi,
                  url: saved.url,
                  originalUrl: saved.originalUrl,
                  cropMetadata: saved.cropMetadata,
                  status: result.status,
                }
              : gi
          );
          await updateAdminProject(editorTarget.itemId, {
            galleryItems: updatedGallery,
            galleryImages: updatedGallery.map((g) => g.url),
          });
        } else {
          await updateAdminProject(editorTarget.itemId, {
            coverImage: saved.url,
            coverImageSettings: saved.cropMetadata,
            status: result.status,
          });
        }
      } else if (section === 'events' && targetItem) {
        if (editorTarget.slotType === 'gallery_item' && editorTarget.galleryIndex !== undefined) {
          const updatedGallery = targetItem.galleryItems.map((gi, idx) =>
            idx === editorTarget.galleryIndex
              ? {
                  ...gi,
                  url: saved.url,
                  originalUrl: saved.originalUrl,
                  cropMetadata: saved.cropMetadata,
                  status: result.status,
                }
              : gi
          );
          await updateAdminEvent(editorTarget.itemId, {
            galleryItems: updatedGallery,
            images: updatedGallery.map((g) => g.url),
          });
        } else {
          await updateAdminEvent(editorTarget.itemId, {
            coverImage: saved.url,
            coverImageSettings: saved.cropMetadata,
            status: result.status,
          });
        }
      } else if (section === 'awards') {
        if (editorTarget.slotType === 'certificate') {
          await updateAdminAward(editorTarget.itemId, {
            certificateImage: saved.url,
            certificateImageSettings: saved.cropMetadata,
            status: result.status,
          });
        } else {
          await updateAdminAward(editorTarget.itemId, {
            trophyImage: saved.url,
            trophyImageSettings: saved.cropMetadata,
            status: result.status,
          });
        }
      }

      setEditorTarget(null);
      await onRefreshData();
      onNotify('success', `Saved image settings for "${editorTarget.itemTitle}" cleanly.`);
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to save edited image.');
    } finally {
      setBusy(false);
    }
  };

  // Quick update display size or fit mode directly from list without re-cropping
  const handleQuickStyleUpdate = async (
    item: (typeof items)[number],
    slotType: 'cover' | 'trophy' | 'certificate',
    patch: { displaySize?: ImageDisplaySize; fitMode?: ImageFitMode }
  ) => {
    const baseSettings: ImageCropMetadata = {
      originalUrl:
        (slotType === 'certificate'
          ? item.secondarySettings?.originalUrl
          : item.settings?.originalUrl) ||
        (slotType === 'certificate' ? item.secondaryImageUrl : item.imageUrl) ||
        '',
      editedUrl:
        (slotType === 'certificate' ? item.secondaryImageUrl : item.imageUrl) || '',
      zoom: 1,
      rotation: 0,
      crop: { x: 0, y: 0 },
      aspectPreset: meta.defaultAspect,
      customRatio: { width: 4, height: 5 },
      position: { x: 50, y: 50 },
      objectPosition: '50% 50%',
      displaySize: 'medium',
      fitMode: meta.defaultFit,
      updatedAt: new Date().toISOString(),
      ...((slotType === 'certificate' ? item.secondarySettings : item.settings) || {}),
      ...patch,
    };

    try {
      if (section === 'courses') {
        await updateAdminCourse(item.id, { coverImageSettings: baseSettings });
      } else if (section === 'portfolio') {
        await updateAdminProject(item.id, { coverImageSettings: baseSettings });
      } else if (section === 'events') {
        await updateAdminEvent(item.id, { coverImageSettings: baseSettings });
      } else if (section === 'awards') {
        if (slotType === 'certificate') {
          await updateAdminAward(item.id, { certificateImageSettings: baseSettings });
        } else {
          await updateAdminAward(item.id, { trophyImageSettings: baseSettings });
        }
      }
      await onRefreshData();
      onNotify(
        'success',
        `Updated display settings for "${item.title}" without altering saved crop/zoom.`
      );
    } catch (err: any) {
      onNotify('error', err?.message || 'Could not update display settings.');
    }
  };

  // Remove image from an item cleanly with cross-section check & confirmation
  const requestRemoveImage = async (
    item: (typeof items)[number],
    slotType: 'cover' | 'trophy' | 'certificate' | 'gallery_item',
    targetUrl: string,
    galleryIndex?: number
  ) => {
    setBusy(true);
    try {
      const { usages } = await checkAdminImageUsage(targetUrl);
      const otherUsages = usages.filter(
        (u) => !(u.section === section && u.id === item.id)
      );

      setConfirmDelete({
        title: `Remove ${isDefaultAssetUrl(targetUrl) ? 'Default ' : ''}Image from "${item.title}"?`,
        description:
          'This will permanently remove the image from this item. Deleted default images will stay deleted after reload.',
        usages: otherUsages,
        onConfirm: async () => {
          if (section === 'courses') {
            await updateAdminCourse(item.id, { coverImage: '', coverImageSettings: null });
          } else if (section === 'portfolio') {
            if (slotType === 'gallery_item' && galleryIndex !== undefined) {
              const nextG = item.galleryItems.filter((_, i) => i !== galleryIndex);
              await updateAdminProject(item.id, {
                galleryItems: nextG,
                galleryImages: nextG.map((g) => g.url),
              });
            } else {
              await updateAdminProject(item.id, {
                coverImage: '',
                coverImageSettings: null,
              });
            }
          } else if (section === 'events') {
            if (slotType === 'gallery_item' && galleryIndex !== undefined) {
              const nextG = item.galleryItems.filter((_, i) => i !== galleryIndex);
              await updateAdminEvent(item.id, {
                galleryItems: nextG,
                images: nextG.map((g) => g.url),
              });
            } else {
              await updateAdminEvent(item.id, {
                coverImage: '',
                coverImageSettings: null,
              });
            }
          } else if (section === 'awards') {
            if (slotType === 'certificate') {
              await updateAdminAward(item.id, {
                certificateImage: '',
                certificateImageSettings: null,
              });
            } else {
              await updateAdminAward(item.id, {
                trophyImage: '',
                trophyImageSettings: null,
              });
            }
          }
          await onRefreshData();
          onNotify('success', `Removed image from "${item.title}".`);
        },
      });
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to check image usage.');
    } finally {
      setBusy(false);
    }
  };

  const requestRemoveAllSelected = async () => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter((it) => selectedIds.includes(it.id));
    setConfirmDelete({
      title: `Remove All Selected Images (${selectedItems.length} item${
        selectedItems.length > 1 ? 's' : ''
      })?`,
      description:
        'Removes cover/primary images for all selected items in this section. Other sections remain untouched.',
      usages: [],
      onConfirm: async () => {
        for (const it of selectedItems) {
          if (section === 'courses') {
            await updateAdminCourse(it.id, { coverImage: '', coverImageSettings: null });
          } else if (section === 'portfolio') {
            await updateAdminProject(it.id, { coverImage: '', coverImageSettings: null });
          } else if (section === 'events') {
            await updateAdminEvent(it.id, { coverImage: '', coverImageSettings: null });
          } else if (section === 'awards') {
            await updateAdminAward(it.id, {
              trophyImage: '',
              trophyImageSettings: null,
              certificateImage: '',
              certificateImageSettings: null,
            });
          }
        }
        setSelectedIds([]);
        await onRefreshData();
        onNotify('success', `Removed images from ${selectedItems.length} selected item(s).`);
      },
    });
  };

  const requestRestoreDefaults = () => {
    setConfirmDelete({
      title: `Restore Default Images for ${section.toUpperCase()}?`,
      description:
        'Only restores the built-in starter images for this specific section. Any custom items or images in other sections are preserved.',
      usages: [],
      onConfirm: async () => {
        await restoreDefaultImages(section);
        await onRefreshData();
        onNotify('success', `Default images restored for ${section}.`);
      },
    });
  };

  const handleAssignFromGallery = async (chosen: MediaItem) => {
    if (!galleryPickerTarget) return;
    const targetItem = items.find((i) => i.id === galleryPickerTarget.itemId);
    if (!targetItem) return;

    setGalleryPickerTarget(null);

    if (galleryPickerTarget.slotType === 'add_gallery') {
      const nextG: SectionImageItem[] = [
        ...targetItem.galleryItems,
        {
          id: `${targetItem.id}-g-${Date.now()}`,
          url: chosen.url,
          originalUrl: chosen.originalUrl || chosen.url,
          title: chosen.title,
          order: targetItem.galleryItems.length,
          status: 'published',
          cropMetadata: chosen.cropMetadata || null,
        },
      ];
      if (section === 'portfolio') {
        await updateAdminProject(targetItem.id, {
          galleryItems: nextG,
          galleryImages: nextG.map((g) => g.url),
        });
      } else if (section === 'events') {
        await updateAdminEvent(targetItem.id, {
          galleryItems: nextG,
          images: nextG.map((g) => g.url),
        });
      }
      await onRefreshData();
      onNotify('success', `Added gallery photo "${chosen.title}" to "${targetItem.title}".`);
      return;
    }

    setEditorTarget({
      itemId: targetItem.id,
      itemTitle: targetItem.title,
      slotType: galleryPickerTarget.slotType,
      imageUrl: chosen.url,
      originalImageUrl: chosen.originalUrl || chosen.url,
      initialMeta: chosen.cropMetadata || {
        aspectPreset:
          galleryPickerTarget.slotType === 'certificate' ? 'original' : meta.defaultAspect,
        fitMode: meta.defaultFit,
        displaySize: 'medium',
      },
    });
  };

  const handleReorderGallery = async (
    item: (typeof items)[number],
    index: number,
    dir: -1 | 1
  ) => {
    const reordered = reorderSectionImages(item.galleryItems, index, dir);
    if (section === 'portfolio') {
      await updateAdminProject(item.id, {
        galleryItems: reordered,
        galleryImages: reordered.map((g) => g.url),
      });
    } else if (section === 'events') {
      await updateAdminEvent(item.id, {
        galleryItems: reordered,
        images: reordered.map((g) => g.url),
      });
    }
    await onRefreshData();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      className="fixed inset-0 z-[65] bg-[#080808]/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
    >
      <div className="bg-[#101010] border border-[#C9A45C]/50 w-full max-w-6xl max-h-[94vh] flex flex-col text-[#F5F5F5] shadow-2xl">
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#C9A45C]/25 bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold">
              Independent Section Image Workspace
            </div>
            <h3 className="text-base sm:text-xl font-editorial font-bold text-[#F5F5F5]">
              {meta.title}
            </h3>
            <p className="text-xs text-[#A7A7A7] mt-0.5">{meta.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close section image manager"
            className="p-2 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BULK & DEFAULT IMAGE TOOLBAR */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#C9A45C]/20 bg-[#141414] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C]/10"
            >
              {selectedIds.length === items.length && items.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#C9A45C]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>
                {selectedIds.length === items.length && items.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={requestRemoveAllSelected}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/50 border border-red-500/60 text-red-200 hover:bg-red-900/60 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Selected Images ({selectedIds.length})</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={requestRestoreDefaults}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C9A45C]/35 text-[#A7A7A7] hover:text-[#E5C98A] hover:border-[#C9A45C]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default Image</span>
          </button>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {items.length === 0 ? (
            <div className="p-10 text-center border border-[#C9A45C]/20 bg-[#141414] text-xs text-[#A7A7A7]">
              No items exist in this section yet. Add an item first, then manage its images here.
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const sizeLabel = formatDisplaySizeLabel(item.settings?.displaySize);
              const ratioLabel = formatAspectLabel(
                item.settings?.aspectPreset || meta.defaultAspect,
                item.settings?.customRatio
              );
              const fitLabel =
                item.settings?.fitMode || meta.defaultFit;
              const isDef = isDefaultAssetUrl(item.imageUrl);

              return (
                <div
                  key={item.id}
                  className={`border ${
                    isSelected ? 'border-[#C9A45C] bg-[#161410]' : 'border-[#C9A45C]/25 bg-[#131313]'
                  } p-4 sm:p-5 space-y-4`}
                >
                  <div className="flex flex-col lg:flex-row gap-5 justify-between">
                    {/* LEFT THUMB + CHECKBOX */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start min-w-0">
                      <div className="flex gap-3 items-start shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          className="mt-1 text-[#C9A45C]"
                          aria-label={`Select ${item.title}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-[#666]" />
                          )}
                        </button>

                        <div className="w-28 h-28 sm:w-36 sm:h-28 shrink-0 border border-[#C9A45C]/30 bg-[#0A0A0A] overflow-hidden flex items-center justify-center relative">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              style={{
                                objectFit: fitLabel,
                                objectPosition: item.settings?.objectPosition || '50% 50%',
                              }}
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="text-[10px] text-[#777] text-center px-2">
                              No Image
                            </div>
                          )}
                          {isDef && (
                            <span className="absolute bottom-1 left-1 text-[9px] bg-[#080808]/85 border border-[#C9A45C]/40 px-1.5 py-0.5 text-[#E5C98A] uppercase">
                              Default
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-[#C9A45C] font-semibold">
                          {item.subtitle} · {item.status}
                        </div>
                        <h4 className="text-base font-editorial font-bold text-[#F5F5F5]">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#A7A7A7]">
                          <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#C9A45C]/20 text-[#E5C98A]">
                            Display: {sizeLabel}
                          </span>
                          <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#C9A45C]/20 text-[#E5C98A]">
                            Ratio: {ratioLabel}
                          </span>
                          <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#C9A45C]/20 text-[#E5C98A]">
                            Mode: {fitLabel === 'contain' ? 'Fit to Frame' : 'Fill Frame'}
                          </span>
                        </div>

                        {/* Quick Independent Display Size & Fit Switchers */}
                        {item.imageUrl && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-[#888] mr-1">Size:</span>
                            {(['small', 'medium', 'large'] as ImageDisplaySize[]).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() =>
                                  handleQuickStyleUpdate(
                                    item,
                                    section === 'awards' ? 'trophy' : 'cover',
                                    { displaySize: sz }
                                  )
                                }
                                className={`px-2 py-0.5 text-[10px] uppercase border ${
                                  (item.settings?.displaySize || 'medium') === sz
                                    ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C] font-bold'
                                    : 'border-[#C9A45C]/25 text-[#A7A7A7] hover:text-[#F5F5F5]'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}

                            <span className="text-[10px] text-[#888] ml-2 mr-1">Fit:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickStyleUpdate(
                                  item,
                                  section === 'awards' ? 'trophy' : 'cover',
                                  { fitMode: 'contain' }
                                )
                              }
                              className={`px-2 py-0.5 text-[10px] uppercase border flex items-center gap-1 ${
                                fitLabel === 'contain'
                                  ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C] font-bold'
                                  : 'border-[#C9A45C]/25 text-[#A7A7A7]'
                              }`}
                            >
                              <Minimize2 className="w-2.5 h-2.5" />
                              <span>Fit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickStyleUpdate(
                                  item,
                                  section === 'awards' ? 'trophy' : 'cover',
                                  { fitMode: 'cover' }
                                )
                              }
                              className={`px-2 py-0.5 text-[10px] uppercase border flex items-center gap-1 ${
                                fitLabel === 'cover'
                                  ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C] font-bold'
                                  : 'border-[#C9A45C]/25 text-[#A7A7A7]'
                              }`}
                            >
                              <Maximize2 className="w-2.5 h-2.5" />
                              <span>Fill</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] shrink-0 self-start">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-[#C9A45C] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#E5C98A]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{item.imageUrl ? 'Replace' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            handleUploadNewForItem(
                              item,
                              section === 'awards' ? 'trophy' : 'cover',
                              f
                            );
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setGalleryPickerTarget({
                            itemId: item.id,
                            itemTitle: item.title,
                            slotType: section === 'awards' ? 'trophy' : 'cover',
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/10"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Choose from Gallery</span>
                      </button>

                      {item.imageUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setEditorTarget({
                                itemId: item.id,
                                itemTitle: item.title,
                                slotType: section === 'awards' ? 'trophy' : 'cover',
                                imageUrl: item.imageUrl,
                                originalImageUrl:
                                  item.settings?.originalUrl || item.imageUrl,
                                initialMeta: item.settings || {
                                  aspectPreset: meta.defaultAspect,
                                  fitMode: meta.defaultFit,
                                  displaySize: 'medium',
                                },
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-2 border border-[#C9A45C]/50 text-[#E5C98A] hover:bg-[#C9A45C]/15 font-semibold"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Edit Image</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                title: item.title,
                                imageUrl: item.imageUrl,
                                meta: item.settings,
                                gallery: item.galleryItems,
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-2 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              requestRemoveImage(
                                item,
                                section === 'awards' ? 'trophy' : 'cover',
                                item.imageUrl
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 border border-red-500/40 text-red-400 hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isDef ? 'Remove Default' : 'Remove'}</span>
                          </button>
                        </>
                      )}

                      {section === 'portfolio' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateAdminProject(item.id, { featured: !item.featured });
                            await onRefreshData();
                          }}
                          className={`flex items-center gap-1 px-2.5 py-2 border ${
                            item.featured
                              ? 'border-[#C9A45C] bg-[#C9A45C]/20 text-[#E5C98A]'
                              : 'border-[#C9A45C]/25 text-[#888]'
                          }`}
                          title="Toggle Featured Portfolio Work"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>{item.featured ? 'Featured' : 'Feature'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AWARD CERTIFICATE PHOTO SLOT (SEPARATE FROM TROPHY) */}
                  {section === 'awards' && (
                    <div className="pt-3 border-t border-[#C9A45C]/15 flex flex-wrap items-center justify-between gap-3 bg-[#101010] p-3">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-16 h-12 border border-[#C9A45C]/25 bg-[#080808] overflow-hidden flex items-center justify-center">
                          {item.secondaryImageUrl ? (
                            <img
                              src={item.secondaryImageUrl}
                              alt="Certificate"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[9px] text-[#666]">None</span>
                          )}
                        </div>
                        <div>
                          <div className="text-[#E5C98A] font-semibold">
                            Award Certificate / Diploma Photo
                          </div>
                          <div className="text-[10px] text-[#A7A7A7]">
                            Uses Fit-to-Frame so certificate text and seals remain 100% legible.
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 border border-[#C9A45C]/50 text-[#E5C98A] hover:bg-[#C9A45C]/10">
                          <Upload className="w-3 h-3" />
                          <span>{item.secondaryImageUrl ? 'Replace Cert' : 'Upload Certificate'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              handleUploadNewForItem(item, 'certificate', f);
                            }}
                          />
                        </label>
                        {item.secondaryImageUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditorTarget({
                                  itemId: item.id,
                                  itemTitle: `${item.title} — Certificate`,
                                  slotType: 'certificate',
                                  imageUrl: item.secondaryImageUrl!,
                                  originalImageUrl:
                                    item.secondarySettings?.originalUrl ||
                                    item.secondaryImageUrl,
                                  initialMeta: item.secondarySettings || {
                                    aspectPreset: 'original',
                                    fitMode: 'contain',
                                    displaySize: 'medium',
                                  },
                                })
                              }
                              className="px-2.5 py-1.5 border border-[#C9A45C]/40 text-[#E5C98A]"
                            >
                              Edit Certificate
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                requestRemoveImage(
                                  item,
                                  'certificate',
                                  item.secondaryImageUrl!
                                )
                              }
                              className="px-2.5 py-1.5 border border-red-500/40 text-red-400"
                            >
                              Remove Cert
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MULTI-IMAGE GALLERY FOR PORTFOLIO & EVENTS */}
                  {(section === 'portfolio' || section === 'events') && (
                    <div className="pt-3 border-t border-[#C9A45C]/15 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="uppercase tracking-wider text-[#C9A45C] font-semibold">
                          {section === 'portfolio'
                            ? `Portfolio Photo Gallery (${item.galleryItems.length})`
                            : `Event Gallery Images (${item.galleryItems.length})`}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 bg-[#1C1C1C] border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/15">
                            <Plus className="w-3 h-3" />
                            <span>Upload Multiple Photos</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const fs = e.target.files;
                                handleBatchAddGallery(item, fs);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setGalleryPickerTarget({
                                itemId: item.id,
                                itemTitle: item.title,
                                slotType: 'add_gallery',
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#E5C98A]"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Add from Gallery</span>
                          </button>
                        </div>
                      </div>

                      {item.galleryItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                          {item.galleryItems.map((gi, gIdx) => (
                            <div
                              key={gi.id || `${gi.url}-${gIdx}`}
                              className="border border-[#C9A45C]/25 bg-[#0B0B0B] p-1.5 space-y-1.5"
                            >
                              <div className="aspect-square overflow-hidden bg-[#161616]">
                                <img
                                  src={gi.url}
                                  alt={gi.title || `Gallery ${gIdx + 1}`}
                                  style={{
                                    objectFit: gi.cropMetadata?.fitMode || 'cover',
                                    objectPosition:
                                      gi.cropMetadata?.objectPosition || '50% 50%',
                                  }}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={gIdx === 0}
                                    onClick={() => handleReorderGallery(item, gIdx, -1)}
                                    className="p-1 border border-[#C9A45C]/20 disabled:opacity-30"
                                    title="Move Earlier"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={gIdx === item.galleryItems.length - 1}
                                    onClick={() => handleReorderGallery(item, gIdx, 1)}
                                    className="p-1 border border-[#C9A45C]/20 disabled:opacity-30"
                                    title="Move Later"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditorTarget({
                                        itemId: item.id,
                                        itemTitle: `${item.title} · Photo #${gIdx + 1}`,
                                        slotType: 'gallery_item',
                                        galleryIndex: gIdx,
                                        imageUrl: gi.url,
                                        originalImageUrl: gi.originalUrl || gi.url,
                                        initialMeta: gi.cropMetadata || {
                                          aspectPreset: meta.defaultAspect,
                                          fitMode: meta.defaultFit,
                                          displaySize: 'medium',
                                        },
                                      })
                                    }
                                    className="p-1 border border-[#C9A45C]/40 text-[#E5C98A]"
                                    title="Edit Gallery Photo"
                                  >
                                    <Scissors className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestRemoveImage(
                                        item,
                                        'gallery_item',
                                        gi.url,
                                        gIdx
                                      )
                                    }
                                    className="p-1 border border-red-500/40 text-red-400"
                                    title="Remove from Gallery"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#C9A45C]/25 bg-[#0A0A0A] flex items-center justify-between text-xs">
          <span className="text-[#A7A7A7]">
            Changes saved in {section} apply exclusively to {section} and persist across reloads.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#C9A45C] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#E5C98A]"
          >
            Done
          </button>
        </div>
      </div>

      {/* NESTED PHOTO EDITOR MODAL */}
      {editorTarget && (
        <PhotoEditorModal
          isOpen={true}
          title={editorTarget.itemTitle}
          imageUrl={editorTarget.imageUrl}
          originalImageUrl={editorTarget.originalImageUrl}
          initialMetadata={editorTarget.initialMeta}
          defaultAspectPreset={
            editorTarget.slotType === 'certificate' ? 'original' : meta.defaultAspect
          }
          defaultFitMode={
            editorTarget.slotType === 'certificate' ? 'contain' : meta.defaultFit
          }
          sectionScope={section}
          sectionName={meta.title}
          imageCategory={meta.category}
          onSave={handleSaveFromPhotoEditor}
          onClose={() => setEditorTarget(null)}
        />
      )}

      {/* GALLERY PICKER MODAL */}
      {galleryPickerTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#121212] border border-[#C9A45C]/50 max-w-4xl w-full max-h-[85vh] flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#C9A45C]">
                  Choose Image from Gallery
                </div>
                <h4 className="text-base font-editorial font-bold text-[#F5F5F5]">
                  Select Photo for "{galleryPickerTarget.itemTitle}"
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setGalleryPickerTarget(null)}
                className="p-1.5 border border-[#C9A45C]/30 text-[#A7A7A7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mediaLibrary.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAssignFromGallery(m)}
                  className="text-left border border-[#C9A45C]/25 bg-[#181818] hover:border-[#C9A45C] overflow-hidden group"
                >
                  <div className="aspect-square bg-[#0B0B0B] overflow-hidden">
                    <img
                      src={m.url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2 text-[11px]">
                    <div className="font-semibold text-[#F5F5F5] truncate">{m.title}</div>
                    <div className="text-[10px] text-[#A7A7A7] truncate">{m.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW WEBSITE CARD MODAL */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#121212] border border-[#C9A45C]/50 max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9A45C]/20 pb-3">
              <div className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
                Website Card Preview — {previewItem.title}
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 border border-[#C9A45C]/30 text-[#A7A7A7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(() => {
              const p = getSectionImageContainerProps(
                section,
                previewItem.meta,
                section === 'courses' || section === 'events' ? '16 / 9' : '4 / 5'
              );
              return (
                <div className="border border-[#C9A45C]/30 bg-[#0B0B0B] p-4 space-y-3">
                  <div className={p.wrapperClass} style={p.wrapperStyle}>
                    <img
                      src={previewItem.imageUrl}
                      alt={previewItem.title}
                      style={p.imgStyle}
                    />
                  </div>
                  <div className="text-xs text-[#E5C98A] font-editorial font-bold">
                    {previewItem.title}
                  </div>
                  <div className="text-[10px] font-mono text-[#A7A7A7]">
                    Display Size: {p.displaySize.toUpperCase()} · Fit Mode: {p.fitMode.toUpperCase()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CONFIRMATION + CROSS-SECTION USAGE WARNING MODAL */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[85] bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#141414] border border-red-500/50 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-editorial font-bold text-[#F5F5F5]">
                  {confirmDelete.title}
                </h4>
                <p className="text-[#A7A7A7] mt-1 leading-relaxed">
                  {confirmDelete.description}
                </p>
              </div>
            </div>

            {confirmDelete.usages.length > 0 && (
              <div className="p-3 border border-amber-500/50 bg-amber-950/30 text-amber-200 space-y-1.5">
                <div className="font-bold uppercase tracking-wider text-[10px]">
                  Cross-Section Usage Warning:
                </div>
                <p>
                  This image asset is currently also referenced by{' '}
                  {confirmDelete.usages.length} other item(s):
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {confirmDelete.usages.slice(0, 5).map((u, idx) => (
                    <li key={idx}>
                      {u.section}: {u.title} ({u.field})
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-amber-300">
                  Removing it here will only clear this item and will NOT remove it from the other sections listed above.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C9A45C]/15">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await confirmDelete.onConfirm();
                    setConfirmDelete(null);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white font-bold uppercase tracking-wider hover:bg-red-500 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
