
import type React from "react";
import { Nav } from "./_components/top-bar";



export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1280px] h-full lg:px-[57px] px-4 w-full mx-auto flex flex-col">
      <Nav />
      <main className="flex gap-4 mt-[60px] flex-1 overflow-hidden">
        <div className="max-w-[791px] w-full mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}