"use client";

import { useMemo } from "react";

type TimelineGridProps = {
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
  children?: React.ReactNode;
  onTimeSlotClick?: (hour: number, minute: number) => void;
};

export default function TimelineGrid({
  startHour = 6,
  endHour = 24,
  intervalMinutes = 30,
  children,
  onTimeSlotClick,
}: TimelineGridProps) {
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string }[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += intervalMinutes) {
        const label = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        slots.push({ hour: h, minute: m, label });
      }
    }
    return slots;
  }, [startHour, endHour, intervalMinutes]);

  const hourHeight = 60; // 1時間 = 60px
  const slotHeight = (hourHeight * intervalMinutes) / 60;
  const totalHeight = (endHour - startHour) * hourHeight;

  return (
    <div className="relative" style={{ height: totalHeight }}>
      {/* 時間ラベルとグリッド線 */}
      {timeSlots.map((slot, idx) => {
        const isHour = slot.minute === 0;
        const top = idx * slotHeight;

        return (
          <div
            key={slot.label}
            className={`absolute left-0 right-0 border-t ${
              isHour
                ? "border-border"
                : "border-border/30 border-dashed"
            }`}
            style={{ top }}
          >
            {isHour && (
              <span className="absolute -top-2.5 left-0 text-[10px] text-muted-foreground bg-background px-1 select-none">
                {slot.label}
              </span>
            )}
            {/* クリック可能エリア */}
            <div
              className="absolute left-8 right-0 cursor-pointer hover:bg-primary/5 transition-colors"
              style={{ height: slotHeight }}
              onClick={() => onTimeSlotClick?.(slot.hour, slot.minute)}
            />
          </div>
        );
      })}

      {/* タスクブロックを配置するコンテナ */}
      <div className="absolute left-8 right-0 top-0 bottom-0 pointer-events-none">
        <div className="relative h-full pointer-events-auto">
          {children}
        </div>
      </div>

      {/* 現在時刻インジケーター */}
      <CurrentTimeIndicator startHour={startHour} hourHeight={hourHeight} />
    </div>
  );
}

function CurrentTimeIndicator({
  startHour,
  hourHeight,
}: {
  startHour: number;
  hourHeight: number;
}) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour < startHour) return null;

  const top = (currentHour - startHour) * hourHeight + (currentMinute / 60) * hourHeight;

  return (
    <div
      className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <div className="flex-1 h-0.5 bg-red-500/60" />
    </div>
  );
}

export function getTimePosition(
  time: string,
  startHour: number = 6,
  hourHeight: number = 60
): number {
  const [h, m] = time.split(":").map(Number);
  return (h - startHour) * hourHeight + (m / 60) * hourHeight;
}

export function getTimeHeight(
  startTime: string,
  endTime: string,
  hourHeight: number = 60
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return ((endMinutes - startMinutes) / 60) * hourHeight;
}
