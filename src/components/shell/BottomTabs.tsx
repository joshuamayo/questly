import { TabItem } from "./NavItem";
import { MOBILE_TABS } from "./nav-config";

/** Phone-only bottom navigation for the most-used destinations. */
export function BottomTabs() {
  return (
    <nav
      aria-label="Quick navigation"
      className="q-timber fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-border-dark pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_16px_rgb(0_0_0/0.45)] sm:hidden"
    >
      {MOBILE_TABS.map((item) => (
        <TabItem key={item.href} item={item} />
      ))}
    </nav>
  );
}
