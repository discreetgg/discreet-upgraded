"use client";

import { PageLoader } from "@/components/ui/page-loader";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { inDevEnvironment } from "@/lib/utils";
import { useRouter } from "@bprogress/next/app";

import { useEffect } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
	const { user } = useGlobal();
	const { loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading) {
			if (user?.role !== "seller" && !inDevEnvironment) {
				router.push("/not-authorized");
			}
		}
	}, [loading, user, router]);

	if (loading || (user?.role !== "seller" && !inDevEnvironment)) {
		return <PageLoader />;
	}

	return children;
};

export default Layout;
