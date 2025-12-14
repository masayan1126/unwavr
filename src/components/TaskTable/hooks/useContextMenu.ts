import { useState, useCallback } from "react";
import { Task } from "@/lib/types";
import { ContextMenuState } from "../types";

interface UseContextMenuProps {
  enabled: boolean;
}

export function useContextMenu({ enabled }: UseContextMenuProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // コンテキストメニューを開く
  const openContextMenu = useCallback(
    (e: React.MouseEvent, task: Task) => {
      if (!enabled) return;
      e.preventDefault();
      setContextMenu({
        task,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    [enabled]
  );

  // コンテキストメニューを閉じる
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}
