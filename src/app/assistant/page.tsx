"use client";
import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { processUserRequest } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { Loader2, Sparkles, Send, ListTodo } from "lucide-react";
import Link from "next/link";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "model"; content: string };

export default function AssistantPage() {
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
  }, [messages, loading]);

  const send = async (textOverride?: string) => {
    const content = textOverride || input.trim();
    if (!content || loading) return;

    if (!apiKey) {
      toast.show("設定画面でGemini APIキーを設定してください", "error");
      return;
    }

    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    if (!textOverride) setInput("");
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
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-6 h-[calc(100vh-64px)] sm:h-screen">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          <h1 className="text-xl font-semibold">Unwavr AI</h1>
        </div>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-6 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={32} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg mb-2">何かお手伝いしましょうか？</p>
                <p className="text-sm mb-6">タスクの管理や、今日の予定の確認ができます。</p>
                <button
                  onClick={() => send("今日の未完了タスクを分かりやすく要約して")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
                >
                  <ListTodo size={16} />
                  今日のタスクを要約
                </button>
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed ${m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
                  }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <Link
                        href={props.href || "#"}
                        className="text-blue-500 hover:underline font-medium"
                      >
                        {props.children}
                      </Link>
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-2 border rounded-lg">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border-b bg-black/5 dark:bg-white/5 px-3 py-2 font-semibold" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border-b px-3 py-2" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside my-2 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
                    ),
                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-base font-bold my-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-2" {...props} />,
                    p: ({ node, ...props }) => <p className="my-1 last:mb-0" {...props} />,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
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
        <div className="p-4 bg-background border-t">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input
              className="w-full bg-muted/50 border-none rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={apiKey ? "AIに指示する..." : "設定画面でAPIキーを設定してください"}
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
              className="absolute right-2 p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
              onClick={() => send()}
              disabled={loading || !input.trim() || !apiKey}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] opacity-40">Gemini 2.0 Flashを使用しています</p>
            <p className="text-[10px] opacity-40 mt-1">
              チャット履歴はサーバーに保存されません。入力内容はAIモデルの学習に使用されません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
