"use client";
import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = (data?.reply ?? "").toString();
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {}
    setLoading(false);
    // scroll bottom
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 0);
  };

  return (
    <div className="border rounded w-full max-w-3xl mx-auto h-[70svh] flex flex-col">
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs opacity-60">Claude に相談してみましょう。右下の入力欄に質問を入力してください。</div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`text-sm whitespace-pre-wrap ${m.role === "user" ? "text-foreground" : "opacity-80"}`}>
            <div className="text-[11px] opacity-60 mb-0.5">{m.role === "user" ? "You" : "Claude"}</div>
            {m.content}
          </div>
        ))}
        {loading && <div className="text-xs opacity-60">考え中...</div>}
      </div>
      <div className="border-t p-2 flex items-center gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="メッセージを入力..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button className="px-3 py-2 rounded border text-sm" onClick={send} disabled={loading || !input.trim()}>
          送信
        </button>
      </div>
    </div>
  );
}


