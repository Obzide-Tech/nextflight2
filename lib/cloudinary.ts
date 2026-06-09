const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dwp64dtwa';
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;

export function cloudinaryVideoUrl(
  publicId: string,
  opts?: { width?: number; quality?: string; format?: string },
): string {
  const parts: string[] = [];
  if (opts?.width) parts.push(`w_${opts.width}`);
  parts.push(`q_${opts?.quality ?? 'auto'}`);
  parts.push(`f_${opts?.format ?? 'auto'}`);
  const transform = parts.join(',');
  return `${BASE}/video/upload/${transform}/${publicId}`;
}

export function cloudinaryStreamUrl(publicId: string): string {
  return `${BASE}/video/upload/sp_auto/${publicId}.m3u8`;
}

export function cloudinaryImageUrl(
  publicId: string,
  opts?: { width?: number; height?: number; crop?: string; quality?: string },
): string {
  const parts: string[] = [];
  if (opts?.width) parts.push(`w_${opts.width}`);
  if (opts?.height) parts.push(`h_${opts.height}`);
  parts.push(`c_${opts?.crop ?? 'fill'}`);
  parts.push(`g_auto`);
  parts.push(`q_${opts?.quality ?? 'auto'}`);
  parts.push('f_auto');
  const transform = parts.join(',');
  return `${BASE}/image/upload/${transform}/${publicId}`;
}

export function cloudinaryThumbnailUrl(videoPublicId: string, width = 640): string {
  return `${BASE}/video/upload/w_${width},c_fill,g_auto,q_auto,f_auto,so_3/${videoPublicId}.jpg`;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

export function extractPublicId(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(/\/(?:video|image|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match?.[1] ?? null;
}
