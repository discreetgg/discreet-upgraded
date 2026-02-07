import { getUserProfile } from "@/actions/user-profile";
import UserProfileView from "./_components/user-profile-view";
import ErrorBoundaryWrapper from "@/components/shared/error-boundary-wrapper";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getCreatorMedia, getPostLikedByUser } from "@/actions/creator-post";
import { generateProfileMetadata } from '@/lib/seo/metadata';
import { generatePersonStructuredData, structuredDataToScript } from '@/lib/seo/structuredData';
import type { Metadata } from 'next';

interface ViewProfilePageProps {
	params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ViewProfilePageProps): Promise<Metadata> {
	const { username } = await params;
	
	try {
		const data = await getUserProfile(username);
		if (!data) {
			return {
				title: 'User Not Found',
				description: 'The requested user profile could not be found.',
				robots: {
					index: false,
					follow: false,
				},
			};
		}
		
		return generateProfileMetadata({
			displayName: data.displayName,
			username: data.username,
			profileImage: data.profileImage,
			bio: data.bio,
		});
	} catch (error) {
		return {
			title: 'Profile Error',
			description: 'An error occurred while loading the profile.',
			robots: {
				index: false,
				follow: false,
			},
		};
	}
}

export default async function ViewProfilePage({
	params,
}: ViewProfilePageProps) {
	const { username } = await params;
	const queryClient = getQueryClient();
	if (!username) {
		return <div>No username provided</div>;
	}
	const data = await getUserProfile(username);
	if (!data) {
		return <div>User not found</div>;
	}
	
	// Generate structured data for the profile
	const personStructuredData = generatePersonStructuredData({
		displayName: data.displayName,
		username: data.username,
		profileImage: data.profileImage,
		bio: data.bio,
	});
	
	void queryClient.prefetchQuery({
		queryKey: ["creator-media", data.discordId],
		queryFn: () => getCreatorMedia(data.discordId),
	});
	void queryClient.prefetchQuery({
		queryKey: ["liked-posts", data.discordId],
		queryFn: () => getPostLikedByUser({ limit: 10 }),
	});
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: structuredDataToScript(personStructuredData),
				}}
			/>
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ErrorBoundaryWrapper title="Error loading Profile">
					<UserProfileView data={data} />
				</ErrorBoundaryWrapper>
			</HydrationBoundary>
		</>
	);
}
