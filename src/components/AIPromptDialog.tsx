"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, X, Check, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { generateText } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { motion, AnimatePresence } from "framer-motion";

interface AIPromptDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string) => void;
}

export default function AIPromptDialog({ isOpen, onClose, onInsert }: AIPromptDialogProps) {
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const apiKey = useAppStore((s) => s.geminiApiKey);
    const toast = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt("");
            setResult("");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!apiKey) {
            toast.show("設定画面でGemini APIキーを設定してください", "error");
            return;
        }

        setLoading(true);
        try {
            const text = await generateText(apiKey, prompt);
            setResult(text);
        } catch (e) {
            console.error(e);
            toast.show("生成に失敗しました", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInsert = () => {
        onInsert(result);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                        <div className="flex items-center gap-2 font-medium">
                            <Sparkles size={18} className="text-primary" />
                            <span>AI アシスタント</span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {!result ? (
                            <div className="space-y-4">
                                <textarea
                                    ref={inputRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="AIに依頼したい内容を入力してください...&#13;&#10;例: 「この会議のアジェンダを作成して」「以下の文章を要約して」"
                                    className="w-full h-32 p-3 bg-muted/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                            handleGenerate();
                                        }
                                    }}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !prompt.trim()}
                                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        生成する
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg border max-h-[300px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{result}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => setResult("")}
                                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <RefreshCw size={14} />
                                        やり直す
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                        >
                                            閉じる
                                        </button>
                                        <button
                                            onClick={handleInsert}
                                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 transition-all"
                                        >
                                            <Check size={16} />
                                            挿入する
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
