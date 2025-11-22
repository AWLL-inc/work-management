# sessions

**テーブル名**: `sessions`

## 概要

ユーザーのセッション情報を管理します。NextAuth.jsで使用されます。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| session_token | VARCHAR | セッショントークン（必須、主キー） |
| user_id | UUID | ユーザーID（外部キー）（必須） |
| expires | TIMESTAMP | 有効期限（必須） |

## 外部キー制約

- `user_id` → [`users(id)`](users.md)

---

[← スキーマ概要に戻る](../schema.md)
