import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  RefreshCw,
  Eye,
  Scissors,
  Check,
  Save,
  Send,
  Upload,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  UserCheck,
  Lock,
  Unlock,
  AlignCenterHorizontal,
  AlignCenterVertical,
} from 'lucide-react';
import {
  AspectRatioPreset,
  FrameImageConfig,
  ImageCropMetadata,
  ImageDisplaySize,
  ImageFitMode,
  PublicationStatus,
  WebsiteFrameSlot,
} from '../../types';
import {
  ASPECT_RATIO_PRESETS,
  PhotoEditorHistory,
  applyEditorChange,
  createInitialEditorHistory,
  redoEditorHistory,
  resetEditorHistory,
  resolveAspectRatio,
  undoEditorHistory,
  computeObjectPosition,
} from '../../utils/photoEditorState';
import { getSectionImageContainerProps, SectionImageScope } from '../../utils/imageDisplay';
import { getCroppedImgDataUrl, getImageNaturalDimensions } from '../../utils/canvasCrop';
import { readImageFileAsDataUrl } from '../../utils/imageUpload';

export interface PhotoEditorSaveResult {
  editedDataUrl: string;
  originalDataUrl?: string;
  cropMetadata: ImageCropMetadata;
  status: PublicationStatus;
  targetFrameSlot?: WebsiteFrameSlot;
}

