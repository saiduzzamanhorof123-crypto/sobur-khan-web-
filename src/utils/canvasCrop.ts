export interface PixelCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Generates a high-resolution cropped, rotated, and optionally resized JPEG/PNG/WEBP Data URL
 * from a source image URL + crop pixel box.
 */
export async function getCroppedImgDataUrl(options: {
  imageSrc: string;
  pixelCrop: PixelCropArea | null;
  rotation?: number;
  targetWidth?: number;
  targetHeight?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}): Promise<string> {
  const {
    imageSrc,
    pixelCrop,
    rotation = 0,
    targetWidth,
    targetHeight,
    mimeType = 'image/jpeg',
    quality = 0.92,
  } = options;

  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to acquire 2D canvas context for cropping');

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    rotation
  );

  canvas.width = Math.max(1, Math.round(bBoxWidth));
  canvas.height = Math.max(1, Math.round(bBoxHeight));

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.translate(-(image.naturalWidth || image.width) / 2, -(image.naturalHeight || image.height) / 2);
  ctx.drawImage(image, 0, 0);

  const cropBox: PixelCropArea =
    pixelCrop && pixelCrop.width > 0 && pixelCrop.height > 0
      ? pixelCrop
      : {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        };

  const outCanvas = document.createElement('canvas');
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Unable to acquire output canvas context');

  const rawCropW = Math.max(1, cropBox.width);
  const rawCropH = Math.max(1, cropBox.height);

  // Use explicit target dimensions when specified, otherwise preserve cropped pixel resolution
  // so small photos aren't unnecessarily upscaled into blurry assets.
  const finalWidth =
    targetWidth && targetWidth > 0 ? Math.round(targetWidth) : Math.round(rawCropW);
  const finalHeight =
    targetHeight && targetHeight > 0 ? Math.round(targetHeight) : Math.round(rawCropH);

  outCanvas.width = Math.max(1, finalWidth);
  outCanvas.height = Math.max(1, finalHeight);

  // Fill deep black backdrop in case crop extends beyond natural boundaries (e.g. Zoom Out / Fit to Frame)
  outCtx.fillStyle = '#080808';
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

  // Compute safe intersection between cropBox and rotated source canvas bounds
  // so negative sx/sy or overshooting width/height never distort drawImage across browsers.
  const srcX1 = Math.max(0, cropBox.x);
  const srcY1 = Math.max(0, cropBox.y);
  const srcX2 = Math.min(canvas.width, cropBox.x + rawCropW);
  const srcY2 = Math.min(canvas.height, cropBox.y + rawCropH);

  const srcW = srcX2 - srcX1;
  const srcH = srcY2 - srcY1;

  if (srcW > 0 && srcH > 0) {
    const scaleX = outCanvas.width / rawCropW;
    const scaleY = outCanvas.height / rawCropH;
    const destX = (srcX1 - cropBox.x) * scaleX;
    const destY = (srcY1 - cropBox.y) * scaleY;
    const destW = srcW * scaleX;
    const destH = srcH * scaleY;

    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(canvas, srcX1, srcY1, srcW, srcH, destX, destY, destW, destH);
  }

  return outCanvas.toDataURL(mimeType, quality);
}

export async function getImageNaturalDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  const img = await createImage(imageSrc);
  return {
    width: img.naturalWidth || img.width || 1200,
    height: img.naturalHeight || img.height || 1500,
  };
}
