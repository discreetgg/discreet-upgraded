import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { JSX } from "react";

const IconGallery = ({
  className,
  itemClassName,
  size = 24,
  filter,
}: {
  className?: string;
  itemClassName?: string;
  size?: number | string;
  filter?: (key: string) => boolean;
}) => {
  const entries = Object.entries(Icon).filter(
    ([key, Component]) =>
      typeof Component === "function" && (filter ? filter(key) : true)
  ) as Array<[string, (props: React.SVGProps<SVGSVGElement>) => JSX.Element]>;

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
        className
      )}
    >
      {entries.map(([key, Component]) => (
        <div
          key={key}
          className={cn(
            "flex items-center gap-3 p-3 border border-[#1E1E21] rounded-lg bg-[#0A0A0A] hover:bg-[#121212] transition-colors",
            itemClassName
          )}
        >
          <Component width={Number(size)} height={Number(size)} />
          <span className="text-sm text-[#E8E8E8] break-all">{key}</span>
        </div>
      ))}
    </div>
  );
};

const IconPage = () => {
  if (process.env.NODE_ENV !== "development") {
    return notFound();
  }
  return <IconGallery size={28} className="grid-cols-6" />;
};

export default IconPage;
