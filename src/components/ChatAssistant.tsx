import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import { Loader2 } from "lucide-react";

type Msg = { role: "user" | "model"; content: string };

// Server API response type
type AIActionResponse =
  | { type: "chat"; message: string }
  | { type: "create_task"; task: Record<string, unknown>; message: string }
  | { type: "update_task"; taskId: string; updates: Record<string, unknown>; message: string }
  | { type: "delete_task"; taskId: string; message: string }
  | { type: "complete_task"; taskId: string; message: string }
  | { type: "schedule_task"; taskId: string; date: string; startTime: string; endTime: string; message: string }
  | { type: "create_and_schedule"; task: Record<string, unknown>; date: string; startTime: string; endTime: string; message: string };

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const completeTasks = useAppStore((s) => s.completeTasks);
  const addTimeSlot = useAppStore((s) => s.addTimeSlot);

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

      const res = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "task_request",
          message: content,
          history,
          tasks: currentTasks,
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
        case "schedule_task": {
          // 日付文字列をUTCタイムスタンプに変換
          const dateUtc = new Date(result.date + "T00:00:00Z").getTime();
          addTimeSlot(result.taskId, {
            date: dateUtc,
            startTime: result.startTime,
            endTime: result.endTime,
          });
          toast.show("タスクをスケジュールしました", "success");
          break;
        }
        case "create_and_schedule": {
          // タスクを作成
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newTaskId = addTask(result.task as any);
          // 時間スロットを追加
          const scheduleDateUtc = new Date(result.date + "T00:00:00Z").getTime();
          addTimeSlot(newTaskId, {
            date: scheduleDateUtc,
            startTime: result.startTime,
            endTime: result.endTime,
          });
          toast.show("タスクを作成しスケジュールしました", "success");
          break;
        }
      }

      setMessages((m) => [...m, { role: "model", content: result.message }]);

    } catch (e) {
      console.error(e);
      toast.show("エラーが発生しました", "error");
      setMessages((m) => [...m, { role: "model", content: "エラーが発生しました。ネットワーク接続を確認してください。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl w-full max-w-3xl mx-auto h-[70svh] flex flex-col bg-card shadow-sm overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-2">
            <p>AI アシスタント</p>
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
          placeholder={mounted ? "メッセージを入力..." : "読み込み中..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!mounted || loading}
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
          disabled={loading || !input.trim() || !mounted}
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
