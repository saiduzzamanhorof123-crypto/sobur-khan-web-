import { PublicationStatus } from '../types';

/**
 * Checks if a content item is strictly visible to the public.
 * Only items with status === 'published' are permitted on the public website.
 */
export function isPubliclyVisible(status: PublicationStatus | string | undefined | null): boolean {
  return status === 'published';
}

/**
 * Filters any list of publishable content items so that only published records are returned.
 * Used by backend API routes and frontend presentation components to guarantee zero leaks
 * of draft, unpublished, or archived owner content.
 */
export function filterOnlyPublished<T extends { status: PublicationStatus }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item.status === 'published');
}

/**
 * Validates allowed status transitions for the admin publishing lifecycle.
 */
export function canTransitionStatus(
  currentStatus: PublicationStatus,
  nextStatus: PublicationStatus
): boolean {
  if (currentStatus === nextStatus) return true;
  const validStatuses: PublicationStatus[] = ['draft', 'published', 'unpublished', 'archived'];
  return validStatuses.includes(nextStatus);
}

/**
 * Formats date into luxury editorial format (e.g., "OCTOBER 2026" or "14 Nov 2026")
 */
export function formatEditorialDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Truncate long text cleanly with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '...';
}
