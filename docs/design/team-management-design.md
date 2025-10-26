# チーム管理機能 設計書

## 概要

ユーザーをチームごとに分類し、チーム内のメンバー間で工数を相互参照できる機能を実装する。
将来的には、チーム内でも参照権限を細かく制御できる拡張性を持たせる。

## データベーススキーマ

### 1. teams テーブル

チーム情報を管理するマスタテーブル。

```typescript
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  isActiveIdx: index("teams_is_active_idx").on(table.isActive),
}));
```

**フィールド説明:**
- `id`: チームの一意識別子（UUID）
- `name`: チーム名（ユニーク制約）
- `description`: チームの説明（任意）
- `isActive`: 有効/無効フラグ（論理削除用）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### 2. team_members テーブル

チームとユーザーの多対多関係を管理する中間テーブル。

```typescript
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  teamUserIdx: index("team_members_team_user_idx").on(table.teamId, table.userId),
  userIdx: index("team_members_user_idx").on(table.userId),
  // ユニーク制約：同じユーザーは同じチームに1回のみ参加可能
  teamUserUnique: unique("team_members_team_user_unique").on(table.teamId, table.userId),
}));
```

**フィールド説明:**
- `id`: レコードの一意識別子
- `teamId`: チームID（外部キー）
- `userId`: ユーザーID（外部キー）
- `role`: チーム内での役割
  - `member`: 一般メンバー（デフォルト）
  - `leader`: チームリーダー（将来の拡張用）
  - `viewer`: 閲覧のみ（将来の拡張用）
- `joinedAt`: チーム参加日時
- `createdAt`: レコード作成日時
- `updatedAt`: レコード更新日時

**制約:**
- (teamId, userId) のユニーク制約：同じユーザーが同じチームに重複して参加できない
- CASCADE削除：チームまたはユーザーが削除された場合、自動的に中間レコードも削除

## 権限設計

### 基本権限モデル

#### フェーズ1（初期実装）

**シンプルなチームベース権限:**

1. **チーム外のユーザー**
   - 自分の工数のみ参照・編集可能
   - 他のユーザーの工数は参照不可

2. **チームメンバー**
   - 自分の工数を参照・編集可能
   - 同じチームメンバーの工数を参照可能（編集は不可）

3. **管理者（admin role）**
   - すべてのユーザーの工数を参照・編集可能
   - チームの作成・編集・削除可能
   - チームメンバーの追加・削除可能

4. **マネージャー（manager role）**
   - 自分が所属するチームの工数を参照可能
   - 自分のチームの管理が可能（将来拡張）

#### フェーズ2（将来拡張）

**チーム内の細かい権限制御:**

team_members テーブルの `role` フィールドを活用：

1. **viewer（閲覧者）**
   - チームメンバーの工数を参照のみ可能
   - 自分の工数も参照のみ（編集不可）

2. **member（一般メンバー）**
   - チームメンバーの工数を参照可能
   - 自分の工数を編集可能

3. **leader（リーダー）**
   - チームメンバーの工数を参照・編集可能
   - チームメンバーの追加・削除が可能（adminの承認不要）

### 権限チェックロジック

```typescript
/**
 * ユーザーが工数を参照可能かチェック
 */
async function canViewWorkLog(
  viewerUserId: string,
  targetUserId: string,
  viewerRole: string
): Promise<boolean> {
  // 1. 管理者は全て参照可能
  if (viewerRole === "admin") return true;

  // 2. 自分の工数は参照可能
  if (viewerUserId === targetUserId) return true;

  // 3. 同じチームのメンバーかチェック
  const isTeammate = await checkIfTeammates(viewerUserId, targetUserId);
  if (isTeammate) return true;

  // 4. それ以外は不可
  return false;
}

/**
 * ユーザーが工数を編集可能かチェック
 */
async function canEditWorkLog(
  editorUserId: string,
  targetUserId: string,
  editorRole: string
): Promise<boolean> {
  // 1. 管理者は全て編集可能
  if (editorRole === "admin") return true;

  // 2. 自分の工数は編集可能
  if (editorUserId === targetUserId) return true;

  // 3. それ以外は不可（フェーズ1）
  // TODO: フェーズ2でチームリーダーの編集権限を追加
  return false;
}
```

## API設計

### 1. チーム管理API

#### GET /api/teams

すべてのチームを取得（または自分が所属するチーム）。

**認証:** 必須

