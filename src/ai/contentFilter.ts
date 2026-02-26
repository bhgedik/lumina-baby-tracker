// ============================================================
// Sprout — Content Safety Filter
// Strictly filters content based on baby's allergies, feeding method,
// and chronic conditions. This prevents emotional alienation and
// ensures medical safety of recommendations.
// ============================================================

import type { ContentItem } from './types';
import type { Baby } from '../modules/baby/types';

interface FilterConfig {
  baby: Baby;
  parentExperienceLevel: 'first_time' | 'experienced';
}

/**
 * STRICT CONTENT FILTERING RULES:
 *
 * 1. FEEDING METHOD FILTER:
 *    - formula_only: REMOVE all breastfeeding-specific content
 *      (latching guides, breast pump reviews, nursing positions)
 *    - breast_only: REMOVE formula comparison/selection content
 *    - mixed: Show all content
 *
 * 2. ALLERGY FILTER:
 *    - If baby has known allergies, REMOVE any recipe/food content
 *      that contains or references those allergens
 *    - CMA (cow's milk allergy): Remove all dairy-containing recipes
 *    - Egg allergy: Remove egg-containing recipes
 *    - etc.
 *
 * 3. CHRONIC CONDITION FILTER:
 *    - Reflux: Prioritize upright feeding positions, avoid "lay flat" advice
 *    - Eczema: Filter skincare content appropriately
 *
 * 4. EXPERIENCE LEVEL FILTER:
 *    - first_time: Include detailed explanations and educational content
 *    - experienced: Reduce verbosity, skip basics, show advanced tips only
 */

const BREASTFEEDING_TAGS = [
  'breastfeeding',
  'nursing',
  'latching',
  'breast_pump',
  'milk_supply',
  'nursing_position',
  'nipple_care',
  'lactation',
];

const FORMULA_TAGS = [
  'formula_selection',
  'formula_comparison',
  'bottle_brand',
  'formula_preparation',
];

export const ALLERGEN_TAG_MAP: Record<string, string[]> = {
  cma: ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream'],
  egg: ['egg', 'eggs', 'mayonnaise'],
  peanut: ['peanut', 'peanut_butter'],
  tree_nut: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio'],
  wheat: ['wheat', 'bread', 'pasta', 'flour'],
  soy: ['soy', 'tofu', 'edamame'],
  fish: ['fish', 'salmon', 'tuna', 'cod'],
  shellfish: ['shrimp', 'crab', 'lobster', 'shellfish'],
  sesame: ['sesame', 'tahini'],
};

export const ALLERGEN_DISPLAY: Record<string, { label: string; emoji: string }> = {
  cma: { label: 'Dairy (CMA)', emoji: '🥛' },
  egg: { label: 'Egg', emoji: '🥚' },
  peanut: { label: 'Peanut', emoji: '🥜' },
  tree_nut: { label: 'Tree Nut', emoji: '🌰' },
  wheat: { label: 'Wheat', emoji: '🌾' },
  soy: { label: 'Soy', emoji: '🫘' },
  fish: { label: 'Fish', emoji: '🐟' },
  shellfish: { label: 'Shellfish', emoji: '🦐' },
  sesame: { label: 'Sesame', emoji: '⚪' },
};

export interface AllergenSuggestion {
  key: string;       // Category key (e.g. "cma")
  matchedTerm: string; // The term that matched (e.g. "milk")
  label: string;     // Display label (e.g. "Dairy (CMA)")
  emoji: string;     // Display emoji (e.g. "🥛")
}

/**
 * Flat searchable index: every food tag + category label → allergen key.
 * Built once at module load.
 */
const ALLERGEN_SEARCH_INDEX: { term: string; key: string }[] = [];
for (const [key, tags] of Object.entries(ALLERGEN_TAG_MAP)) {
  for (const tag of tags) {
    ALLERGEN_SEARCH_INDEX.push({ term: tag.replace('_', ' '), key });
  }
  // Also index the display label itself (e.g. "dairy (cma)", "tree nut")
  const display = ALLERGEN_DISPLAY[key];
  if (display) {
    ALLERGEN_SEARCH_INDEX.push({ term: display.label.toLowerCase(), key });
  }
}

/**
 * Search allergens by free text query.
 * Returns matching allergen categories (deduplicated by key), minimum 3 chars.
 */
export function searchAllergens(query: string): AllergenSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  const seen = new Set<string>();
  const results: AllergenSuggestion[] = [];

  for (const entry of ALLERGEN_SEARCH_INDEX) {
    if (seen.has(entry.key)) continue;
    if (entry.term.includes(q)) {
      const display = ALLERGEN_DISPLAY[entry.key];
      if (display) {
        seen.add(entry.key);
        results.push({
          key: entry.key,
          matchedTerm: entry.term,
          label: display.label,
          emoji: display.emoji,
        });
      }
    }
  }
  return results;
}

/**
 * Scan a food name and food group against ALLERGEN_TAG_MAP
 * and return matching allergen keys.
 */
export function detectAllergens(foodName: string, foodGroup: string): string[] {
  const text = `${foodName} ${foodGroup}`.toLowerCase();
  const matched: string[] = [];
  for (const [allergenKey, tags] of Object.entries(ALLERGEN_TAG_MAP)) {
    if (tags.some((tag) => text.includes(tag))) {
      matched.push(allergenKey);
    }
  }
  return matched;
}

export function filterContent(
  items: ContentItem[],
  config: FilterConfig
): ContentItem[] {
  return items.filter((item) => {
    // 1. Feeding method filter
    if (config.baby.primary_feeding_method === 'formula_only') {
      if (item.tags.some((tag) => BREASTFEEDING_TAGS.includes(tag.toLowerCase()))) {
        return false;
      }
    }
    if (config.baby.primary_feeding_method === 'breast_only') {
      if (item.tags.some((tag) => FORMULA_TAGS.includes(tag.toLowerCase()))) {
        return false;
      }
    }

    // 2. Allergy filter
    for (const allergy of config.baby.known_allergies) {
      const allergenTags = ALLERGEN_TAG_MAP[allergy.toLowerCase()] ?? [allergy.toLowerCase()];
      if (item.tags.some((tag) => allergenTags.includes(tag.toLowerCase()))) {
        return false;
      }
    }

    // 3. Chronic condition filter (soft filter — deprioritize, don't remove)
    // This is handled at the sort level, not the filter level.

    return true;
  });
}

/**
 * Adjust content verbosity based on parent experience level.
 * For experienced parents, filter out basic educational content.
 */
export function adjustForExperience(
  items: ContentItem[],
  experienceLevel: 'first_time' | 'experienced'
): ContentItem[] {
  if (experienceLevel === 'experienced') {
    return items.filter(
      (item) => !item.tags.includes('beginner') && !item.tags.includes('basics')
    );
  }
  return items;
}
