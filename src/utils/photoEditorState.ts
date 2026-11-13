import { AspectRatioPreset, ImageDisplaySize, ImageFitMode } from '../types';

export interface PhotoEditSnapshot {
  zoom: number;
  rotation: number;
  crop: { x: number; y: number };
  croppedAreaPercentages: { x: number; y: number; width: number; height: number } | null;
  croppedAreaPixels: { x: number; y: number; width: number; height: number } | null;
  aspectPreset: AspectRatioPreset;
  customRatio: { width: number; height: number };
  resizeWidth: number;
  resizeHeight: number;
  position: { x: number; y: number }; // 0-100 percentages for CSS object-position
  objectPosition: string;
  displaySize: ImageDisplaySize;
  fitMode: ImageFitMode;
  customDisplayWidth: number | null;
  customDisplayHeight: number | null;
}

export interface PhotoEditorHistory {
  past: PhotoEditSnapshot[];
  present: PhotoEditSnapshot;
  future: PhotoEditSnapshot[];
}

export const ASPECT_RATIO_PRESETS: Array<{
  id: AspectRatioPreset;
  label: string;
  description: string;
}> = [
  { id: 'free', label: 'Free Crop', description: 'Unconstrained aspect framing' },
  { id: 'original', label: 'Original', description: 'Keep natural image proportions' },
  { id: '1:1', label: '1:1 Square', description: 'Square' },
  { id: '3:4', label: '3:4 Portrait', description: 'Classic Portrait' },
  { id: '4:5', label: '4:5 Portrait', description: 'Instagram Portrait' },
  { id: '9:16', label: '9:16 Vertical', description: 'Story / Full Vertical' },
  { id: '16:9', label: '16:9 Landscape', description: 'Widescreen Landscape' },
  { id: 'custom', label: 'Custom Frame', description: 'Custom width & height ratio' },
];

export function clampZoom(zoom: number): number {
  if (Number.isNaN(zoom)) return 1;
  return Math.min(4, Math.max(0.4, Number(zoom.toFixed(2))));
}

export function normalizeRotation(deg: number): number {
  if (Number.isNaN(deg)) return 0;
  let r = deg % 360;
  if (r > 180) r -= 360;
  if (r < -180) r += 360;
  return Math.round(r);
}

export function clampPositionPercent(val: number): number {
  if (Number.isNaN(val)) return 50;
  return Math.min(100, Math.max(0, Math.round(val)));
}

export function computeObjectPosition(xPercent: number, yPercent: number): string {
  return `${clampPositionPercent(xPercent)}% ${clampPositionPercent(yPercent)}%`;
}

export function resolveAspectRatio(
  preset: AspectRatioPreset,
  naturalWidth = 4,
  naturalHeight = 5,
  customRatio = { width: 4, height: 5 }
): number {
  switch (preset) {
    case '1:1':
      return 1;
    case '3:4':
      return 3 / 4;
    case '4:5':
      return 4 / 5;
    case '9:16':
      return 9 / 16;
    case '16:9':
      return 16 / 9;
    case 'custom':
    case 'free': {
      const w = Math.max(1, Number(customRatio.width) || 1);
      const h = Math.max(1, Number(customRatio.height) || 1);
      if (preset === 'free' && customRatio.width === 4 && customRatio.height === 5) {
        return Math.max(1, Number(naturalWidth) || 4) / Math.max(1, Number(naturalHeight) || 5);
      }
      return w / h;
    }
    case 'original':
    default: {
      const w = Math.max(1, Number(naturalWidth) || 4);
      const h = Math.max(1, Number(naturalHeight) || 5);
      return w / h;
    }
  }
}

export function createDefaultSnapshot(
  aspectPreset: AspectRatioPreset = 'original',
  resizeWidth = 1200,
  resizeHeight = 1500,
  displaySize: ImageDisplaySize = 'medium',
  fitMode: ImageFitMode = 'cover'
): PhotoEditSnapshot {
  return {
    zoom: 1,
    rotation: 0,
    crop: { x: 0, y: 0 },
    croppedAreaPercentages: null,
    croppedAreaPixels: null,
    aspectPreset,
    customRatio: { width: 4, height: 5 },
    resizeWidth,
    resizeHeight,
    position: { x: 50, y: 50 },
    objectPosition: '50% 50%',
    displaySize,
    fitMode,
    customDisplayWidth: null,
    customDisplayHeight: null,
  };
}

export function createInitialEditorHistory(initial?: Partial<PhotoEditSnapshot>): PhotoEditorHistory {
  const base = createDefaultSnapshot(
    initial?.aspectPreset || 'original',
    initial?.resizeWidth ?? 1200,
    initial?.resizeHeight ?? 1500,
    initial?.displaySize || 'medium',
    initial?.fitMode || 'cover'
  );
  const pos = initial?.position || base.position;
  const present: PhotoEditSnapshot = {
    ...base,
    ...initial,
    position: pos,
    objectPosition: initial?.objectPosition || computeObjectPosition(pos.x, pos.y),
    displaySize: initial?.displaySize || base.displaySize,
    fitMode: initial?.fitMode || base.fitMode,
    customDisplayWidth: initial?.customDisplayWidth ?? null,
    customDisplayHeight: initial?.customDisplayHeight ?? null,
  };
  return {
    past: [],
    present,
    future: [],
  };
}

export function applyEditorChange(
  history: PhotoEditorHistory,
  patch: Partial<PhotoEditSnapshot>,
  recordHistory = true
): PhotoEditorHistory {
  const nextPosition = patch.position
    ? {
        x: clampPositionPercent(patch.position.x),
        y: clampPositionPercent(patch.position.y),
      }
    : history.present.position;

  const nextPresent: PhotoEditSnapshot = {
    ...history.present,
    ...patch,
    zoom: patch.zoom !== undefined ? clampZoom(patch.zoom) : history.present.zoom,
    rotation:
      patch.rotation !== undefined ? normalizeRotation(patch.rotation) : history.present.rotation,
    position: nextPosition,
    objectPosition:
      patch.objectPosition ||
      (patch.position
        ? computeObjectPosition(nextPosition.x, nextPosition.y)
        : history.present.objectPosition),
  };

  if (!recordHistory) {
    return { ...history, present: nextPresent };
  }

  return {
    past: [...history.past.slice(-29), history.present],
    present: nextPresent,
    future: [],
  };
}

export function undoEditorHistory(history: PhotoEditorHistory): PhotoEditorHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoEditorHistory(history: PhotoEditorHistory): PhotoEditorHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  const newFuture = history.future.slice(1);
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}

export function resetEditorHistory(
  history: PhotoEditorHistory,
  defaultAspect: AspectRatioPreset = 'original'
): PhotoEditorHistory {
  const fresh = createDefaultSnapshot(
    defaultAspect,
    history.present.resizeWidth,
    history.present.resizeHeight,
    history.present.displaySize,
    history.present.fitMode
  );
  return {
    past: [...history.past.slice(-29), history.present],
    present: fresh,
    future: [],
  };
}
