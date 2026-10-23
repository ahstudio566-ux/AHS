import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Safely parse any date value (Date, string, number, undefined, null) into a valid Date object.
 * Returns null if the value cannot be parsed into a valid Date.
 */
export function parseSafeDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try handling ISO strings like "2026-08-02T14:00" without seconds or timezone
  if (typeof dateVal === 'string') {
    let str = dateVal.trim();
    if (str.includes('T')) {
      if (!str.endsWith('Z') && !str.includes('+') && !str.includes('-')) {
        str += 'Z';
      }
      const reParsed = new Date(str);
      if (!isNaN(reParsed.getTime())) return reParsed;
    }
  }
  return null;
}

/**
 * Safely format a date relative to now (e.g. "5 phút trước") without throwing RangeError.
 */
export function safeFormatDistanceToNow(dateVal: any, fallback = 'Vừa xong'): string {
  const d = parseSafeDate(dateVal);
  if (!d) return fallback;
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
    return fallback;
  }
}

/**
 * Safely format date to local date string without throwing RangeError.
 */
export function safeLocaleDateString(
  dateVal: any, 
  locale = 'vi-VN', 
  options?: Intl.DateTimeFormatOptions, 
  fallback = 'Gần đây'
): string {
  const d = parseSafeDate(dateVal);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely format date to local time string without throwing RangeError.
 */
export function safeLocaleTimeString(
  dateVal: any, 
  locale = 'vi-VN', 
  options?: Intl.DateTimeFormatOptions, 
  fallback = '--:--'
): string {
  const d = parseSafeDate(dateVal);
  if (!d) return fallback;
  try {
    return d.toLocaleTimeString(locale, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely format date to full local string without throwing RangeError.
 */
export function safeLocaleString(
  dateVal: any, 
  locale = 'vi-VN', 
  options?: Intl.DateTimeFormatOptions, 
  fallback = 'Gần đây'
): string {
  const d = parseSafeDate(dateVal);
  if (!d) return fallback;
  try {
    return d.toLocaleString(locale, options);
  } catch {
    return fallback;
  }
}
