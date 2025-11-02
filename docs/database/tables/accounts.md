# accounts

**テーブル名**: `accounts`

## 概要

OAuth認証プロバイダーのアカウント情報を管理します。NextAuth.jsで使用されます。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| user_id | UUID | ユーザーID（外部キー）（必須） |
| type | VARCHAR | タイプ（必須） |
| provider | VARCHAR | プロバイダー（必須） |
| provider_account_id | VARCHAR | プロバイダーアカウントID（必須） |
| refresh_token | TEXT | リフレッシュトークン |
| access_token | TEXT | アクセストークン |
| expires_at | INTEGER | 有効期限 |
| token_type | VARCHAR | トークンタイプ |
| scope | VARCHAR | スコープ |
| id_token | TEXT | IDトークン |
| session_state | VARCHAR | セッション状態 |

## 外部キー制約

- `user_id` → [`users(id)`](users.md)

---

> **自動生成日時**: 2025-11-02T07:41:07.506Z

[← スキーマ概要に戻る](../schema.md)
