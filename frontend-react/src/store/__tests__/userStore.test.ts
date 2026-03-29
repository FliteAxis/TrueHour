/**
 * Unit tests for useUserStore.
 * API calls are mocked via vi.mock.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

vi.mock("../../services/api", () => ({
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
  getLatestImportHistory: vi.fn(),
}));

import { useUserStore } from "../userStore";
import * as api from "../../services/api";

const mockSettings = {
  auto_save_enabled: true,
  auto_save_interval: 3000,
  timezone: "America/New_York",
  onboarding_completed: false,
  target_certification: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  useUserStore.getState().reset();
});

describe("useUserStore - initial state", () => {
  it("starts with null settings and no error", () => {
    const state = useUserStore.getState();
    expect(state.settings).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.currentHours).toBeNull();
  });
});

describe("useUserStore - loadSettings", () => {
  it("sets settings on success", async () => {
    vi.mocked(api.getUserSettings).mockResolvedValue(mockSettings as any);

    await act(async () => {
      await useUserStore.getState().loadSettings();
    });

    expect(useUserStore.getState().settings).toEqual(mockSettings);
    expect(useUserStore.getState().isLoading).toBe(false);
    expect(useUserStore.getState().error).toBeNull();
  });

  it("falls back to DEFAULT_SETTINGS and sets error on failure", async () => {
    vi.mocked(api.getUserSettings).mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await useUserStore.getState().loadSettings();
    });

    // Falls back to DEFAULT_SETTINGS
    expect(useUserStore.getState().settings).not.toBeNull();
    expect(useUserStore.getState().settings?.auto_save_enabled).toBe(true);
    expect(useUserStore.getState().error).toBe("Network error");
  });
});

describe("useUserStore - updateSettings", () => {
  it("merges and saves updated settings", async () => {
    const updated = { ...mockSettings, timezone: "America/Chicago" };
    vi.mocked(api.updateUserSettings).mockResolvedValue(updated as any);

    useUserStore.setState({ settings: mockSettings as any });

    await act(async () => {
      await useUserStore.getState().updateSettings({ timezone: "America/Chicago" });
    });

    expect(useUserStore.getState().settings?.timezone).toBe("America/Chicago");
    expect(vi.mocked(api.updateUserSettings)).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "America/Chicago" })
    );
  });

  it("throws and sets error on failure", async () => {
    vi.mocked(api.updateUserSettings).mockRejectedValue(new Error("Save failed"));

    useUserStore.setState({ settings: mockSettings as any });

    await expect(
      act(async () => {
        await useUserStore.getState().updateSettings({ timezone: "America/Chicago" });
      })
    ).rejects.toThrow("Save failed");

    expect(useUserStore.getState().error).toBe("Save failed");
  });
});

describe("useUserStore - setTargetCertification", () => {
  it("calls updateSettings with target_certification", async () => {
    const updated = { ...mockSettings, target_certification: "ppl" };
    vi.mocked(api.updateUserSettings).mockResolvedValue(updated as any);

    useUserStore.setState({ settings: mockSettings as any });

    await act(async () => {
      await useUserStore.getState().setTargetCertification("ppl");
    });

    expect(useUserStore.getState().settings?.target_certification).toBe("ppl");
  });
});

describe("useUserStore - completeOnboarding", () => {
  it("sets onboarding_completed to true", async () => {
    const updated = { ...mockSettings, onboarding_completed: true };
    vi.mocked(api.updateUserSettings).mockResolvedValue(updated as any);

    useUserStore.setState({ settings: mockSettings as any });

    await act(async () => {
      await useUserStore.getState().completeOnboarding();
    });

    expect(useUserStore.getState().settings?.onboarding_completed).toBe(true);
  });
});

describe("useUserStore - loadCurrentHours", () => {
  it("sets hours from import history", async () => {
    const mockImport = {
      hours_imported: {
        total: 42.5,
        pic: 20.0,
        cross_country: 15.0,
        night: 3.0,
        instrument_total: 5.0,
        dual_received: 22.5,
      },
    };
    vi.mocked(api.getLatestImportHistory).mockResolvedValue(mockImport as any);

    await act(async () => {
      await useUserStore.getState().loadCurrentHours();
    });

    expect(useUserStore.getState().currentHours?.total).toBe(42.5);
  });

  it("sets default zero hours when no import history exists", async () => {
    vi.mocked(api.getLatestImportHistory).mockResolvedValue(null as any);

    await act(async () => {
      await useUserStore.getState().loadCurrentHours();
    });

    const hours = useUserStore.getState().currentHours;
    expect(hours).not.toBeNull();
    expect(hours?.total).toBe(0);
    expect(hours?.pic).toBe(0);
  });
});

describe("useUserStore - reset", () => {
  it("resets all state to defaults", () => {
    useUserStore.setState({
      settings: mockSettings as any,
      error: "some error",
      isLoading: true,
      currentHours: { total: 42 } as any,
    });

    useUserStore.getState().reset();

    const state = useUserStore.getState();
    expect(state.settings).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.currentHours).toBeNull();
  });
});
