"use client";
import React from "react";
import { cn, formatCompactNumber, pushUrl } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const ServerTab = ({
  name,
  sub,
  active,
  className,
}: {
  name: string;
  sub?: string | number;
  active: boolean;
  className?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onClick = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", String(name));
    const url = `${pathname}?${params.toString()}`;
    pushUrl(url, router);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-row gap-2 items-center justify-center text-[15px] cursor-pointer rounded-[10px] w-fit p-2.5 bg-[#1F2227]/60 hover:bg-[#1F2227] text-[#E8E8E8]",
        active &&
          "text-[#0A0A0A] bg-[#F8F8F8] hover:bg-[#F8F8F8]/90 hover:text-[#0A0A0A]",
        className
      )}
    >
      <span className="text-[15px] font-medium max-w-[83px] truncate">
        {name}
      </span>
      {Number(sub) > 1 ? (
        <span className="text-[15px] font-medium opacity-70">
          {formatCompactNumber(Number(sub))}
        </span>
      ) : null}
    </button>
  );
};
