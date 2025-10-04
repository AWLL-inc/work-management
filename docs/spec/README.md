# 仕様書・ユーザーマニュアル

このディレクトリには、エンドユーザー・ビジネス関係者向けの仕様書とマニュアルが含まれています。

## ディレクトリ構成

### 📖 user-manual/ - ユーザーマニュアル
エンドユーザー向けの操作マニュアルと機能説明

```
user-manual/
├── README.md              # マニュアル目次
├── overview.md            # システム概要
├── getting-started.md     # 開始方法・初期設定
├── features/              # 機能別マニュアル
│   ├── task-management.md # タスク管理機能
│   ├── user-management.md # ユーザー管理機能
│   ├── project-management.md # プロジェクト管理機能
│   └── dashboard.md       # ダッシュボード機能
├── admin-guide.md         # 管理者ガイド
└── troubleshooting.md     # FAQ・トラブルシューティング
```

### 💼 business/ - 業務仕様書
ビジネス要件と業務ルールの定義

```
business/
├── README.md              # 業務仕様索引
├── requirements.md        # 要件定義
├── business-rules.md      # ビジネスルール
├── user-stories.md        # ユーザーストーリー
└── acceptance-criteria.md # 受入基準
```

### 🔄 workflows/ - 業務フロー
業務プロセスとワークフローの詳細

```
workflows/
├── README.md              # フロー索引
├── user-registration.md   # ユーザー登録フロー
├── task-lifecycle.md      # タスクライフサイクル
└── project-management.md  # プロジェクト管理フロー
```

## ドキュメント作成ガイドライン

### 対象読者
- **エンドユーザー**: システムを実際に使用する方
- **管理者**: システム管理・運用を行う方
- **ビジネス関係者**: 要件定義・受入テストを行う方

### 記載言語
- **日本語**: ユーザー向けマニュアル、業務仕様書
- **スクリーンショット**: 実際の画面キャプチャを含める
- **手順**: 具体的で分かりやすい操作手順

### 文書品質基準
- **分かりやすさ**: 専門用語を避け、平易な表現を使用
- **完全性**: 必要な情報がすべて含まれている
- **正確性**: 実際のシステムと齟齬がない
- **最新性**: システム更新に合わせて文書も更新

## 関連ドキュメント

### 技術設計書
技術的な詳細は `docs/design/` を参照してください：
- [基本設計](../design/basic/README.md)
- [詳細設計](../design/detailed/README.md)
- [API仕様](../design/api/README.md)

### アーキテクチャ決定記録
技術選択の背景は `docs/adr/` を参照してください：
- [ADR索引](../adr/README.md)

### 運用ドキュメント
システム運用については `docs/operations/` を参照してください：
- [運用手順](../operations/README.md)

---

**最終更新**: 2024-10-04  
**管理者**: work-management開発チーム