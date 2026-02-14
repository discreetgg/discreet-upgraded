"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveMenuPrice } from "@/lib/menu-pricing";

type MenuCardPricingMetaProps = {
  priceToView: string;
  promo?: {
    isEnabled: boolean;
    type: "percentage" | "fixed";
    value: string;
    startsAt: string | null;
    endsAt: string | null;
    message?: string;
  };
  mediaCount: number;
  imageCount: number;
  videoCount: number;
};

const formatMoney = (amount: number | string) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
};

export const MenuCardPricingMeta = ({
  priceToView,
  promo,
  mediaCount,
  imageCount,
  videoCount,
}: MenuCardPricingMetaProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!promo?.isEnabled) return;

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [promo?.isEnabled]);

  const pricing = useMemo(
    () => resolveMenuPrice(priceToView, promo, now),
    [now, priceToView, promo],
  );

  return (
    <div className="flex flex-col gap-y-2 font-inter">
      <div className="flex flex-wrap items-center gap-2">
        {pricing.promoActive ? (
          <>
            <p className="text-xs text-accent-text line-through">
              {formatMoney(priceToView)}
            </p>
            <p className="text-base font-semibold text-[#34D399]">
              {formatMoney(pricing.effectiveUnitPrice)}
            </p>
            <span className="rounded bg-[#34D399]/10 px-2 py-0.5 text-[11px] font-medium text-[#34D399]">
              {pricing.promoLabel}
            </span>
          </>
        ) : (
          <p className="text-base font-semibold text-off-white">
            {formatMoney(priceToView)}
          </p>
        )}
      </div>

      {pricing.promoActive && pricing.promoCountdownLabel && (
        <p className="w-fit rounded bg-[#34D399]/10 px-2 py-0.5 text-[11px] font-medium text-[#34D399]">
          Ends in {pricing.promoCountdownLabel}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-2 text-xs text-accent-text">
        <span className="text-sm font-medium text-off-white">
          {mediaCount} {mediaCount === 1 ? "piece" : "pieces"}
        </span>
        {(imageCount > 0 || videoCount > 0) && (
          <span>
            {imageCount > 0 && `${imageCount} image${imageCount > 1 ? "s" : ""}`}
            {imageCount > 0 && videoCount > 0 && " • "}
            {videoCount > 0 && `${videoCount} video${videoCount > 1 ? "s" : ""}`}
          </span>
        )}
      </div>
    </div>
  );
};
