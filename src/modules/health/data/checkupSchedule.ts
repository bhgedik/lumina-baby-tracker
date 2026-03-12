// ============================================================
// Lumina — AAP Well-Child Checkup Schedule (Birth–24 months)
// ============================================================

import type { WellChildCheckup } from '../types';

export const AAP_CHECKUP_SCHEDULE: WellChildCheckup[] = [
  {
    id: 'newborn',
    label: 'Newborn',
    ageMonths: 0,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Hearing screen', 'Newborn metabolic screen'],
    vaccinesAtVisit: ['hepb'],
  },
  {
    id: '3-5-days',
    label: '3–5 Days',
    ageMonths: 0.15,
    typicalScreenings: ['Weight check', 'Jaundice screen', 'Feeding assessment'],
    vaccinesAtVisit: [],
  },
  {
    id: '1-month',
    label: '1 Month',
    ageMonths: 1,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening'],
    vaccinesAtVisit: ['hepb'],
  },
  {
    id: '2-month',
    label: '2 Months',
    ageMonths: 2,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening'],
    vaccinesAtVisit: ['rv', 'dtap', 'hib', 'pcv13', 'ipv'],
  },
  {
    id: '4-month',
    label: '4 Months',
    ageMonths: 4,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening'],
    vaccinesAtVisit: ['rv', 'dtap', 'hib', 'pcv13', 'ipv'],
  },
  {
    id: '6-month',
    label: '6 Months',
    ageMonths: 6,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening', 'Lead risk assessment'],
    vaccinesAtVisit: ['rv', 'dtap', 'hib', 'pcv13', 'ipv', 'hepb', 'flu'],
  },
  {
    id: '9-month',
    label: '9 Months',
    ageMonths: 9,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening', 'ASQ screening'],
    vaccinesAtVisit: [],
  },
  {
    id: '12-month',
    label: '12 Months',
    ageMonths: 12,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening', 'Lead screening', 'Hemoglobin/Hematocrit'],
    vaccinesAtVisit: ['hib', 'pcv13', 'mmr', 'varicella', 'hepa'],
  },
  {
    id: '15-month',
    label: '15 Months',
    ageMonths: 15,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Developmental screening'],
    vaccinesAtVisit: ['dtap'],
  },
  {
    id: '18-month',
    label: '18 Months',
    ageMonths: 18,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Autism screening (M-CHAT)', 'Developmental screening'],
    vaccinesAtVisit: ['hepa'],
  },
  {
    id: '24-month',
    label: '24 Months',
    ageMonths: 24,
    typicalScreenings: ['Weight', 'Length', 'Head circumference', 'Autism screening (M-CHAT)', 'Developmental screening', 'Dental referral'],
    vaccinesAtVisit: [],
  },
];
