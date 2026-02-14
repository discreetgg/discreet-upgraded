"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateMenuPromo } from "@/actions/menu-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PromoType = "percentage" | "fixed";

type MenuPromoDialogProps = {
  children: ReactNode;
  menuId: string;
  ownerDiscordId: string;
  basePrice: number;
  defaultPromo?: {
    isEnabled: boolean;
    type?: PromoType;
    value?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    message?: string;
  };
};

const toLocalDateTimeValue = (iso?: string | null) => {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";

  const offsetMinutes = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offsetMinutes * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const MenuPromoDialog = ({
  children,
  menuId,
  ownerDiscordId,
  basePrice,
  defaultPromo,
}: MenuPromoDialogProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [type, setType] = useState<PromoType>("percentage");
  const [value, setValue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setIsEnabled(defaultPromo?.isEnabled ?? false);
    setType(defaultPromo?.type ?? "percentage");
    setValue(defaultPromo?.value ?? "");
    setStartsAt(toLocalDateTimeValue(defaultPromo?.startsAt));
    setEndsAt(toLocalDateTimeValue(defaultPromo?.endsAt));
    setMessage(defaultPromo?.message ?? "");
  };

  const promoMutation = useMutation({
    mutationFn: async (payload: {
      isEnabled: boolean;
      type?: PromoType;
      value?: string;
      startsAt?: string;
      endsAt?: string;
      message?: string;
    }) => {
      return await updateMenuPromo(menuId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["menu_item", ownerDiscordId],
      });
      toast.success(
        isEnabled
          ? "Promo updated successfully."
          : "Promo disabled. Base pricing restored.",
      );
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update promo", {
        description: error?.message || "Please try again.",
      });
    },
  });

  const promoPreview = useMemo(() => {
    if (!isEnabled) return null;

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return null;

    const discount =
      type === "percentage" ? (basePrice * parsedValue) / 100 : parsedValue;
    const clampedDiscount = Math.max(0, Math.min(discount, basePrice));
    const effectivePrice = Math.max(0, basePrice - clampedDiscount);
    if (effectivePrice <= 0) return null;

    return {
      effectivePrice: Number(effectivePrice.toFixed(2)),
      discount: Number(clampedDiscount.toFixed(2)),
    };
  }, [basePrice, isEnabled, type, value]);

  const maxFixedDiscount = useMemo(
    () => Math.max(0, basePrice - 0.01),
    [basePrice],
  );

  const handleSave = () => {
    if (!isEnabled) {
      promoMutation.mutate({ isEnabled: false });
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      toast.error("Promo value must be greater than 0.");
      return;
    }
    if (type === "percentage" && parsedValue >= 100) {
      toast.error("Percentage promo must be below 100.");
      return;
    }
    if (type === "fixed" && parsedValue >= basePrice) {
      toast.error(`Fixed discount must be less than ${basePrice.toFixed(2)}.`);
      return;
    }
    if (!endsAt) {
      toast.error("End date is required for limited-time promos.");
      return;
    }

    const now = Date.now();
    const startsAtIso = startsAt ? new Date(startsAt).toISOString() : undefined;
    const endsAtIso = new Date(endsAt).toISOString();
    if (new Date(endsAtIso).getTime() <= now) {
      toast.error("Promo end date must be in the future.");
      return;
    }
    if (startsAtIso && new Date(endsAtIso) <= new Date(startsAtIso)) {
      toast.error("Promo end date must be later than start date.");
      return;
    }

    promoMutation.mutate({
      isEnabled: true,
      type,
      value: parsedValue.toString(),
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      message: message.trim(),
    });
  };

  const handleDisable = () => {
    promoMutation.mutate({ isEnabled: false });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetForm();
    }
    if (!promoMutation.isPending) {
      setOpen(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="overflow-hidden border-[#2A2D31] bg-[#111316] p-0 sm:max-w-[680px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="border-b border-[#2A2D31] px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-[#F8F8F8]">
            Limited-Time Promo
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#A1A1AA]">
            Update this listing with a temporary discount without reposting it.
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center justify-between rounded-xl border border-[#2A2D31] bg-[#0E1013] px-4 py-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-[#F8F8F8]">
                Enable promo
              </Label>
              <p className="text-sm text-[#8A8C95]">
                Toggle on to apply temporary pricing.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={promoMutation.isPending}
            />
          </div>

          {isEnabled && (
            <div className="space-y-4 rounded-xl border border-[#2A2D31] bg-[#0E1013] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#D4D4D8]">
                    Promo Type
                  </Label>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as PromoType)}
                    className="h-11 w-full rounded-md border border-[#2E2E32] bg-[#0F1114] px-3 text-base text-[#F8F8F8]"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#D4D4D8]">
                    Value{" "}
                    <span className="text-xs text-[#8A8C95]">
                      {type === "percentage"
                        ? "(1-99%)"
                        : `(max ${maxFixedDiscount.toFixed(2)})`}
                    </span>
                  </Label>
                  <Input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder={type === "percentage" ? "15" : "5"}
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#D4D4D8]">
                    Start (optional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#D4D4D8]">
                    End
                  </Label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#D4D4D8]">
                  Promo message (optional)
                </Label>
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={140}
                  placeholder="Weekend flash sale"
                  className="h-11 text-base"
                />
              </div>

              {promoPreview && (
                <div className="rounded-md border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-2 text-sm">
                  <p className="font-medium text-[#D9FBEA]">
                    Promo Preview: ${basePrice.toFixed(2)} → $
                    {promoPreview.effectivePrice.toFixed(2)}
                  </p>
                  <p className="text-[#8BE7BC]">
                    Buyer saves ${promoPreview.discount.toFixed(2)} per item.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#2A2D31] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={promoMutation.isPending}
            className="min-w-[130px]"
          >
            Cancel
          </Button>
          {defaultPromo?.isEnabled && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDisable}
              disabled={promoMutation.isPending}
              className="min-w-[150px]"
            >
              Disable promo
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={promoMutation.isPending}
            className="min-w-[180px] bg-[#34D399] text-black hover:bg-[#2EC08A]"
          >
            {promoMutation.isPending ? "Saving..." : "Apply promo to listing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
