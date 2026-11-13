import {
  AspectRatioPreset,
  ImageCropMetadata,
  ImageDisplaySize,
  ImageFitMode,
  SectionImageItem,
} from '../types';

export type SectionImageScope = 'courses' | 'portfolio' | 'events' | 'awards';

/**
 * Computes exact CSS aspect-ratio string for an image container from saved ImageCropMetadata.
 * Ensures published frames preserve the user's chosen ratio without unexpected distortion or clipping.
 */
export function resolveFrameAspectCss(
  meta?: Partial<ImageCropMetadata> | null,
  fallbackAspect = '16 / 9'
): string {
  if (!meta?.aspectPreset) return fallbackAspect;
  switch (meta.aspectPreset) {
    case '1:1':
      return '1 / 1';
    case '3:4':
      return '3 / 4';
    case '4:5':
      return '4 / 5';
    case '9:16':
      return '9 / 16';
    case '16:9':
      return '16 / 9';
    case 'custom': {
      const w = Math.max(1, Number(meta.customRatio?.width) || 4);
      const h = Math.max(1, Number(meta.customRatio?.height) || 5);
      return `${w} / ${h}`;
    }
    case 'free':
    case 'original': {
      if (meta.croppedAreaPixels?.width && meta.croppedAreaPixels?.height) {
        return `${Math.round(meta.croppedAreaPixels.width)} / ${Math.round(
          meta.croppedAreaPixels.height
        )}`;
      }
      if (meta.resizeWidth && meta.resizeHeight) {
        return `${Math.round(meta.resizeWidth)} / ${Math.round(meta.resizeHeight)}`;
      }
      return fallbackAspect;
    }
    default:
      return fallbackAspect;
  }
}

/**
 * Returns layout container classes & inline styles for Small / Medium / Large display sizes
 * independently per section, never overflowing mobile or desktop viewports.
 */
export function getSectionImageContainerProps(
  section: SectionImageScope,
  meta?: Partial<ImageCropMetadata> | null,
  fallbackAspect = '16 / 9'
): {
  wrapperClass: string;
  wrapperStyle: React.CSSProperties;
  imgStyle: React.CSSProperties;
  fitMode: ImageFitMode;
  displaySize: ImageDisplaySize;
} {
  const displaySize: ImageDisplaySize = meta?.displaySize || 'medium';
  const fitMode: ImageFitMode = meta?.fitMode || (section === 'awards' ? 'contain' : 'cover');
  const aspectCss = resolveFrameAspectCss(meta, fallbackAspect);
  const objectPosition = meta?.objectPosition || '50% 35%';

  let wrapperClass = 'relative overflow-hidden bg-[#141414] mx-auto w-full';
  const wrapperStyle: React.CSSProperties = {
    aspectRatio: aspectCss,
    maxWidth: '100%',
  };

  if (meta?.customDisplayWidth && meta.customDisplayWidth > 0) {
    wrapperStyle.maxWidth = `min(100%, ${Math.round(meta.customDisplayWidth)}px)`;
  } else if (section === 'awards') {
    if (displaySize === 'small') {
      wrapperClass = 'relative overflow-hidden bg-[#141414] shrink-0 w-24 sm:w-28 max-w-full';
    } else if (displaySize === 'medium') {
      wrapperClass = 'relative overflow-hidden bg-[#141414] shrink-0 w-36 sm:w-44 max-w-full';
    } else {
      wrapperClass = 'relative overflow-hidden bg-[#141414] w-full';
    }
  } else {
    if (displaySize === 'small') {
      wrapperStyle.maxWidth = 'min(100%, 260px)';
    } else if (displaySize === 'medium') {
      wrapperStyle.maxWidth = '100%';
    } else {
      // Large: generous height allowance for tall or cinematic showcase
      wrapperStyle.maxWidth = '100%';
      wrapperStyle.minHeight = section === 'courses' ? '260px' : '300px';
    }
  }

  if (meta?.customDisplayHeight && meta.customDisplayHeight > 0) {
    wrapperStyle.maxHeight = `${Math.round(meta.customDisplayHeight)}px`;
  }

  const imgStyle: React.CSSProperties = {
    objectFit: fitMode,
    objectPosition,
    width: '100%',
    height: '100%',
  };

  return {
    wrapperClass,
    wrapperStyle,
    imgStyle,
    fitMode,
    displaySize,
  };
}

export function formatAspectLabel(preset?: AspectRatioPreset, customRatio?: { width: number; height: number }): string {
  if (!preset) return 'Original';
  if (preset === 'custom' && customRatio) return `${customRatio.width}:${customRatio.height}`;
  if (preset === 'free') return 'Free';
  if (preset === 'original') return 'Original';
  return preset;
}

export function formatDisplaySizeLabel(size?: ImageDisplaySize): string {
  if (size === 'small') return 'Small';
  if (size === 'large') return 'Large';
  return 'Medium';
}

/**
 * Reorders a SectionImageItem array cleanly by index offset (-1 or +1) and reassigns `order`.
 */
export function reorderSectionImages(
  items: SectionImageItem[],
  fromIndex: number,
  direction: -1 | 1
): SectionImageItem[] {
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items;
  }
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy.map((item, idx) => ({ ...item, order: idx }));
}

export const DEFAULT_ASSET_URLS = [
  '/src/assets/images/hero_sobur_portrait_1794476542316.jpg',
  '/src/assets/images/about_fashion_runway_1794476556845.jpg',
  '/src/assets/images/editorial_photoshoot_1794476571514.jpg',
  '/src/assets/images/event_award_gala_1794476585239.jpg',
];

export function isDefaultAssetUrl(url?: string | null): boolean {
  if (!url) return false;
  return DEFAULT_ASSET_URLS.includes(url) || url.startsWith('/src/assets/images/');
}
