"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type UserRequestData,
  UserRequestForm,
} from "@/components/features/user-request/user-request-form";
import type { User } from "@/components/ui/user-combobox";

// サンプルデータ - 実際の実装では API から取得
const mockApprovers: User[] = [
  { id: "1", name: "管理者 太郎", email: "admin@example.com", role: "admin" },
  {
    id: "2",
    name: "マネージャー 花子",
    email: "manager1@example.com",
    role: "manager",
  },
  {
    id: "3",
    name: "リーダー 次郎",
    email: "leader@example.com",
    role: "manager",
  },
  {
    id: "4",
    name: "チームマネージャー 三郎",
    email: "team-manager@example.com",
    role: "manager",
  },
  {
    id: "5",
    name: "プロジェクトマネージャー 四郎",
    email: "project-manager@example.com",
    role: "manager",
  },
  { id: "6", name: "部長 五郎", email: "director@example.com", role: "admin" },
  {
    id: "7",
    name: "課長 六郎",
    email: "section-chief@example.com",
    role: "manager",
  },
  {
    id: "8",
    name: "主任 七子",
    email: "supervisor@example.com",
    role: "manager",
  },
  {
    id: "9",
    name: "シニアマネージャー 八郎",
    email: "senior-manager@example.com",
    role: "manager",
  },
  {
    id: "10",
    name: "エリアマネージャー 九子",
    email: "area-manager@example.com",
    role: "manager",
  },
  // 20件以上のデータでページネーション動作を確認
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `${i + 11}`,
    name: `承認者 ${i + 11}`,
    email: `approver${i + 11}@example.com`,
    role: "manager" as const,
  })),
];

export default function UserRequestPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: UserRequestData) => {
    setIsSubmitting(true);

    try {
      // 実際の実装では API を呼び出し
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("ユーザー申請を送信しました");
      console.log("Submitted data:", data);
    } catch (error) {
      toast.error("申請の送信に失敗しました");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">ユーザー追加申請</h1>
          <p className="text-muted-foreground">
            新しいユーザーの追加や権限変更の申請を行います
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <UserRequestForm
            availableApprovers={mockApprovers}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">
            インクリメンタルサーチの動作確認
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 未入力状態：承認者一覧の最初の20件が表示されます</li>
            <li>
              • 検索入力：入力内容でフィルタリングされた結果が表示されます
            </li>
            <li>
              • スクロール：下にスクロールすると追加の20件が読み込まれます
            </li>
            <li>• 合計{mockApprovers.length}件の承認者データが利用可能です</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
