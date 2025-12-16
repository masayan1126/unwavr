"use client";

import { useState, useCallback, useRef } from "react";

type DroppableTimeSlotProps = {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  onDrop?: (hour: number, minute: number, data: unknown) => void | Promise<void>;
  children?: React.ReactNode;
};

export default function DroppableTimeSlot({
  startHour = 6,
  endHour = 24,
  hourHeight = 60,
  onDrop,
  children,
}: DroppableTimeSlotProps) {
  const [dropPreview, setDropPreview] = useState<{ top: number; visible: boolean }>({
    top: 0,
    visible: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const getTimeFromPosition = useCallback(
    (clientY: number): { hour: number; minute: number } => {
      if (!containerRef.current) return { hour: startHour, minute: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const totalMinutes = (relativeY / hourHeight) * 60 + startHour * 60;

      // 15分単位でスナップ
      const snappedMinutes = Math.round(totalMinutes / 15) * 15;
      const hour = Math.floor(snappedMinutes / 60);
      const minute = snappedMinutes % 60;

      return {
        hour: Math.max(startHour, Math.min(endHour - 1, hour)),
        minute: Math.max(0, Math.min(45, minute)),
      };
    },
    [startHour, endHour, hourHeight]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const { hour, minute } = getTimeFromPosition(e.clientY);
      const top = (hour - startHour) * hourHeight + (minute / 60) * hourHeight;

      setDropPreview({ top, visible: true });
    },
    [getTimeFromPosition, startHour, hourHeight]
  );

  const handleDragLeave = useCallback(() => {
    setDropPreview((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropPreview((prev) => ({ ...prev, visible: false }));

      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr);
        const { hour, minute } = getTimeFromPosition(e.clientY);
        onDrop?.(hour, minute, data);
      } catch {
        // JSON parse error
      }
    },
    [getTimeFromPosition, onDrop]
  );

  const totalHeight = (endHour - startHour) * hourHeight;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: totalHeight }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* ドロップ位置プレビュー */}
      {dropPreview.visible && (
        <div
          className="absolute left-8 right-0 h-12 border-2 border-dashed border-primary rounded-lg bg-primary/10 pointer-events-none z-20 transition-all"
          style={{ top: dropPreview.top }}
        >
          <div className="absolute -top-5 left-2 text-[10px] text-primary font-medium bg-background px-1 rounded">
            {formatTime(dropPreview.top, startHour, hourHeight)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(top: number, startHour: number, hourHeight: number): string {
  const totalMinutes = (top / hourHeight) * 60 + startHour * 60;
  const hour = Math.floor(totalMinutes / 60);
  const minute = Math.round(totalMinutes % 60);
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}
