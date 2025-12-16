import { StateCreator } from "zustand";
import { BgmTrack, BgmGroup, BgmSearchResult } from "../types";
import { AppState } from "../storeTypes";
import { BgmSlice } from "./sliceTypes";

function createBgmId(): string {
    return `bgm_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
function createBgmGroupId(): string {
    return `bgmg_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export const createBgmSlice: StateCreator<AppState, [], [], BgmSlice> = (set) => ({
    bgmTracks: [],
    bgmGroups: [],
    bgmCurrentTrackId: undefined,
    bgmMiniPos: undefined,
    bgmSearchResults: [],
    bgmSearchLoading: false,
    addBgmTrack: (input) =>
        set((state) => {
            const newTrack = { ...input, id: createBgmId(), createdAt: Date.now() } as BgmTrack;
            fetch('/api/db/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracks: [newTrack] }) }).catch(() => { });
            return { bgmTracks: [...state.bgmTracks, newTrack] };
        }),
    removeBgmTrack: (id) =>
        set((state) => {
            fetch(`/api/db/bgm/tracks/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { });
            return { bgmTracks: state.bgmTracks.filter((t) => t.id !== id) };
        }),
    updateBgmTrack: (id, update) =>
        set((state) => ({ bgmTracks: state.bgmTracks.map((t) => (t.id === id ? { ...t, ...update } : t)) })),
    moveBgmTrack: (fromIdx, toIdx) =>
        set((state) => {
            const list = [...state.bgmTracks];
            if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) return state;
            const [item] = list.splice(fromIdx, 1);
            list.splice(toIdx, 0, item);
            return { bgmTracks: list };
        }),
    moveBgmTrackWithinGroup: (trackId, beforeTrackId) =>
        set((state) => {
            const tracks = [...state.bgmTracks];
            const srcIdx = tracks.findIndex((t) => t.id === trackId);
            if (srcIdx < 0) return state;
            const src = tracks[srcIdx];
            const groupId = src.groupId;
            const groupOrder = tracks
                .map((t, idx) => ({ t, idx }))
                .filter(({ t }) => t.groupId === groupId);
            const fromOrderIdx = groupOrder.findIndex(({ t }) => t.id === trackId);
            if (fromOrderIdx < 0) return state;
            let toOrderIdx = beforeTrackId
                ? groupOrder.findIndex(({ t }) => t.id === beforeTrackId)
                : groupOrder.length; // move to end of group
            if (toOrderIdx < 0) toOrderIdx = groupOrder.length;
            const fromAbs = groupOrder[fromOrderIdx].idx;
            // Compute absolute index to insert before
            const toAbs = toOrderIdx >= groupOrder.length ? (groupOrder.at(-1)?.idx ?? fromAbs) + 1 : groupOrder[toOrderIdx].idx;
            const [moved] = tracks.splice(fromAbs, 1);
            const adj = fromAbs < toAbs ? toAbs - 1 : toAbs;
            tracks.splice(adj, 0, moved);
            return { bgmTracks: tracks };
        }),
    setBgmTrackGroup: (trackId, groupId) =>
        set((state) => ({
            bgmTracks: state.bgmTracks.map((t) => (t.id === trackId ? { ...t, groupId } : t)),
        })),
    clearBgmTracks: () => set({ bgmTracks: [] }),
    addBgmGroup: (input) =>
        set((state) => {
            const newGroup = { ...input, id: createBgmGroupId() } as BgmGroup;
            fetch('/api/db/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groups: [newGroup] }) }).catch(() => { });
            return { bgmGroups: [...state.bgmGroups, newGroup] };
        }),
    updateBgmGroup: (id, update) =>
        set((state) => ({ bgmGroups: state.bgmGroups.map((g) => (g.id === id ? { ...g, ...update } : g)) })),
    removeBgmGroup: (id) =>
        set((state) => ({
            bgmGroups: state.bgmGroups.filter((g) => g.id !== id),
            bgmTracks: state.bgmTracks.map((t) => (t.groupId === id ? { ...t, groupId: undefined } : t)),
        })),
    playBgmTrack: (trackId: string) => set({ bgmCurrentTrackId: trackId }),
    stopBgm: () => set({ bgmCurrentTrackId: undefined }),
    setBgmMiniPos: (pos) => set({ bgmMiniPos: pos }),
    setBgmSearchResults: (results: BgmSearchResult[]) => set({ bgmSearchResults: results }),
    setBgmSearchLoading: (loading: boolean) => set({ bgmSearchLoading: loading }),
    clearBgmSearchResults: () => set({ bgmSearchResults: [] }),
});
