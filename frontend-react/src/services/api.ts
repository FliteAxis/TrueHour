// TrueHour API Service
// Type-safe wrappers for backend API endpoints

import type {
  UserSettings,
  UserDataResponse,
  SaveDataRequest,
  BudgetCard,
  BudgetCardCreate,
  BudgetCategorySummary,
  ImportHistory,
  HoursData,
  Flight,
  FlightSummary,
  UserAircraft,
  UserAircraftCreate,
  UserAircraftUpdate,
  FAALookupResponse,
} from "../types/api";

// Use empty string for API_BASE to use relative URLs (Vite proxy will handle routing to backend)
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
}

// ============================================================================
// User Settings & Data
// ============================================================================

export async function getUserSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE}/api/user/settings`);
  return handleResponse<UserSettings>(response);
}

export async function updateUserSettings(settings: UserSettings): Promise<UserSettings> {
  const response = await fetch(`${API_BASE}/api/user/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return handleResponse<UserSettings>(response);
}

export async function loadUserData(sessionId?: string): Promise<UserDataResponse> {
  const headers: HeadersInit = {};
  if (sessionId) {
    headers["X-Session-ID"] = sessionId;
  }
  const response = await fetch(`${API_BASE}/api/user/load`, { headers });
  return handleResponse<UserDataResponse>(response);
}

export async function saveUserData(
  data: SaveDataRequest,
  sessionId?: string
): Promise<{ status: string; message: string; session_id: string }> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) {
    headers["X-Session-ID"] = sessionId;
  }
  const response = await fetch(`${API_BASE}/api/user/save`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ============================================================================
// Budget Cards
// ============================================================================

export async function getBudgetCards(year?: number, month?: number): Promise<BudgetCard[]> {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (month !== undefined && year !== undefined) {
    // Format as YYYY-MM-01 (first day of month)
    const monthStr = month.toString().padStart(2, "0");
    params.append("month", `${year}-${monthStr}-01`);
  }

  const response = await fetch(`${API_BASE}/api/user/budget-cards/?${params}`);
  return handleResponse<BudgetCard[]>(response);
}

export async function getBudgetCardsSummaryByCategory(year: number): Promise<BudgetCategorySummary[]> {
  const response = await fetch(`${API_BASE}/api/user/budget-cards/summary/category?year=${year}`);
  return handleResponse<BudgetCategorySummary[]>(response);
}

export async function createBudgetCard(card: BudgetCardCreate): Promise<BudgetCard> {
  const response = await fetch(`${API_BASE}/api/user/budget-cards/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  return handleResponse<BudgetCard>(response);
}

export async function updateBudgetCard(id: number, card: Partial<BudgetCard>): Promise<BudgetCard> {
  const response = await fetch(`${API_BASE}/api/user/budget-cards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  return handleResponse<BudgetCard>(response);
}

export async function deleteBudgetCard(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/user/budget-cards/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete budget card: ${response.status}`);
  }
}

export async function duplicateBudgetCard(id: number): Promise<BudgetCard> {
  const response = await fetch(`${API_BASE}/api/user/budget-cards/${id}/duplicate`, {
    method: "POST",
  });
  return handleResponse<BudgetCard>(response);
}

// ============================================================================
// Import History (Hours)
// ============================================================================

export async function getLatestImportHistory(): Promise<ImportHistory | null> {
  const response = await fetch(`${API_BASE}/api/user/import-history/latest`);
  if (response.status === 404) {
    return null;
  }
  return handleResponse<ImportHistory>(response);
}

export async function createImportHistory(data: {
  import_type: string;
  file_name?: string;
  flights_imported: number;
  hours_imported: HoursData;
  notes?: string;
}): Promise<ImportHistory> {
  const response = await fetch(`${API_BASE}/api/user/import-history/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ImportHistory>(response);
}

// ============================================================================
// Flights
// ============================================================================

export async function getFlights(params?: {
  aircraft_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<Flight[]> {
  const queryParams = new URLSearchParams();
  if (params?.aircraft_id) queryParams.append("aircraft_id", params.aircraft_id.toString());
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const response = await fetch(`${API_BASE}/api/user/flights?${queryParams}`);
  return handleResponse<Flight[]>(response);
}

export async function getFlightSummary(params?: { start_date?: string; end_date?: string }): Promise<FlightSummary> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);

  const response = await fetch(`${API_BASE}/api/user/flights/summary?${queryParams}`);
  return handleResponse<FlightSummary>(response);
}

export async function getFlight(id: number): Promise<Flight> {
  const response = await fetch(`${API_BASE}/api/user/flights/${id}`);
  return handleResponse<Flight>(response);
}

export async function createFlight(flight: Partial<Flight>): Promise<Flight> {
  const response = await fetch(`${API_BASE}/api/user/flights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flight),
  });
  return handleResponse<Flight>(response);
}

export async function updateFlight(id: number, flight: Partial<Flight>): Promise<Flight> {
  const response = await fetch(`${API_BASE}/api/user/flights/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flight),
  });
  return handleResponse<Flight>(response);
}

export async function deleteFlight(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/user/flights/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete flight: ${response.status}`);
  }
}

// ============================================================================
// User Aircraft
// ============================================================================

export async function getUserAircraft(isActive?: boolean): Promise<UserAircraft[]> {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append("is_active", isActive.toString());

  const response = await fetch(`${API_BASE}/api/user/aircraft?${params}`);
  return handleResponse<UserAircraft[]>(response);
}

export async function getAircraftById(id: number): Promise<UserAircraft> {
  const response = await fetch(`${API_BASE}/api/user/aircraft/${id}`);
  return handleResponse<UserAircraft>(response);
}

export async function createUserAircraft(aircraft: UserAircraftCreate): Promise<UserAircraft> {
  const response = await fetch(`${API_BASE}/api/user/aircraft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aircraft),
  });
  return handleResponse<UserAircraft>(response);
}

export async function updateUserAircraft(id: number, aircraft: UserAircraftUpdate): Promise<UserAircraft> {
  const response = await fetch(`${API_BASE}/api/user/aircraft/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aircraft),
  });
  return handleResponse<UserAircraft>(response);
}

export async function deleteUserAircraft(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/user/aircraft/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete aircraft: ${response.status}`);
  }
}

// FAA Lookup
export async function lookupFAAAircraft(tailNumber: string): Promise<FAALookupResponse> {
  const response = await fetch(`${API_BASE}/api/v1/aircraft/${encodeURIComponent(tailNumber)}`);
  return handleResponse<FAALookupResponse>(response);
}

// ============================================================================
// Health Check
// ============================================================================

export async function healthCheck(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse(response);
}
