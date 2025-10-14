# Architecture Decision Records (ADR)

このディレクトリには、work-managementプロジェクトの技術的な意思決定を文書化したArchitecture Decision Records (ADR)が含まれています。

## ADR一覧

### [ADR-001: Next.js with Vercel Architecture](./001-nextjs-vercel-architecture.md)
**Status**: Accepted  
**概要**: フロントエンドアーキテクチャとVercelホスティングの技術選択

**主要決定事項**:
- Next.js 15 App Router with React 19
- Tailwind CSS 4 with inline theme configuration
- Biome for linting and formatting
- Turbopack for development and build optimization
- Vercelによるホスティングとデプロイメント

### [ADR-002: Server-side Implementation Architecture](./002-server-side-implementation.md)
**Status**: Accepted  
**概要**: サーバーサイド実装方針とAPI設計

**主要決定事項**:
- Next.js App Router API Routes with Edge Runtime
- NextAuth.js v5 for authentication
- JWT strategy with role-based access control
- Zod for input validation
- 包括的なセキュリティ対策とエラーハンドリング

### [ADR-003: Database Integration with Vercel Postgres](./003-database-integration.md)
**Status**: Accepted  
**概要**: データベース統合とデータアクセス層の設計

**主要決定事項**:
- Vercel Postgres (PostgreSQL 15+)
- Drizzle ORM for type-safe database operations
- Repository pattern for data layer abstraction
- 包括的なスキーマ設計とマイグレーション戦略
- パフォーマンス最適化とセキュリティ対策

### [ADR-004: Development Guidelines and Best Practices](./004-development-guidelines.md)
**Status**: Accepted
**概要**: 開発プロセス、コーディング規約、テスト戦略

**主要決定事項**:
- TypeScript strict mode with 100% type coverage
- Vitest for unit testing, Playwright for E2E testing
- Git Flow with conventional commits
- 包括的なコードレビューガイドライン
- パフォーマンスとセキュリティ基準

### [ADR-005: UIライブラリとデータテーブルの選定](./005-ui-library-and-data-table.md)
**Status**: Accepted (Updated 2025-01-10)
**概要**: UIコンポーネントライブラリとデータテーブル/グリッドライブラリの技術選択

**主要決定事項**:
- shadcn/ui + Radix UI for base UI components
- **AG Grid Community Edition** for main data operations (Updated)
- shadcn/ui Data Table for simple lists and reports
- 用途に応じた使い分けアプローチ
- Excel風の直感的操作とインライン編集機能

### [ADR-006: AG Grid標準準拠の実装ガイドライン](./006-ag-grid-standard-compliance.md)
**Status**: Accepted
**概要**: AG Grid実装における標準準拠とカスタマイゼーションガイドライン

**主要決定事項**:
- AG Grid標準パターンの最優先適用
- カスタム実装の最小化と明示的承認制
- データ管理はAG Grid内部を単一の真実の源とする
- 標準から外れる場合のADR文書化必須
- バリデーションは保存時一括処理を推奨

### [ADR-007: 国際化（i18n）実装方針 - Cookie ベース](./007-i18n-implementation-cookie-based.md)
**Status**: Accepted
**概要**: 多言語対応における言語管理方式の技術選択

**主要決定事項**:
- Cookie ベースの言語管理を採用
- URL パスにロケールを含めない設計
- next-intl ライブラリの使用
- サーバーアクションによる言語切り替え
- 1年間の永続的な言語設定保存

## 技術スタック概要

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5+ (strict mode)
- **UI Library**: React 19
- **UI Components**: shadcn/ui + Radix UI
- **Data Table**: AG Grid Community Edition + shadcn/ui Data Table
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack

### Backend
- **API**: Next.js API Routes (Edge Runtime)
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **Middleware**: Next.js Middleware

### Database
- **Database**: Vercel Postgres (PostgreSQL 15+)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Pattern**: Repository Pattern

### Development Tools
- **Linting/Formatting**: Biome
- **Testing**: Vitest (unit), Playwright (E2E)
- **Version Control**: Git with conventional commits
- **CI/CD**: GitHub Actions with Vercel deployment

### Hosting & Infrastructure
- **Platform**: Vercel
- **CDN**: Vercel Edge Network
- **Database**: Vercel Postgres
- **Analytics**: Vercel Analytics

## プロジェクト構造

```
work-management/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles (Tailwind CSS 4)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Shared utilities
│   ├── db/               # Database utilities and repositories
│   ├── auth.ts           # NextAuth configuration
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Utility functions
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── data-table/       # TanStack Table wrappers (reports)
│   ├── ag-grid/          # AG Grid shared components
│   └── features/         # Feature-specific components
├── types/                # TypeScript type definitions
├── drizzle/              # Database schema and migrations
│   ├── migrations/       # Generated migration files
│   ├── schema.ts         # Database schema definition
│   └── seed.ts           # Database seeding
├── docs/                 # Documentation
│   └── adr/             # Architecture Decision Records
├── public/              # Static assets
├── tests/               # Test files
├── biome.json           # Biome configuration
├── drizzle.config.ts    # Drizzle ORM configuration
├── middleware.ts        # Next.js middleware
├── next.config.ts       # Next.js configuration
├── postcss.config.mjs   # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## 開発フロー

### 1. 環境セットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local

# データベースのセットアップ
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 2. 開発
```bash
# 開発サーバーの起動
npm run dev

# コードの品質チェック
npm run lint
npm run type-check

# テストの実行
npm run test
npm run test:e2e
```

### 3. デプロイメント
```bash
# プロダクションビルド
npm run build

# Vercelへのデプロイ（自動）
# main ブランチへのプッシュで自動デプロイ
```

## 品質基準

### コード品質
- TypeScript strict mode 100% compliance
- Biome linting rules adherence
- 80%+ test coverage requirement
- Zero ESLint errors/warnings

### パフォーマンス
- Core Web Vitals optimization
- API response time < 200ms
- Page load time < 2s
- Bundle size monitoring

### セキュリティ
- Input validation with Zod
- Authentication with NextAuth.js
- Rate limiting implementation
- Security headers configuration

## コントリビューション

1. **Feature Branch**: `feature/feature-name` でブランチを作成
2. **Conventional Commits**: コミットメッセージは規約に従う
3. **Pull Request**: 全ての変更はPRを通す
4. **Code Review**: 必須のコードレビューを実施
5. **Testing**: 新機能には適切なテストを追加

## リファレンス

### ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NextAuth.js Documentation](https://authjs.dev/)
- [Vercel Documentation](https://vercel.com/docs)

### 開発ツール
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Zod](https://zod.dev/)

## 更新履歴

- **2024-10-03**: ADR-001〜004の初期作成
- **2024-10-04**: ADR-005追加（UIライブラリとデータテーブルの選定）
- **2024-10-13**: ADR-006追加（AG Grid標準準拠の実装ガイドライン）
- **2025-01-10**: ADR-005更新（AG Grid Community Edition採用）
- **2025-01-14**: ADR-007追加（国際化（i18n）実装方針）
- 今後の変更は各ADRファイルで管理

---

**注意**: これらのADRは生きた文書です。技術的な決定事項が変更される場合は、新しいADRを作成するか、既存のADRを更新してください。