"use client";
import { Suspense } from "react";
import { isAuthed } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Only these routes are accessible without authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function GuardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    
    // If not a public route and user is not authenticated, redirect to login
    if (!isPublicRoute && !isAuthed()) {
      router.replace("/login");
    }
  }, [router, pathname]);

  return <>{children}</>;
}

export default function Guard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuardContent>{children}</GuardContent>
    </Suspense>
  );
}
