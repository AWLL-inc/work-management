"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth/signin",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md border">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              サインアウト
            </h2>
            <p className="text-gray-600 mb-6">本当にサインアウトしますか？</p>
            <div className="space-y-4">
              <Button onClick={handleSignOut} className="w-full">
                サインアウト
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
