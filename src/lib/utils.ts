import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a next follow-up value for storage.
 * - Trims whitespace
 * - Returns null for empty values
 * - Limits length to 1000 characters to avoid excessively long input
 */
export function normalizeNextFollowUp(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  // Remove control characters except common whitespace
  const cleaned = s.replace(/[\x00-\x1F\x7F]/g, " ").trim()
  if (!cleaned) return null
  return cleaned.length > 1000 ? cleaned.slice(0, 1000) : cleaned
}
