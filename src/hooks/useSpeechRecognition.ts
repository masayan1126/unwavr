"use client";
import { useEffect, useRef, useState } from "react";

type UseSpeechRecognitionOptions = {
  onResult?: (text: string) => void;
  lang?: string;
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onResult, lang = "ja-JP" } = options;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      if (t && onResult) onResult(t);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
      setListening(false);
    };
  }, [lang, onResult]);

  const start = () => {
    if (!supported || !recRef.current) return;
    try {
      setListening(true);
      recRef.current.start();
    } catch {
      setListening(false);
    }
  };
  const stop = () => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
    setListening(false);
  };
  const toggle = () => (listening ? stop() : start());

  return { listening, supported, start, stop, toggle };
}


