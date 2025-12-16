import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { processUserRequest } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { Loader2 } from "lucide-react";

type Msg = { role: "user" | "model"; content: string };

export default function ChatAssistant() {
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

  return (
    <div className="border rounded-xl w-full max-w-3xl mx-auto h-[70svh] flex flex-col bg-card shadow-sm overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-2">
            <p>Gemini 2.5 Flash アシスタント</p>
            <p className="text-xs">「牛乳を買うタスクを追加して」「今日のタスクを教えて」など話しかけてください</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${m.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
              }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin opacity-50" />
              <span className="text-xs opacity-50">考え中...</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-3 bg-background flex items-center gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={mounted && apiKey ? "メッセージを入力..." : "設定画面でAPIキーを設定してください"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!mounted || !apiKey || loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          onClick={send}
          disabled={loading || !input.trim() || !mounted || !apiKey}
        >
          送信
        </button>
      </div>
      <div className="text-center py-2 border-t bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          チャット履歴はサーバーに保存されません。入力内容はAIモデルの学習に使用されません。
        </p>
      </div>
    </div>
  );
}


