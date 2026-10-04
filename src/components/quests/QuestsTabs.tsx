"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { cx } from "@/lib/cx";

const TABS: { href: string; label: string; icon: SpriteName }[] = [
  { href: "/quests", label: "Quest Journal", icon: "quests" },
  { href: "/quests/board", label: "Quest Board", icon: "diaries" },
  { href: "/quests/new", label: "Create Quest", icon: "skill-creator" },
];

/** Sub-navigation shared by the Quest screens. */
export function QuestsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quests" className="q-stone q-frame mb-4 flex flex-wrap gap-1.5 p-1.5">
      {TABS.map((t) => {
        const active = t.href === "/quests" ? pathname === "/quests" || /^\/quests\/[0-9a-f-]{36}$/.test(pathname) : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-10 items-center gap-2 rounded-sm border px-3 text-sm sm:text-base",
              active ? "border-gold-500 bg-gold-700/25 text-gold-200" : "border-stone-700 text-text-primary hover:border-stone-500",
            )}
          >
            <PixelIcon name={t.icon} size={20} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
