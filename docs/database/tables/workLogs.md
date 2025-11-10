# workLogs

**テーブル名**: `work_logs`

## 概要

日々の作業記録を管理します。プロジェクトとカテゴリに紐付けて作業時間を記録します。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | UUID | 主キー（必須、デフォルト値あり、主キー） |
| user_id | UUID | ユーザーID（外部キー）（必須） |
| date | TIMESTAMP | 日付（必須） |
| hours | VARCHAR | 作業時間（必須） |
| project_id | UUID | プロジェクトID（外部キー）（必須） |
| category_id | UUID | カテゴリID（外部キー）（必須） |
| details | TEXT | 詳細 |
| created_at | TIMESTAMP | 作成日時（必須、デフォルト値あり） |
| updated_at | TIMESTAMP | 更新日時（必須、デフォルト値あり） |

## 外部キー制約

- `user_id` → [`users(id)`](users.md)
- `project_id` → [`projects(id)`](projects.md)
- `category_id` → [`work_categories(id)`](workCategories.md)

## インデックス

| インデックス名 | タイプ | カラム |
|---------------|--------|--------|
| work_logs_user_id_date_idx | INDEX | user_id, date |
| work_logs_project_id_idx | INDEX | project_id |
| work_logs_category_id_idx | INDEX | category_id |
| work_logs_date_user_idx | INDEX | date, user_id |
| work_logs_project_category_idx | INDEX | project_id, category_id |
| work_logs_details_gin_idx | INDEX | expression |

## 関連APIエンドポイント

- GET /api/work-logs - 作業ログ一覧取得
- POST /api/work-logs - 作業ログ作成
- GET /api/work-logs/{id} - 作業ログ詳細取得
- PUT /api/work-logs/{id} - 作業ログ更新
- DELETE /api/work-logs/{id} - 作業ログ削除
- PUT /api/work-logs/batch - 作業ログ一括更新

詳細は[API Documentation](../../api/README.md)を参照してください。

---

> **自動生成日時**: 2025-11-10T11:18:07.704Z

[← スキーマ概要に戻る](../schema.md)
