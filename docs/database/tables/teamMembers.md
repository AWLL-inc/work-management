# teamMembers

**テーブル名**: `team_members`

## 概要

チームメンバーの所属情報を管理します。ユーザーとチームの多対多の関係を表現します。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | UUID | 主キー（必須、デフォルト値あり、主キー） |
| team_id | UUID | チームID（外部キー）（必須） |
| user_id | UUID | ユーザーID（外部キー）（必須） |
| role | VARCHAR | 役割・権限（必須、デフォルト値あり） |
| joined_at | TIMESTAMP | 参加日時（必須、デフォルト値あり） |
| created_at | TIMESTAMP | 作成日時（必須、デフォルト値あり） |
| updated_at | TIMESTAMP | 更新日時（必須、デフォルト値あり） |

## 外部キー制約

- `team_id` → [`teams(id)`](teams.md)
- `user_id` → [`users(id)`](users.md)

## インデックス

| インデックス名 | タイプ | カラム |
|---------------|--------|--------|
| team_members_team_user_idx | INDEX | team_id, user_id |
| team_members_user_idx | INDEX | user_id |

---

> **自動生成日時**: 2025-11-08T00:16:08.818Z

[← スキーマ概要に戻る](../schema.md)
