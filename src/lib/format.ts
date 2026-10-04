/** Locale-stable number formatting (identical on server and client). */
const integer = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return integer.format(value);
}
