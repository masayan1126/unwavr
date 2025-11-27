"use client";
import { create } from "zustand";
import { AppState } from "./storeTypes";
import { createTaskSlice } from "./stores/createTaskSlice";
import { createMilestoneSlice } from "./stores/createMilestoneSlice";
import { createLauncherSlice } from "./stores/createLauncherSlice";
import { createBgmSlice } from "./stores/createBgmSlice";
import { createPomodoroSlice } from "./stores/createPomodoroSlice";
import { createImportHistorySlice } from "./stores/createImportHistorySlice";
import { createUISlice } from "./stores/createUISlice";

export const useAppStore = create<AppState>()((...a) => ({
  ...createTaskSlice(...a),
  ...createMilestoneSlice(...a),
  ...createLauncherSlice(...a),
  ...createBgmSlice(...a),
  ...createPomodoroSlice(...a),
  ...createImportHistorySlice(...a),
  ...createUISlice(...a),
}));

// Initial hydration
if (typeof window !== 'undefined') {
  useAppStore.getState().hydrateFromDb();
}

export type { AppState };
