import React, { useState, useEffect } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Camera, Maximize2, Upload, RefreshCw } from 'lucide-react';
import { fetchPublicGallery, replaceAdminImage } from '../../api/client';
import { MediaItem, MediaCategory, FrameImageConfig } from '../../types';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';

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

interface GallerySectionProps {
  isOwner?: boolean;
  onUpdated?: () => void;
  modelingFrame?: FrameImageConfig;
  featuredFrame?: FrameImageConfig;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  isOwner = false,
  onUpdated,
  modelingFrame,
  featuredFrame,
}) => {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const data = await fetchPublicGallery();
      setPhotos(data || []);
    } catch (err) {
      console.error('Failed to load public gallery photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleReplacePhoto = async (itemId: string, file?: File | null) => {
    if (!file) return;
    setReplaceError(null);
    setReplacingId(itemId);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const updated = await replaceAdminImage(itemId, {
        dataUrl,
        fileName: file.name,
      });
      setPhotos((prev) => prev.map((p) => (p.id === itemId ? { ...p, ...updated } : p)));
      onUpdated?.();
    } catch (err: any) {
      setReplaceError(err?.message || 'Failed to replace photo.');
    } finally {
      setReplacingId(null);
    }
  };

  // Filter photos
  const filtered = photos.filter((photo) => {
    const matchCategory =
      selectedCategory === 'all' || photo.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (photo.description && photo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
    document.body.style.overflow = 'auto';
  };

  const nextLightbox = () => {
    if (activeLightboxIndex === null || filtered.length === 0) return;
    setActiveLightboxIndex((activeLightboxIndex + 1) % filtered.length);
  };

  const prevLightbox = () => {
    if (activeLightboxIndex === null || filtered.length === 0) return;
    setActiveLightboxIndex((activeLightboxIndex - 1 + filtered.length) % filtered.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filtered.length]);

  const activePhoto = activeLightboxIndex !== null ? filtered[activeLightboxIndex] : null;

  return (
    <section id="gallery" className="py-24 bg-[#080808] border-b border-[#C9A45C]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#C9A45C]/20 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C9A45C] font-semibold">
              <Camera className="w-4 h-4" />
              <span>Cinematic Visual Portfolio</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] tracking-tight">
              High-Fashion & Editorial Gallery
            </h2>
            <p className="text-xs md:text-sm text-[#A7A7A7] max-w-2xl leading-relaxed">
              Curated editorial assignments, runway appearances, haute couture photoshoots, and international brand campaigns showcasing the versatility of Sobur Ali Khan.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#C9A45C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photoshoot or style..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#121212] border border-[#C9A45C]/30 text-[#F5F5F5] placeholder-[#777] focus:outline-none focus:border-[#C9A45C]"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#C9A45C] text-[#080808]'
                : 'text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/20 hover:border-[#C9A45C]/50'
            }`}
          >
            All Works ({photos.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = photos.filter((p) => p.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#C9A45C] text-[#080808]'
                    : 'text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/20 hover:border-[#C9A45C]/50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Owner Replace Error Banner */}
        {replaceError && (
          <div className="mb-6 p-3 border border-red-500/60 bg-red-950/30 text-xs text-red-300 flex items-center justify-between">
            <span>{replaceError}</span>
            <button onClick={() => setReplaceError(null)} className="text-[11px] underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="py-24 text-center text-[#C9A45C]">
            <div className="text-xs uppercase tracking-widest animate-pulse">
              Loading High-Definition Visuals...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#C9A45C]/25 bg-[#0D0D0D]">
            <p className="text-sm font-editorial text-[#A7A7A7]">
              No photographs available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openLightbox(idx)}
                className="group relative cursor-pointer border border-[#C9A45C]/20 bg-[#121212] overflow-hidden flex flex-col justify-between"
              >
                {/* Photo container */}
                <div className="aspect-[3/4] bg-[#181818] relative overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      objectPosition:
                        item.cropMetadata?.objectPosition ||
                        (item.featured
                          ? featuredFrame?.imageSettings?.objectPosition
                          : modelingFrame?.imageSettings?.objectPosition) ||
                        '50% 35%',
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Corner indicator */}
                  <div className="absolute top-3 right-3 p-2 bg-[#080808]/70 text-[#E5C98A] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  {isOwner && (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-12 z-10 cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-[#080808]/90 border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] text-[10px] uppercase tracking-wider font-bold transition-colors shadow-lg"
                      title="Replace this photograph from your device"
                    >
                      {replacingId === item.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Replacing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3" />
                          <span>Replace Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        disabled={replacingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          handleReplacePhoto(item.id, file);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  {item.featured && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#C9A45C] text-[#080808] text-[9px] uppercase tracking-wider font-bold">
                      Featured
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 space-y-1">
                    <div className="text-[10px] uppercase tracking-widest text-[#C9A45C] font-semibold">
                      {item.category}
                    </div>
                    <h3 className="text-base font-editorial font-bold text-[#F5F5F5] group-hover:text-[#E5C98A] transition-colors truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[#A7A7A7] line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 select-none"
        >
          {/* Controls */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-3 text-[#A7A7A7] hover:text-[#F5F5F5] bg-[#141414] border border-[#C9A45C]/30 z-10"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevLightbox();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-[#A7A7A7] hover:text-[#C9A45C] bg-[#141414]/80 border border-[#C9A45C]/30 z-10"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextLightbox();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-[#A7A7A7] hover:text-[#C9A45C] bg-[#141414]/80 border border-[#C9A45C]/30 z-10"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <div className="relative max-h-[75vh] flex items-center justify-center overflow-hidden border border-[#C9A45C]/40 bg-[#000]">
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-4 text-center max-w-2xl px-4 space-y-1">
              <div className="text-[11px] uppercase tracking-widest text-[#C9A45C] font-semibold">
                {activePhoto.category}
              </div>
              <h3 className="text-xl font-editorial font-bold text-[#F5F5F5]">
                {activePhoto.title}
              </h3>
              {activePhoto.description && (
                <p className="text-xs text-[#A7A7A7] leading-relaxed">
                  {activePhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
