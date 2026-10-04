import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { SkillsBoard } from "@/components/skills/SkillsBoard";
import { artUrl } from "@/server/art";
import { loadCharacterSheet, loadRecentXp } from "@/server/queries";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage({ searchParams }: PageProps<"/skills">) {
  const [sheet, recentXp, params] = await Promise.all([loadCharacterSheet(), loadRecentXp(5), searchParams]);
  const initialKey = typeof params.skill === "string" ? params.skill : undefined;
  const sceneUrls = Object.fromEntries(sheet.skills.map((s) => [s.key, artUrl(`skills/${s.key}-scene`)]));

  return (
    <>
      <PageBanner slot="skills" title="Skills" tagline="Level up through real progress. Every Quest trains a Skill." />
      <SkillsBoard
        key={initialKey ?? "default"}
        skills={sheet.skills}
        initialKey={initialKey}
        totalLevel={sheet.totalLevel}
        maxTotalLevel={sheet.maxTotalLevel}
        recentXp={recentXp}
        sceneUrls={sceneUrls}
      />
    </>
  );
}
