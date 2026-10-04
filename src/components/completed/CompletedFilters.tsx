"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const field =
  "rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

function monthLabel(m: string) {
  return new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Search + month filter. Updates the URL so results are shareable and server-rendered. */
export function CompletedFilters({ months, initialQuery, month }: { months: string[]; initialQuery: string; month: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function go(next: { q?: string; month?: string }) {
    const sp = new URLSearchParams();
    const nq = next.q ?? q;
    const nm = next.month ?? month;
    if (nq.trim()) sp.set("q", nq.trim());
    if (nm) sp.set("month", nm);
    router.push(`/completed${sp.size ? `?${sp}` : ""}`);
  }

  return (
    <form
      role="search"
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        go({});
      }}
    >
      <label className="sr-only" htmlFor="completed-search">
        Search completed quests
      </label>
      <input id="completed-search" type="search" className={`${field} min-w-0 flex-1`} placeholder="Search completed quests…" value={q} onChange={(e) => setQ(e.target.value)} />
      <label className="sr-only" htmlFor="completed-month">
        Month
      </label>
      <select id="completed-month" className={field} value={month} onChange={(e) => go({ month: e.target.value })}>
        <option value="">All Time</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-sm border border-blue-600 bg-stone-850 px-4 text-text-primary hover:border-blue-400">
        Search
      </button>
    </form>
  );
}
