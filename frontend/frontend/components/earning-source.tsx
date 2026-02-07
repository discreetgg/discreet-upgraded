import { cn } from "@/lib/utils";
import { Icon as Icons } from "./ui/icons";
import { Skeleton } from "./ui/skeleton";

export const Source = ({
	amount,
	title,
	metric,
	currency,
	className,
	icon: Icon = Icons.increase,
	isLoading,
}: {
	amount: string;
	title: string;
	metric: string;
	currency?: string;
	isLoading?: boolean;
	className?: string;
	icon?: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}) => {
	return (
		<div className={cn("space-y-1", className)}>
			<h3 className="text-lg text-[#8A8C95]">{title}</h3>
			{isLoading ? (
				<Skeleton className="h-8 w-full animate-pulse " />
			) : (
				<div className="flex gap-1 items-end">
					<span className="text-3xl text-[#F8F8F8] font-semibold">
						{amount}
					</span>
					<span className="text-[15px] text-[#8A8C95] font-light pb-0.5">
						{currency}
					</span>
				</div>
			)}
			<div className="flexx hidden py-1 pr-2 w-max pl-1 items-center gap-1 rounded bg-[#1E1E21]">
				<Icon />
				<p className="text-xs text-[#8A8C95] ">{metric}</p>
			</div>
		</div>
	);
};
