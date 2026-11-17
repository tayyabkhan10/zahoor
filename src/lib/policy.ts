import { ALL_SIZES, PAYMENT_LABELS, PAYMENT_METHODS } from "./config";

/** Exchange policy. Applies to unused items with tags attached, within the days set on the product. */
export function returnLabel(days: number) {
  if (!days || days < 1) return "No return or exchange on this item";
  return `Easy ${days}-day exchange (unused, with tags)`;
}

/** "cod,card" -> ["cod","card"] (valid values only, fixed order). Falls back to COD. */
export function parseMethods(value: string | null | undefined): string[] {
  const set = new Set((value ?? "").split(","));
  const list = PAYMENT_METHODS.filter((m) => set.has(m));
  return list.length ? list : ["cod"];
}

/** "S,M,L" -> ["S","M","L"] (valid sizes only, fixed order). Empty = one-size product. */
export function parseSizes(value: string | null | undefined): string[] {
  const set = new Set((value ?? "").split(",").map((s) => s.trim()));
  return ALL_SIZES.filter((s) => set.has(s));
}

export function paymentLabel(method: string) {
  return PAYMENT_LABELS[method as keyof typeof PAYMENT_LABELS] ?? method;
}
