// Festival Pricing and Discount Calculations
// Supports both Percentage (%) and Direct Fixed Amount (₹) discounts

export interface FestivePricingResult {
  regularPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountBadge: string;
  hasDiscount: boolean;
}

/**
 * Calculates selling price and discount for an individual product,
 * respecting its festive discount (either percentage or direct fixed amount).
 */
export function computeFestivePrice(
  regularPrice: number | string,
  options: {
    isFestivalSpecial?: boolean;
    festivalDiscountType?: "percentage" | "fixed" | string | null;
    festivalDiscountPercentage?: number | string | null;
    festivalDiscountAmount?: number | string | null;
    salePrice?: number | string | null;
  }
): FestivePricingResult {
  const reg = Number(regularPrice) || 0;
  const isFestive = Boolean(options.isFestivalSpecial);
  const type = options.festivalDiscountType || "percentage";
  const rawPct = options.festivalDiscountPercentage
    ? Number(String(options.festivalDiscountPercentage).replace(/%/g, "").trim())
    : 0;
  const rawAmt = options.festivalDiscountAmount
    ? Number(options.festivalDiscountAmount)
    : 0;
  const sale = options.salePrice ? Number(options.salePrice) : null;

  if (isFestive) {
    if (type === "fixed" && rawAmt > 0) {
      const discount = Math.min(reg, rawAmt);
      const finalPrice = Math.max(0, Number((reg - discount).toFixed(2)));
      return {
        regularPrice: reg,
        discountedPrice: finalPrice,
        discountAmount: discount,
        discountBadge: `₹${Math.round(rawAmt)} OFF`,
        hasDiscount: discount > 0,
      };
    } else if (rawPct > 0) {
      const discount = (reg * rawPct) / 100;
      const finalPrice = Math.max(0, Number((reg - discount).toFixed(2)));
      return {
        regularPrice: reg,
        discountedPrice: finalPrice,
        discountAmount: discount,
        discountBadge: `${Math.round(rawPct)}% OFF`,
        hasDiscount: discount > 0,
      };
    } else if (rawAmt > 0) {
      const discount = Math.min(reg, rawAmt);
      const finalPrice = Math.max(0, Number((reg - discount).toFixed(2)));
      return {
        regularPrice: reg,
        discountedPrice: finalPrice,
        discountAmount: discount,
        discountBadge: `₹${Math.round(rawAmt)} OFF`,
        hasDiscount: discount > 0,
      };
    }
  }

  // Standard product sale price fallback
  if (sale && sale < reg) {
    const discount = reg - sale;
    const pct = (((reg - sale) / reg) * 100).toFixed(0);
    return {
      regularPrice: reg,
      discountedPrice: sale,
      discountAmount: discount,
      discountBadge: `${pct}% OFF`,
      hasDiscount: true,
    };
  }

  return {
    regularPrice: reg,
    discountedPrice: reg,
    discountAmount: 0,
    discountBadge: "",
    hasDiscount: false,
  };
}

/**
 * Calculates store-level global festival discount from SiteSettings
 * (used when a product is marked festive or checkout falls back to store settings).
 */
export function computeGlobalFestiveDiscount(
  regularPrice: number | string,
  settings: {
    festivalDiscountActive?: boolean;
    festivalDiscountType?: "percentage" | "fixed" | string | null;
    festivalDiscountPercentage?: number | string | null;
    festivalDiscountAmount?: number | string | null;
    festivalExpiresAt?: string | Date | null;
  }
): {
  discountAmount: number;
  finalPrice: number;
  discountBadge: string;
} {
  const reg = Number(regularPrice) || 0;
  if (!settings?.festivalDiscountActive) {
    return { discountAmount: 0, finalPrice: reg, discountBadge: "" };
  }
  if (settings.festivalExpiresAt && new Date(settings.festivalExpiresAt) < new Date()) {
    return { discountAmount: 0, finalPrice: reg, discountBadge: "" };
  }

  const type = settings.festivalDiscountType || "percentage";
  const rawAmt = settings.festivalDiscountAmount ? Number(settings.festivalDiscountAmount) : 0;
  const rawPct = settings.festivalDiscountPercentage
    ? Number(String(settings.festivalDiscountPercentage).replace(/[^0-9.]/g, "").trim())
    : 0;

  if (type === "fixed" && rawAmt > 0) {
    const discount = Math.min(reg, rawAmt);
    return {
      discountAmount: discount,
      finalPrice: Math.max(0, Number((reg - discount).toFixed(2))),
      discountBadge: `₹${Math.round(rawAmt)} OFF`,
    };
  } else if (rawPct > 0) {
    const discount = (reg * rawPct) / 100;
    return {
      discountAmount: discount,
      finalPrice: Math.max(0, Number((reg - discount).toFixed(2))),
      discountBadge: `${Math.round(rawPct)}% OFF`,
    };
  }

  return { discountAmount: 0, finalPrice: reg, discountBadge: "" };
}

