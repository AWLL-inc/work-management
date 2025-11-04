"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  type UserRequestData,
  UserRequestForm,
} from "@/components/features/user-request/user-request-form";
import type { User } from "@/components/ui/user-combobox";

interface UserRequestClientProps {
  approvers: User[];
  currentUser: User;
}

export function UserRequestClient({
  approvers,
  currentUser,
}: UserRequestClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: UserRequestData) => {
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to submit user request
      // For now, just show success message
      console.log("User request data:", data);

      toast.success("ユーザー申請を送信しました");

      // Redirect to requests list page (TODO: create this page)
      // router.push("/admin/user-requests");

      // For now, just stay on the page
      toast.info("申請一覧ページは準備中です");
    } catch (error) {
      console.error("Error submitting user request:", error);
      toast.error("申請の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ユーザー申請</h1>
        <p className="text-muted-foreground mt-2">
          新規ユーザーの追加、権限変更、アカウント無効化の申請を行います。
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <UserRequestForm
          availableApprovers={approvers}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