**クエリパラメータ:**
- `active` (optional): `true` で有効なチームのみ取得

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "開発チーム",
      "description": "製品開発を担当するチーム",
      "isActive": true,
      "memberCount": 5,
      "createdAt": "2024-10-26T00:00:00Z",
      "updatedAt": "2024-10-26T00:00:00Z"
    }
  ]
}
```

#### POST /api/teams

新しいチームを作成。

**認証:** 必須（admin または manager）

**リクエストボディ:**
```json
{
  "name": "開発チーム",
  "description": "製品開発を担当するチーム"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "開発チーム",
    "description": "製品開発を担当するチーム",
    "isActive": true,
    "createdAt": "2024-10-26T00:00:00Z",
    "updatedAt": "2024-10-26T00:00:00Z"
  }
}
```

#### GET /api/teams/[id]

チームの詳細情報とメンバー一覧を取得。

**認証:** 必須

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "開発チーム",
    "description": "製品開発を担当するチーム",
    "isActive": true,
    "createdAt": "2024-10-26T00:00:00Z",
    "updatedAt": "2024-10-26T00:00:00Z",
    "members": [
      {
        "id": "member-record-uuid",
        "userId": "user-uuid",
        "userName": "山田太郎",
        "userEmail": "yamada@example.com",
        "role": "member",
        "joinedAt": "2024-10-20T00:00:00Z"
      }
    ]
  }
}
```

#### PUT /api/teams/[id]

チーム情報を更新。

**認証:** 必須（admin のみ）

**リクエストボディ:**
```json
{
  "name": "開発チーム（更新）",
  "description": "更新後の説明",
  "isActive": true
}
```

#### DELETE /api/teams/[id]

チームを削除（論理削除）。

**認証:** 必須（admin のみ）

**レスポンス:**
```json
{
  "success": true
}
```

### 2. チームメンバー管理API

#### POST /api/teams/[id]/members

チームにメンバーを追加。

**認証:** 必須（admin または該当チームのリーダー）

**リクエストボディ:**
```json
{
  "userId": "user-uuid",
  "role": "member"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "member-record-uuid",
    "teamId": "team-uuid",
    "userId": "user-uuid",
    "role": "member",
    "joinedAt": "2024-10-26T00:00:00Z",
    "createdAt": "2024-10-26T00:00:00Z"
  }
}
```

#### DELETE /api/teams/[id]/members/[userId]

チームからメンバーを削除。

**認証:** 必須（admin または該当チームのリーダー）

**レスポンス:**
```json
{
  "success": true
}
```

### 3. 既存API の変更

#### GET /api/work-logs

