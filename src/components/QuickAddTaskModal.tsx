"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic, X, Target } from "lucide-react";
import { useToast } from "@/components/Providers";

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetail?: (taskId: string) => void;
}

export default function QuickAddTaskModal({ isOpen, onClose, onOpenDetail }: QuickAddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useAppStore((state) => state.addTask);
  const milestones = useAppStore((state) => state.milestones);
  const toast = useToast();

  const { listening, toggle: toggleSpeech } = useSpeechRecognition({
    onResult: (text) => setTitle((prev) => (prev ? prev + " " + text : text)),
    lang: "ja-JP",
  });

  // モーダルが開いたときにフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 背景スクロール抑止
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      const prevPos = document.body.style.position;
      const prevTop = document.body.style.top;
      const scrollY = window.scrollY;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = prev;
        document.body.style.position = prevPos;
        document.body.style.top = prevTop;
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    // 音声入力が有効な場合は停止
    if (listening) {
      toggleSpeech();
    }

    setTitle("");
    setMilestoneId("");
    setError(null);
    onClose();
  }, [isSubmitting, listening, toggleSpeech, onClose]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, isSubmitting, handleClose]);

  const handleSave = async () => {
    if (!title.trim()) return;
    if (isSubmitting) return;

    // 音声入力が有効な場合は停止
    if (listening) {
      toggleSpeech();
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 今日の日付をUTCタイムスタンプで取得
      const today = new Date();
      const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

      const newId = addTask({
        title: title.trim(),
        description: undefined,
        type: "backlog",
        plannedDates: [todayUtc],
        estimatedPomodoros: 0,
        order: 0,
        milestoneId: milestoneId || undefined,
      });

      toast.show(`タスク「${title.trim()}」を追加しました`, "success");

      // フォームをリセットして連続追加可能に
      setTitle("");
      setMilestoneId("");

      // フォーカスを保持
      if (inputRef.current) {
        inputRef.current.focus();
      }

      return newId;
    } catch (err) {
      console.error("Failed to add task:", err);
      setError("タスクの追加に失敗しました");
      toast.show("タスクの追加に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailEdit = async () => {
    const newId = await handleSave();
    if (newId && onOpenDetail) {
      onOpenDetail(newId);
    }
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleDetailEdit();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-200 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh] z-[9999] pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          aria-describedby="quick-add-description"
          className="bg-background border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-2xl mx-4 pointer-events-auto transform transition-all duration-200 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <div>
              <h2 id="quick-add-title" className="text-lg font-semibold">
                クイックタスク追加
              </h2>
              <p id="quick-add-description" className="text-sm opacity-70 mt-1">
                Enter: 保存 / Shift+Enter: 詳細編集 / ESC: 閉じる
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="タスク名を入力..."
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-base bg-transparent disabled:opacity-50"
                autoComplete="off"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "task-error" : undefined}
              />
              <button
                type="button"
                onClick={toggleSpeech}
                disabled={isSubmitting}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[52px] disabled:opacity-50 ${listening
                  ? "bg-[var(--danger)] text-white hover:opacity-80"
                  : "bg-transparent border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                title={listening ? "音声入力を停止" : "音声入力を開始"}
                aria-label={listening ? "音声入力を停止" : "音声入力を開始"}
              >
                <Mic size={20} />
              </button>
            </div>

            {/* マイルストーン選択 */}
            {milestones.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Target size={16} className="text-muted-foreground shrink-0" />
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-transparent text-sm disabled:opacity-50 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">マイルストーン: 未選択</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.currentUnits}/{m.targetUnits})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {listening && (
              <div className="mt-3 text-sm text-[var(--danger)] flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[var(--danger)] rounded-full animate-pulse" />
                音声入力中...
              </div>
            )}

            {error && (
              <div id="task-error" className="mt-3 text-sm text-[var(--danger)]" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex justify-between">
            <button
              onClick={handleDetailEdit}
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              詳細を編集
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSubmitting}
                style={{ backgroundColor: "var(--primary)" }}
                className="px-6 py-2 text-sm text-white dark:text-background rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
