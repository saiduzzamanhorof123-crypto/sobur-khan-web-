import React, { useState } from 'react';
import { ExternalLink, Upload, RefreshCw } from 'lucide-react';
import { FrameImageConfig, ModelingGroup } from '../../types';
import { uploadAdminImage, updateAdminModelingGroup } from '../../api/client';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';

interface ModelingGroupProps {
  groups: ModelingGroup[];
  isOwner?: boolean;
  onUpdated?: () => void;
  groupFrame?: FrameImageConfig;
}

export const ModelingGroupSection: React.FC<ModelingGroupProps> = ({
  groups,
  isOwner = false,
  onUpdated,
  groupFrame,
}) => {
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  if (!groups || groups.length === 0) return null;

  const handleReplaceGroupPhoto = async (group: ModelingGroup, file?: File | null) => {
    if (!file) return;
    setReplaceError(null);
    setReplacingId(group.id);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const uploaded = await uploadAdminImage({
        dataUrl,
        fileName: file.name,
        title: `${group.groupName} Photo`,
        category: 'Modeling Group',
        status: 'published',
      });
      await updateAdminModelingGroup(group.id, { logo: uploaded.url });
      onUpdated?.();
    } catch (err: any) {
      setReplaceError(err?.message || 'Failed to replace group photo.');
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <section id="modeling-group" className="py-24 bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F3F1EC] border-b border-[#C9A45C]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
            Collective Excellence
          </div>
          <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
            Modeling Group Affiliation
          </h2>
        </div>

        {replaceError && (
          <div className="mb-6 p-3 border border-red-500/60 bg-red-950/30 text-xs text-red-300 flex items-center justify-between">
            <span>{replaceError}</span>
            <button onClick={() => setReplaceError(null)} className="text-[11px] underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-12">
          {groups.map((group, idx) => (
            <div
              key={group.id}
              className="border border-[#C9A45C]/25 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Group Photography / Logo */}
              <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden border border-[#C9A45C]/30 bg-[#181818]">
                <img
                  src={
                    idx === 0 && groupFrame?.imageSettings?.editedUrl
                      ? groupFrame.imageSettings.editedUrl
                      : group.logo || group.groupPhotos[0]
                  }
                  alt={group.groupName}
                  referrerPolicy="no-referrer"
                  style={{
                    objectPosition:
                      idx === 0 ? groupFrame?.imageSettings?.objectPosition || '50% 35%' : '50% 35%',
                  }}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent" />
                {isOwner && (
                  <label
                    className="absolute top-3 right-3 z-10 cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-[#080808]/90 border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] text-[10px] uppercase tracking-wider font-bold transition-colors shadow-lg"
                    title="Replace group photograph from your device"
                  >
                    {replacingId === group.id ? (
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
                      disabled={replacingId === group.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        handleReplaceGroupPhoto(group, file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs uppercase tracking-widest text-[#E5C98A] font-semibold">
                    Position: {group.position}
                  </span>
                </div>
              </div>

              {/* Group Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold mb-2">
                    Official Ensemble
                  </div>
                  <h3 className="text-2xl md:text-3xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                    {group.groupName}
                  </h3>
                </div>

                <p className="text-sm md:text-base text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                  {group.groupDescription}
                </p>

                <div className="p-4 border-l border-[#C9A45C] bg-[#0E0E0E] dark:bg-[#0E0E0E] light:bg-[#EDE9E1]">
                  <div className="text-xs uppercase tracking-wider text-[#E5C98A] font-semibold mb-1">
                    Group Experience & Roles
                  </div>
                  <div className="text-sm text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                    {group.experience}
                  </div>
                </div>

                {group.officialPageLink && (
                  <div className="pt-4">
                    <a
                      href={group.officialPageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#C9A45C] hover:text-[#E5C98A] transition-colors"
                    >
                      <span>Visit Official Group Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
