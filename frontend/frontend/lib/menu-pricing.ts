export type MenuPromoType = "percentage" | "fixed";

export type MenuPromo = {
  isEnabled: boolean;
  type: MenuPromoType;
  value: string;
  startsAt: string | null;
  endsAt: string | null;
  message?: string;
};

export type MenuPriceResolution = {
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  discountPerItem: number;
  promoActive: boolean;
  promoLabel: string;
  promoCountdownLabel: string;
};

const toCurrencyNumber = (value: number) => Number(Number(value).toFixed(2));

const formatPromoCountdownLabel = (endsAt: Date, now: Date): string => {
  const remainingMs = endsAt.getTime() - now.getTime();
  if (remainingMs <= 0) return "";

  const remainingMinutes = Math.max(1, Math.floor(remainingMs / 60_000));
  const days = Math.floor(remainingMinutes / (60 * 24));
  const hours = Math.floor((remainingMinutes % (60 * 24)) / 60);
  const minutes = remainingMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const resolveMenuPrice = (
  priceToView: string,
  promo?: MenuPromo | null,
  now: Date = new Date(),
): MenuPriceResolution => {
  const baseUnitPrice = Number(priceToView);
  if (!Number.isFinite(baseUnitPrice) || baseUnitPrice <= 0) {
    return {
      baseUnitPrice: 0,
      effectiveUnitPrice: 0,
      discountPerItem: 0,
      promoActive: false,
      promoLabel: "",
      promoCountdownLabel: "",
    };
  }

  if (!promo?.isEnabled) {
    return {
      baseUnitPrice,
      effectiveUnitPrice: baseUnitPrice,
      discountPerItem: 0,
      promoActive: false,
      promoLabel: "",
      promoCountdownLabel: "",
    };
  }

  const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
  const beforeStart = startsAt && now < startsAt;
  const afterEnd = endsAt && now > endsAt;
  if (beforeStart || afterEnd) {
    return {
      baseUnitPrice,
      effectiveUnitPrice: baseUnitPrice,
      discountPerItem: 0,
      promoActive: false,
      promoLabel: "",
      promoCountdownLabel: "",
    };
  }

  const promoValue = Number(promo.value);
  if (!Number.isFinite(promoValue) || promoValue <= 0) {
    return {
      baseUnitPrice,
      effectiveUnitPrice: baseUnitPrice,
      discountPerItem: 0,
      promoActive: false,
      promoLabel: "",
      promoCountdownLabel: "",
    };
  }

  const discountPerItem =
    promo.type === "percentage"
      ? (baseUnitPrice * promoValue) / 100
      : promoValue;
  const clampedDiscount = Math.max(0, Math.min(discountPerItem, baseUnitPrice));
  const effectiveUnitPrice = toCurrencyNumber(baseUnitPrice - clampedDiscount);
  if (effectiveUnitPrice <= 0) {
    return {
      baseUnitPrice,
      effectiveUnitPrice: baseUnitPrice,
      discountPerItem: 0,
      promoActive: false,
      promoLabel: "",
      promoCountdownLabel: "",
    };
  }

  const promoLabel =
    promo.type === "percentage"
      ? `${promoValue}% off`
      : `$${toCurrencyNumber(promoValue)} off`;
  const promoCountdownLabel =
    endsAt && endsAt > now ? formatPromoCountdownLabel(endsAt, now) : "";

  return {
    baseUnitPrice,
    effectiveUnitPrice,
    discountPerItem: toCurrencyNumber(clampedDiscount),
    promoActive: true,
    promoLabel,
    promoCountdownLabel,
  };
};
