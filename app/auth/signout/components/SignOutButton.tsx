"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth/signin",
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleSignOut} className="w-full">
        サインアウト
      </Button>
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="w-full"
      >
        キャンセル
      </Button>
    </div>
  );
}
