import { TaskSlice, MilestoneSlice, LauncherSlice, BgmSlice, PomodoroSlice, ImportHistorySlice, UISlice, AISlice } from "./stores/sliceTypes";

export type AppState = TaskSlice &
    MilestoneSlice &
    LauncherSlice &
    BgmSlice &
    PomodoroSlice &
    ImportHistorySlice &
    UISlice &
    AISlice;
