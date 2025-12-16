"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListTodo, AlertTriangle, Home, Archive, Rocket, Target, Timer, Calendar, Music, Lock, MessageSquare, Settings, PanelLeftClose, PanelLeftOpen, Sun, BarChart2, GripVertical } from "lucide-react";
import AuthButtons from "@/components/AuthButtons";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import DailyBriefingDialog from "./DailyBriefingDialog";
import { IconButton } from "@/components/ui/IconButton";
import { UnwavrLogo } from "@/components/ui/UnwavrLogo";
import { Reorder, useDragControls } from "framer-motion";

type NavItemData = {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  requiresGoogle?: boolean;
  isLocked?: boolean;
  isButton?: boolean;
};

// Default nav items order
const DEFAULT_NAV_ITEMS: NavItemData[] = [
  { id: "home", href: "/", label: "ホーム", icon: <Home size={16} />, exact: true },
  { id: "launcher", href: "/launcher", label: "ランチャー", icon: <Rocket size={16} /> },
  { id: "tasks", href: "/tasks", label: "すべてのタスク", icon: <ListTodo size={16} />, exact: true },
  { id: "archived", href: "/tasks/archived", label: "アーカイブ", icon: <Archive size={16} /> },
  { id: "milestones", href: "/milestones", label: "マイルストーン", icon: <Target size={16} /> },
  { id: "analysis", href: "/analysis", label: "分析", icon: <BarChart2 size={16} />, isLocked: true },
  { id: "calendar", href: "/calendar", label: "カレンダー", icon: <Calendar size={16} /> },
  { id: "pomodoro", href: "/pomodoro", label: "ポモドーロ", icon: <Timer size={16} /> },
  { id: "bgm", href: "/bgm", label: "BGMプレイリスト", icon: <Music size={16} /> },
  { id: "assistant", href: "/assistant", label: "Unwavr AI", icon: <MessageSquare size={16} /> },
  { id: "briefing", href: "#briefing", label: "Daily Briefing", icon: <Sun size={16} />, isButton: true },
  { id: "settings", href: "/settings", label: "設定", icon: <Settings size={16} /> },
];

const STORAGE_KEY = "sidebar:navOrder";

