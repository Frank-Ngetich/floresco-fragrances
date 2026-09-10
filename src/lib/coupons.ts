/* Single source of truth for discount codes — shared by the cart display,
   checkout, and the order API (which recomputes the discount itself rather
   than trusting whatever amount the client sends). */
export const COUPONS: Record<string, number> = {
  FLORESCO10: 0.10,
};

export function calcDiscount(code: string | null | undefined, subtotal: number): number {
  if (!code) return 0;
  const rate = COUPONS[code.trim().toUpperCase()];
  if (!rate) return 0;
  return Math.round(subtotal * rate);
}
