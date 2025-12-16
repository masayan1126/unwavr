"use client";
import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import { Button } from "@/components/ui/Button";
import { Download, Upload, Settings } from "lucide-react";

const THEME_STORAGE_KEY = "unwavr-theme-preferences";

type ThemePreferences = {
  palette: string;
  borderRadius: string;
  shadowIntensity: string;
  transitionSpeed: string;
};

type SettingsExport = {
  version: string;
  exportedAt: string;
  display: {
    fontSize: number;
  };
  theme: ThemePreferences | null;
  language: "ja" | "en";
};

export default function SettingsImportExport() {
  const fontSize = useAppStore((s) => s.fontSize);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  function getThemePreferences(): ThemePreferences | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as ThemePreferences;
      }
    } catch {
      // ignore
    }
    return null;
  }

  function setThemePreferences(prefs: ThemePreferences) {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
    // Trigger theme reload by dispatching a custom event or reloading
    window.dispatchEvent(new CustomEvent("unwavr-theme-change"));
  }

  function generateExportData(): SettingsExport {
    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      display: {
        fontSize,
      },
      theme: getThemePreferences(),
      language,
    };
  }

  async function exportJSON() {
    const data = generateExportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const fileName = `unwavr_settings_${dateStr}.json`;

    // Feature detection for File System Access API
    const anyWindow = window as unknown as {
      showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
    };

    try {
      if (anyWindow.showSaveFilePicker) {
        const fileHandle = await anyWindow.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        } as unknown);
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.show(`設定を保存しました: ${fileName}`, "success");
        return;
      }

      // Fallback to regular download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.show("設定をエクスポートしました", "success");
    } catch (e) {
      const err = e as Error;
      const message = err?.message ?? "保存に失敗しました";
      if (message.toLowerCase().includes("abort") || message.toLowerCase().includes("cancel")) {
        toast.show("保存をキャンセルしました", "info");
        return;
      }
      toast.show(message, "error");
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as SettingsExport;

      // Validate basic structure
      if (!data.version || !data.display) {
        throw new Error("無効な設定ファイルです");
      }

      // Import display settings
      if (data.display.fontSize && typeof data.display.fontSize === "number") {
        const fs = Math.max(80, Math.min(150, data.display.fontSize));
        setFontSize(fs);
      }

      // Import theme settings
      if (data.theme && typeof data.theme === "object") {
        const theme = data.theme;
        if (theme.palette && theme.borderRadius && theme.shadowIntensity && theme.transitionSpeed) {
          setThemePreferences(theme);
        }
      }

      // Import language
      if (data.language && (data.language === "ja" || data.language === "en")) {
        setLanguage(data.language);
      }

      setImportResult({ success: true, message: "設定をインポートしました" });
      toast.show("設定をインポートしました。テーマを反映するにはページを再読み込みしてください。", "success");
    } catch (e) {
      const err = e as Error;
      setImportResult({ success: false, message: err.message || "インポートに失敗しました" });
      toast.show(err.message || "インポートに失敗しました", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="opacity-70" />
          <div className="text-sm font-medium">設定のエクスポート</div>
        </div>
        <div className="text-xs opacity-70">
          表示設定（文字サイズ）、テーマ・デザイン、言語設定をJSON形式でエクスポートします。
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-xs">
          <div className="font-medium mb-2">エクスポートされる設定:</div>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>表示設定: 文字サイズ ({fontSize}%)</li>
            <li>テーマ・デザイン: カラーパレット、角の丸み、シャドウ、トランジション</li>
            <li>言語設定: {language === "ja" ? "日本語" : "English"}</li>
          </ul>
        </div>
        <div>
          <Button onClick={exportJSON}>
            <Download size={14} />
            エクスポート
          </Button>
        </div>
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Upload size={18} className="opacity-70" />
          <div className="text-sm font-medium">設定のインポート</div>
        </div>
        <div className="text-xs opacity-70">
          エクスポートしたJSONファイルを選択して設定を復元します。
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setSelectedFileName(f.name);
              setImportResult(null);
              handleImport(f);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            JSONファイルを選択
          </Button>
          {selectedFileName && (
            <span className="text-xs opacity-80 truncate" title={selectedFileName}>
              {selectedFileName}
            </span>
          )}
        </div>
        {importResult && (
          <div
            className={`text-sm p-2 rounded ${
              importResult.success
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {importResult.message}
          </div>
        )}
      </div>

      <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <div className="text-sm font-medium">設定ファイルの形式</div>
        <div className="text-xs opacity-70">
          エクスポートされるJSONファイルは以下の形式です:
        </div>
        <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto">
{`{
  "version": "1.0",
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "display": {
    "fontSize": 100
  },
  "theme": {
    "palette": "warmAccent",
    "borderRadius": "subtle",
    "shadowIntensity": "normal",
    "transitionSpeed": "fast"
  },
  "language": "ja"
}`}
        </pre>
      </div>
    </div>
  );
}
