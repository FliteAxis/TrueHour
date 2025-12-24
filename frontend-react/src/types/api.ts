// TrueHour API Types
export interface UserSettings {
  auto_save_enabled: boolean;
  auto_save_interval: number;
  default_aircraft_id?: number | null;
  timezone: string;
  budget_state?: any;
  onboarding_completed: boolean;
  target_certification?: string | null;
  enable_faa_lookup?: boolean;
}

export interface HoursData {
  total: number;
  pic: number;
  cross_country: number;
  instrument_total: number;
  night: number;
  simulator_time: number;
  dual_received: number;
  pic_xc: number;
  complex: number;
  instrument_dual_airplane: number;
  actual_instrument: number;
  simulated_instrument: number;
  recent_instrument: number;
  ir_250nm_xc: number;
  dual_xc: number;
  private_long_xc: number;
  private_towered_ops: number;
}

export interface Aircraft {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: string | number;
  type: string;
  wetRate: number;
  dryRate: number;
  notes: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flight {
  id: number;
  aircraft_id?: number | null;
  tail_number?: string | null;
  date: string;
  departure_airport?: string | null;
  arrival_airport?: string | null;
  route?: string | null;
  time_out?: string | null;
  time_off?: string | null;
  time_on?: string | null;
  time_in?: string | null;
  total_time?: number | null;
  pic_time?: number | null;
  sic_time?: number | null;
  night_time?: number | null;
  solo_time?: number | null;
  cross_country_time?: number | null;
  actual_instrument_time?: number | null;
  simulated_instrument_time?: number | null;
  simulated_flight_time?: number | null;
  dual_given_time?: number | null;
  dual_received_time?: number | null;
  ground_training_time?: number | null;
  complex_time?: number | null;
  high_performance_time?: number | null;
  hobbs_start?: number | null;
  hobbs_end?: number | null;
  tach_start?: number | null;
  tach_end?: number | null;
  day_takeoffs: number;
  day_landings_full_stop: number;
  night_takeoffs: number;
  night_landings_full_stop: number;
  all_landings: number;
  holds: number;
  approaches?: any | null;
  instructor_name?: string | null;
  instructor_comments?: string | null;
  pilot_comments?: string | null;
  is_flight_review: boolean;
  is_ipc: boolean;
  is_checkride: boolean;
  is_simulator_session: boolean;
  fuel_gallons?: number | null;
  fuel_cost?: number | null;
  landing_fees?: number | null;
  instructor_cost?: number | null;
  rental_cost?: number | null;
  other_costs?: number | null;
  import_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightSummary {
  total_flights: number;
  total_hours: number;
  pic_hours: number;
  sic_hours: number;
  night_hours: number;
  cross_country_hours: number;
  actual_instrument_hours: number;
  simulated_instrument_hours: number;
  simulator_hours: number;
  dual_received_hours: number;
  dual_given_hours: number;
  complex_hours: number;
  high_performance_hours: number;
  total_landings: number;
  night_landings: number;
}

export interface BudgetCard {
  id: number;
  name: string;
  category: string;
  frequency: string;
  when_date: string;
  budgeted_amount: number;
  actual_amount: number;
  status: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export type BudgetCardCreate = Omit<BudgetCard, "id" | "actual_amount" | "created_at" | "updated_at">;

export interface BudgetCategorySummary {
  category: string;
  total_budgeted: string;
  total_actual: string;
}

export interface Expense {
  id: number;
  aircraft_id?: number | null;
  budget_card_id?: number | null;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
  vendor?: string | null;
  is_tax_deductible: boolean;
  tax_category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  aircraft_id?: number | null;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  amount: number;
  date: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
  vendor?: string | null;
  is_tax_deductible?: boolean;
  tax_category?: string | null;
}

export interface ExpenseUpdate {
  aircraft_id?: number | null;
  category?: string;
  subcategory?: string | null;
  description?: string | null;
  amount?: number;
  date?: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
  vendor?: string | null;
  is_tax_deductible?: boolean;
  tax_category?: string | null;
}

export interface ExpenseSummary {
  group_name: string;
  count: number;
  total_amount: number;
  avg_amount: number;
  min_amount: number;
  max_amount: number;
}

export interface ImportHistory {
  id?: number;
  import_type: string;
  file_name?: string;
  flights_imported: number;
  hours_imported: HoursData;
}

export interface UserDataResponse {
  aircraft: Aircraft[];
  expenses: any[];
  flights: Flight[];
  settings: UserSettings;
  last_saved_at?: string;
}

export interface SaveDataRequest {
  aircraft?: Aircraft[];
  flights?: Flight[];
  budget_state?: any;
}

// User Aircraft (v2 - database backed)
export interface UserAircraft {
  id: number;
  tail_number: string;
  type_code?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  gear_type?: string | null;
  engine_type?: string | null;
  aircraft_class?: string | null;
  is_complex: boolean;
  is_taa: boolean;
  is_high_performance: boolean;
  is_simulator: boolean;
  category?: string | null;
  hourly_rate_wet?: number | null;
  hourly_rate_dry?: number | null;
  notes?: string | null;
  is_active: boolean;
  data_source?: "faa" | "foreflight" | "manual" | null;
  faa_last_checked?: string | null;
  total_time?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserAircraftCreate {
  tail_number: string;
  type_code?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  gear_type?: string | null;
  engine_type?: string | null;
  aircraft_class?: string | null;
  is_complex?: boolean;
  is_taa?: boolean;
  is_high_performance?: boolean;
  is_simulator?: boolean;
  category?: string | null;
  hourly_rate_wet?: number | null;
  hourly_rate_dry?: number | null;
  notes?: string | null;
  is_active?: boolean;
  data_source?: "faa" | "foreflight" | "manual";
  faa_last_checked?: string;
}

export interface UserAircraftUpdate {
  tail_number?: string;
  type_code?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  gear_type?: string | null;
  engine_type?: string | null;
  aircraft_class?: string | null;
  is_complex?: boolean;
  is_taa?: boolean;
  is_high_performance?: boolean;
  is_simulator?: boolean;
  category?: string | null;
  hourly_rate_wet?: number | null;
  hourly_rate_dry?: number | null;
  notes?: string | null;
  is_active?: boolean;
}

// FAA Lookup Response
export interface FAALookupResponse {
  tail_number: string;
  manufacturer: string;
  model: string;
  series?: string;
  aircraft_type?: string;
  engine_type?: string;
  num_engines?: string;
  num_seats?: string;
  year_mfr?: string;
  gear_type?: string;
  is_complex?: boolean;
  is_high_performance?: boolean;
}

export type CertificationType = "private" | "ir" | "cpl" | "cfi";

export interface CertificationRequirement {
  label: string;
  required: number;
  unit: string;
  key: keyof HoursData | "total_xc_pic";
}

export const CERTIFICATION_REQUIREMENTS: Record<CertificationType, CertificationRequirement[]> = {
  private: [
    { label: "Total Time", required: 40, unit: "hrs", key: "total" },
    { label: "PIC", required: 10, unit: "hrs", key: "pic" },
    { label: "Cross-Country", required: 5, unit: "hrs", key: "cross_country" },
    { label: "Night", required: 3, unit: "hrs", key: "night" },
  ],
  ir: [
    { label: "Total Time", required: 50, unit: "hrs", key: "total" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Instrument Time", required: 40, unit: "hrs", key: "instrument_total" },
  ],
  cpl: [
    { label: "Total Time", required: 250, unit: "hrs", key: "total" },
    { label: "PIC", required: 100, unit: "hrs", key: "pic" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Night", required: 5, unit: "hrs", key: "night" },
    { label: "Instrument", required: 10, unit: "hrs", key: "instrument_total" },
  ],
  cfi: [
    { label: "Total Time", required: 250, unit: "hrs", key: "total" },
    { label: "PIC", required: 100, unit: "hrs", key: "pic" },
  ],
};
