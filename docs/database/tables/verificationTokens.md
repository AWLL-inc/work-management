# verificationTokens

**テーブル名**: `verification_tokens`

## 概要

メール認証やパスワードリセット用のトークンを管理します。NextAuth.jsで使用されます。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| identifier | VARCHAR | 識別子（必須） |
| token | VARCHAR | トークン（必須、一意制約） |
| expires | TIMESTAMP | 有効期限（必須） |

---

生成日時: 2025-11-02T04:37:01.033Z

[← スキーマ概要に戻る](../schema.md)
