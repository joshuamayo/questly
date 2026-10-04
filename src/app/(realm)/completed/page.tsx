import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { CompletedFilters } from "@/components/completed/CompletedFilters";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { loadCompleted } from "@/server/loaders";

export const metadata: Metadata = { title: "Completed" };

export default async function CompletedPage({ searchParams }: PageProps<"/completed">) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const page = Math.max(1, Number.parseInt(str(sp.page), 10) || 1);
  const q = str(sp.q);
  const month = str(sp.month) || null;
  const data = await loadCompleted(page, q, month);
  const filtered = Boolean(q || month);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (month) u.set("month", month);
    if (p > 1) u.set("page", String(p));
    return `/completed${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageBanner slot="completed" title="Completed Log" tagline="Look at everything you've actually gotten done.">
        <p className="q-stone q-frame-gold mt-4 inline-flex flex-col items-center px-5 py-2">
          <span className="q-title text-display-md leading-none tabular-nums text-gold-200">{formatNumber(data.total)}</span>
          <span className="text-sm text-text-secondary">Quests Completed</span>
        </p>
      </PageBanner>

      {data.total === 0 ? (
        <GamePanel surface="parchment" className="p-6">
          <EmptyState
            tone="parchment"
            icon={<PixelIcon name="diaries" size={56} />}
            title="No quests completed yet."
            message="Your first victory is waiting."
            action={
              <GameLinkButton href="/" variant="success">
                Go to your Quest Log
              </GameLinkButton>
            }
          />
        </GamePanel>
      ) : (
        <GamePanel as="section" aria-label="Completed quests" className="flex flex-col gap-3 p-3 sm:p-4">
          <CompletedFilters months={data.months} initialQuery={q} month={month ?? ""} />
          {data.items.length === 0 ? (
            <p className="py-6 text-center text-text-secondary">No completed quests match{q ? ` “${q}”` : ""}.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-stone-800">
              {data.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <PixelIcon name="check" size={22} label="Completed" />
                  <span className="min-w-0 flex-1 truncate text-text-primary">{item.title}</span>
                  <span className="hidden text-sm text-text-muted sm:inline">
                    <LocalDate iso={item.completedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
                  </span>
                  <span className="w-20 text-right font-bold tabular-nums text-gold-200">+{formatNumber(item.gpReward)} GP</span>
                </li>
              ))}
            </ol>
          )}
          {filtered && <p className="text-sm text-text-muted">{formatNumber(data.matching)} matching</p>}
          {data.pages > 1 && (
            <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-1.5">
              {data.page > 1 && (
                <Link className="rounded-sm border border-stone-700 px-3 py-1.5 hover:border-stone-500" href={href(data.page - 1)} aria-label="Previous page">
                  ‹
                </Link>
              )}
              {Array.from({ length: data.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pages || Math.abs(p - data.page) <= 2)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-text-muted">…</span>}
                    <Link
                      href={href(p)}
                      aria-current={p === data.page ? "page" : undefined}
                      className={cx("min-w-9 rounded-sm border px-3 py-1.5 text-center", p === data.page ? "border-gold-500 text-gold-200" : "border-stone-700 hover:border-stone-500")}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {data.page < data.pages && (
                <Link className="rounded-sm border border-stone-700 px-3 py-1.5 hover:border-stone-500" href={href(data.page + 1)} aria-label="Next page">
                  ›
                </Link>
              )}
            </nav>
          )}
        </GamePanel>
      )}
    </>
  );
}
