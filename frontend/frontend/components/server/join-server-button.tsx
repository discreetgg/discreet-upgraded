"use client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface Props {
  className?: string;
  link: string;
}

export default function JoinServerButton({ className, link }: Props) {
  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-full text-[#0A0A0B] bg-[#FF0065] hover:bg-[#FF0065]/80",

        className
      )}
      asChild
    >
      <a href={`${link}`} target="_blank" rel="noopener noreferrer">
        Join Server
      </a>
    </Button>
  );
}
