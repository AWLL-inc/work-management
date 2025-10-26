"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Best practice for Next.js 15 App Router
 *
 * @example
 * ```tsx
 * import { AuthGuard } from "@/components/auth/auth-guard";
 *
 * export default function ProtectedPage() {
 *   return (
 *     <AuthGuard>
 *       <div>Protected content</div>
 *     </AuthGuard>
 *   );
 * }
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <AuthGuard fallback={<ProfileSkeleton />}>
 *       <UserProfile />
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <>{fallback ?? <div>Loading...</div>}</>;
  }

  if (!session) return null;

  return <>{children}</>;
}
