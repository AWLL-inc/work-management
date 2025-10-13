"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/components/ui/user-combobox";
import { ApproverCombobox } from "./approver-combobox";

interface UserRequestFormProps {
  availableApprovers: User[];
  onSubmit?: (data: UserRequestData) => void;
  isSubmitting?: boolean;
}

export interface UserRequestData {
  requestType: string;
  userName: string;
  userEmail: string;
  userRole: string;
  approverId: string;
  reason: string;
}

export function UserRequestForm({
  availableApprovers,
  onSubmit,
  isSubmitting = false,
}: UserRequestFormProps) {
  const [formData, setFormData] = React.useState<UserRequestData>({
    requestType: "",
    userName: "",
    userEmail: "",
    userRole: "",
    approverId: "",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleInputChange =
    (field: keyof UserRequestData) => (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="requestType">申請種別</Label>
          <Select
            value={formData.requestType}
            onValueChange={handleInputChange("requestType")}
          >
            <SelectTrigger>
              <SelectValue placeholder="申請種別を選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new-user">新規ユーザー追加</SelectItem>
              <SelectItem value="role-change">権限変更</SelectItem>
              <SelectItem value="account-disable">アカウント無効化</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="userName">ユーザー名</Label>
          <Input
            id="userName"
            type="text"
            value={formData.userName}
            onChange={(e) => handleInputChange("userName")(e.target.value)}
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <Label htmlFor="userEmail">メールアドレス</Label>
          <Input
            id="userEmail"
            type="email"
            value={formData.userEmail}
            onChange={(e) => handleInputChange("userEmail")(e.target.value)}
            placeholder="yamada@example.com"
          />
        </div>

        <div>
          <Label htmlFor="userRole">ユーザー権限</Label>
          <Select
            value={formData.userRole}
            onValueChange={handleInputChange("userRole")}
          >
            <SelectTrigger>
              <SelectValue placeholder="権限を選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">一般ユーザー</SelectItem>
              <SelectItem value="manager">マネージャー</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="approver">承認者</Label>
          <ApproverCombobox
            approvers={availableApprovers}
            value={formData.approverId}
            onValueChange={handleInputChange("approverId")}
          />
          <p className="text-sm text-muted-foreground mt-1">
            承認者を検索して選択してください。未入力の場合は最初の20件が表示され、
            入力すると検索結果が表示されます。スクロールで追加読み込みが可能です。
          </p>
        </div>

        <div>
          <Label htmlFor="reason">申請理由</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleInputChange("reason")(e.target.value)}
            placeholder="申請の理由を記載してください"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "申請中..." : "申請を送信"}
        </Button>
      </div>
    </form>
  );
}
