/** Locale-stable number formatting (identical on server and client). */
const integer = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return integer.format(value);
}

/** Compact for tight spaces (e.g. 12.4K); exact below 10,000. */
export function formatCompact(value: number): string {
  return value < 10_000 ? integer.format(value) : compact.format(value);
}
