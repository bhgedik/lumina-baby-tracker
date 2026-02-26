import { UUID, ISO8601, Timestamps, FeedingType, BreastSide, BottleContentType, BabyResponse } from '../../shared/types/common';

export interface SolidFoodEntry {
  food_name: string;
  food_group: 'fruit' | 'vegetable' | 'grain' | 'protein' | 'dairy' | 'other';
  amount: 'taste' | 'small' | 'medium' | 'large';
  is_new_food: boolean;
  reaction: 'none' | 'mild_rash' | 'vomiting' | 'diarrhea' | 'swelling' | 'other' | null;
  reaction_notes: string | null;
  allergen_flags: string[];
}

export interface FeedingLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  type: FeedingType;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  breast_side: BreastSide | null;
  left_duration_seconds: number | null;
  right_duration_seconds: number | null;
  bottle_amount_ml: number | null;
  bottle_content: BottleContentType | null;
  bottle_temperature: 'warm' | 'room' | 'cold' | null;
  solid_foods: SolidFoodEntry[] | null;
  notes: string | null;
  baby_response: BabyResponse | null;
  photo_url: string | null;
}

export interface FeedingSummary {
  total_feeds: number;
  breast_feeds: number;
  bottle_feeds: number;
  solid_feeds: number;
  total_breast_minutes: number;
  total_bottle_ml: number;
  last_feed_at: ISO8601 | null;
  hours_since_last_feed: number | null;
}
