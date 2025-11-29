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
  const [args, setArgs] = useState("");

  const [customIconUrl, setCustomIconUrl] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    const cid = categoryId || undefined;
    if (!cid && newCategory.trim()) {
      const name = newCategory.trim();
      const col = color;
      addCategory({ name, color: col });
    }
    add({ label: label.trim(), url: url.trim(), iconName, color, categoryId: cid, kind: linkType, nativePath: nativePath || undefined, args: args.trim() || undefined, customIconUrl: customIconUrl || undefined });
    setLabel("");
    setUrl("");
    setIconName("Globe");
    setColor("#0ea5e9");
    setCategoryId("");
    setNewCategory("");
    setLinkType("web");
    setNativePath("");
    setArgs("");
    setCustomIconUrl("");
  };

  const pickNativeApp = async () => {
    try {
      const res = await fetch("/api/launcher/pick");
      const data = await res.json();
      if (data?.path) {
        setUrl(data.path);
        // Extract app name from path (e.g. /Applications/Slack.app -> Slack)
        const name = data.path.split("/").pop()?.replace(".app", "") ?? "";
        if (name && !label) {
          setLabel(name);
        }
      }
    } catch { }
  };

  return {
    // store-exposed
    categories,
    // local states
    label, setLabel, url, setUrl, iconName, setIconName, color, setColor,
    categoryId, setCategoryId, newCategory, setNewCategory, linkType, setLinkType,
    showHelp, setShowHelp, nativePath, args, setArgs, customIconUrl, setCustomIconUrl,
    // actions
    submit, pickNativeApp,
  };
}


