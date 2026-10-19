import type { TaskAgeLabel } from '@/types/task';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function truncateDescription(description: string, maxLength = 50): string {
  if (description.length <= maxLength) {
    return description;
  }
  return `${description.slice(0, maxLength)}...`;
}

export function getTaskAgeLabel(
  createdAt: string,
  now: Date = new Date(),
): TaskAgeLabel {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return 'new';
  }

  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(elapsedMs / DAY_IN_MS);

  if (diffDays === 0) return 'new';
  if (diffDays === 1) return '1 day';
  if (diffDays === 2) return '2 days';
  if (diffDays === 3) return '3 days';
  return '>3 days';
}
