import type { Metadata } from "next";
import { RespawnFlow } from "@/components/respawn/RespawnFlow";
import { RESPAWN } from "@/game/config/balance";
import { loadCharacterSheet, loadCollection, loadNeedsAttention, loadOpenRespawn, loadQuests, loadRespawnSuggestion, loadToday } from "@/server/queries";

export const metadata: Metadata = { title: "Respawn" };

export default async function RespawnPage() {
  const [sheet, suggestion, open, attention, active, collection, today] = await Promise.all([
    loadCharacterSheet(),
    loadRespawnSuggestion(),
    loadOpenRespawn(),
    loadNeedsAttention(),
    loadQuests("active"),
    loadCollection(),
    loadToday(),
  ]);
  const obtained = collection.filter((i) => i.state === "UNLOCKED").length;
  return (
    <div className="pt-4 lg:pt-20">
      <RespawnFlow
        today={today}
        started={Boolean(open)}
        trigger={suggestion.trigger ?? "MANUAL"}
        recoveryDays={RESPAWN.recoveryDays}
        comebackXp={RESPAWN.comebackFocusXp}
        permanent={{ totalLevel: sheet.totalLevel, questPoints: sheet.questPoints, combatPoints: sheet.combatPoints, gp: sheet.gp.balance, collection: obtained }}
        attention={attention.map((q) => ({ id: q.id, title: q.title, icon: q.icon, reason: q.reason, targetDate: q.targetDate, deadline: q.deadline, progress: q.progress }))}
        active={active}
      />
    </div>
  );
}
