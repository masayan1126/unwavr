"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function useLauncherForm() {
  const add = useAppStore((s) => s.addLauncherShortcut);
  const categories = useAppStore((s) => s.launcherCategories);
  const addCategory = useAppStore((s) => s.addLauncherCategory);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [iconName, setIconName] = useState("Globe");
  const [color, setColor] = useState("#0ea5e9");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [linkType, setLinkType] = useState<"web" | "app">("web");
  const [showHelp, setShowHelp] = useState(false);
  const [nativePath, setNativePath] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    const cid = categoryId || undefined;
    if (!cid && newCategory.trim()) {
      const name = newCategory.trim();
      const col = color;
      addCategory({ name, color: col });
    }
    add({ label: label.trim(), url: url.trim(), iconName, color, categoryId: cid, kind: linkType, nativePath: nativePath || undefined });
    setLabel("");
    setUrl("");
    setIconName("Globe");
    setColor("#0ea5e9");
    setCategoryId("");
    setNewCategory("");
    setLinkType("web");
    setNativePath("");
  };

  const pickNativeApp = async () => {
    try {
      const res = await fetch("/api/launcher/pick");
      const data = await res.json();
      if (data?.path) setNativePath(data.path);
    } catch {}
  };

  return {
    // store-exposed
    categories,
    // local states
    label, setLabel, url, setUrl, iconName, setIconName, color, setColor,
    categoryId, setCategoryId, newCategory, setNewCategory, linkType, setLinkType,
    showHelp, setShowHelp, nativePath,
    // actions
    submit, pickNativeApp,
  };
}


