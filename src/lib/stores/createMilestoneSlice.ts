import { StateCreator } from "zustand";
import { Milestone, createMilestoneId } from "../types";
import { AppState } from "../storeTypes";
import { MilestoneSlice } from "./sliceTypes";

export const createMilestoneSlice: StateCreator<AppState, [], [], MilestoneSlice> = (set, get) => ({
    milestones: [],
    addMilestone: (input) =>
        set((state) => {
            const m: Milestone = { ...input, id: createMilestoneId(), currentUnits: input.currentUnits ?? 0, order: Date.now() } as Milestone;
            fetch('/api/db/milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }).catch(() => { });
            return { milestones: [...state.milestones, m] };
        }),
    updateMilestoneProgress: (milestoneId, delta) =>
        set((state) => {
            const milestones = state.milestones.map((m) =>
                m.id === milestoneId
                    ? {
                        ...m,
                        currentUnits: Math.max(0, Math.min(m.targetUnits, m.currentUnits + delta)),
                    }
                    : m
            );
            const changed = milestones.find((m) => m.id === milestoneId);
            if (changed) fetch(`/api/db/milestones/${encodeURIComponent(milestoneId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUnits: changed.currentUnits }) }).catch(() => { });
            return { milestones };
        }),
    removeMilestone: (milestoneId) =>
        set((state) => {
            fetch(`/api/db/milestones/${encodeURIComponent(milestoneId)}`, { method: 'DELETE' }).catch(() => { });
            return { milestones: state.milestones.filter((m) => m.id !== milestoneId) };
        }),
    exportMilestones: () => {
        const milestones = get().milestones;
        const header = ["タイトル", "目標", "現在", "期限"];
        const formatDate = (ts?: number) => {
            if (!ts) return "-";
            const d = new Date(ts);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dd}`;
        };
        const esc = (v: string) =>
            v.includes(",") || v.includes("\n") ? `"${v.replaceAll('"', '""')}"` : v;
        const rows = milestones.map((m) =>
            [
                esc(m.title),
                String(m.targetUnits),
                String(m.currentUnits ?? 0),
                formatDate(m.dueDate),
            ].join(",")
        );
        const csv = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "milestones.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return csv;
    },
    importMilestones: (data) => {
        const errors: string[] = [];
        let imported = 0;

        function parseCsv(text: string): string[][] {
            const rows: string[][] = [];
            let row: string[] = [];
            let field = "";
            let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (inQuotes) {
                    if (ch === '"') {
                        if (i + 1 < text.length && text[i + 1] === '"') {
                            field += '"';
                            i++;
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        field += ch;
                    }
                } else {
                    if (ch === '"') inQuotes = true;
                    else if (ch === ',') { row.push(field.trim()); field = ""; }
                    else if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ""; }
                    else if (ch === '\r') { /* ignore */ }
                    else { field += ch; }
                }
            }
            row.push(field.trim());
            if (row.some((c) => c.length > 0)) rows.push(row);
            return rows;
        }

        const trimmed = data.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
            try {
                const parsed = JSON.parse(trimmed);
                const list: Partial<Milestone>[] = Array.isArray(parsed) ? parsed : [parsed];
                list.forEach((m, idx) => {
                    const title = (m.title ?? "").toString().trim();
                    const target = Number(m.targetUnits ?? 0);
                    const current = Number(m.currentUnits ?? 0);
                    if (!title) { errors.push(`JSON #${idx + 1}: タイトルが空です`); return; }
                    if (!Number.isFinite(target) || target < 1) { errors.push(`JSON #${idx + 1}: 目標が不正です`); return; }
                    const dueDate = typeof m.dueDate === 'number' ? m.dueDate : undefined;
                    try {
                        get().addMilestone({ title, targetUnits: Math.max(1, Math.floor(target)), currentUnits: Math.max(0, Math.floor(current)), dueDate } as Omit<Milestone, "id">);
                    } catch {
                        errors.push(`JSON #${idx + 1}: 追加に失敗`);
                        return;
                    }
                    imported++;
                });
                return { success: true, imported, errors };
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                return { success: false, imported: 0, errors: [msg] };
            }
        }

        try {
            const rows = parseCsv(trimmed).filter((r) => r.length > 0);
            if (rows.length === 0) return { success: true, imported: 0, errors };
            const header = rows[0].map((h) => h.trim());
            const col = (...names: string[]) => {
                for (const n of names) { const i = header.indexOf(n); if (i !== -1) return i; }
                return -1;
            };
            const idxTitle = col("タイトル", "title");
            const idxTarget = col("目標", "target", "targetUnits");
            const idxCurrent = col("現在", "current", "currentUnits");
            const idxDue = col("期限", "dueDate");
            if (idxTitle === -1 || idxTarget === -1) {
                return { success: false, imported: 0, errors: ["CSVヘッダーが不正です（必要: タイトル, 目標）"] };
            }
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i];
                if (cells.every((c) => c.trim() === "")) continue;
                const title = (cells[idxTitle] ?? "").trim();
                const target = parseInt((cells[idxTarget] ?? "").trim(), 10);
                const current = parseInt((cells[idxCurrent] ?? "0").trim() || "0", 10);
                const dueStr = (idxDue >= 0 ? (cells[idxDue] ?? "").trim() : "");
                if (!title) { errors.push(`行${i + 1}: タイトルが空です`); continue; }
                if (!Number.isFinite(target) || target < 1) { errors.push(`行${i + 1}: 目標が不正です`); continue; }
                let dueDate: number | undefined = undefined;
                if (dueStr && dueStr !== "-") {
                    const d = new Date(dueStr);
                    if (!isNaN(d.getTime())) {
                        const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                        dueDate = local.getTime();
                    }
                }
                try {
                    get().addMilestone({
                        title,
                        targetUnits: Math.max(1, Math.floor(target)),
                        currentUnits: Math.max(0, Math.min(target, Math.floor(current))),
                        dueDate,
                    } as Omit<Milestone, "id">);
                } catch {
                    errors.push(`行${i + 1}: 追加に失敗`);
                    continue;
                }
                imported++;
            }
            return { success: true, imported, errors };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { success: false, imported: 0, errors: [msg] };
        }
    },
    updateMilestoneOrder: (milestoneId, newOrder) =>
        set((state) => {
            const milestones = state.milestones.map((m) => (m.id === milestoneId ? { ...m, order: newOrder } : m));
            fetch(`/api/db/milestones/${encodeURIComponent(milestoneId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: newOrder }) }).catch(() => { });
            return { milestones };
        }),
    clearMilestones: () => set({ milestones: [] }),
});
