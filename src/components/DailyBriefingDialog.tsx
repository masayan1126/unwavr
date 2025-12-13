"use client";
import { useState, useEffect } from "react";
import { Sun, Loader2, X, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { generateDailyBriefing } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { motion, AnimatePresence } from "framer-motion";
import { isTaskForToday } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface DailyBriefingDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DailyBriefingDialog({ isOpen, onClose }: DailyBriefingDialogProps) {
    const [briefing, setBriefing] = useState("");
    const [loading, setLoading] = useState(false);
    const apiKey = useAppStore((s) => s.geminiApiKey);
    const tasks = useAppStore((s) => s.tasks);
    const language = useAppStore((s) => s.language);
    const toast = useToast();

    // Mock weather for now, or use a real hook if available
    const weather = "Sunny, 25°C";

    useEffect(() => {
        if (isOpen && !briefing) {
            handleGenerate();
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!apiKey) {
            toast.show("設定画面でGemini APIキーを設定してください", "error");
            return;
        }

        setLoading(true);
        try {
            const todayTasks = tasks.filter((t) => isTaskForToday(t));
            const text = await generateDailyBriefing(apiKey, {
                tasks: todayTasks,
                weather,
                date: new Date(),
                language
            });
            setBriefing(text);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("Quota")) {
                toast.show("Gemini APIの利用枠を超えました。しばらく待ってから再試行してください。", "error");
            } else {
                toast.show("生成に失敗しました", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                        <div className="flex items-center gap-2 font-medium">
                            <Sun size={18} className="text-orange-500" />
                            <span>Daily Briefing</span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
                                <Loader2 size={32} className="animate-spin text-primary" />
                                <p>今日のブリーフィングを作成中...</p>
                            </div>
                        ) : briefing ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{briefing}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <p>ブリーフィングを生成できませんでした。</p>
                                <button onClick={handleGenerate} className="mt-2 text-primary underline">再試行</button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            再生成
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-all"
                        >
                            閉じる
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
