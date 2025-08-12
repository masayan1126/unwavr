"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

type StepKey = "launcher" | "tasksNew" | "milestones" | "pomodoro" | "importExport";

const sequence: StepKey[] = ["launcher", "tasksNew", "milestones", "pomodoro", "importExport"];

export default function OnboardingGuide() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    // すでに完了済みなら何もしない
    if (typeof window === "undefined") return;
    const done = localStorage.getItem("onboardingGuideDone");
    if (done === "true") return;

    let current = 0;
    const highlight = () => {
      const key = sequence[current];
      const el = document.querySelector(`[data-guide-key="${key}"]`);
      if (!el) return;
      el.classList.add("guide-highlight");
      el.addEventListener("click", nextStep, { once: true });
    };
    const clear = () => {
      document.querySelectorAll(".guide-highlight").forEach((n) => n.classList.remove("guide-highlight"));
    };
    const nextStep = () => {
      clear();
      current += 1;
      if (current >= sequence.length) {
        localStorage.setItem("onboardingGuideDone", "true");
        return;
      }
      // 少し遅延して次のハイライト
      setTimeout(highlight, 200);
    };

    highlight();
    return () => clear();
  }, [status]);

  return null;
}


