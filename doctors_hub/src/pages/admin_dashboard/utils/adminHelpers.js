/**
 * Helper to auto-calculate price based on original price and discount input
 */
export function calculateFinalPrice(origPriceStr, discountStr) {
  const orig = parseFloat(origPriceStr);
  if (isNaN(orig) || orig <= 0) return '';
  if (!discountStr || !discountStr.trim()) return orig.toString();

  const distTrim = discountStr.trim();
  const pctMatch = distTrim.match(/^(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const finalPrice = Math.round(orig * (1 - pct / 100));
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  const flatMatch = distTrim.match(/^(\d+(?:\.\d+)?)/);
  if (flatMatch) {
    const flat = parseFloat(flatMatch[1]);
    const finalPrice = Math.round(orig - flat);
    return (finalPrice >= 0 ? finalPrice : 0).toString();
  }

  return orig.toString();
}
