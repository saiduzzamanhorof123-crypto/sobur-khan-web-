import React, { useState } from 'react';
import { MapPin, Trophy, Upload, RefreshCw, X, Images } from 'lucide-react';
import { EventItem, AwardItem, FrameImageConfig, ImageCropMetadata, SectionImageItem } from '../../types';
import { uploadAdminImage, updateAdminEvent, updateAdminAward } from '../../api/client';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';
import { getSectionImageContainerProps } from '../../utils/imageDisplay';

interface EventsAwardsProps {
  events: EventItem[];
  awards: AwardItem[];
  isOwner?: boolean;
  onUpdated?: () => void;
  eventFrame?: FrameImageConfig;
  awardFrame?: FrameImageConfig;
}

export const EventsAwardsSection: React.FC<EventsAwardsProps> = ({
  events,
  awards,
  isOwner = false,
  onUpdated,
  eventFrame,
  awardFrame,
}) => {
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [galleryLightbox, setGalleryLightbox] = useState<{
    title: string;
    subtitle: string;
    images: Array<{ url: string; meta?: Partial<ImageCropMetadata> | null; caption?: string }>;
    index: number;
  } | null>(null);

  const handleReplaceEventPhoto = async (ev: EventItem, file?: File | null) => {
    if (!file) return;
    setReplaceError(null);
    setReplacingId(ev.id);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const uploaded = await uploadAdminImage({
        dataUrl,
        fileName: file.name,
        title: ev.title,
        category: 'Events & Experiences',
        status: 'published',
      });
      await updateAdminEvent(ev.id, { coverImage: uploaded.url });
      onUpdated?.();
    } catch (err: any) {
      setReplaceError(err?.message || 'Failed to replace event photo.');
    } finally {
      setReplacingId(null);
    }
  };

  const handleReplaceAwardPhoto = async (award: AwardItem, file?: File | null) => {
    if (!file) return;
    setReplaceError(null);
    setReplacingId(award.id);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const uploaded = await uploadAdminImage({
        dataUrl,
        fileName: file.name,
        title: award.name,
        category: 'Awards & Achievements',
        status: 'published',
      });
      await updateAdminAward(award.id, {
        trophyImage: uploaded.url,
        trophyImageSettings: {
          originalUrl: uploaded.url,
          editedUrl: uploaded.url,
          zoom: 1,
          rotation: 0,
          crop: { x: 0, y: 0 },
          aspectPreset: '1:1',
          customRatio: { width: 1, height: 1 },
          position: { x: 50, y: 50 },
          objectPosition: '50% 50%',
          displaySize: 'medium',
          fitMode: 'contain',
          updatedAt: new Date().toISOString(),
        },
      });
      onUpdated?.();
    } catch (err: any) {
      setReplaceError(err?.message || 'Failed to replace award photo.');
    } finally {
      setReplacingId(null);
    }
  };

  const openEventGallery = (ev: EventItem) => {
    const slides: Array<{ url: string; meta?: Partial<ImageCropMetadata> | null }> = [];
    if (ev.coverImage) {
      slides.push({ url: ev.coverImage, meta: ev.coverImageSettings });
    }
    const gList: SectionImageItem[] =
      ev.galleryItems && ev.galleryItems.length > 0
        ? ev.galleryItems
        : (ev.images || []).map((url, i) => ({ id: `${ev.id}-${i}`, url }));
    gList.forEach((gi) => {
      if (gi.url && gi.url !== ev.coverImage) {
        slides.push({ url: gi.url, meta: gi.cropMetadata });
      }
    });
    if (slides.length === 0) return;
    setGalleryLightbox({
      title: ev.title,
      subtitle: `${ev.role} · ${ev.date} · ${ev.location}`,
      images: slides,
      index: 0,
    });
  };

  return (
    <section
      id="events"
      className="py-24 bg-[#080808] dark:bg-[#080808] light:bg-[#FAF9F6] border-b border-[#C9A45C]/20 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6">
        {replaceError && (
          <div className="mb-6 p-3 border border-red-500/60 bg-red-950/30 text-xs text-red-300 flex items-center justify-between">
            <span>{replaceError}</span>
            <button onClick={() => setReplaceError(null)} className="text-[11px] underline">
              Dismiss
            </button>
          </div>
        )}

        {/* EVENTS SECTION */}
        <div className="mb-20">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
              Runway & Appearances
            </div>
            <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
              Events & Modeling Shows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {events.map((ev, idx) => {
              const effectiveMeta =
                ev.coverImageSettings ||
                (idx === 0 && ev.coverImage ? eventFrame?.imageSettings : null);
              const containerProps = getSectionImageContainerProps(
                'events',
                effectiveMeta,
                '16 / 10'
              );
              const extraPhotos =
                ev.galleryItems && ev.galleryItems.length > 0
                  ? ev.galleryItems.map((gi) => gi.url)
                  : ev.images || [];
              const galleryCount = extraPhotos.filter((u) => u && u !== ev.coverImage).length;

              return (
                <div
                  key={ev.id}
                  className="border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] overflow-hidden flex flex-col justify-between hover:border-[#C9A45C]/50 transition-colors"
                >
                  {ev.coverImage && (
                    <div className="bg-[#101010] relative flex items-center justify-center">
                      <div
                        className={`${containerProps.wrapperClass} cursor-pointer`}
                        style={containerProps.wrapperStyle}
                        onClick={() => openEventGallery(ev)}
                      >
                        <img
                          src={ev.coverImage}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          style={containerProps.imgStyle}
                          className="hover:scale-[1.03] transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {galleryCount > 0 && (
                          <div className="absolute bottom-2 left-2 bg-[#080808]/85 border border-[#C9A45C]/50 px-2 py-0.5 text-[10px] text-[#E5C98A] flex items-center gap-1">
                            <Images className="w-3 h-3" />
                            <span>+{galleryCount} Gallery</span>
                          </div>
                        )}
                      </div>

                      {isOwner && (
                        <label
                          className="absolute top-2.5 right-2.5 z-10 cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-[#080808]/90 border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] text-[10px] uppercase tracking-wider font-bold transition-colors shadow-lg"
                          title="Replace event photograph from your device"
                        >
                          {replacingId === ev.id ? (
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
                            accept="image/*"
                            disabled={replacingId === ev.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              handleReplaceEventPhoto(ev, file);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#E5C98A] mb-2 font-medium">
                        <span>{ev.role}</span>
                        <span className="tabular-nums">{ev.date}</span>
                      </div>

                      <h3 className="text-lg font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-3">
                        {ev.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-[#A7A7A7] mb-4">
                        <MapPin className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                        <span>{ev.location}</span>
                      </div>

                      <p className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666] leading-relaxed">
                        {ev.description}
                      </p>

                      {galleryCount > 0 && (
                        <button
                          type="button"
                          onClick={() => openEventGallery(ev)}
                          className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#C9A45C] hover:text-[#E5C98A] font-semibold"
                        >
                          <Images className="w-3.5 h-3.5" />
                          <span>View Event Gallery ({galleryCount + 1})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AWARDS & ACHIEVEMENTS SECTION */}
        <div id="awards" className="pt-16 border-t border-[#C9A45C]/20">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
              Distinctions
            </div>
            <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
              Awards & Recognition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {awards.map((award, idx) => {
              const awardMeta =
                award.trophyImageSettings ||
                (idx === 0 && award.trophyImage ? awardFrame?.imageSettings : null) || {
                  fitMode: 'contain' as const,
                  displaySize: 'medium' as const,
                };
              const awardContainer = getSectionImageContainerProps('awards', awardMeta, '1 / 1');
              const isLargeAward = awardContainer.displaySize === 'large';

              return (
                <div
                  key={award.id}
                  className={`border border-[#C9A45C]/25 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] p-8 flex ${
                    isLargeAward ? 'flex-col' : 'flex-col sm:flex-row'
                  } gap-6 items-start hover:border-[#C9A45C]/60 transition-colors`}
                >
                  {award.trophyImage ? (
                    <div
                      className={`${awardContainer.wrapperClass} border border-[#C9A45C]/30 cursor-pointer group`}
                      style={awardContainer.wrapperStyle}
                      onClick={() =>
                        setGalleryLightbox({
                          title: award.name,
                          subtitle: `${award.organization} · ${award.date}`,
                          images: [
                            { url: award.trophyImage!, meta: award.trophyImageSettings, caption: 'Trophy / Recognition' },
                            ...(award.certificateImage && award.certificateImage !== award.trophyImage
                              ? [
                                  {
                                    url: award.certificateImage,
                                    meta: award.certificateImageSettings || { fitMode: 'contain' },
                                    caption: 'Official Award Certificate',
                                  },
                                ]
                              : []),
                          ],
                          index: 0,
                        })
                      }
                    >
                      <img
                        src={award.trophyImage}
                        alt={award.name}
                        referrerPolicy="no-referrer"
                        style={awardContainer.imgStyle}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {isOwner && (
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-x-0 bottom-0 z-10 cursor-pointer flex items-center justify-center gap-1 py-1 bg-[#080808]/90 border-t border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] text-[9px] uppercase tracking-wider font-bold transition-colors"
                          title="Replace award photograph from your device"
                        >
                          {replacingId === award.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-2.5 h-2.5" />
                              <span>Replace</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={replacingId === award.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              handleReplaceAwardPhoto(award, file);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 border border-[#C9A45C]/30 bg-[#181818] flex items-center justify-center text-[#C9A45C]">
                      <Trophy className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center justify-between text-xs text-[#E5C98A]">
                      <span className="uppercase tracking-widest font-semibold">
                        {award.organization}
                      </span>
                      <span className="tabular-nums">{award.date}</span>
                    </div>
                    <h3 className="text-xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                      {award.name}
                    </h3>
                    <p className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666] leading-relaxed">
                      {award.description}
                    </p>

                    {award.certificateImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryLightbox({
                            title: award.name,
                            subtitle: `${award.organization} · Official Certificate`,
                            images: [
                              {
                                url: award.certificateImage!,
                                meta: award.certificateImageSettings || { fitMode: 'contain' },
                                caption: 'Certificate',
                              },
                            ],
                            index: 0,
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#C9A45C] hover:text-[#E5C98A] font-semibold"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Inspect Full Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EVENT GALLERY & AWARD CERTIFICATE LIGHTBOX */}
      {galleryLightbox && (() => {
        const current = galleryLightbox.images[galleryLightbox.index] || galleryLightbox.images[0];
        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-4xl w-full bg-[#111111] border border-[#C9A45C]/40 p-5 sm:p-8 space-y-4 text-[#F5F5F5] max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-[#C9A45C]/20 pb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[#C9A45C]">
                    {galleryLightbox.subtitle}
                  </div>
                  <h4 className="text-xl font-editorial font-bold">{galleryLightbox.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryLightbox(null)}
                  aria-label="Close gallery"
                  className="p-2 border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {current && (
                <div className="bg-[#080808] border border-[#C9A45C]/25 flex items-center justify-center max-h-[60vh] overflow-hidden p-2">
                  <img
                    src={current.url}
                    alt={current.caption || galleryLightbox.title}
                    style={{
                      objectFit: current.meta?.fitMode || 'contain',
                      objectPosition: current.meta?.objectPosition || '50% 50%',
                    }}
                    className="max-h-[56vh] w-auto max-w-full"
                  />
                </div>
              )}

              {galleryLightbox.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {galleryLightbox.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setGalleryLightbox({ ...galleryLightbox, index: i })
                      }
                      className={`aspect-square border overflow-hidden ${
                        galleryLightbox.index === i
                          ? 'border-[#C9A45C] ring-1 ring-[#C9A45C]'
                          : 'border-[#C9A45C]/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
};
