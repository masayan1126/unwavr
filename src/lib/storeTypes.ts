import { TaskSlice } from "./stores/createTaskSlice";
import { MilestoneSlice } from "./stores/createMilestoneSlice";
import { LauncherSlice } from "./stores/createLauncherSlice";
import { BgmSlice } from "./stores/createBgmSlice";
import { PomodoroSlice } from "./stores/createPomodoroSlice";
import { ImportHistorySlice } from "./stores/createImportHistorySlice";
import { UISlice } from "./stores/createUISlice";

export type AppState = TaskSlice &
    MilestoneSlice &
    LauncherSlice &
    BgmSlice &
    PomodoroSlice &
    ImportHistorySlice &
    UISlice;
