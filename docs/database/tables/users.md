# users

**テーブル名**: `users`

## 概要

ユーザーアカウント情報を管理します。認証、プロフィール、権限などを保存します。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | UUID | 主キー（必須、デフォルト値あり、主キー） |
| name | VARCHAR | 名前 |
| email | VARCHAR | メールアドレス（必須、一意制約） |
| email_verified | TIMESTAMP | メール確認日時 |
| image | VARCHAR | 画像URL |
| password_hash | VARCHAR | パスワードハッシュ |
| role | VARCHAR | 役割・権限（必須、デフォルト値あり） |
| password_reset_required | BOOLEAN | password_reset_required（必須、デフォルト値あり） |
| password_reset_token | VARCHAR | password_reset_token |
| password_reset_token_expires | TIMESTAMP | password_reset_token_expires |
| last_password_change | TIMESTAMP | last_password_change |
| created_at | TIMESTAMP | 作成日時（必須、デフォルト値あり） |
| updated_at | TIMESTAMP | 更新日時（必須、デフォルト値あり） |

## 関連APIエンドポイント

- 認証エンドポイント - NextAuth.jsによる認証
- GET /api/dashboard/personal - 個人統計（ユーザー情報を使用）

詳細は[API Documentation](../../api/README.md)を参照してください。

## このテーブルを参照しているテーブル

- [accounts](accounts.md)
- [sessions](sessions.md)
- [teamMembers](teamMembers.md)
- [workLogs](workLogs.md)

---

> **自動生成日時**: 2025-11-10T11:18:07.704Z

[← スキーマ概要に戻る](../schema.md)