interface PhotoEditorModalProps {
  isOpen: boolean;
  title: string;
  imageUrl: string;
  originalImageUrl?: string;
  initialMetadata?: Partial<ImageCropMetadata> | null;
  defaultAspectPreset?: AspectRatioPreset;
  defaultFitMode?: ImageFitMode;
  defaultDisplaySize?: ImageDisplaySize;
  sectionScope?: SectionImageScope;
  sectionName?: string;
  imageCategory?: string;
  frameSlots?: FrameImageConfig[];
  activeFrameSlot?: WebsiteFrameSlot;
  onChangeFrameSlot?: (slot: WebsiteFrameSlot) => void;
  allowReplaceSource?: boolean;
  onSave: (result: PhotoEditorSaveResult) => Promise<void> | void;
  onClose: () => void;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  isOpen,
  title,
  imageUrl,
  originalImageUrl,
  initialMetadata,
  defaultAspectPreset = 'original',
  defaultFitMode = 'cover',
  defaultDisplaySize = 'medium',
  sectionScope,
  sectionName,
  imageCategory,
  frameSlots,
  activeFrameSlot,
  onChangeFrameSlot,
  allowReplaceSource = true,
  onSave,
  onClose,
}) => {
  const [sourceUrl, setSourceUrl] = useState<string>(originalImageUrl || imageUrl);
  const [uploadedOriginalDataUrl, setUploadedOriginalDataUrl] = useState<string | undefined>(
    undefined
  );
  const [naturalDims, setNaturalDims] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 1500,
  });

  const resolvedInitialMeta = {
    aspectPreset: initialMetadata?.aspectPreset || defaultAspectPreset,
    zoom: initialMetadata?.zoom ?? 1,
    rotation: initialMetadata?.rotation ?? 0,
    crop: initialMetadata?.crop ?? { x: 0, y: 0 },
    croppedAreaPixels: initialMetadata?.croppedAreaPixels ?? null,
    croppedAreaPercentages: initialMetadata?.croppedAreaPercentages ?? null,
    customRatio: initialMetadata?.customRatio ?? { width: 4, height: 5 },
    resizeWidth: initialMetadata?.resizeWidth ?? 1200,
    resizeHeight: initialMetadata?.resizeHeight ?? 1500,
    position: initialMetadata?.position ?? { x: 50, y: 50 },
    objectPosition: initialMetadata?.objectPosition ?? '50% 50%',
    displaySize: initialMetadata?.displaySize || defaultDisplaySize,
    fitMode: initialMetadata?.fitMode || defaultFitMode,
    customDisplayWidth: initialMetadata?.customDisplayWidth ?? null,
    customDisplayHeight: initialMetadata?.customDisplayHeight ?? null,
  };

  const [history, setHistory] = useState<PhotoEditorHistory>(() =>
    createInitialEditorHistory(resolvedInitialMeta)
  );

  const [lockResizeAspect, setLockResizeAspect] = useState(true);
  const [customResizeApplied, setCustomResizeApplied] = useState(false);
  const [cropModified, setCropModified] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [appliedPreviewDataUrl, setAppliedPreviewDataUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync whenever source image or metadata changes
  useEffect(() => {
    const nextSource = originalImageUrl || imageUrl;
    setSourceUrl(nextSource);
    setUploadedOriginalDataUrl(nextSource?.startsWith('data:') ? nextSource : undefined);
    setAppliedPreviewDataUrl(null);
    setPreviewMode(false);
    setCropModified(false);
    setCustomResizeApplied(false);
    setError(null);
    setHistory(
      createInitialEditorHistory({
        aspectPreset: initialMetadata?.aspectPreset || defaultAspectPreset,
        zoom: initialMetadata?.zoom ?? 1,
        rotation: initialMetadata?.rotation ?? 0,
        crop: initialMetadata?.crop ?? { x: 0, y: 0 },
        croppedAreaPixels: initialMetadata?.croppedAreaPixels ?? null,
        croppedAreaPercentages: initialMetadata?.croppedAreaPercentages ?? null,
        customRatio: initialMetadata?.customRatio ?? { width: 4, height: 5 },
        resizeWidth: initialMetadata?.resizeWidth ?? 1200,
        resizeHeight: initialMetadata?.resizeHeight ?? 1500,
        position: initialMetadata?.position ?? { x: 50, y: 50 },
        objectPosition: initialMetadata?.objectPosition ?? '50% 50%',
        displaySize: initialMetadata?.displaySize || defaultDisplaySize,
        fitMode: initialMetadata?.fitMode || defaultFitMode,
        customDisplayWidth: initialMetadata?.customDisplayWidth ?? null,
        customDisplayHeight: initialMetadata?.customDisplayHeight ?? null,
      })
    );
  }, [
    imageUrl,
    originalImageUrl,
    activeFrameSlot,
    defaultAspectPreset,
    defaultFitMode,
    defaultDisplaySize,
    initialMetadata,
  ]);

  useEffect(() => {
    if (!sourceUrl) return;
    let active = true;
    getImageNaturalDimensions(sourceUrl)
      .then((dims) => {
        if (active) {
          setNaturalDims(dims);
        }
      })
      .catch(() => {
        // Keep defaults
      });
    return () => {
      active = false;
    };
  }, [sourceUrl]);

  if (!isOpen) return null;

  const current = history.present;
  const numericAspect = resolveAspectRatio(
    current.aspectPreset,
    naturalDims.width,
    naturalDims.height,
    current.customRatio
  );

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setHistory((prev) =>
      applyEditorChange(
        prev,
        {
          croppedAreaPercentages: croppedArea,
          croppedAreaPixels,
        },
        false
      )
    );
  }, []);

  const renderEditedDataUrl = async (): Promise<string> => {
    if (!sourceUrl) {
      throw new Error('No source image selected to edit.');
    }
    return getCroppedImgDataUrl({
      imageSrc: sourceUrl,
      pixelCrop: current.croppedAreaPixels,
      rotation: current.rotation,
      targetWidth: customResizeApplied ? current.resizeWidth : undefined,
      targetHeight: customResizeApplied ? current.resizeHeight : undefined,
    });
  };

  const handleApplyCrop = async () => {
    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await renderEditedDataUrl();
      setAppliedPreviewDataUrl(dataUrl);
      setPreviewMode(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to render cropped preview.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelCrop = () => {
    setAppliedPreviewDataUrl(null);
    setPreviewMode(false);
    setHistory((prev) =>
      resetEditorHistory(prev, initialMetadata?.aspectPreset || defaultAspectPreset)
    );
    setCropModified(false);
  };

  const handleTogglePreview = async () => {
    if (!previewMode) {
      await handleApplyCrop();
    } else {
      setPreviewMode(false);
    }
  };

  const handleSaveAction = async (status: PublicationStatus) => {
    setError(null);
    setProcessing(true);
    try {
      const shouldRenderCrop =
        appliedPreviewDataUrl ||
        cropModified ||
        current.rotation !== 0 ||
        current.zoom !== 1 ||
        current.crop.x !== 0 ||
        current.crop.y !== 0 ||
        customResizeApplied ||
        Boolean(uploadedOriginalDataUrl);

      let editedDataUrl = appliedPreviewDataUrl || '';
      if (!editedDataUrl && shouldRenderCrop) {
        editedDataUrl = await renderEditedDataUrl();
      } else if (!editedDataUrl) {
        editedDataUrl = sourceUrl;
      }

      const metadata: ImageCropMetadata = {
        originalUrl: originalImageUrl || imageUrl,
        editedUrl: '',
        sectionName: sectionName || initialMetadata?.sectionName,
        category: imageCategory || initialMetadata?.category,
        zoom: current.zoom,
        rotation: current.rotation,
        crop: current.crop,
        croppedAreaPixels: current.croppedAreaPixels,
        croppedAreaPercentages: current.croppedAreaPercentages,
        aspectPreset: current.aspectPreset,
        customRatio: current.customRatio,
        resizeWidth: current.resizeWidth,
        resizeHeight: current.resizeHeight,
        position: current.position,
        objectPosition: current.objectPosition,
        displaySize: current.displaySize,
        fitMode: current.fitMode,
        customDisplayWidth: current.customDisplayWidth,
        customDisplayHeight: current.customDisplayHeight,
        status,
        updatedAt: new Date().toISOString(),
      };

      await onSave({
        editedDataUrl,
        originalDataUrl: uploadedOriginalDataUrl,
        cropMetadata: metadata,
        status,
        targetFrameSlot: activeFrameSlot,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save cropped photo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReplaceSourceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setSourceUrl(dataUrl);
      setUploadedOriginalDataUrl(dataUrl);
      setAppliedPreviewDataUrl(null);
      setCropModified(true);
      setHistory((prev) => resetEditorHistory(prev, current.aspectPreset));
    } catch (err: any) {
      setError(err?.message || 'Could not load selected image file.');
    }
  };

  const handleResizeWidthChange = (newW: number) => {
    const clampedW = Math.max(100, Math.min(4096, Math.round(newW || 100)));
    const nextH = lockResizeAspect
      ? Math.max(100, Math.round(clampedW / numericAspect))
      : current.resizeHeight;
    setCustomResizeApplied(true);
    setCropModified(true);
    setHistory((prev) =>
      applyEditorChange(prev, { resizeWidth: clampedW, resizeHeight: nextH })
    );
    setAppliedPreviewDataUrl(null);
  };

  const handleResizeHeightChange = (newH: number) => {
    const clampedH = Math.max(100, Math.min(4096, Math.round(newH || 100)));
    const nextW = lockResizeAspect
      ? Math.max(100, Math.round(clampedH * numericAspect))
      : current.resizeWidth;
    setCustomResizeApplied(true);
    setCropModified(true);
    setHistory((prev) =>
      applyEditorChange(prev, { resizeWidth: nextW, resizeHeight: clampedH })
    );
    setAppliedPreviewDataUrl(null);
  };

  const handleAspectPresetChange = (preset: AspectRatioPreset) => {
    const nextAspect = resolveAspectRatio(
      preset,
      naturalDims.width,
      naturalDims.height,
      current.customRatio
    );
    const nextH = Math.max(100, Math.round(current.resizeWidth / nextAspect));
    setCropModified(true);
    setHistory((prev) =>
      applyEditorChange(prev, {
        aspectPreset: preset,
        resizeHeight: nextH,
      })
    );
    setAppliedPreviewDataUrl(null);
  };

  const nudgePosition = (dx: number, dy: number) => {
    const nextCrop = {
      x: Math.round(current.crop.x + dx),
      y: Math.round(current.crop.y + dy),
    };
    const nextPos = {
      x: current.position.x - Math.round(dx / 4),
      y: current.position.y - Math.round(dy / 4),
    };
    setCropModified(true);
    setHistory((prev) =>
      applyEditorChange(prev, {
        crop: nextCrop,
        position: nextPos,
        objectPosition: computeObjectPosition(nextPos.x, nextPos.y),
      })
    );
    setAppliedPreviewDataUrl(null);
  };

  const handleFitToFrame = () => {
    setHistory((prev) =>
      applyEditorChange(prev, {
        fitMode: 'contain',
        zoom: 1,
        crop: { x: 0, y: 0 },
        position: { x: 50, y: 50 },
        objectPosition: '50% 50%',
      })
    );
    setAppliedPreviewDataUrl(null);
  };

  const handleFillFrame = () => {
    setHistory((prev) =>
      applyEditorChange(prev, {
        fitMode: 'cover',
        zoom: 1,
        crop: { x: 0, y: 0 },
        position: { x: 50, y: 50 },
        objectPosition: '50% 50%',
      })
    );
    setAppliedPreviewDataUrl(null);
  };

  const previewMeta: Partial<ImageCropMetadata> = {
    aspectPreset: current.aspectPreset,
    customRatio: current.customRatio,
    croppedAreaPixels: current.croppedAreaPixels,
    resizeWidth: current.resizeWidth,
    resizeHeight: current.resizeHeight,
    objectPosition: current.objectPosition,
    displaySize: current.displaySize,
    fitMode: current.fitMode,
    customDisplayWidth: current.customDisplayWidth,
    customDisplayHeight: current.customDisplayHeight,
  };

  const livePreviewContainer = getSectionImageContainerProps(
    sectionScope || 'portfolio',
    previewMeta,
    `${numericAspect}`
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Advanced Photo Crop, Zoom, Display Size & Position Editor"
      className="fixed inset-0 z-[75] bg-[#080808]/95 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#111111] border border-[#C9A45C]/50 w-full max-w-6xl max-h-[96vh] flex flex-col text-[#F5F5F5] shadow-2xl">
        {/* TOP TOOLBAR */}
        <div className="px-3 sm:px-5 py-3 border-b border-[#C9A45C]/25 bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C9A45C] font-semibold truncate">
              {sectionName ? `${sectionName} · Precision Image Studio` : 'Luxury Studio Photo Editor'}
            </div>
            <h3 className="text-sm sm:text-lg font-editorial font-bold text-[#F5F5F5] truncate">
              {title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {allowReplaceSource && (
              <label className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold border border-[#C9A45C]/40 text-[#E5C98A] hover:bg-[#C9A45C]/10 min-h-[34px]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload / Replace</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReplaceSourceFile}
                  className="hidden"
                />
              </label>
            )}

            <button
              type="button"
              onClick={() => {
                setHistory((prev) => undoEditorHistory(prev));
                setAppliedPreviewDataUrl(null);
              }}
              disabled={history.past.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] uppercase tracking-wider border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C]/10 disabled:opacity-35 min-h-[34px]"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHistory((prev) => redoEditorHistory(prev));
                setAppliedPreviewDataUrl(null);
              }}
              disabled={history.future.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] uppercase tracking-wider border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C]/10 disabled:opacity-35 min-h-[34px]"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHistory((prev) => resetEditorHistory(prev, defaultAspectPreset));
                setAppliedPreviewDataUrl(null);
                setCropModified(false);
                setCustomResizeApplied(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] uppercase tracking-wider border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5] min-h-[34px]"
              title="Reset Image"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Image</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePreview}
              disabled={processing}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold border min-h-[34px] ${
                previewMode
                  ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                  : 'border-[#C9A45C]/50 text-[#E5C98A] hover:bg-[#C9A45C]/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? 'Edit Canvas' : 'Preview Card'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="p-1.5 text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/25 min-h-[34px] min-w-[34px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 border border-red-500/60 bg-red-950/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* MAIN WORKSPACE */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: INTERACTIVE CANVAS OR LIVE WEBSITE CARD PREVIEW */}
          <div className="lg:col-span-7 bg-[#060606] p-3 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#C9A45C]/20 min-h-[340px]">
            {frameSlots && frameSlots.length > 0 && onChangeFrameSlot && (
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C9A45C]/15">
                <span className="text-[11px] uppercase tracking-wider text-[#C9A45C] font-semibold">
                  Website Section Frame:
                </span>
                <select
                  value={activeFrameSlot}
                  onChange={(e) => onChangeFrameSlot(e.target.value as WebsiteFrameSlot)}
                  className="bg-[#141414] border border-[#C9A45C]/40 px-3 py-1.5 text-xs text-[#E5C98A] focus:outline-none focus:border-[#C9A45C]"
                >
                  {frameSlots.map((slot) => (
                    <option key={slot.slot} value={slot.slot}>
                      {slot.label} ({slot.imageSettings.aspectPreset})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {previewMode ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-[#C9A45C] font-semibold text-center">
                  Website Live Card Preview · Size: {current.displaySize.toUpperCase()} · Fit:{' '}
                  {current.fitMode.toUpperCase()} · Ratio: {current.aspectPreset}
                </div>
                <div className="w-full max-w-md border border-[#C9A45C]/40 bg-[#121212] p-4 space-y-3">
                  <div
                    className={livePreviewContainer.wrapperClass}
                    style={livePreviewContainer.wrapperStyle}
                  >
                    <img
                      src={appliedPreviewDataUrl || sourceUrl}
                      alt="Website Card Preview"
                      style={livePreviewContainer.imgStyle}
                    />
                  </div>
                  <div className="pt-1 border-t border-[#C9A45C]/15 flex items-center justify-between text-[11px] text-[#A7A7A7]">
                    <span className="text-[#E5C98A] font-semibold truncate">{title}</span>
                    <span className="shrink-0 font-mono">
                      Pos {current.objectPosition}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[310px] sm:h-[440px] bg-[#0B0B0B] border border-[#C9A45C]/30 overflow-hidden touch-none">
                <Cropper
                  image={sourceUrl}
                  crop={current.crop}
                  zoom={current.zoom}
                  rotation={current.rotation}
                  aspect={numericAspect}
                  objectFit={current.fitMode === 'contain' ? 'contain' : 'horizontal-cover'}
                  minZoom={0.4}
                  maxZoom={4}
                  restrictPosition={false}
                  onCropChange={(c) => {
                    setCropModified(true);
                    setHistory((prev) => applyEditorChange(prev, { crop: c }, false));
                  }}
                  onZoomChange={(z) => {
                    setCropModified(true);
                    setHistory((prev) => applyEditorChange(prev, { zoom: z }, false));
                  }}
                  onRotationChange={(r) => {
                    setCropModified(true);
                    setHistory((prev) => applyEditorChange(prev, { rotation: r }, false));
                  }}
                  onCropComplete={onCropComplete}
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A7A7A7]">
              <span>Drag or pinch inside frame · Independent from Display Size</span>
              <span className="text-[#E5C98A] font-mono">
                Zoom {current.zoom.toFixed(2)}x · Size {current.displaySize.toUpperCase()} · {current.fitMode.toUpperCase()}
              </span>
            </div>
          </div>

          {/* RIGHT: ALL PRECISION CONTROLS */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-5 bg-[#121212] text-xs">
            {/* A. IMAGE DISPLAY SIZE (INDEPENDENT FROM ZOOM) & FIT/FILL MODE */}
            <div className="p-3.5 border border-[#C9A45C]/35 bg-[#161616] space-y-3">
              <div className="flex items-center justify-between">
                <label className="uppercase tracking-wider text-[#C9A45C] font-bold">
                  Image Display Size on Website
                </label>
                <span className="text-[10px] text-[#A7A7A7]">Does not change crop zoom</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as ImageDisplaySize[]).map((sz) => {
                  const active = current.displaySize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setHistory((prev) =>
                          applyEditorChange(prev, {
                            displaySize: sz,
                            customDisplayWidth: null,
                            customDisplayHeight: null,
                          })
                        );
                      }}
                      className={`py-2 px-2 uppercase tracking-wider font-semibold border transition-colors ${
                        active
                          ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                          : 'bg-[#101010] text-[#E5C98A] border-[#C9A45C]/30 hover:border-[#C9A45C]/70'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Display Width / Height */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-[#A7A7A7] mb-1">
                    Custom Max Width (px, optional)
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={1400}
                    placeholder="Auto"
                    value={current.customDisplayWidth ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setHistory((prev) => applyEditorChange(prev, { customDisplayWidth: val }));
                    }}
                    className="w-full bg-[#101010] border border-[#C9A45C]/25 px-2.5 py-1.5 text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A7A7A7] mb-1">
                    Custom Max Height (px, optional)
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={1200}
                    placeholder="Auto"
                    value={current.customDisplayHeight ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setHistory((prev) => applyEditorChange(prev, { customDisplayHeight: val }));
                    }}
                    className="w-full bg-[#101010] border border-[#C9A45C]/25 px-2.5 py-1.5 text-[#F5F5F5]"
                  />
                </div>
              </div>

              {/* Fit to Frame vs Fill Frame */}
              <div className="pt-2 border-t border-[#C9A45C]/15">
                <div className="text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1.5">
                  Display Mode (No Text/Subject Clipping)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFitToFrame}
                    className={`py-2 px-2.5 flex items-center justify-center gap-1.5 border font-semibold ${
                      current.fitMode === 'contain'
                        ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                        : 'bg-[#101010] text-[#E5C98A] border-[#C9A45C]/30'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Fit to Frame</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillFrame}
                    className={`py-2 px-2.5 flex items-center justify-center gap-1.5 border font-semibold ${
                      current.fitMode === 'cover'
                        ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C]'
                        : 'bg-[#101010] text-[#E5C98A] border-[#C9A45C]/30'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fill Frame</span>
                  </button>
                </div>
              </div>
            </div>

            {/* B. CROP & FRAME RATIO OPTIONS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="uppercase tracking-wider text-[#C9A45C] font-semibold">
                  Crop & Frame Ratio
                </label>
                <span className="text-[10px] text-[#A7A7A7]">
                  Source: {naturalDims.width}×{naturalDims.height}px
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ASPECT_RATIO_PRESETS.map((p) => {
                  const active = current.aspectPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAspectPresetChange(p.id)}
                      className={`px-2 py-2 text-left border transition-colors ${
                        active
                          ? 'bg-[#C9A45C] text-[#080808] border-[#C9A45C] font-bold'
                          : 'bg-[#181818] text-[#F5F5F5] border-[#C9A45C]/25 hover:border-[#C9A45C]/60'
                      }`}
                    >
                      <div className="text-[10px] leading-tight">{p.label}</div>
                    </button>
                  );
                })}
              </div>

              {(current.aspectPreset === 'custom' || current.aspectPreset === 'free') && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-[#A7A7A7] mb-1">
                      Width Ratio
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={current.customRatio.width}
                      onChange={(e) => {
                        const w = Math.max(1, Number(e.target.value) || 1);
                        setCropModified(true);
                        setHistory((prev) =>
                          applyEditorChange(prev, {
                            customRatio: { ...current.customRatio, width: w },
                          })
                        );
                        setAppliedPreviewDataUrl(null);
                      }}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 px-2.5 py-1.5 text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A7A7A7] mb-1">
                      Height Ratio
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={current.customRatio.height}
                      onChange={(e) => {
                        const h = Math.max(1, Number(e.target.value) || 1);
                        setCropModified(true);
                        setHistory((prev) =>
                          applyEditorChange(prev, {
                            customRatio: { ...current.customRatio, height: h },
                          })
                        );
                        setAppliedPreviewDataUrl(null);
                      }}
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 px-2.5 py-1.5 text-[#F5F5F5]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C. ZOOM CONTROLS */}
            <div className="pt-3 border-t border-[#C9A45C]/20 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="uppercase tracking-wider text-[#C9A45C] font-semibold">
                  Crop Zoom ({current.zoom.toFixed(2)}x)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCropModified(true);
                      setHistory((prev) =>
                        applyEditorChange(prev, { zoom: prev.present.zoom - 0.15 })
                      );
                      setAppliedPreviewDataUrl(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808]"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropModified(true);
                      setHistory((prev) =>
                        applyEditorChange(prev, { zoom: prev.present.zoom + 0.15 })
                      );
                      setAppliedPreviewDataUrl(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808]"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistory((prev) => applyEditorChange(prev, { zoom: 1 }));
                      setAppliedPreviewDataUrl(null);
                    }}
                    className="px-2 py-1 bg-[#181818] border border-[#C9A45C]/25 text-[#A7A7A7] hover:text-[#F5F5F5]"
                  >
                    Reset Zoom
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0.4}
                max={4}
                step={0.05}
                value={current.zoom}
                onChange={(e) => {
                  setCropModified(true);
                  setHistory((prev) =>
                    applyEditorChange(prev, { zoom: Number(e.target.value) })
                  );
                  setAppliedPreviewDataUrl(null);
                }}
                className="w-full accent-[#C9A45C]"
              />
            </div>

            {/* D. POSITION CONTROLS */}
            <div className="pt-3 border-t border-[#C9A45C]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="uppercase tracking-wider text-[#C9A45C] font-semibold flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Move & Position Inside Frame</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setHistory((prev) =>
                      applyEditorChange(prev, {
                        crop: { x: 0, y: 0 },
                        position: { x: 50, y: 50 },
                        objectPosition: '50% 50%',
                      })
                    );
                    setAppliedPreviewDataUrl(null);
                  }}
                  className="text-[10px] text-[#E5C98A] hover:underline"
                >
                  Reset Position
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCropModified(true);
                    setHistory((prev) =>
                      applyEditorChange(prev, {
                        zoom: 1.4,
                        crop: { x: 0, y: 40 },
                        position: { x: 50, y: 15 },
                        objectPosition: '50% 15%',
                      })
                    );
                    setAppliedPreviewDataUrl(null);
                  }}
                  className="px-2 py-1.5 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] flex items-center justify-center gap-1 text-[10px]"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Center Face</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistory((prev) =>
                      applyEditorChange(prev, {
                        crop: { ...prev.present.crop, x: 0 },
                        position: { ...prev.present.position, x: 50 },
                        objectPosition: computeObjectPosition(50, prev.present.position.y),
                      })
                    );
                    setAppliedPreviewDataUrl(null);
                  }}
                  className="px-2 py-1.5 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] flex items-center justify-center gap-1 text-[10px]"
                >
                  <AlignCenterHorizontal className="w-3 h-3" />
                  <span>Center H</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistory((prev) =>
                      applyEditorChange(prev, {
                        crop: { ...prev.present.crop, y: 0 },
                        position: { ...prev.present.position, y: 50 },
                        objectPosition: computeObjectPosition(prev.present.position.x, 50),
                      })
                    );
                    setAppliedPreviewDataUrl(null);
                  }}
                  className="px-2 py-1.5 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808] flex items-center justify-center gap-1 text-[10px]"
                >
                  <AlignCenterVertical className="w-3 h-3" />
                  <span>Center V</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#161616] p-2.5 border border-[#C9A45C]/20">
                <span className="text-[10px] text-[#A7A7A7] uppercase">Move Image:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => nudgePosition(-20, 0)}
                    className="p-2 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePosition(0, -20)}
                    className="p-2 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePosition(0, 20)}
                    className="p-2 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePosition(20, 0)}
                    className="p-2 border border-[#C9A45C]/30 hover:bg-[#C9A45C]/20"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* E. ROTATE CONTROLS */}
            <div className="pt-3 border-t border-[#C9A45C]/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="uppercase tracking-wider text-[#C9A45C] font-semibold">
                  Rotate ({current.rotation}°)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCropModified(true);
                      setHistory((prev) =>
                        applyEditorChange(prev, { rotation: prev.present.rotation - 90 })
                      );
                      setAppliedPreviewDataUrl(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>-90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropModified(true);
                      setHistory((prev) =>
                        applyEditorChange(prev, { rotation: prev.present.rotation + 90 })
                      );
                      setAppliedPreviewDataUrl(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-[#181818] border border-[#C9A45C]/30 text-[#E5C98A] hover:bg-[#C9A45C] hover:text-[#080808]"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>+90°</span>
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={current.rotation}
                onChange={(e) => {
                  setCropModified(true);
                  setHistory((prev) =>
                    applyEditorChange(prev, { rotation: Number(e.target.value) })
                  );
                  setAppliedPreviewDataUrl(null);
                }}
                className="w-full accent-[#C9A45C]"
              />
            </div>

            {/* F. PIXEL RESIZE & APPLY / CANCEL CROP */}
            <div className="pt-3 border-t border-[#C9A45C]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="uppercase tracking-wider text-[#C9A45C] font-semibold">
                  Resize Image Pixels {customResizeApplied ? '(Custom)' : '(Auto Native)'}
                </label>
                <button
                  type="button"
                  onClick={() => setLockResizeAspect(!lockResizeAspect)}
                  className="flex items-center gap-1 text-[10px] text-[#E5C98A]"
                >
                  {lockResizeAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{lockResizeAspect ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A7A7A7] mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={4096}
                    value={current.resizeWidth}
                    onChange={(e) => handleResizeWidthChange(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 px-2.5 py-1.5 text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A7A7A7] mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={4096}
                    value={current.resizeHeight}
                    onChange={(e) => handleResizeHeightChange(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#C9A45C]/30 px-2.5 py-1.5 text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={processing}
                  className="py-2.5 bg-[#1C1C1C] border border-[#C9A45C]/70 text-[#E5C98A] hover:bg-[#C9A45C]/20 uppercase tracking-wider font-bold flex items-center justify-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{processing ? 'Rendering...' : 'Apply Crop'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={processing}
                  className="py-2.5 bg-[#141414] border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5] uppercase tracking-wider font-semibold"
                >
                  Cancel Crop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE & PUBLISH ACTION BAR */}
        <div className="px-3 sm:px-5 py-3.5 border-t border-[#C9A45C]/25 bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-[#A7A7A7]">
            Original image preserved; display size ({current.displaySize}) & crop settings save independently.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-3.5 py-2 text-xs uppercase tracking-wider border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5] min-h-[38px]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveAction('draft')}
              disabled={processing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs uppercase tracking-wider font-semibold border border-[#C9A45C]/50 text-[#E5C98A] hover:bg-[#C9A45C]/10 disabled:opacity-50 min-h-[38px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAction('published')}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#1E1E1E] border border-[#C9A45C] text-[#E5C98A] hover:bg-[#C9A45C]/20 disabled:opacity-50 min-h-[38px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAction('published')}
              disabled={processing}
              className="flex items-center gap-1.5 px-5 py-2 text-xs uppercase tracking-widest font-bold bg-[#C9A45C] text-[#080808] hover:bg-[#E5C98A] disabled:opacity-50 min-h-[38px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{processing ? 'Saving...' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
