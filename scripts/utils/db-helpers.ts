/**
 * Common helper functions for database documentation generation
 * Shared across multiple DB documentation scripts
 */

import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * Get Japanese data type name from Drizzle column
 *
 * @param column - The Drizzle column to get the data type from
 * @returns Japanese data type name
 */
export function getDataType(column: PgColumn): string {
  const dataType = column.dataType;

  switch (dataType) {
    case "string":
      if (column.columnType === "PgUUID") return "UUID";
      if (column.columnType === "PgText") return "TEXT";
      return "VARCHAR";
    case "number":
      return "INTEGER";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "TIMESTAMP";
    default:
      return dataType.toUpperCase();
  }
}

/**
 * Get column constraints description in Japanese
 *
 * @param column - The Drizzle column to extract constraints from
 * @returns Array of constraint descriptions
 */
export function getConstraints(column: PgColumn): string[] {
  const constraints: string[] = [];

  if (column.notNull) {
    constraints.push("必須");
  }
  if (column.hasDefault) {
    constraints.push("デフォルト値あり");
  }
  if (column.isUnique) {
    constraints.push("一意制約");
  }
  if (column.primary) {
    constraints.push("主キー");
  }

  return constraints;
}

/**
 * Get Japanese description for common column names
 *
 * @param columnName - The name of the column
 * @param column - The Drizzle column object
 * @returns Full description including base description and constraints
 */
export function getColumnDescription(
  columnName: string,
  column: PgColumn,
): string {
  const constraints = getConstraints(column);
  const constraintText =
    constraints.length > 0 ? `（${constraints.join("、")}）` : "";

  // Common column patterns
  const descriptions: Record<string, string> = {
    id: "主キー",
    createdAt: "作成日時",
    created_at: "作成日時",
    updatedAt: "更新日時",
    updated_at: "更新日時",
    name: "名前",
    email: "メールアドレス",
    emailVerified: "メール確認日時",
    email_verified: "メール確認日時",
    image: "画像URL",
    passwordHash: "パスワードハッシュ",
    password_hash: "パスワードハッシュ",
    role: "役割・権限",
    description: "説明",
    isActive: "有効状態",
    is_active: "有効状態",
    displayOrder: "表示順序",
    display_order: "表示順序",
    date: "日付",
    hours: "作業時間",
    details: "詳細",
    userId: "ユーザーID（外部キー）",
    user_id: "ユーザーID（外部キー）",
    projectId: "プロジェクトID（外部キー）",
    project_id: "プロジェクトID（外部キー）",
    categoryId: "カテゴリID（外部キー）",
    category_id: "カテゴリID（外部キー）",
    teamId: "チームID（外部キー）",
    team_id: "チームID（外部キー）",
    joinedAt: "参加日時",
    joined_at: "参加日時",
    type: "タイプ",
    provider: "プロバイダー",
    providerAccountId: "プロバイダーアカウントID",
    provider_account_id: "プロバイダーアカウントID",
    refreshToken: "リフレッシュトークン",
    refresh_token: "リフレッシュトークン",
    accessToken: "アクセストークン",
    access_token: "アクセストークン",
    expiresAt: "有効期限",
    expires_at: "有効期限",
    expires: "有効期限",
    tokenType: "トークンタイプ",
    token_type: "トークンタイプ",
    scope: "スコープ",
    idToken: "IDトークン",
    id_token: "IDトークン",
    sessionState: "セッション状態",
    session_state: "セッション状態",
    sessionToken: "セッショントークン",
    session_token: "セッショントークン",
    identifier: "識別子",
    token: "トークン",
  };

  const baseDescription = descriptions[columnName] || columnName;
  return `${baseDescription}${constraintText}`;
}
