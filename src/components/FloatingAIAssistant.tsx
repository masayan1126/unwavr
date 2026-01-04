"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { isBgmRelatedMessage } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { Loader2, Sparkles, X, Send, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BgmSearchResultCard from "./BgmSearchResultCard";
import TaskConfirmCard, { TaskConfirmOptions } from "./TaskConfirmCard";
import BulkTaskConfirmCard, { BulkTaskConfirmOptions } from "./BulkTaskConfirmCard";
import { BgmSearchResult, TaskType } from "@/lib/types";

// Server API response types
type AIActionResponse =
    | { type: "chat"; message: string }
    | { type: "create_task"; task: Record<string, unknown>; message: string }
    | {
        type: "create_task_confirm";
        task: {
            title: string;
            recommendedType: TaskType;
            recommendedMilestoneIds: string[];
            recommendedParentTaskId: string | null;
        };
        options: {
            types: { value: TaskType; label: string }[];
            milestones: { id: string; title: string; targetUnits: number; currentUnits: number }[];
            parentTasks: { id: string; title: string }[];
        };
        message: string;
    }
    | {
        type: "create_tasks_confirm";
        tasks: { title: string }[];
        recommendedType: TaskType;
        options: {
            types: { value: TaskType; label: string }[];
            milestones: { id: string; title: string; targetUnits: number; currentUnits: number }[];
        };
        message: string;
    }
    | { type: "update_task"; taskId: string; updates: Record<string, unknown>; message: string }
    | { type: "delete_task"; taskId: string; message: string }
    | { type: "complete_task"; taskId: string; message: string };

type BGMActionResponse =
    | { type: "search_bgm"; query: string; mood?: string; message: string }
    | { type: "play_existing"; groupName?: string; message: string }
    | { type: "bgm_chat"; message: string };

type Msg = {
    role: "user" | "model";
    content: string;
    searchResults?: BgmSearchResult[];
    taskConfirm?: {
        task: TaskConfirmOptions["task"];
        options: TaskConfirmOptions["options"];
    };
    bulkTaskConfirm?: {
        tasks: { title: string }[];
        recommendedType: TaskType;
        options: BulkTaskConfirmOptions["options"];
    };
};

type Size = "normal" | "large";

type Command = {
    command: string;
    description: string;
    example: string;
    pages: string[]; // Which pages this command appears on, empty = all pages
};

// Common commands available everywhere
const COMMON_COMMANDS: Command[] = [
    { command: "/help", description: "ヘルプを表示", example: "/help", pages: [] },
];

// Task-related commands
const TASK_COMMANDS: Command[] = [
    { command: "/task", description: "タスクを追加", example: "/task 買い物に行く", pages: ["tasks", "home", "pomodoro", "milestones", "calendar", "launcher"] },
    { command: "/today", description: "今日のタスク一覧", example: "/today", pages: ["tasks", "home", "pomodoro", "calendar"] },
    { command: "/done", description: "タスクを完了", example: "/done タスク名", pages: ["tasks", "home", "pomodoro"] },
];

// BGM-related commands
const BGM_COMMANDS: Command[] = [
    { command: "/bgm", description: "BGMを検索・再生", example: "/bgm 集中できる曲", pages: ["bgm", "pomodoro", "launcher"] },
    { command: "/play", description: "プレイリストから再生", example: "/play", pages: ["bgm", "pomodoro"] },
    { command: "/stop", description: "BGMを停止", example: "/stop", pages: ["bgm", "pomodoro"] },
];

// Milestone-related commands
const MILESTONE_COMMANDS: Command[] = [
    { command: "/milestone", description: "マイルストーンを追加", example: "/milestone 目標名", pages: ["milestones"] },
    { command: "/progress", description: "進捗を確認", example: "/progress", pages: ["milestones"] },
];

// Get commands for current page
function getCommandsForPage(pathname: string): Command[] {
    let pageKey = "home";
    if (pathname.startsWith("/tasks")) pageKey = "tasks";
    else if (pathname.startsWith("/bgm")) pageKey = "bgm";
    else if (pathname.startsWith("/pomodoro")) pageKey = "pomodoro";
    else if (pathname.startsWith("/milestones")) pageKey = "milestones";
    else if (pathname.startsWith("/calendar")) pageKey = "calendar";
    else if (pathname.startsWith("/launcher")) pageKey = "launcher";

    const allCommands = [...COMMON_COMMANDS, ...TASK_COMMANDS, ...BGM_COMMANDS, ...MILESTONE_COMMANDS];

    return allCommands.filter(cmd =>
        cmd.pages.length === 0 || cmd.pages.includes(pageKey)
    );
}

