import { useAppStore } from "@/lib/store";
import { useToast, useConfirm } from "@/components/Providers";

export const useSettings = () => {
    const fontSize = useAppStore((s) => s.fontSize);
    const setFontSize = useAppStore((s) => s.setFontSize);
    const clearAll = useAppStore((s) => s.clearTasksMilestonesLaunchers);
    const toast = useToast();
    const confirm = useConfirm();

    const handleClearAll = async () => {
        const ok = await confirm(
            "本当に全て削除しますか？この操作は取り消せません。",
            { tone: "danger", confirmText: "削除" }
        );
        if (!ok) return;
        clearAll();
        toast.show("すべて削除しました", "success");
    };

    return {
        fontSize,
        setFontSize,
        handleClearAll,
    };
};
