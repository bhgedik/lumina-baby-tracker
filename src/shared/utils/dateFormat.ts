// ============================================================
// Lumina — Locale-Aware Date Input Formatting
// US / Imperial: MM/DD/YYYY | Metric / Rest of world: DD/MM/YYYY
// Supports explicit override via preferred_units setting
// ============================================================

import { Platform } from 'react-native';

/** Detect if user's locale is US format (MM/DD/YYYY) */
export function getIsUSLocale(): boolean {
  try {
    const locale = Platform.select({
      ios: Intl.DateTimeFormat().resolvedOptions().locale,
      android: Intl.DateTimeFormat().resolvedOptions().locale,
      default: 'en-US',
    }) ?? 'en-US';
    return locale.endsWith('-US') || locale === 'en-US' || locale === 'en_US';
  } catch {
    return true;
  }
}

const IS_US = getIsUSLocale();

/** Default placeholder — uses device locale. Prefer getDatePlaceholder() when units are known. */
export const DATE_PLACEHOLDER = IS_US ? 'MM/DD/YYYY' : 'DD/MM/YYYY';

/** Get date placeholder for a specific format mode */
export function getDatePlaceholder(isUS?: boolean): string {
  const useUS = isUS ?? IS_US;
  return useUS ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
}

/** Format raw digits into date string with auto "/" insertion */
export function formatDateInput(text: string, isUS?: boolean): string {
  const cleaned = text.replace(/[^0-9]/g, '');
  let formatted = cleaned;
  if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
  return formatted;
}

/** Convert locale-formatted date string to ISO YYYY-MM-DD */
export function toISO(dateStr: string, isUS?: boolean): string {
  const useUS = isUS ?? IS_US;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  if (useUS) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert ISO YYYY-MM-DD to locale display format */
export function fromISO(iso: string, isUS?: boolean): string {
  const useUS = isUS ?? IS_US;
  if (!iso || !iso.includes('-')) return '';
  const [yyyy, mm, dd] = iso.split('-');
  if (useUS) return `${mm}/${dd}/${yyyy}`;
  return `${dd}/${mm}/${yyyy}`;
}
