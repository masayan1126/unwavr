import { StateCreator } from "zustand";
import { AppState } from "../storeTypes";
import { AISlice, GeminiModel } from "./sliceTypes";

export const createAISlice: StateCreator<AppState, [], [], AISlice> = (set, get) => ({
    geminiApiKey: (typeof window !== 'undefined' ? safeLocalStorageGet("geminiApiKey") || "" : ""),
    setGeminiApiKey: (key: string) => {
        safeLocalStorageSet("geminiApiKey", key);
        set({ geminiApiKey: key });
    },
    aiModel: (typeof window !== 'undefined' ? (safeLocalStorageGet("aiModel") as GeminiModel) || "gemini-2.5-flash-preview-05-20" : "gemini-2.5-flash-preview-05-20"),
    setAIModel: (model: GeminiModel) => {
        safeLocalStorageSet("aiModel", model);
        set({ aiModel: model });
        // サーバーにも保存
        fetch("/api/db/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ custom_settings: { ai_model: model } }),
        }).catch(() => {});
    },
    aiChatOpen: false,
    setAIChatOpen: (open: boolean) => set({ aiChatOpen: open }),
    toggleAIChat: () => set({ aiChatOpen: !get().aiChatOpen }),
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
