import { Skeleton } from "../ui/skeleton";

export default function UserHoverCardSkeleton() {
	return (
		<div className="w-full flex flex-col gap-3 justify-between h-full animate-pulse">
			<div className="flex w-full  justify-between">
				<div className="flex flex-col gap-y-2">
					<Skeleton className="size-[70px] rounded-full" />
					<div className="flex flex-col gap-y-1">
						<Skeleton className="w-[130px] h-4" />
						<Skeleton className="w-[100px] h-4" />
					</div>
				</div>
				<Skeleton className="w-[100px] h-8 rounded-full" />
			</div>
			<div className="flex flex-col gap-y-2">
				<Skeleton className="w-full h-4" />
				<Skeleton className="w-full h-4" />
			</div>
		</div>
	);
}
