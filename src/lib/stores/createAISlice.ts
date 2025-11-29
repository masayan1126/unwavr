import { StateCreator } from "zustand";
import { AppState } from "../storeTypes";
import { AISlice } from "./sliceTypes";

export const createAISlice: StateCreator<AppState, [], [], AISlice> = (set) => ({
    geminiApiKey: (typeof window !== 'undefined' ? safeLocalStorageGet("geminiApiKey") || "" : ""),
    setGeminiApiKey: (key: string) => {
        safeLocalStorageSet("geminiApiKey", key);
        set({ geminiApiKey: key });
    },
});

function safeLocalStorageGet(key: string): string | null {
    try {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
    } catch { }
    return null;
}

function safeLocalStorageSet(key: string, value: string) {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
        }
    } catch { }
}
