import { TabItem } from "./NavItem";
import { PRIMARY_NAV } from "./nav-config";

/** Phone navigation: the same four destinations as the rail. */
export function BottomTabs() {
  return (
    <nav
      aria-label="Primary"
      className="q-timber fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-border-dark pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_16px_rgb(0_0_0/0.45)] lg:hidden"
    >
      {PRIMARY_NAV.map((item) => (
        <TabItem key={item.href} item={item} />
      ))}
    </nav>
  );
}
