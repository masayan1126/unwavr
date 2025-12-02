"use client";
import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { processUserRequest } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { Loader2, Sparkles, X, Send, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "model"; content: string };

export default function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);

    const apiKey = useAppStore((s) => s.geminiApiKey);
    const tasks = useAppStore((s) => s.tasks);
    const addTask = useAppStore((s) => s.addTask);
    const updateTask = useAppStore((s) => s.updateTask);
    const removeTask = useAppStore((s) => s.removeTask);
    const completeTasks = useAppStore((s) => s.completeTasks);

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

    const send = async () => {
        const content = input.trim();
        if (!content || loading) return;

        if (!apiKey) {
            toast.show("設定画面でGemini APIキーを設定してください", "error");
            return;
        }

        const newMessages = [...messages, { role: "user" as const, content }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // Prepare simplified task context
            const currentTasks = tasks.map(t => ({
                id: t.id,
                title: t.title,
                type: t.type,
                completed: t.completed,
                scheduled: t.scheduled,
                plannedDates: t.plannedDates
            }));

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const result = await processUserRequest(apiKey, history, content, currentTasks);

            // Execute action
            switch (result.type) {
                case "create_task":
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    addTask(result.task as any);
                    toast.show("タスクを作成しました", "success");
                    break;
                case "update_task":
                    updateTask(result.taskId, result.updates);
                    toast.show("タスクを更新しました", "success");
                    break;
                case "delete_task":
                    removeTask(result.taskId);
                    toast.show("タスクを削除しました", "success");
                    break;
                case "complete_task":
                    completeTasks([result.taskId]);
                    toast.show("タスクを完了しました", "success");
                    break;
            }

            setMessages((m) => [...m, { role: "model", content: result.message }]);

        } catch (e) {
            console.error(e);
            toast.show("エラーが発生しました", "error");
            setMessages((m) => [...m, { role: "model", content: "エラーが発生しました。APIキーやネットワーク接続を確認してください。" }]);
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-20 right-4 w-[calc(100vw-32px)] sm:w-[400px] h-[500px] max-h-[60vh] sm:max-h-[500px] bg-card border border-border shadow-2xl rounded-2xl z-[200000] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Sparkles size={16} className="text-primary" />
                                <span>AI Assistant</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-4 p-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Sparkles size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm mb-1">何かお手伝いしましょうか？</p>
                                        <p className="text-xs">「タスクを追加して」「今日の予定は？」</p>
                                    </div>
                                </div>
                            )}
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-foreground rounded-bl-none"
                                            }`}
                                    >
                                        {m.content}
                                    </div>
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
                        <div className="p-3 bg-background border-t">
                            <div className="relative flex items-center">
                                <input
                                    className="w-full bg-muted/50 border-none rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder={apiKey ? "AIに指示する..." : "APIキーを設定してください"}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={!apiKey || loading}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            void send();
                                        }
                                    }}
                                />
                                <button
                                    className="absolute right-1.5 p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
                                    onClick={send}
                                    disabled={loading || !input.trim() || !apiKey}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 z-[200000] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    }`}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </motion.button>
        </>
    );
}
