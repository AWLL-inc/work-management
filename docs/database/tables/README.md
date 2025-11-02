# データベーステーブル詳細ドキュメント

生成日時: 2025-11-02T04:37:01.041Z

## テーブル一覧

### [accounts](accounts.md)

**物理テーブル名**: `accounts`

OAuth認証プロバイダーのアカウント情報を管理します。NextAuth.jsで使用されます。

### [projects](projects.md)

**物理テーブル名**: `projects`

プロジェクト情報を管理します。作業ログの分類や統計分析に使用されます。

### [sessions](sessions.md)

**物理テーブル名**: `sessions`

ユーザーのセッション情報を管理します。NextAuth.jsで使用されます。

### [teamMembers](teamMembers.md)

**物理テーブル名**: `team_members`

チームメンバーの所属情報を管理します。ユーザーとチームの多対多の関係を表現します。

### [teams](teams.md)

**物理テーブル名**: `teams`

チーム情報を管理します。メンバーのグループ化や権限管理に使用されます。

### [users](users.md)

**物理テーブル名**: `users`

ユーザーアカウント情報を管理します。認証、プロフィール、権限などを保存します。

### [verificationTokens](verificationTokens.md)

**物理テーブル名**: `verification_tokens`

メール認証やパスワードリセット用のトークンを管理します。NextAuth.jsで使用されます。

### [workCategories](workCategories.md)

**物理テーブル名**: `work_categories`

作業カテゴリ情報を管理します。作業ログの分類や統計分析に使用されます。

### [workLogs](workLogs.md)

**物理テーブル名**: `work_logs`

日々の作業記録を管理します。プロジェクトとカテゴリに紐付けて作業時間を記録します。

---

[← スキーマ概要に戻る](../schema.md)
