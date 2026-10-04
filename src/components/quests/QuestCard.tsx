import Link from "next/link";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { isActiveStatus, QUEST_STATUS_LABELS } from "@/game/quests";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { QuestSummary } from "@/server/queries/quests";
import { DifficultyBadge } from "./DifficultyBadge";
import { QuestDates } from "./QuestDates";

/** Quest Journal entry. The whole card opens the Active Quest. */
export function QuestCard({ quest }: { quest: QuestSummary }) {
  const active = isActiveStatus(quest.status);
  return (
    <Link
      href={`/quests/${quest.id}`}
      className={cx(
        "q-tile group flex gap-3 p-3 transition-colors hover:border-gold-600",
        quest.status === "ON_HOLD" && "opacity-80",
      )}
    >
      <SkillIcon icon={quest.icon} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="q-title text-lg leading-tight text-text-primary group-hover:text-gold-200">{quest.title}</p>
          {quest.status !== "ACCEPTED" && quest.status !== "IN_PROGRESS" && (
            <Badge tone={quest.status === "COMPLETED" ? "moss" : "stone"}>{QUEST_STATUS_LABELS[quest.status]}</Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={quest.difficulty} />
          <span className="text-sm" style={{ color: skillColor(quest.skillKey) }}>
            {quest.skillName}
          </span>
          <span className="text-sm text-text-muted">
            +{formatNumber(quest.rewards.xp)} XP · +{quest.rewards.gp} GP · +{quest.rewards.qp} QP
          </span>
        </div>
        {active && quest.progress.total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar
              size="sm"
              className="flex-1"
              color={skillColor(quest.skillKey)}
              value={quest.progress.percent}
              label={`${quest.title} progress`}
              valueText={`${quest.progress.done} of ${quest.progress.total} objectives`}
            />
            <span className="text-xs tabular-nums text-text-secondary">
              {quest.progress.done}/{quest.progress.total}
            </span>
          </div>
        )}
        {active && quest.currentStep && (
          <p className="mt-1 truncate text-sm text-text-secondary">
            <span className="text-blue-300">Current Step:</span> {quest.currentStep}
          </p>
        )}
        <div className="mt-1">
          <QuestDates targetDate={quest.targetDate} deadline={quest.deadline} active={active} compact />
        </div>
      </div>
      <span aria-hidden className="self-center text-xl text-text-muted group-hover:text-gold-300">
        ›
      </span>
    </Link>
  );
}
