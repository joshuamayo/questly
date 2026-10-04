"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";
import { isActive, type NavDestination } from "./nav-config";

/** Rail navigation item. Active state uses a gold frame + aria-current, not color alone. */
export function NavItem({ item, onNavigate }: { item: NavDestination; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group relative flex min-h-11 items-center gap-3 rounded-sm border px-2.5 py-1.5",
        "transition-colors duration-[var(--duration-fast)]",
        active
          ? "border-gold-600 bg-[linear-gradient(90deg,rgb(217_164_65/0.22),rgb(217_164_65/0.04))] text-gold-100 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.4)]"
          : "border-transparent text-text-secondary hover:border-timber-600 hover:bg-timber-950/50 hover:text-text-primary",
      )}
    >
      {active && <span aria-hidden className="absolute -left-[3px] top-1/2 h-5 w-1 -translate-y-1/2 bg-gold-300" />}
      <span
        className={cx(
          "flex size-8 items-center justify-center rounded-xs border",
          active ? "border-gold-600 bg-void/60" : "border-border-dark bg-void/40 group-hover:border-timber-600",
        )}
      >
        <PixelIcon name={item.icon} size={22} />
      </span>
      <span className="flex-1 text-[0.95rem] font-bold leading-tight">{item.label}</span>
      {!item.available && (
        <PixelIcon name="lock" size={12} label="Not yet built" className="opacity-60" />
      )}
    </Link>
  );
}

/** Mobile bottom-bar tab. */
export function TabItem({ item }: { item: NavDestination }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 text-[0.7rem] font-bold uppercase tracking-wider",
        active ? "border-gold-400 text-gold-200" : "border-transparent text-text-muted hover:text-text-primary",
      )}
    >
      <PixelIcon name={item.icon} size={22} />
      {item.label}
    </Link>
  );
}