type PageContext = {
    title: string;
    description: string;
    suggestions: string[];
};

function getPageContext(pathname: string): PageContext {
    if (pathname.startsWith("/tasks") || pathname === "/") {
        return {
            title: "タスク管理",
            description: "タスクの追加・編集・完了ができます",
            suggestions: ["タスクを追加して", "今日のタスクは？", "買い物リストを作って"],
        };
    }
    if (pathname.startsWith("/bgm")) {
        return {
            title: "BGM管理",
            description: "音楽の検索・再生ができます",
            suggestions: ["集中できる曲かけて", "カフェっぽいBGM", "ASMRを再生して"],
        };
    }
    if (pathname.startsWith("/pomodoro")) {
        return {
            title: "ポモドーロ",
            description: "集中タイマーと連携できます",
            suggestions: ["作業用BGMをかけて", "今日のタスクは？", "タスクを追加して"],
        };
    }
    if (pathname.startsWith("/milestones")) {
        return {
            title: "マイルストーン",
            description: "目標管理と連携できます",
            suggestions: ["進捗を確認", "タスクを追加して", "今日やることは？"],
        };
    }
    if (pathname.startsWith("/calendar")) {
        return {
            title: "カレンダー",
            description: "予定の確認ができます",
            suggestions: ["今日の予定は？", "タスクを追加して", "明日の予定"],
        };
    }
    if (pathname.startsWith("/launcher")) {
        return {
            title: "ランチャー",
            description: "アプリ起動と連携できます",
            suggestions: ["タスクを追加して", "BGMをかけて", "今日のタスクは？"],
        };
    }
    return {
        title: "アシスタント",
        description: "何でもお手伝いします",
        suggestions: ["タスクを追加して", "BGMをかけて", "今日の予定は？"],
    };
}

