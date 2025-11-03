# projects

**テーブル名**: `projects`

## 概要

プロジェクト情報を管理します。作業ログの分類や統計分析に使用されます。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | UUID | 主キー（必須、デフォルト値あり、主キー） |
| name | VARCHAR | 名前（必須、一意制約） |
| description | TEXT | 説明 |
| is_active | BOOLEAN | 有効状態（必須、デフォルト値あり） |
| created_at | TIMESTAMP | 作成日時（必須、デフォルト値あり） |
| updated_at | TIMESTAMP | 更新日時（必須、デフォルト値あり） |

## インデックス

| インデックス名 | タイプ | カラム |
|---------------|--------|--------|
| projects_is_active_idx | INDEX | is_active |

## 関連APIエンドポイント

- GET /api/projects - プロジェクト一覧取得
- POST /api/projects - プロジェクト作成
- GET /api/projects/{id} - プロジェクト詳細取得
- PUT /api/projects/{id} - プロジェクト更新
- DELETE /api/projects/{id} - プロジェクト削除（ソフトデリート）

詳細は[API Documentation](../../api/README.md)を参照してください。

## このテーブルを参照しているテーブル

- [workLogs](workLogs.md)

---

> **自動生成日時**: 2025-11-03T07:19:47.364Z

[← スキーマ概要に戻る](../schema.md)
