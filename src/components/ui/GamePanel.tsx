import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Surface = "stone" | "timber" | "parchment";

const SURFACE: Record<Surface, string> = {
  stone: "q-stone",
  timber: "q-timber",
  parchment: "q-parchment",
};

/**
 * The framed Questly panel. `stone` is the default game surface, `timber` for
 * bars, `parchment` for journals. Use `as="section"` with `labelledBy` for
 * landmark sections.
 */
export function GamePanel({
  surface = "stone",
  as: Tag = "div",
  gold = false,
  rivets = false,
  corners = true,
  className,
  children,
  labelledBy,
  ...rest
}: {
  surface?: Surface;
  as?: ElementType;
  gold?: boolean;
  rivets?: boolean;
  /** Gold corner brackets (default on). */
  corners?: boolean;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
  id?: string;
}) {
  return (
    <Tag
      className={cx(SURFACE[surface], gold ? "q-frame-gold" : "q-frame", rivets && "q-rivets", className)}
      aria-labelledby={labelledBy}
      {...rest}
    >
      {corners && (
        <>
          <span aria-hidden className="q-corner q-corner-tl" />
          <span aria-hidden className="q-corner q-corner-tr" />
          <span aria-hidden className="q-corner q-corner-bl" />
          <span aria-hidden className="q-corner q-corner-br" />
        </>
      )}
      {children}
    </Tag>
  );
}

/** Parchment convenience wrapper. Text inside uses parchment ink automatically. */
export function ParchmentPanel(props: Omit<Parameters<typeof GamePanel>[0], "surface">) {
  return <GamePanel {...props} surface="parchment" />;
}