// Get ordered nav items from localStorage
function getOrderedNavItems(): NavItemData[] {
  if (typeof window === "undefined") return DEFAULT_NAV_ITEMS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_NAV_ITEMS;
    const orderIds: string[] = JSON.parse(stored);
    // Map stored order to actual items, handling new items that may have been added
    const orderedItems: NavItemData[] = [];
    const itemMap = new Map(DEFAULT_NAV_ITEMS.map(item => [item.id, item]));
    for (const id of orderIds) {
      const item = itemMap.get(id);
      if (item) {
        orderedItems.push(item);
        itemMap.delete(id);
      }
    }
    // Add any new items that weren't in the stored order
    for (const item of itemMap.values()) {
      orderedItems.push(item);
    }
    return orderedItems;
  } catch {
    return DEFAULT_NAV_ITEMS;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState<number>(224);
  const [showBriefing, setShowBriefing] = useState(false);
  const [navItems, setNavItems] = useState<NavItemData[]>(DEFAULT_NAV_ITEMS);
  const [isReordering, setIsReordering] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startWRef = useRef<number>(width);

  // Load saved order from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = Number(localStorage.getItem("sidebar:w") ?? 224);
    const o = localStorage.getItem("sidebar:o");
    if (w) setWidth(Math.max(160, Math.min(360, w)));
    if (o != null) setOpen(o === "1");
    // Load nav items order
    setNavItems(getOrderedNavItems());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar:w", String(width));
    localStorage.setItem("sidebar:o", open ? "1" : "0");
  }, [width, open]);

  // Save nav items order to localStorage
  const saveNavOrder = useCallback((items: NavItemData[]) => {
    if (typeof window === "undefined") return;
    const orderIds = items.map(item => item.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
  }, []);

  const handleReorder = (newOrder: NavItemData[]) => {
    setNavItems(newOrder);
    saveNavOrder(newOrder);
  };

  if (pathname.startsWith("/unwavr")) return null;
  if (status === "unauthenticated") return null;

  const isGoogle = (session as unknown as { provider?: string } | null)?.provider === "google";

  // Drag handle component to prevent text selection
  const DragHandle = ({ controls }: { controls: ReturnType<typeof useDragControls> }) => (
    <div
      className="p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 rounded select-none touch-none"
      style={{ touchAction: "none", userSelect: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        controls.start(e);
      }}
    >
      <GripVertical size={14} />
    </div>
  );

  // Draggable nav item component
  const DraggableNavItem = ({ item }: { item: NavItemData }) => {
    const controls = useDragControls();
    const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href);

    const itemClassName = isReordering
      ? "flex items-center select-none"
      : "flex items-center";

    // Handle locked items (like Analysis)
    if (item.isLocked) {
      return (
        <Reorder.Item
          value={item}
          dragListener={false}
          dragControls={controls}
          className={itemClassName}
          style={isReordering ? { touchAction: "none" } : undefined}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm opacity-70 cursor-not-allowed select-none bg-transparent flex-1"
            title="準備中"
          >
            <div className="flex items-center gap-1">
              {item.icon}
              <Lock size={14} className="opacity-80" />
            </div>
            <span className="truncate">{item.label}</span>
          </div>
          {isReordering && <DragHandle controls={controls} />}
        </Reorder.Item>
      );
    }

    // Handle Google-required items (like Calendar)
    if (item.requiresGoogle && !isGoogle) {
      return (
        <Reorder.Item
          value={item}
          dragListener={false}
          dragControls={controls}
          className={itemClassName}
          style={isReordering ? { touchAction: "none" } : undefined}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm opacity-70 cursor-not-allowed select-none flex-1 ${active ? "bg-black/5 dark:bg-white/5 text-foreground/80" : "bg-transparent"}`}
            title="Googleログインが必要です"
          >
            <div className="flex items-center gap-1">
              {item.icon}
              <Lock size={14} className="opacity-80" />
            </div>
            <span className="truncate">{item.label}</span>
          </div>
          {isReordering && <DragHandle controls={controls} />}
        </Reorder.Item>
      );
    }

    // Handle button items (like Daily Briefing)
    if (item.isButton) {
      return (
        <Reorder.Item
          value={item}
          dragListener={false}
          dragControls={controls}
          className={itemClassName}
          style={isReordering ? { touchAction: "none" } : undefined}
        >
          <button
            onClick={() => setShowBriefing(true)}
            className="group flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-fast text-muted-foreground hover:bg-muted hover:text-foreground text-left flex-1"
          >
            <span className="group-hover:scale-110 transition-fast">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
          {isReordering && <DragHandle controls={controls} />}
        </Reorder.Item>
      );
    }

    // Regular nav link
    return (
      <Reorder.Item
        value={item}
        dragListener={false}
        dragControls={controls}
        className={itemClassName}
        style={isReordering ? { touchAction: "none" } : undefined}
      >
        <Link
          href={item.href}
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-fast flex-1 ${active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <span className={`transition-fast ${active ? "scale-110" : "group-hover:scale-110"}`}>
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </Link>
        {isReordering && <DragHandle controls={controls} />}
      </Reorder.Item>
    );
  };

  return (
    <aside className="hidden md:flex border-r border-border h-[100svh] sticky top-0 bg-sidebar text-muted-foreground" style={{ width: open ? width : 48 }}>
      <div className="flex flex-col p-3 gap-1 flex-1 overflow-y-auto">
        <div className={`flex items-center ${open ? "justify-between px-2" : "justify-center"} pt-2 mb-4`}>
          {open && (
            <div className="flex items-center gap-3 min-w-0 group cursor-pointer">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <UnwavrLogo size={24} className="shrink-0" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-bold tracking-tight text-foreground truncate" title="unwavr">unwavr</div>
                <div className="text-xxs text-muted-foreground truncate">Workspace</div>
              </div>
            </div>
          )}
          <IconButton
            icon={open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            variant="ghost"
            size="sm"
            label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
            onClick={() => setOpen((v) => !v)}
          />
        </div>

        {open && (
          <nav className="flex-1 flex flex-col gap-0.5" suppressHydrationWarning={true}>
            {/* Reorder toggle button */}
            <button
              onClick={() => setIsReordering(!isReordering)}
              className={`flex items-center gap-2 px-3 py-1.5 mb-2 text-xs rounded-[var(--radius-md)] transition-fast ${
                isReordering
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <GripVertical size={12} />
              <span>{isReordering ? "並び替え完了" : "メニューを並び替え"}</span>
            </button>

            {/* Reorderable nav items */}
            <Reorder.Group
              axis="y"
              values={navItems}
              onReorder={handleReorder}
              className="flex flex-col gap-0.5"
            >
              {navItems.map((item) => (
                <DraggableNavItem key={item.id} item={item} />
              ))}
            </Reorder.Group>
          </nav>
        )}

        {open && (
          <div className="mt-auto pt-3 border-t border-border flex flex-col gap-3">
            <AuthButtons />
            <div className="flex items-center justify-between text-xxs opacity-60">
              <div className="flex gap-3">
                <Link href="/terms" className="hover:opacity-100 hover:underline">利用規約</Link>
                <Link href="/privacy" className="hover:opacity-100 hover:underline">プライバシー</Link>
              </div>
              <span>v0.1.0</span>
            </div>
          </div>
        )}
      </div>
      {open && (
        <div
          className="w-1 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10"
          onMouseDown={(e) => {
            startXRef.current = e.clientX;
            startWRef.current = width;
            const onMove = (ev: MouseEvent) => {
              if (startXRef.current == null) return;
              const dx = ev.clientX - startXRef.current;
              setWidth(Math.max(160, Math.min(360, startWRef.current + dx)));
            };
            const onUp = () => {
              startXRef.current = null;
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          title="ドラッグで幅を変更"
        />
      )}
      <DailyBriefingDialog isOpen={showBriefing} onClose={() => setShowBriefing(false)} />
    </aside>
  );
}
