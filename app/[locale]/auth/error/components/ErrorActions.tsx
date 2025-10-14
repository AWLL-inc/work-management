"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ErrorActions() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          router.push("/auth/signin");
        }}
        className="w-full"
      >
        サインインページに戻る
      </Button>
    </div>
  );
}
