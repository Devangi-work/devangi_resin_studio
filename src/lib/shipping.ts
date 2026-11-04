export interface CityShippingRate {
  id?: string;
  name: string;
  charge: number | string;
}

export function parseShippingFee(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === "") return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Matches a user's delivery city or state against admin configured regional rates.
 * If user hasn't specified city/state, falls back to the first configured city rate
 * (e.g. Mumbai) or the default shipping charge.
 */
export function resolveShippingCharge(options: {
  subtotal: number;
  cityName?: string | null;
  stateName?: string | null;
  cityRates?: CityShippingRate[] | null;
  defaultShippingCharge?: number | string | null;
  freeShippingThreshold?: number | string | null;
  isProductFreeShipping?: boolean;
}): {
  charge: number;
  isFree: boolean;
  matchedCityName: string | null;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
} {
  const freeThreshold = parseShippingFee(options.freeShippingThreshold, 0);
  const defaultCharge = parseShippingFee(options.defaultShippingCharge, 0);
  const rates = Array.isArray(options.cityRates) ? options.cityRates : [];

  // Check if eligible for free delivery:
  // ONLY if product explicitly marked free shipping OR freeThreshold > 0 AND subtotal >= freeThreshold
  if (options.isProductFreeShipping || (freeThreshold > 0 && options.subtotal > 0 && options.subtotal >= freeThreshold)) {
    return {
      charge: 0,
      isFree: true,
      matchedCityName: null,
      freeShippingThreshold: freeThreshold,
      defaultShippingCharge: defaultCharge,
    };
  }

  const cleanCity = (options.cityName || "").trim().toLowerCase();
  const cleanState = (options.stateName || "").trim().toLowerCase();

  // Try matching by entered city or state from customer shipping profile
  if (rates.length > 0 && (cleanCity || cleanState)) {
    const matched = rates.find((r) => {
      const rName = (r.name || "").trim().toLowerCase();
      if (!rName) return false;
      return (
        (cleanCity && (cleanCity.includes(rName) || rName.includes(cleanCity))) ||
        (cleanState && (cleanState.includes(rName) || rName.includes(cleanState)))
      );
    });

    if (matched) {
      const charge = parseShippingFee(matched.charge, defaultCharge);
      return {
        charge,
        isFree: charge === 0,
        matchedCityName: matched.name,
        freeShippingThreshold: freeThreshold,
        defaultShippingCharge: defaultCharge,
      };
    }
  }

  return {
    charge: defaultCharge,
    isFree: defaultCharge === 0,
    matchedCityName: null,
    freeShippingThreshold: freeThreshold,
    defaultShippingCharge: defaultCharge,
  };
}

