/**
 * Shared constants for BucketList components.
 */

export const CATEGORIES = [
  { value: 'ADVENTURE', label: 'Adventure', color: 'bg-[#ffed00]' },
  { value: 'SKILLS', label: 'Skills', color: 'bg-[#bdf2ff]' },
  { value: 'TRAVEL', label: 'Travel', color: 'bg-[#ffdad6]' },
  { value: 'FITNESS', label: 'Fitness', color: 'bg-[#d9f99d]' },
  { value: 'CAREER', label: 'Career', color: 'bg-[#e9d5ff]' },
];

export const STATUS_FILTERS = [
  { key: 'all', label: 'All', activeBg: 'bg-black text-white' },
  {
    key: 'in-progress',
    label: 'In Progress',
    activeBg: 'bg-[#ffed00] text-black',
  },
  {
    key: 'not-started',
    label: 'Not Started',
    activeBg: 'bg-[#bdf2ff] text-black',
  },
  {
    key: 'completed',
    label: 'Completed',
    activeBg: 'bg-[#ffdad6] text-black',
  },
];

export const CATEGORY_COLOR_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.color])
);

/** Human-readable status label */
export function statusLabel(status) {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Not Started';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

/** Format an ISO date string to a short readable form */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Check if a deadline is past */
export function isOverdue(deadline) {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

/** Demo user id used for team ownership checks. */
export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_NAME = 'You (Demo)';
