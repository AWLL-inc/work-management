# teams

**テーブル名**: `teams`

## 概要

チーム情報を管理します。メンバーのグループ化や権限管理に使用されます。

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
| teams_is_active_idx | INDEX | is_active |

## 関連APIエンドポイント

- GET /api/teams - チーム一覧取得
- POST /api/teams - チーム作成
- GET /api/teams/{id} - チーム詳細取得
- PUT /api/teams/{id} - チーム更新
- DELETE /api/teams/{id} - チーム削除（ソフトデリート）
- POST /api/teams/{id}/members - チームメンバー追加
- DELETE /api/teams/{id}/members/{userId} - チームメンバー削除

詳細は[API Documentation](../../api/README.md)を参照してください。

## このテーブルを参照しているテーブル

- [teamMembers](teamMembers.md)

---

> **自動生成日時**: 2025-11-02T21:46:08.797Z

[← スキーマ概要に戻る](../schema.md)
