import { ProfileHeaderSection } from "@/components/profile-header-section";
import { ProfileNavHeader } from "@/components/profile-nav-header";
import { ProfileSideMenuSection } from "@/components/profile-side-menu-section";
import { getServerUser } from "@/lib/server-auth";
import { redirect } from 'next/navigation';

const Page = async () => {
	// Fetch user on server
	const user = await getServerUser();

	// Redirect if not authenticated
	if (!user) {
		redirect('/auth?redirect=/profile');
	}

	return (
		<div className="py-6 flex flex-col w-full gap-y-4">
			<ProfileNavHeader />
			<div className="w-full flex gap-x-5">
				<ProfileHeaderSection user={user} />
				{user.role === "seller" ? <ProfileSideMenuSection /> : null}
			</div>
		</div>
	);
};

export default Page;
