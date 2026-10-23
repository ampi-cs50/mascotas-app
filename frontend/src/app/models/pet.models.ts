export type Species = 'CAT' | 'DOG';
export type WaterIntake = 'LOW' | 'NORMAL' | 'HIGH';
export type FoodIntake = 'NONE' | 'LOW' | 'NORMAL' | 'HIGH';
export type LitterUrine = 'NONE' | 'REDUCED' | 'NORMAL' | 'EXCESSIVE' | 'DIFFICULTY';
export type EnergyMood = 'LETHARGIC' | 'CALM' | 'ACTIVE' | 'PLAYFUL' | 'RESTLESS';
export type EventType = 'VACCINE' | 'DEWORMING' | 'MEDICATION' | 'CHECKUP' | 'SURGERY';
export type DangerLevel = 'MILD' | 'MODERATE' | 'SEVERE' | 'FATAL';
export type ToxicityCategory = 'PLANT' | 'FOOD' | 'MEDICATION' | 'OBJECT' | 'CHEMICAL';

export type PetSex = 'MALE' | 'FEMALE';
export type VaccineCategory = 'CORE' | 'LIFESTYLE' | 'MANDATORY';

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  sex?: PetSex;
  is_neutered?: boolean;
  neutered_date?: string;
  birth_date: string;
  weight_kg: number;
  avatar_url?: string;
}

export interface PetVaccine {
  id: string;
  pet_id: string;
  vaccine_code: string;
  name: string;
  category: VaccineCategory;
  applied: boolean;
  applied_date?: string;
  notes?: string;
  created_at?: string;
}

export interface DailyLog {
  id?: string;
  pet_id: string;
  log_date: string;
  water_intake: WaterIntake;
  food_intake: FoodIntake;
  litter_urine: LitterUrine;
  energy_mood: EnergyMood;
  notes?: string;
  created_at?: string;
}

export interface ClinicalEvent {
  id: string;
  pet_id: string;
  event_type: EventType;
  event_date: string;
  title: string;
  notes?: string;
}

export interface ToxicityItem {
  id: string;
  name: string;
  category: ToxicityCategory;
  danger_level: DangerLevel;
  symptoms: string;
  action_required: string;
  target_species?: 'CAT' | 'DOG' | 'ALL';
}

export interface PainAssessment {
  id?: string;
  pet_id: string;
  assessment_date?: string;
  score: number;
  ears_score?: number;
  eyes_score?: number;
  muzzle_score?: number;
  notes?: string;
}

export interface DailyLogSummary {
  pet_id: string;
  total_logs: number;
  logs_history: DailyLog[];
  mood_distribution: Record<string, number>;
  water_distribution: Record<string, number>;
  food_distribution: Record<string, number>;
  urine_distribution: Record<string, number>;
  anomaly_alerts: string[];
}
