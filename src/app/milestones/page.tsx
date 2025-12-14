"use client";
import Link from "next/link";
import Milestones from "@/components/Milestones";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";

export default function MilestonesPage() {
  const hydrating = useAppStore((s) => s.hydrating);
  return (
    <PageLayout>
      <PageHeader
        title="マイルストーン管理"
        actions={
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        }
      />
      {hydrating ? <SectionLoader label="マイルストーンを読み込み中..." lines={4} /> : <Milestones />}
    </PageLayout>
  );
}


