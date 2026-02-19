import ProfileSideAdCards from "./shared/profile-side-cards";
import { useMenuItems } from "@/hooks/queries/use-menu-items";
import { UserType } from "@/types/global";
import { useGlobal } from "@/context/global-context-provider";

export const ProfileSideMenuMenuContent = ({ user }: { user: UserType }) => {
	const { data: menuItems, isLoading } = useMenuItems(user.discordId);
	const { user: currentUser } = useGlobal();

	const isCurrentUser = currentUser?.discordId === user.discordId;
	return (
		<div className="space-y-[18px] relative h-full">
			<div className="flex w-full items-center justify-between">
				<span className="text-[#D4D4D8] font-medium">
					{isCurrentUser ? "My" : user.displayName} Menu
				</span>
				{isCurrentUser && (
					<span className="text-[11px] text-[#8A8C95]">
						Add items by publishing unlockable feed posts
					</span>
				)}
			</div>
			<ProfileSideAdCards menuItems={menuItems ?? []} isLoading={isLoading} />
		</div>
	);
};
