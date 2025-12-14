"use client";
import Link from "next/link";
import LauncherGrid from "@/components/LauncherGrid";
import LauncherForm from "@/components/LauncherForm";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import LauncherOnboarding from "@/components/LauncherOnboarding";
import SectionLoader from "@/components/SectionLoader";
import { useToast } from "@/components/Providers";
import * as Icons from "lucide-react";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";

export default function LauncherPage() {
  const onboarded = useAppStore((s) => s.launcherOnboarded);
  const hasShortcuts = useAppStore((s) => s.launcherShortcuts.length > 0);
  const exportLaunchers = useAppStore((s) => s.exportLaunchers);
  const importLaunchers = useAppStore((s) => s.importLaunchers);
  const hydrating = useAppStore((s) => s.hydrating);
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    const fileName = `launchers_${Date.now()}.json`;
    const data = {
      categories: useAppStore.getState().launcherCategories,
      shortcuts: useAppStore.getState().launcherShortcuts,
    };
    const json = JSON.stringify(data, null, 2);

    // Feature detection for File System Access API
    const anyWindow = window as unknown as {
      showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    };

    try {
      if (anyWindow.showSaveFilePicker) {
        const fileHandle = await anyWindow.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        } as unknown);
        const writable = await fileHandle.createWritable();
        await writable.write(new Blob([json], { type: 'application/json' }));
        await writable.close();
        toast.show(`JSONを保存しました: ${fileName}`, 'success');
        return;
      }
      if (anyWindow.showDirectoryPicker) {
        const dir = await anyWindow.showDirectoryPicker();
        const fileHandle = await dir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(new Blob([json], { type: 'application/json' }));
        await writable.close();
        toast.show(`JSONを保存しました: ${fileName}`, 'success');
        return;
      }
      // Fallback
      exportLaunchers();
      toast.show('JSONをエクスポートしました', 'success');
    } catch (e) {
      const err = e as Error;
      const message = err?.message ?? '保存に失敗しました';
      if (message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel')) {
        toast.show('保存をキャンセルしました', 'info');
        return;
      }
      toast.show(message, 'error');
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="ランチャー"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/" title="ホームへ戻る">
              <IconButton icon={<Icons.Home size={18} />} variant="ghost" label="ホーム" />
            </Link>
            <div className="relative">
              <IconButton
                icon={<Icons.MoreVertical size={18} />}
                variant="ghost"
                onClick={() => setMenuOpen(!menuOpen)}
                label="メニュー"
              />
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <Card padding="none" className="absolute right-0 top-full mt-2 w-48 shadow-lg z-50 py-1 flex flex-col">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left w-full"
                      onClick={() => { setShow(true); setMenuOpen(false); }}
                    >
                      <Icons.Plus size={16} /> 一括登録
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left w-full"
                      onClick={() => { setImporting(true); setMenuOpen(false); }}
                    >
                      <Icons.Upload size={16} /> インポート
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left w-full"
                      onClick={() => { handleExport(); setMenuOpen(false); }}
                    >
                      <Icons.Download size={16} /> エクスポート
                    </button>
                  </Card>
                </>
              )}
            </div>
          </div>
        }
      />
      {hydrating ? <SectionLoader label="ランチャーを読み込み中..." lines={6} /> : <LauncherGrid />}
      <LauncherForm />
      {show && <LauncherOnboarding onClose={() => setShow(false)} />}
      {importing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setImporting(false)}>
          <Card padding="md" className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium mb-3">ランチャーのインポート</div>
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                importLaunchers(text, true);
                setImporting(false);
              }}
            />
            <div className="mt-3 text-xs opacity-70">選択したJSONで上書きインポートします。</div>
          </Card>
        </div>
      )}
      {!onboarded && !hasShortcuts && !show && <LauncherOnboarding onClose={() => setShow(false)} />}
    </PageLayout>
  );
}


