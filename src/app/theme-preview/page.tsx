"use client";
import { useState } from "react";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/Card";
import { H2, Text } from "@/components/ui/Typography";
import { Plus, Trash2, Download, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";

type ThemeOption = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

const themes: Record<ThemeOption, {
    name: string;
    description: string;
    light: {
        primary: string;
        primaryHover: string;
        accent: string;
        accentHover: string;
        soft: string;
        softHover: string;
    };
    dark: {
        primary: string;
        primaryHover: string;
        primaryText: string;
        accent: string;
        accentHover: string;
        accentText: string;
        soft: string;
        softHover: string;
    };
}> = {
    A: {
        name: "Notion風ニュートラル",
        description: "Notionライクな落ち着いたグレー系",
        light: {
            primary: "#37352F",
            primaryHover: "#2D2B27",
            accent: "#2383E2",
            accentHover: "#1B6DBF",
            soft: "#F7F6F3",
            softHover: "#EBEAE6",
        },
        dark: {
            primary: "#EBEBEA",
            primaryHover: "#D3D3D2",
            primaryText: "#191919",
            accent: "#528BFF",
            accentHover: "#4070E0",
            accentText: "#FFFFFF",
            soft: "#2F2F2F",
            softHover: "#3D3D3D",
        },
    },
    B: {
        name: "ウォームアクセント",
        description: "温かみのあるオレンジ系アクセント",
        light: {
            primary: "#37352F",
            primaryHover: "#2D2B27",
            accent: "#D9730D",
            accentHover: "#BF6309",
            soft: "#FBF8F3",
            softHover: "#F5EFE5",
        },
        dark: {
            primary: "#EBEBEA",
            primaryHover: "#D3D3D2",
            primaryText: "#191919",
            accent: "#FFA344",
            accentHover: "#E89030",
            accentText: "#1A1410",
            soft: "#2F2A26",
            softHover: "#3D3632",
        },
    },
    C: {
        name: "モダンミニマル",
        description: "シンプルなモノトーン",
        light: {
            primary: "#0F0F0F",
            primaryHover: "#262626",
            accent: "#0F0F0F",
            accentHover: "#262626",
            soft: "#F5F5F4",
            softHover: "#E7E5E4",
        },
        dark: {
            primary: "#FFFFFF",
            primaryHover: "#E5E5E5",
            primaryText: "#0F0F0F",
            accent: "#FFFFFF",
            accentHover: "#E5E5E5",
            accentText: "#0F0F0F",
            soft: "#262626",
            softHover: "#333333",
        },
    },
    D: {
        name: "Warm Earth",
        description: "温かみのあるアースカラー",
        light: {
            primary: "#8B5A2B",
            primaryHover: "#6B4423",
            accent: "#C2703A",
            accentHover: "#A85D2E",
            soft: "#F5F1EB",
            softHover: "#EBE5DB",
        },
        dark: {
            primary: "#D4A574",
            primaryHover: "#C49664",
            primaryText: "#1A1410",
            accent: "#E8956B",
            accentHover: "#D4815B",
            accentText: "#1A1410",
            soft: "#2D2A26",
            softHover: "#3D3A36",
        },
    },
    E: {
        name: "Ocean Blue",
        description: "爽やかな海の青",
        light: {
            primary: "#1E40AF",
            primaryHover: "#1E3A8A",
            accent: "#0EA5E9",
            accentHover: "#0284C7",
            soft: "#EFF6FF",
            softHover: "#DBEAFE",
        },
        dark: {
            primary: "#60A5FA",
            primaryHover: "#3B82F6",
            primaryText: "#0F172A",
            accent: "#38BDF8",
            accentHover: "#0EA5E9",
            accentText: "#0F172A",
            soft: "#1E293B",
            softHover: "#334155",
        },
    },
    F: {
        name: "Forest Green",
        description: "落ち着いた森の緑",
        light: {
            primary: "#166534",
            primaryHover: "#14532D",
            accent: "#059669",
            accentHover: "#047857",
            soft: "#F0FDF4",
            softHover: "#DCFCE7",
        },
        dark: {
            primary: "#4ADE80",
            primaryHover: "#22C55E",
            primaryText: "#052E16",
            accent: "#34D399",
            accentHover: "#10B981",
            accentText: "#052E16",
            soft: "#14532D",
            softHover: "#166534",
        },
    },
    G: {
        name: "Elegant Purple",
        description: "エレガントなパープル",
        light: {
            primary: "#6D28D9",
            primaryHover: "#5B21B6",
            accent: "#8B5CF6",
            accentHover: "#7C3AED",
            soft: "#F5F3FF",
            softHover: "#EDE9FE",
        },
        dark: {
            primary: "#A78BFA",
            primaryHover: "#8B5CF6",
            primaryText: "#1E1B4B",
            accent: "#C4B5FD",
            accentHover: "#A78BFA",
            accentText: "#1E1B4B",
            soft: "#2E1065",
            softHover: "#3B0764",
        },
    },
    H: {
        name: "Coral Pink",
        description: "優しいコーラルピンク",
        light: {
            primary: "#BE185D",
            primaryHover: "#9D174D",
            accent: "#EC4899",
            accentHover: "#DB2777",
            soft: "#FDF2F8",
            softHover: "#FCE7F3",
        },
        dark: {
            primary: "#F472B6",
            primaryHover: "#EC4899",
            primaryText: "#500724",
            accent: "#F9A8D4",
            accentHover: "#F472B6",
            accentText: "#500724",
            soft: "#831843",
            softHover: "#9D174D",
        },
    },
    I: {
        name: "Amber Gold",
        description: "高級感のある琥珀ゴールド",
        light: {
            primary: "#B45309",
            primaryHover: "#92400E",
            accent: "#D97706",
            accentHover: "#B45309",
            soft: "#FFFBEB",
            softHover: "#FEF3C7",
        },
        dark: {
            primary: "#FBBF24",
            primaryHover: "#F59E0B",
            primaryText: "#451A03",
            accent: "#FCD34D",
            accentHover: "#FBBF24",
            accentText: "#451A03",
            soft: "#78350F",
            softHover: "#92400E",
        },
    },
};

type ButtonVariant = "primary" | "accent" | "soft" | "secondary" | "outline" | "ghost" | "success" | "danger";

export default function ThemePreviewPage() {
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("D");
    const [isDark, setIsDark] = useState(false);

    const theme = themes[selectedTheme];
    const colors = isDark ? theme.dark : theme.light;

    const getButtonStyles = (variant: ButtonVariant): React.CSSProperties => {
        switch (variant) {
            case "primary":
                return {
                    backgroundColor: colors.primary,
                    color: isDark ? theme.dark.primaryText : "#FFFFFF",
                    border: "1px solid transparent",
                };
            case "accent":
                return {
                    backgroundColor: colors.accent,
                    color: isDark ? theme.dark.accentText : "#FFFFFF",
                    border: "1px solid transparent",
                };
            case "soft":
                return {
                    backgroundColor: colors.soft,
                    color: isDark ? "#D4D4D4" : "#37352F",
                    border: "1px solid transparent",
                };
            case "secondary":
                return {
                    backgroundColor: "transparent",
                    color: isDark ? "#D4D4D4" : "#37352F",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#E9E9E7"}`,
                };
            case "outline":
                return {
                    backgroundColor: "transparent",
                    color: isDark ? "#D4D4D4" : "#37352F",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                };
            case "ghost":
                return {
                    backgroundColor: "transparent",
                    color: isDark ? "#D4D4D4" : "#37352F",
                    border: "1px solid transparent",
                };
            case "success":
                return {
                    backgroundColor: isDark ? "#10B981" : "#059669",
                    color: "#FFFFFF",
                    border: "1px solid transparent",
                };
            case "danger":
                return {
                    backgroundColor: "#EB5757",
                    color: "#FFFFFF",
                    border: "1px solid transparent",
                };
            default:
                return {};
        }
    };

    const PreviewButton = ({
        variant,
        children,
        icon,
    }: {
        variant: ButtonVariant;
        children: React.ReactNode;
        icon?: React.ReactNode;
    }) => (
        <button
            style={getButtonStyles(variant)}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[3px] transition-opacity hover:opacity-80"
        >
            {icon}
            {children}
        </button>
    );

    return (
        <div
            style={{
                backgroundColor: isDark ? "#191919" : "#FFFFFF",
                color: isDark ? "#D4D4D4" : "#37352F",
                minHeight: "100vh",
            }}
        >
            <PageLayout maxWidth="lg">
                <PageHeader title="Theme Preview" />
                <Text className="opacity-70 -mt-2 mb-4">
                    ボタンカラーテーマのプレビュー（削除予定ページ）
                </Text>

                {/* Theme Selector */}
                <Card padding="md" className="mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Text className="font-medium">テーマ選択:</Text>
                        {(Object.keys(themes) as ThemeOption[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSelectedTheme(key)}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-all ${selectedTheme === key
                                        ? "border-blue-500 bg-blue-500/10 font-medium"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                    }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDark}
                                onChange={(e) => setIsDark(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">ダークモード</span>
                        </label>
                    </div>
                </Card>

                {/* Selected Theme Info */}
                <Card padding="md" className="mb-6">
                    <H2 className="mb-2">
                        Option {selectedTheme}: {theme.name}
                    </H2>
                    <Text className="opacity-70 mb-4">{theme.description}</Text>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: colors.primary }}
                            />
                            <span>Primary: {colors.primary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: colors.accent }}
                            />
                            <span>Accent: {colors.accent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: colors.soft }}
                            />
                            <span>Soft: {colors.soft}</span>
                        </div>
                    </div>
                </Card>

                {/* Button Variants Preview */}
                <Card padding="md" className="mb-6">
                    <H2 className="mb-4">Button Variants</H2>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <PreviewButton variant="primary" icon={<Plus size={14} />}>
                                Primary
                            </PreviewButton>
                            <PreviewButton variant="accent" icon={<Download size={14} />}>
                                Accent
                            </PreviewButton>
                            <PreviewButton variant="soft" icon={<RefreshCw size={14} />}>
                                Soft
                            </PreviewButton>
                            <PreviewButton variant="secondary" icon={<Filter size={14} />}>
                                Secondary
                            </PreviewButton>
                            <PreviewButton variant="outline">Outline</PreviewButton>
                            <PreviewButton variant="ghost">Ghost</PreviewButton>
                            <PreviewButton variant="success">Success</PreviewButton>
                            <PreviewButton variant="danger" icon={<Trash2 size={14} />}>
                                Danger
                            </PreviewButton>
                        </div>
                    </div>
                </Card>

                {/* Usage Examples */}
                <Card padding="md" className="mb-6">
                    <H2 className="mb-4">Usage Examples</H2>

                    {/* Example 1: Page Header */}
                    <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: isDark ? "#202020" : "#F7F7F5" }}>
                        <Text className="text-xs opacity-50 mb-2">ページヘッダー例</Text>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">タスク一覧</h3>
                            <div className="flex items-center gap-2">
                                <PreviewButton variant="secondary" icon={<Filter size={14} />}>
                                    フィルター
                                </PreviewButton>
                                <PreviewButton variant="primary" icon={<Plus size={14} />}>
                                    タスク追加
                                </PreviewButton>
                            </div>
                        </div>
                    </div>

                    {/* Example 2: Filter Bar */}
                    <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: isDark ? "#202020" : "#F7F7F5" }}>
                        <Text className="text-xs opacity-50 mb-2">フィルターバー例</Text>
                        <div className="flex items-center gap-2 flex-wrap">
                            <PreviewButton variant="primary">未完了</PreviewButton>
                            <PreviewButton variant="outline">実行済み</PreviewButton>
                            <PreviewButton variant="secondary">
                                昇順
                            </PreviewButton>
                            <div className="ml-auto flex items-center gap-2">
                                <PreviewButton variant="secondary" icon={<ChevronLeft size={14} />}>
                                    前へ
                                </PreviewButton>
                                <PreviewButton variant="secondary" icon={<ChevronRight size={14} />}>
                                    次へ
                                </PreviewButton>
                            </div>
                        </div>
                    </div>

                    {/* Example 3: Dialog Actions */}
                    <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: isDark ? "#202020" : "#F7F7F5" }}>
                        <Text className="text-xs opacity-50 mb-2">ダイアログアクション例</Text>
                        <div className="flex items-center justify-end gap-2">
                            <PreviewButton variant="ghost">キャンセル</PreviewButton>
                            <PreviewButton variant="danger" icon={<Trash2 size={14} />}>
                                削除
                            </PreviewButton>
                            <PreviewButton variant="primary">保存</PreviewButton>
                        </div>
                    </div>

                    {/* Example 4: Tab-like Selection */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDark ? "#202020" : "#F7F7F5" }}>
                        <Text className="text-xs opacity-50 mb-2">タブ切替例</Text>
                        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                            <PreviewButton variant="primary">1ヶ月</PreviewButton>
                            <PreviewButton variant="ghost">3ヶ月</PreviewButton>
                            <PreviewButton variant="ghost">半年</PreviewButton>
                            <PreviewButton variant="ghost">1年</PreviewButton>
                        </div>
                    </div>
                </Card>

                {/* Code Output */}
                <Card padding="md">
                    <H2 className="mb-4">Button.tsx 用コード</H2>
                    <Text className="text-xs opacity-70 mb-3">
                        このテーマを適用する場合、以下のコードを Button.tsx の variants に貼り付けてください
                    </Text>
                    <pre
                        className="p-4 rounded-lg text-xs overflow-x-auto"
                        style={{ backgroundColor: isDark ? "#0F0F0F" : "#F5F5F4" }}
                    >
                        {`// Option ${selectedTheme}: ${theme.name}
const variants = {
    primary: "!bg-[${colors.primary}] dark:!bg-[${theme.dark.primary}] !text-white dark:!text-[${theme.dark.primaryText}] hover:!bg-[${colors.primaryHover}] dark:hover:!bg-[${theme.dark.primaryHover}] !border-transparent !opacity-100 hover:!opacity-100",
    accent: "!bg-[${colors.accent}] dark:!bg-[${theme.dark.accent}] !text-white dark:!text-[${theme.dark.accentText}] hover:!bg-[${colors.accentHover}] dark:hover:!bg-[${theme.dark.accentHover}] !border-transparent !opacity-100 hover:!opacity-100",
    soft: "!bg-[${colors.soft}] dark:!bg-[${theme.dark.soft}] text-foreground hover:!bg-[${colors.softHover}] dark:hover:!bg-[${theme.dark.softHover}] !border-transparent !opacity-100 hover:!opacity-100",
    secondary: "!bg-transparent !border-border text-foreground hover:!bg-black/5 dark:hover:!bg-white/5 !opacity-100 hover:!opacity-100",
    success: "!bg-success !text-white hover:!opacity-90 !border-transparent",
    danger: "!bg-danger !text-white hover:!opacity-90 !border-transparent",
    outline: "!bg-transparent !border-black/15 dark:!border-white/15 hover:!bg-black/5 dark:hover:!bg-white/5 !opacity-100 hover:!opacity-100",
    ghost: "!bg-transparent !border-transparent hover:!bg-black/5 dark:hover:!bg-white/5 !opacity-100 hover:!opacity-100",
};`}
                    </pre>
                </Card>
            </PageLayout>
        </div>
    );
}
