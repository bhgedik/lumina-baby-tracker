// ============================================================
// Lumina — Units-Aware Date Format Hook
// Imperial → MM/DD/YYYY | Metric → DD/MM/YYYY
// Falls back to device locale when no preference is set
// ============================================================

import { useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import {
  getIsUSLocale,
  formatDateInput as rawFormatDateInput,
  toISO as rawToISO,
  fromISO as rawFromISO,
  getDatePlaceholder,
} from '../utils/dateFormat';

export function useDateFormat() {
  const preferredUnits = useAuthStore((s) => s.family?.preferred_units);

  const isUS = useMemo(() => {
    if (preferredUnits === 'imperial') return true;
    if (preferredUnits === 'metric') return false;
    return getIsUSLocale();
  }, [preferredUnits]);

  return useMemo(
    () => ({
      isUS,
      placeholder: getDatePlaceholder(isUS),
      formatDateInput: (text: string) => rawFormatDateInput(text, isUS),
      toISO: (dateStr: string) => rawToISO(dateStr, isUS),
      fromISO: (iso: string) => rawFromISO(iso, isUS),
    }),
    [isUS],
  );
}
