import { getUserProfile } from "@/actions/user-profile";
import UserProfileView from "./_components/user-profile-view";
import ErrorBoundaryWrapper from "@/components/shared/error-boundary-wrapper";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getCreatorMedia } from "@/actions/creator-post";
import { generateProfileMetadata } from '@/lib/seo/metadata';
import { generatePersonStructuredData, structuredDataToScript } from '@/lib/seo/structuredData';
import type { Metadata } from 'next';
import { cache } from "react";

interface ViewProfilePageProps {
	params: Promise<{ username: string }>;
}

const normalizeUsername = (username: string): string => {
	if (!username) return '';

	try {
		return decodeURIComponent(username).trim();
	} catch {
		return username.trim();
	}
};

const getCachedUserProfile = cache(async (username: string) => {
	return getUserProfile(username);
});

export async function generateMetadata({ params }: ViewProfilePageProps): Promise<Metadata> {
	const { username } = await params;
	const normalizedUsername = normalizeUsername(username);

	if (!normalizedUsername) {
		return {
			title: 'User Not Found',
			description: 'The requested user profile could not be found.',
			robots: {
				index: false,
				follow: false,
			},
		};
	}
	
	try {
		const data = await getCachedUserProfile(normalizedUsername);
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
			profileImage: data.profileImage ?? undefined,
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
	const normalizedUsername = normalizeUsername(username);
	const queryClient = getQueryClient();
	if (!normalizedUsername) {
		return <div>No username provided</div>;
	}
	const data = await getCachedUserProfile(normalizedUsername);
	if (!data) {
		return <div>User not found</div>;
	}
	
	// Generate structured data for the profile
	const personStructuredData = generatePersonStructuredData({
		displayName: data.displayName,
		username: data.username,
		profileImage: data.profileImage ?? undefined,
		bio: data.bio,
	});
	
	if (data.role === 'seller') {
		void queryClient
			.prefetchQuery({
				queryKey: ["creator-media", data.discordId],
				queryFn: () => getCreatorMedia(data.discordId),
			})
			.catch(() => undefined);
	}
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
