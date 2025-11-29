import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { chatWithGemini, generateTaskFromText } from "@/lib/gemini";
import { useToast } from "@/components/Providers";
import { Loader2, Plus } from "lucide-react";

type Msg = { role: "user" | "model"; content: string };

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const apiKey = useAppStore((s) => s.geminiApiKey);
  const addTask = useAppStore((s) => s.addTask);
  const toast = useToast();

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
      // Check if it's a task creation request
      if (content.toLowerCase().startsWith("task:") || content.includes("タスク作成") || content.includes("タスク追加")) {
        const taskData = await generateTaskFromText(apiKey, content);
        if (taskData) {
          const taskId = addTask(taskData);
          setMessages((m) => [...m, { role: "model", content: `タスク「${taskData.title}」を作成しました。` }]);
          toast.show("タスクを作成しました", "success");
        } else {
          setMessages((m) => [...m, { role: "model", content: "タスク情報の抽出に失敗しました。" }]);
        }
      } else {
        // Normal chat
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

        const reply = await chatWithGemini(apiKey, history, content);
        setMessages((m) => [...m, { role: "model", content: reply }]);
      }
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
            <p className="text-xs">「タスク追加: 牛乳を買う」のように入力するとタスクを作成できます</p>
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
          placeholder={apiKey ? "メッセージを入力..." : "設定画面でAPIキーを設定してください"}
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
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          onClick={send}
          disabled={loading || !input.trim() || !apiKey}
        >
          送信
        </button>
      </div>
    </div>
  );
}


