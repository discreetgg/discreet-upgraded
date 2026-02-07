import ProfileSideAdCards from "./shared/profile-side-cards";
import { Icon } from "./ui/icons";
import { AddMenuItem } from "./add-menu-item";
import { Button } from "./ui/button";
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
					<AddMenuItem>
						<Button
							disabled={isLoading}
							className="flex gap-0.5 text-[#8A8C95] font-medium p-0"
							size="ghost"
						>
							Add <Icon.add className="shrink-0 !size-6" />
						</Button>
					</AddMenuItem>
				)}
			</div>
			<ProfileSideAdCards menuItems={menuItems ?? []} isLoading={isLoading} />
		</div>
	);
};
