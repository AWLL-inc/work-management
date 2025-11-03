# workCategories

**テーブル名**: `work_categories`

## 概要

作業カテゴリ情報を管理します。作業ログの分類や統計分析に使用されます。

## カラム一覧

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| id | UUID | 主キー（必須、デフォルト値あり、主キー） |
| name | VARCHAR | 名前（必須、一意制約） |
| description | TEXT | 説明 |
| display_order | INTEGER | 表示順序（必須、デフォルト値あり） |
| is_active | BOOLEAN | 有効状態（必須、デフォルト値あり） |
| created_at | TIMESTAMP | 作成日時（必須、デフォルト値あり） |
| updated_at | TIMESTAMP | 更新日時（必須、デフォルト値あり） |

## インデックス

| インデックス名 | タイプ | カラム |
|---------------|--------|--------|
| work_categories_is_active_display_order_idx | INDEX | is_active, display_order |

## 関連APIエンドポイント

- GET /api/work-categories - カテゴリ一覧取得
- POST /api/work-categories - カテゴリ作成
- GET /api/work-categories/{id} - カテゴリ詳細取得
- PUT /api/work-categories/{id} - カテゴリ更新
- DELETE /api/work-categories/{id} - カテゴリ削除（ソフトデリート）

詳細は[API Documentation](../../api/README.md)を参照してください。

## このテーブルを参照しているテーブル

- [workLogs](workLogs.md)

---

> **自動生成日時**: 2025-11-03T13:10:36.408Z

[← スキーマ概要に戻る](../schema.md)