export default function FloatingAIAssistant() {
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [size, setSize] = useState<Size>("normal");
    const [showCommands, setShowCommands] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const pathname = usePathname();

    // Mobile: use store state, Desktop: use local state
    const aiChatOpen = useAppStore((s) => s.aiChatOpen);
    const setAIChatOpen = useAppStore((s) => s.setAIChatOpen);
    const isOpen = isMobile ? aiChatOpen : desktopOpen;
    const setIsOpen = isMobile ? setAIChatOpen : setDesktopOpen;

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const pageContext = getPageContext(pathname || "/");

    const tasks = useAppStore((s) => s.tasks);
    const addTask = useAppStore((s) => s.addTask);
    const updateTask = useAppStore((s) => s.updateTask);
    const removeTask = useAppStore((s) => s.removeTask);
    const completeTasks = useAppStore((s) => s.completeTasks);

    // Milestones for AI context
    const milestones = useAppStore((s) => s.milestones);

    // Parent task candidates (root tasks only - tasks without parentTaskId)
    const parentTaskCandidates = useMemo(() => {
        return tasks
            .filter((t) => !t.parentTaskId && !t.archived && !t.completed)
            .map((t) => ({ id: t.id, title: t.title }));
    }, [tasks]);

    // BGM related
    const addBgmTrack = useAppStore((s) => s.addBgmTrack);
    const playBgmTrack = useAppStore((s) => s.playBgmTrack);
    const bgmTracks = useAppStore((s) => s.bgmTracks);

    const toast = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, loading, isOpen]);

    // Auto-adjust textarea height when input changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
        }
    }, [input]);

    const handlePlayBgmResult = (result: BgmSearchResult) => {
        // Add to playlist
        addBgmTrack({
            videoId: result.videoId,
            title: result.title,
            url: `https://www.youtube.com/watch?v=${result.videoId}`,
        });

        // Find the newly added track and play it
        setTimeout(() => {
            const tracks = useAppStore.getState().bgmTracks;
            const newTrack = tracks.find((t) => t.videoId === result.videoId);
            if (newTrack) {
                playBgmTrack(newTrack.id);
            }
        }, 100);

        toast.show(`「${result.title}」を再生します`, "success");
    };

    const searchYouTube = async (query: string): Promise<BgmSearchResult[]> => {
        try {
            const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5`);
            const data = await res.json();
            return data.items || [];
        } catch (e) {
            console.error("YouTube search failed", e);
            return [];
        }
    };

    // Handle input change and show/hide commands
    const handleInputChange = (value: string) => {
        setInput(value);
        setShowCommands(value === "/" || (value.startsWith("/") && value.length <= 6));
    };

    // Handle command selection
    const handleCommandSelect = (command: Command) => {
        setInput(command.command + " ");
        setShowCommands(false);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
    };

    // Process slash commands
    const processCommand = async (content: string): Promise<boolean> => {
        const cmd = content.toLowerCase();
        const pageCommands = getCommandsForPage(pathname || "/");

        if (cmd === "/help") {
            setMessages((m) => [
                ...m,
                { role: "user" as const, content },
                {
                    role: "model",
                    content: `**このページで使えるコマンド:**\n\n${pageCommands.map(c => `\`${c.command}\` - ${c.description}`).join("\n")}\n\nまたは自然な言葉で話しかけてください。`,
                },
            ]);
            return true;
        }

        if (cmd === "/stop") {
            useAppStore.getState().stopBgm();
            setMessages((m) => [
                ...m,
                { role: "user" as const, content },
                { role: "model", content: "BGMを停止しました。" },
            ]);
            return true;
        }

        if (cmd === "/play") {
            const tracks = useAppStore.getState().bgmTracks;
            if (tracks.length > 0) {
                const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
                playBgmTrack(randomTrack.id);
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: `「${randomTrack.title}」を再生します` },
                ]);
            } else {
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: "プレイリストに曲がありません。まず曲を追加してください。" },
                ]);
            }
            return true;
        }

        if (cmd === "/today") {
            // Will be processed by AI
            return false;
        }

        if (cmd.startsWith("/task ")) {
            // Extract task title and create
            const taskTitle = content.slice(6).trim();
            if (taskTitle) {
                addTask({ title: taskTitle, type: "backlog", order: 0, milestoneIds: [] });
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: `タスク「${taskTitle}」を追加しました。` },
                ]);
                toast.show("タスクを追加しました", "success");
                return true;
            }
        }

        if (cmd.startsWith("/bgm ")) {
            // BGM search - will be processed normally
            return false;
        }

        if (cmd.startsWith("/done ")) {
            const taskName = content.slice(6).trim().toLowerCase();
            if (taskName) {
                const matchingTask = tasks.find(t =>
                    t.title.toLowerCase().includes(taskName) && !t.completed
                );
                if (matchingTask) {
                    completeTasks([matchingTask.id]);
                    setMessages((m) => [
                        ...m,
                        { role: "user" as const, content },
                        { role: "model", content: `「${matchingTask.title}」を完了しました。` },
                    ]);
                    toast.show("タスクを完了しました", "success");
                } else {
                    setMessages((m) => [
                        ...m,
                        { role: "user" as const, content },
                        { role: "model", content: `「${taskName}」に一致するタスクが見つかりませんでした。` },
                    ]);
                }
                return true;
            }
        }

        if (cmd.startsWith("/milestone ")) {
            const milestoneName = content.slice(11).trim();
            if (milestoneName) {
                const addMilestone = useAppStore.getState().addMilestone;
                addMilestone({ title: milestoneName, targetUnits: 1, currentUnits: 0, order: 0 });
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: `マイルストーン「${milestoneName}」を追加しました。` },
                ]);
                toast.show("マイルストーンを追加しました", "success");
                return true;
            }
        }

        if (cmd === "/progress") {
            const milestones = useAppStore.getState().milestones;
            if (milestones.length === 0) {
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: "まだマイルストーンがありません。`/milestone 目標名` で追加してみましょう。" },
                ]);
            } else {
                const summary = milestones.map(m => {
                    const linkedTasks = tasks.filter(t => (t.milestoneIds ?? []).includes(m.id));
                    const completedCount = linkedTasks.filter(t => t.completed).length;
                    const progress = linkedTasks.length > 0 ? Math.round((completedCount / linkedTasks.length) * 100) : 0;
                    return `• **${m.title}**: ${progress}% (${completedCount}/${linkedTasks.length}タスク)`;
                }).join("\n");
                setMessages((m) => [
                    ...m,
                    { role: "user" as const, content },
                    { role: "model", content: `**マイルストーン進捗:**\n\n${summary}` },
                ]);
            }
            return true;
        }

        return false;
    };

    const send = async () => {
        const content = input.trim();
        if (!content || loading) return;

        setShowCommands(false);

        // Process slash commands first
        if (content.startsWith("/")) {
            const handled = await processCommand(content);
            if (handled) {
                setInput("");
                return;
            }
            // If not handled, continue with AI processing
            // Convert /bgm to natural language
            if (content.toLowerCase().startsWith("/bgm ")) {
                const query = content.slice(5).trim();
                setInput("");
                setLoading(true);
                const newMessages = [...messages, { role: "user" as const, content: query + "をかけて" }];
                setMessages(newMessages);
                try {
                    const searchResults = await searchYouTube(query);
                    if (searchResults.length > 0) {
                        setMessages((m) => [
                            ...m,
                            { role: "model", content: `「${query}」の検索結果です：`, searchResults },
                        ]);
                    } else {
                        setMessages((m) => [
                            ...m,
                            { role: "model", content: "検索結果が見つかりませんでした。" },
                        ]);
                    }
                } catch {
                    setMessages((m) => [
                        ...m,
                        { role: "model", content: "エラーが発生しました。" },
                    ]);
                } finally {
                    setLoading(false);
                }
                return;
            }
        }

        const newMessages = [...messages, { role: "user" as const, content }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // Check if this is a BGM-related request
            if (isBgmRelatedMessage(content)) {
                const res = await fetch("/api/ai/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "bgm_request", message: content }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    if (errData.error === "limit_exceeded") {
                        setMessages((m) => [
                            ...m,
                            { role: "model", content: `${errData.message}\n\n[料金プラン](/pricing)からアップグレードできます。` },
                        ]);
                        return;
                    }
                    throw new Error(errData.error || "API error");
                }

                const bgmResult: BGMActionResponse = await res.json();

                if (bgmResult.type === "search_bgm") {
                    // Search YouTube
                    const searchResults = await searchYouTube(bgmResult.query);

                    if (searchResults.length > 0) {
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: bgmResult.message,
                                searchResults,
                            },
                        ]);
                    } else {
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: "検索結果が見つかりませんでした。別のキーワードで試してみてください。",
                            },
                        ]);
                    }
                } else if (bgmResult.type === "play_existing") {
                    // Find and play from existing playlist
                    const groupName = bgmResult.groupName?.toLowerCase();
                    let tracksToPlay = bgmTracks;

                    if (groupName) {
                        const groups = useAppStore.getState().bgmGroups;
                        const matchingGroup = groups.find((g) =>
                            g.name.toLowerCase().includes(groupName)
                        );
                        if (matchingGroup) {
                            tracksToPlay = bgmTracks.filter((t) => t.groupId === matchingGroup.id);
                        }
                    }

                    if (tracksToPlay.length > 0) {
                        const randomTrack = tracksToPlay[Math.floor(Math.random() * tracksToPlay.length)];
                        playBgmTrack(randomTrack.id);
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: `「${randomTrack.title}」を再生します`,
                            },
                        ]);
                    } else {
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: bgmResult.message,
                            },
                        ]);
                    }
                } else {
                    setMessages((m) => [...m, { role: "model", content: bgmResult.message }]);
                }
            } else {
                // Task-related request - call server API
                const currentTasks = tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    type: t.type,
                    completed: t.completed,
                    scheduled: t.scheduled,
                    plannedDates: t.plannedDates,
                }));

                // Milestones for AI context
                const currentMilestones = milestones.map((m) => ({
                    id: m.id,
                    title: m.title,
                    targetUnits: m.targetUnits,
                    currentUnits: m.currentUnits,
                }));

                const history = messages.map((m) => ({
                    role: m.role,
                    parts: [{ text: m.content }],
                }));

                const res = await fetch("/api/ai/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "task_request",
                        message: content,
                        history,
                        tasks: currentTasks,
                        milestones: currentMilestones,
                        parentTasks: parentTaskCandidates,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    if (errData.error === "limit_exceeded") {
                        setMessages((m) => [
                            ...m,
                            { role: "model", content: `${errData.message}\n\n[料金プラン](/pricing)からアップグレードできます。` },
                        ]);
                        return;
                    }
                    throw new Error(errData.error || "API error");
                }

                const result: AIActionResponse = await res.json();

                // Execute action
                switch (result.type) {
                    case "create_task":
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        addTask(result.task as any);
                        toast.show("タスクを作成しました", "success");
                        setMessages((m) => [...m, { role: "model", content: result.message }]);
                        break;
                    case "create_task_confirm":
                        // 選択肢確認が必要な場合 - taskConfirmフィールド付きでメッセージを追加
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: result.message,
                                taskConfirm: {
                                    task: result.task,
                                    options: result.options,
                                },
                            },
                        ]);
                        break;
                    case "create_tasks_confirm":
                        // 複数タスク一括確認が必要な場合 - bulkTaskConfirmフィールド付きでメッセージを追加
                        setMessages((m) => [
                            ...m,
                            {
                                role: "model",
                                content: result.message,
                                bulkTaskConfirm: {
                                    tasks: result.tasks,
                                    recommendedType: result.recommendedType,
                                    options: result.options,
                                },
                            },
                        ]);
                        break;
                    case "update_task":
                        updateTask(result.taskId, result.updates);
                        toast.show("タスクを更新しました", "success");
                        setMessages((m) => [...m, { role: "model", content: result.message }]);
                        break;
                    case "delete_task":
                        removeTask(result.taskId);
                        toast.show("タスクを削除しました", "success");
                        setMessages((m) => [...m, { role: "model", content: result.message }]);
                        break;
                    case "complete_task":
                        completeTasks([result.taskId]);
                        toast.show("タスクを完了しました", "success");
                        setMessages((m) => [...m, { role: "model", content: result.message }]);
                        break;
                    default:
                        // chat type
                        setMessages((m) => [...m, { role: "model", content: result.message }]);
                        break;
                }
            }
        } catch (e) {
            console.error(e);
            toast.show("エラーが発生しました", "error");
            setMessages((m) => [
                ...m,
                {
                    role: "model",
                    content: "エラーが発生しました。ネットワーク接続を確認してください。",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.9 }}
                        className={`fixed bg-card border border-border shadow-2xl z-[200000] flex flex-col overflow-hidden transition-all duration-200 ${
                            isMobile
                                ? "inset-x-0 bottom-14 top-12 rounded-none border-x-0 border-b-0"
                                : size === "large"
                                    ? "bottom-20 right-4 w-[750px] lg:w-[850px] h-[700px] max-h-[80vh] rounded-2xl"
                                    : "bottom-20 right-4 w-[500px] h-[550px] max-h-[550px] rounded-2xl"
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Sparkles size={16} className="text-primary" />
                                <span>Unwavr AI</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {!isMobile && (
                                    <button
                                        onClick={() => setSize(size === "normal" ? "large" : "normal")}
                                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                        title={size === "normal" ? "拡大" : "縮小"}
                                    >
                                        {size === "normal" ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <ChevronDown size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center gap-4 p-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Sparkles size={24} className="text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-foreground">{pageContext.title}</p>
                                        <p className="text-xs">{pageContext.description}</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                                        {pageContext.suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] mt-2">
                                        <code className="bg-muted px-1 rounded">/</code> でコマンド一覧を表示
                                    </p>
                                </div>
                            )}
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-foreground rounded-bl-none"
                                            }`}
                                    >
                                        {m.content}
                                    </div>
                                    {m.searchResults && m.searchResults.length > 0 && (
                                        <div className="mt-2 w-full max-w-[95%]">
                                            <BgmSearchResultCard
                                                results={m.searchResults}
                                                onPlay={handlePlayBgmResult}
                                            />
                                        </div>
                                    )}
                                    {m.taskConfirm && (
                                        <div className="mt-2 w-full max-w-[95%]">
                                            <TaskConfirmCard
                                                task={m.taskConfirm.task}
                                                options={m.taskConfirm.options}
                                                onConfirm={(confirmedTask) => {
                                                    // タスクを作成
                                                    addTask({
                                                        title: confirmedTask.title,
                                                        type: confirmedTask.type,
                                                        milestoneIds: confirmedTask.milestoneIds,
                                                        parentTaskId: confirmedTask.parentTaskId ?? undefined,
                                                        order: 0,
                                                    });
                                                    toast.show("タスクを作成しました", "success");
                                                    // 確認カードを非表示にする（メッセージからtaskConfirmを削除）
                                                    setMessages((msgs) =>
                                                        msgs.map((msg, i) =>
                                                            i === idx
                                                                ? { ...msg, content: `「${confirmedTask.title}」を${confirmedTask.type === "daily" ? "毎日タスク" : confirmedTask.type === "scheduled" ? "特定曜日タスク" : "積み上げ候補"}として作成しました。`, taskConfirm: undefined }
                                                                : msg
                                                        )
                                                    );
                                                }}
                                                onCancel={() => {
                                                    // 確認カードを非表示にする（キャンセルメッセージに変更）
                                                    setMessages((msgs) =>
                                                        msgs.map((msg, i) =>
                                                            i === idx
                                                                ? { ...msg, content: "タスク作成をキャンセルしました。", taskConfirm: undefined }
                                                                : msg
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                    )}
                                    {m.bulkTaskConfirm && (
                                        <div className="mt-2 w-full max-w-[95%]">
                                            <BulkTaskConfirmCard
                                                tasks={m.bulkTaskConfirm.tasks}
                                                recommendedType={m.bulkTaskConfirm.recommendedType}
                                                options={m.bulkTaskConfirm.options}
                                                onConfirm={(confirmed) => {
                                                    // 複数タスクを一括作成
                                                    confirmed.tasks.forEach((task) => {
                                                        addTask({
                                                            title: task.title,
                                                            type: confirmed.type,
                                                            milestoneIds: confirmed.milestoneIds,
                                                            order: 0,
                                                        });
                                                    });
                                                    toast.show(`${confirmed.tasks.length}件のタスクを作成しました`, "success");
                                                    // 確認カードを非表示にする
                                                    const typeLabel = confirmed.type === "daily" ? "毎日タスク" : confirmed.type === "scheduled" ? "特定曜日タスク" : "積み上げ候補";
                                                    setMessages((msgs) =>
                                                        msgs.map((msg, i) =>
                                                            i === idx
                                                                ? { ...msg, content: `${confirmed.tasks.length}件のタスクを${typeLabel}として作成しました。`, bulkTaskConfirm: undefined }
                                                                : msg
                                                        )
                                                    );
                                                }}
                                                onCancel={() => {
                                                    // 確認カードを非表示にする（キャンセルメッセージに変更）
                                                    setMessages((msgs) =>
                                                        msgs.map((msg, i) =>
                                                            i === idx
                                                                ? { ...msg, content: "タスク作成をキャンセルしました。", bulkTaskConfirm: undefined }
                                                                : msg
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin opacity-50" />
                                        <span className="text-xs opacity-50">考え中...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-background border-t relative">
                            {/* Command Suggestions */}
                            <AnimatePresence>
                                {showCommands && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                                    >
                                        <div className="p-2 border-b bg-muted/30">
                                            <p className="text-xs font-medium opacity-70">コマンド一覧</p>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {getCommandsForPage(pathname || "/").filter(c =>
                                                input === "/" || c.command.startsWith(input.toLowerCase())
                                            ).map((cmd) => (
                                                <button
                                                    key={cmd.command}
                                                    onClick={() => handleCommandSelect(cmd)}
                                                    className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                                                >
                                                    <div>
                                                        <code className="text-sm font-medium text-primary">{cmd.command}</code>
                                                        <p className="text-xs">{cmd.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative flex items-end">
                                <textarea
                                    ref={textareaRef}
                                    className="w-full bg-muted/50 border-none rounded-2xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[42px] max-h-[120px] overflow-y-auto"
                                    placeholder="メッセージを入力... (Shift+Enterで改行)"
                                    value={input}
                                    rows={1}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onFocus={() => {
                                        if (input === "/") setShowCommands(true);
                                    }}
                                    onBlur={() => {
                                        // Delay to allow click on command
                                        setTimeout(() => setShowCommands(false), 200);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && !showCommands) {
                                            e.preventDefault();
                                            void send();
                                        }
                                        if (e.key === "Escape") {
                                            setShowCommands(false);
                                        }
                                    }}
                                />
                                <button
                                    className="absolute right-1.5 bottom-1.5 p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
                                    onClick={send}
                                    disabled={loading || !input.trim()}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] mt-2 px-2">
                                履歴は保存されません・学習に使用されません
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button - Desktop only */}
            {!isMobile && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`fixed bottom-10 right-8 z-[200000] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                        }`}
                >
                    {isOpen ? <X size={24} /> : <Sparkles size={24} />}
                </motion.button>
            )}
        </>
    );
}
