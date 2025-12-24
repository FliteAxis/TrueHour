// TrueHour User Store
// Manages user settings, authentication state, and session

import { create } from "zustand";
import type { UserSettings, HoursData } from "../types/api";
import * as api from "../services/api";

interface UserState {
  // State
  settings: UserSettings | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  currentHours: HoursData | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setTargetCertification: (cert: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  loadCurrentHours: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  auto_save_enabled: true,
  auto_save_interval: 3000,
  timezone: "America/New_York",
  onboarding_completed: false,
  target_certification: null,
};

export const useUserStore = create<UserState>()((set, get) => ({
  // Initial state
  settings: null,
  sessionId: null,
  isLoading: false,
  error: null,
  currentHours: null,

  // Load user settings from backend
  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.getUserSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error("[UserStore] Failed to load settings:", error);
      set({
        settings: DEFAULT_SETTINGS,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load settings",
      });
    }
  },

  // Update user settings
  updateSettings: async (partialSettings: Partial<UserSettings>) => {
    const currentSettings = get().settings || DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...partialSettings };

    set({ isLoading: true, error: null });
    try {
      const settings = await api.updateUserSettings(updatedSettings);
      set({ settings, isLoading: false });
    } catch (error) {
      console.error("[UserStore] Failed to update settings:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update settings",
      });
      throw error;
    }
  },

  // Set target certification (convenience method)
  setTargetCertification: async (cert: string) => {
    await get().updateSettings({ target_certification: cert });
  },

  // Mark onboarding as complete
  completeOnboarding: async () => {
    await get().updateSettings({ onboarding_completed: true });
  },

  // Load current hours from import history
  loadCurrentHours: async () => {
    set({ isLoading: true, error: null });
    try {
      const importHistory = await api.getLatestImportHistory();
      if (importHistory && importHistory.hours_imported) {
        set({ currentHours: importHistory.hours_imported, isLoading: false });
      } else {
        set({
          currentHours: {
            total: 0,
            pic: 0,
            cross_country: 0,
            instrument_total: 0,
            night: 0,
            simulator_time: 0,
            dual_received: 0,
            pic_xc: 0,
            complex: 0,
            instrument_dual_airplane: 0,
            actual_instrument: 0,
            simulated_instrument: 0,
            recent_instrument: 0,
            ir_250nm_xc: 0,
            dual_xc: 0,
            private_long_xc: 0,
            private_towered_ops: 0,
          },
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("[UserStore] Failed to load hours:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load hours",
      });
    }
  },

  // Reset store
  reset: () => {
    set({
      settings: null,
      sessionId: null,
      isLoading: false,
      error: null,
      currentHours: null,
    });
  },
}));
