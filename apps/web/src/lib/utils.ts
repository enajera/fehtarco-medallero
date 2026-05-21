import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get initials from a name (max 2 chars) */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Format a date string to "DD MMM" in Spanish */
export function formatEventDate(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('es', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return { day, month };
}
