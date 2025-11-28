import { StateCreator } from "zustand";
// import { ImportHistoryEntry } from "../types";
import { AppState } from "../storeTypes";
import { ImportHistorySlice } from "./sliceTypes";

function createHistoryId(): string {
    return `imh_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export const createImportHistorySlice: StateCreator<AppState, [], [], ImportHistorySlice> = (set) => ({
    importHistory: [],
    addImportHistory: (entry) =>
        set((state) => ({ importHistory: [{ ...entry, id: createHistoryId() }, ...state.importHistory] })),
    deleteImportHistory: (id) =>
        set((state) => ({ importHistory: state.importHistory.filter((e) => e.id !== id) })),
    clearImportHistory: () => set({ importHistory: [] }),
});
