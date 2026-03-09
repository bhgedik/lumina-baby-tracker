// ============================================================
// Sprouty — Vaccine & Checkup Schedule Computation
// CRITICAL: Vaccines ALWAYS use chronological age (date_of_birth)
//           NEVER use calculateCorrectedAge() for vaccines
// ============================================================

import type { Baby } from '../../baby/types';
import type { Vaccination, HealthLog, VaccineTrackingItem, CheckupTrackingItem, VaccineStatus } from '../types';
import { CDC_VACCINE_SCHEDULE } from '../data/vaccineSchedule';
import { AAP_CHECKUP_SCHEDULE } from '../data/checkupSchedule';

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Math.floor(months));
  if (months % 1 !== 0) {
    result.setDate(result.getDate() + Math.round((months % 1) * 30));
  }
  return result;
}

function getChronologicalAgeMonths(dob: Date, referenceDate: Date = new Date()): number {
  const diffMs = referenceDate.getTime() - dob.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30.44);
}

function computeStatus(ageMonths: number, maxAgeMonths: number, isCompleted: boolean, chronoAgeMonths: number): VaccineStatus {
  if (isCompleted) return 'completed';
  if (chronoAgeMonths > maxAgeMonths) return 'overdue';
  if (chronoAgeMonths >= ageMonths) return 'due';
  return 'upcoming';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function computeVaccineSchedule(
  baby: Pick<Baby, 'date_of_birth'>,
  existingVaccinations: Vaccination[],
): VaccineTrackingItem[] {
  const dob = new Date(baby.date_of_birth);
  const now = new Date();
  const chronoAgeMonths = getChronologicalAgeMonths(dob, now);
  const items: VaccineTrackingItem[] = [];

  for (const vaccine of CDC_VACCINE_SCHEDULE) {
    for (const dose of vaccine.doses) {
      const match = existingVaccinations.find(
        (v) => v.vaccine_name === vaccine.id && v.dose_number === dose.doseNumber
      );

      const scheduledDate = addMonths(dob, dose.ageMonths);
      const isCompleted = !!match?.administered_date;
      const status = computeStatus(dose.ageMonths, dose.maxAgeMonths, isCompleted, chronoAgeMonths);

      items.push({
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        shortName: vaccine.shortName,
        doseNumber: dose.doseNumber,
        scheduledDate: formatDate(scheduledDate),
        status,
        ageMonths: dose.ageMonths,
        administeredDate: match?.administered_date ?? null,
      });
    }
  }

  // Sort: overdue first, then due, then upcoming, then completed
  const statusOrder: Record<VaccineStatus, number> = { overdue: 0, due: 1, upcoming: 2, completed: 3 };
  items.sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return a.ageMonths - b.ageMonths;
  });

  return items;
}

export function computeCheckupSchedule(
  baby: Pick<Baby, 'date_of_birth'>,
  existingLogs: HealthLog[],
): CheckupTrackingItem[] {
  const dob = new Date(baby.date_of_birth);
  const now = new Date();
  const chronoAgeMonths = getChronologicalAgeMonths(dob, now);
  const items: CheckupTrackingItem[] = [];

  const wellChildLogs = existingLogs.filter((l) => l.type === 'well_child_checkup' || l.type === 'doctor_visit');

  for (const checkup of AAP_CHECKUP_SCHEDULE) {
    const scheduledDate = addMonths(dob, checkup.ageMonths);

    // Match by approximate age (within 2 months of scheduled)
    const match = wellChildLogs.find((log) => {
      const logDate = new Date(log.logged_at);
      const logAgeMonths = getChronologicalAgeMonths(dob, logDate);
      return Math.abs(logAgeMonths - checkup.ageMonths) < 2;
    });

    const isCompleted = !!match;
    const maxAgeMonths = checkup.ageMonths + 2;
    const status = computeStatus(checkup.ageMonths, maxAgeMonths, isCompleted, chronoAgeMonths);

    items.push({
      checkupId: checkup.id,
      label: checkup.label,
      ageMonths: checkup.ageMonths,
      scheduledDate: formatDate(scheduledDate),
      status,
      typicalScreenings: checkup.typicalScreenings,
      vaccinesAtVisit: checkup.vaccinesAtVisit,
      completedDate: match?.logged_at ?? null,
    });
  }

  return items;
}
