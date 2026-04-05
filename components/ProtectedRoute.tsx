"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
