"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppProvider } from "@/app/context/AppContext";
import Navigation from "@/components/Navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isChatPage = pathname.startsWith("/chat/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Navigation />
        <main
          className={`flex-1 min-h-0 md:ml-16 ${
            isChatPage ? "mb-0" : "mb-20"
          } md:mb-0 overflow-hidden flex flex-col`}
        >
          {children}
        </main>
      </div>
    </AppProvider>
  );
}
