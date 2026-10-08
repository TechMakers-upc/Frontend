export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export function priorityRank(priority: Priority | null): number {
  return priority === null ? PRIORITIES.length : PRIORITIES.indexOf(priority);
}
