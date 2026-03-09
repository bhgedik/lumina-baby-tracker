// ============================================================
// Sprouty — CDC Immunization Schedule (Birth–24 months)
// CRITICAL: Vaccines ALWAYS use chronological age, NEVER corrected age
// ============================================================

import type { VaccineDefinition } from '../types';

export const CDC_VACCINE_SCHEDULE: VaccineDefinition[] = [
  {
    id: 'hepb',
    name: 'Hepatitis B',
    shortName: 'HepB',
    doses: [
      { doseNumber: 1, ageMonths: 0, minAgeMonths: 0, maxAgeMonths: 1 },
      { doseNumber: 2, ageMonths: 1, minAgeMonths: 1, maxAgeMonths: 4 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 6, maxAgeMonths: 18 },
    ],
  },
  {
    id: 'rv',
    name: 'Rotavirus',
    shortName: 'RV',
    doses: [
      { doseNumber: 1, ageMonths: 2, minAgeMonths: 1.5, maxAgeMonths: 3 },
      { doseNumber: 2, ageMonths: 4, minAgeMonths: 3, maxAgeMonths: 5 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 5, maxAgeMonths: 8 },
    ],
  },
  {
    id: 'dtap',
    name: 'Diphtheria, Tetanus & Pertussis',
    shortName: 'DTaP',
    doses: [
      { doseNumber: 1, ageMonths: 2, minAgeMonths: 1.5, maxAgeMonths: 3 },
      { doseNumber: 2, ageMonths: 4, minAgeMonths: 3, maxAgeMonths: 5 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 5, maxAgeMonths: 7 },
      { doseNumber: 4, ageMonths: 15, minAgeMonths: 12, maxAgeMonths: 18 },
    ],
  },
  {
    id: 'hib',
    name: 'Haemophilus Influenzae Type b',
    shortName: 'Hib',
    doses: [
      { doseNumber: 1, ageMonths: 2, minAgeMonths: 1.5, maxAgeMonths: 3 },
      { doseNumber: 2, ageMonths: 4, minAgeMonths: 3, maxAgeMonths: 5 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 5, maxAgeMonths: 7 },
      { doseNumber: 4, ageMonths: 12, minAgeMonths: 12, maxAgeMonths: 15 },
    ],
  },
  {
    id: 'pcv13',
    name: 'Pneumococcal Conjugate',
    shortName: 'PCV13',
    doses: [
      { doseNumber: 1, ageMonths: 2, minAgeMonths: 1.5, maxAgeMonths: 3 },
      { doseNumber: 2, ageMonths: 4, minAgeMonths: 3, maxAgeMonths: 5 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 5, maxAgeMonths: 7 },
      { doseNumber: 4, ageMonths: 12, minAgeMonths: 12, maxAgeMonths: 15 },
    ],
  },
  {
    id: 'ipv',
    name: 'Inactivated Poliovirus',
    shortName: 'IPV',
    doses: [
      { doseNumber: 1, ageMonths: 2, minAgeMonths: 1.5, maxAgeMonths: 3 },
      { doseNumber: 2, ageMonths: 4, minAgeMonths: 3, maxAgeMonths: 5 },
      { doseNumber: 3, ageMonths: 6, minAgeMonths: 6, maxAgeMonths: 18 },
    ],
  },
  {
    id: 'flu',
    name: 'Influenza (Flu)',
    shortName: 'Flu',
    doses: [
      { doseNumber: 1, ageMonths: 6, minAgeMonths: 6, maxAgeMonths: 12 },
      { doseNumber: 2, ageMonths: 7, minAgeMonths: 7, maxAgeMonths: 13 },
    ],
  },
  {
    id: 'mmr',
    name: 'Measles, Mumps & Rubella',
    shortName: 'MMR',
    doses: [
      { doseNumber: 1, ageMonths: 12, minAgeMonths: 12, maxAgeMonths: 15 },
    ],
  },
  {
    id: 'varicella',
    name: 'Varicella (Chickenpox)',
    shortName: 'VAR',
    doses: [
      { doseNumber: 1, ageMonths: 12, minAgeMonths: 12, maxAgeMonths: 15 },
    ],
  },
  {
    id: 'hepa',
    name: 'Hepatitis A',
    shortName: 'HepA',
    doses: [
      { doseNumber: 1, ageMonths: 12, minAgeMonths: 12, maxAgeMonths: 18 },
      { doseNumber: 2, ageMonths: 18, minAgeMonths: 18, maxAgeMonths: 24 },
    ],
  },
];
