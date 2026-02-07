import { ServerFilterBar, ServerSidebar, ServerTopBar } from "@/components/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WalletContextProvider from "@/context/wallet-context-provider";

import type React from "react";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  //   const { isAuthenticated, loading } = useAuth();
  //   const router = useRouter();

  //   useEffect(() => {
  //     if (!(loading || isAuthenticated)) {
  //       toast.error('You are not logged in.');
  //       router.push('/');
  //     }
  //   }, [isAuthenticated, router, loading]);

  //   if (loading) {
  //     return <PageLoader />;
  //   }

  //   if (!isAuthenticated) {
  //     toast.error('You are not logged in.');
  //     router.push('/');
  //   }
  return (
    <SidebarProvider className="relative h-dvh overflow-hidden">
      <WalletContextProvider>
        <div className="max-w-[2560px] h-full lg:px-[57px] px-4 w-full mx-auto flex flex-col">
          {/* <ServerTopBar /> */}
          <Suspense fallback={<div className="h-16" />}>
          <ServerFilterBar />
        </Suspense>
          <main className="flex gap-4 flex-1 overflow-hidden">
            <Suspense>
              <ServerSidebar />
            </Suspense>
            <SidebarInset className="w-full h-full overflow-y-auto">
              {children}
            </SidebarInset>
          </main>
        </div>
      </WalletContextProvider>
    </SidebarProvider>
  );
}
