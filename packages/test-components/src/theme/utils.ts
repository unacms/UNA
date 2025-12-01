// Utility functions for styling

/**
 * Simple className concatenation utility
 * Filters out falsy values and joins with space
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