**変更内容:**
- クエリパラメータに `scope` を追加
  - `scope=own`: 自分の工数のみ（デフォルト）
  - `scope=team`: 自分のチームメンバーの工数を含む
  - `scope=all`: すべての工数（admin のみ）

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "userName": "山田太郎",
      "userEmail": "yamada@example.com",
      "date": "2024-10-26T00:00:00Z",
      "hours": "8.0",
      "projectId": "project-uuid",
      "projectName": "プロジェクトA",
      "categoryId": "category-uuid",
      "categoryName": "設計",
      "details": "<p>要件定義</p>",
      "createdAt": "2024-10-26T10:00:00Z",
      "updatedAt": "2024-10-26T10:00:00Z"
    }
  ]
}
```

## UI設計

### 1. チーム管理画面

**パス:** `/teams`

**機能:**
- チーム一覧表示
- チームの作成・編集・削除（admin のみ）
- チーム詳細の表示

**レイアウト:**
```
+------------------------------------------+
|  チーム管理                               |
+------------------------------------------+
|  [+ 新規チーム作成] (admin only)          |
+------------------------------------------+
|  チーム一覧                               |
|  +--------------------------------------+ |
|  | 開発チーム          | 5名 | [詳細]   | |
|  | QAチーム            | 3名 | [詳細]   | |
|  | デザインチーム      | 4名 | [詳細]   | |
|  +--------------------------------------+ |
+------------------------------------------+
```

### 2. チーム詳細画面

**パス:** `/teams/[id]`

**機能:**
- チーム情報の表示
- メンバー一覧の表示
- メンバーの追加・削除（admin のみ）
- チームメンバーの工数一覧へのリンク

**レイアウト:**
```
+------------------------------------------+
|  開発チーム                               |
|  製品開発を担当するチーム                  |
+------------------------------------------+
|  メンバー (5名)                           |
|  [+ メンバー追加] (admin only)            |
+------------------------------------------+
|  +--------------------------------------+ |
|  | 山田太郎  | yamada@ex  | member  |[X]| |
|  | 佐藤花子  | sato@ex    | member  |[X]| |
|  | 鈴木一郎  | suzuki@ex  | leader  |[X]| |
|  +--------------------------------------+ |
+------------------------------------------+
|  [チーム工数を確認]                       |
+------------------------------------------+
```

### 3. 工数一覧画面の拡張

**パス:** `/work-logs`

**変更内容:**
- スコープ切り替えタブを追加
  - 「自分の工数」タブ
  - 「チームの工数」タブ（チームメンバーがいる場合のみ表示）
  - 「全体」タブ（admin のみ表示）

**レイアウト:**
```
+------------------------------------------+
|  工数管理                                 |
+------------------------------------------+
|  [自分の工数] [チームの工数] [全体(admin)]|
+------------------------------------------+
|  フィルター: [プロジェクト▼] [期間▼]     |
+------------------------------------------+
|  工数一覧                                 |
|  +--------------------------------------+ |
|  | 日付   | ユーザー | プロジェクト | 時間 ||
|  |--------|---------|-------------|------||
|  |10/26   | 山田太郎 | プロジェクトA| 8.0  ||
|  |10/26   | 佐藤花子 | プロジェクトB| 7.5  ||
|  +--------------------------------------+ |
+------------------------------------------+
```

## マイグレーション計画

### Phase 1: テーブル作成
1. `teams` テーブルの作成
2. `team_members` テーブルの作成
3. インデックスと制約の追加

### Phase 2: データ移行（必要に応じて）
- 既存ユーザーをデフォルトチームに割り当て（オプション）

### Phase 3: 権限ロジックの実装
1. `canViewWorkLog()` 関数の実装
2. `canEditWorkLog()` 関数の実装
3. 既存APIの権限チェック更新

### Phase 4: 新規API実装
1. チーム管理API
2. チームメンバー管理API
3. 工数取得APIの拡張

### Phase 5: UI実装
1. チーム管理画面
2. チーム詳細画面
3. 工数一覧のスコープ切り替え機能

## セキュリティ考慮事項

### 1. 認可チェック
- すべてのAPIエンドポイントで適切な権限チェックを実施
- チームメンバーシップの検証を確実に実施
- SQL インジェクション対策（Drizzle ORM の型安全性を活用）

### 2. データ漏洩防止
- ユーザーは自分がアクセス権限を持つデータのみ取得可能
- チーム外のユーザー情報は返さない
- レスポンスに機密情報（passwordHash など）を含めない

### 3. レート制限
- API呼び出しの頻度制限（DDoS対策）
- 大量のチーム作成・削除を防ぐ

## パフォーマンス考慮事項

### 1. インデックス戦略
- `team_members` テーブルに適切なインデックスを設定
  - (teamId, userId) - チームメンバー検索
  - (userId) - ユーザーの所属チーム検索

### 2. クエリ最適化
- チームメンバーの工数取得時は JOIN を活用
- N+1 問題を回避（ユーザー情報の一括取得）
- ページネーション実装（大量データ対策）

### 3. キャッシング
- チームメンバーシップ情報のキャッシュ（Redis など）
- セッション内でのチーム情報キャッシュ

## テスト計画

### 1. ユニットテスト
- 権限チェック関数のテスト
- チームメンバーシップ検証のテスト
- API バリデーションのテスト

### 2. 統合テスト
- チーム作成からメンバー追加までのフロー
- チームメンバーによる工数参照のテスト
- 権限エラーケースのテスト

### 3. E2Eテスト
- チーム管理画面の操作テスト
- 工数一覧のスコープ切り替えテスト
- 権限による表示制御のテスト

## 実装順序

### Sprint 1: バックエンド基盤
1. データベーススキーマの作成
2. マイグレーションファイルの作成・適用
3. 型定義の追加

### Sprint 2: API実装
1. チーム管理API の実装
2. チームメンバー管理API の実装
3. 工数取得API の拡張
4. 権限チェックロジックの実装

### Sprint 3: フロントエンド実装
1. チーム管理画面の作成
2. チーム詳細画面の作成
3. 工数一覧のスコープ切り替え機能追加

### Sprint 4: テスト & 最適化
1. ユニットテスト・統合テストの追加
2. E2Eテストの追加
3. パフォーマンステスト
4. セキュリティレビュー

## 拡張性

### 将来の機能拡張
1. **階層的なチーム構造**
   - 親チーム・子チームの関係
   - 部門 > チーム の階層構造

2. **プロジェクトとチームの紐付け**
   - プロジェクトごとにアサインされたチーム
   - チーム単位でのプロジェクト工数管理

3. **チーム内の細かい権限制御**
   - viewer / member / leader の役割による権限分離
   - カスタム権限設定

4. **通知機能**
   - チームメンバーが追加された際の通知
   - チームの工数が閾値を超えた際のアラート

## まとめ

このチーム管理機能により、以下が実現されます：

✅ ユーザーをチームごとに分類
✅ チーム内のメンバー間で工数を相互参照
✅ 将来的な権限制御の拡張性を確保
✅ セキュアで高パフォーマンスな実装
✅ テスト可能な設計

---

**作成日:** 2024-10-26
**バージョン:** 1.0
