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
        "group relative flex min-h-12 items-center gap-3 rounded-sm border px-2.5 py-1.5",
        "transition-colors duration-[var(--duration-fast)]",
        active
          ? "border-gold-500 bg-[linear-gradient(90deg,rgb(219_167_63/0.2),rgb(219_167_63/0.05))] text-gold-200 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.5),0_0_12px_rgb(219_167_63/0.12)]"
          : "border-transparent text-text-primary hover:border-stone-600 hover:bg-stone-850",
      )}
    >
      <span className="flex size-9 items-center justify-center">
        <PixelIcon name={item.icon} size={28} />
      </span>
      <span className="flex-1 text-[1.02rem] leading-tight">{item.label}</span>
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
