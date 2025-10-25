# Server/Client Component Guidelines

## 概要

Next.js 15とReact 19のServer Componentsを活用し、クライアントサイドのJavaScriptバンドルサイズを削減し、パフォーマンスを向上させるためのガイドライン。

**原則**: "Server Component First" - デフォルトでServer Componentsを使用し、必要な場合のみClient Componentsを使用する。

## Server Components vs Client Components

### Server Components（デフォルト）

**使用すべき場合**:
- データベースからのデータフェッチ
- 静的コンテンツのレンダリング
- APIとの統合
- 重い計算処理
- 機密情報の取り扱い（APIキーなど）

**特徴**:
- `"use client"`ディレクティブ不要
- サーバー側でのみ実行
- クライアントサイドのJavaScriptバンドルに含まれない
- 直接データベースアクセス可能
- Hooks（useState, useEffectなど）は使用不可

### Client Components（明示的に "use client"）

**使用すべき場合**:
- イベントハンドラー（onClick, onChange, etc.）
- Reactフック（useState, useEffect, useContextなど）
- ブラウザAPI（localStorage, window, navigator）
- インタラクティブなUI要素
- リアルタイム更新

**特徴**:
- ファイルの先頭に`"use client"`が必要
- クライアント側で実行
- JavaScriptバンドルに含まれる
- ブラウザAPIにアクセス可能
- 全てのReact機能が使用可能

## 命名規則

Server ComponentsとClient Componentsを明確に区別するための命名規則：

```
components/features/work-logs/
├── work-logs-page.tsx           # Server Component（デフォルト）
├── work-logs-client.tsx         # Client Component（インタラクティブ）
├── work-log-table.tsx           # Server Component（デフォルト）
├── work-log-table-client.tsx    # Client Component（必要な場合）
└── work-log-filters-client.tsx  # Client Component（フィルター機能）
```

**規則**:
- Server Components: 通常の名前（例: `work-logs-page.tsx`）
- Client Components: `-client`サフィックス（例: `work-logs-client.tsx`）

## 実装パターン

### パターン1: ページレベルでの分離

**Before (全てClient Component):**
```typescript
// app/[locale]/work-logs/page.tsx
"use client"

import { useState, useEffect } from 'react';

export default function WorkLogsPage() {
  const [workLogs, setWorkLogs] = useState([]);

  useEffect(() => {
    fetch('/api/work-logs')
      .then(r => r.json())
      .then(setWorkLogs);
  }, []);

  return <WorkLogTable data={workLogs} onUpdate={...} />;
}
```

**After (Server Component First):**
```typescript
// app/[locale]/work-logs/page.tsx (Server Component)
import { getWorkLogs, getProjects, getWorkCategories } from '@/lib/api/work-logs';
import { WorkLogsClient } from '@/components/features/work-logs/work-logs-client';

export default async function WorkLogsPage() {
  // サーバー側で並列データフェッチ
  const [workLogs, projects, categories] = await Promise.all([
    getWorkLogs(),
    getProjects(true),
    getWorkCategories(true),
  ]);

  return (
    <WorkLogsClient
      initialWorkLogs={workLogs}
      projects={projects}
      categories={categories}
    />
  );
}

// components/features/work-logs/work-logs-client.tsx
"use client"

import { useState } from 'react';

interface Props {
  initialWorkLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
}

export function WorkLogsClient({ initialWorkLogs, projects, categories }: Props) {
  const [workLogs, setWorkLogs] = useState(initialWorkLogs);
  // ... インタラクティブなロジックのみ

  return <WorkLogTable data={workLogs} onUpdate={...} />;
}
```

### パターン2: コンポーネント合成

複雑なコンポーネントは、Server ComponentとClient Componentを組み合わせる：

```typescript
// components/features/work-logs/work-log-card.tsx (Server Component)
import { WorkLogActions } from './work-log-actions-client';

interface Props {
  workLog: WorkLog;
  project: Project;
  category: WorkCategory;
}

export function WorkLogCard({ workLog, project, category }: Props) {
  return (
    <div className="card">
      {/* 静的コンテンツ - Server Component */}
      <h3>{project.name}</h3>
      <p>{category.name}</p>
      <p>Hours: {workLog.hours}</p>

      {/* インタラクティブな部分 - Client Component */}
      <WorkLogActions workLogId={workLog.id} />
    </div>
  );
}

// components/features/work-logs/work-log-actions-client.tsx
"use client"

import { useState } from 'react';

interface Props {
  workLogId: string;
}

export function WorkLogActions({ workLogId }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // ... 削除ロジック
  };

  return (
    <button onClick={handleDelete} disabled={isDeleting}>
      Delete
    </button>
  );
}
```

### パターン3: Context Provider

Context Providerは常にClient Componentである必要があります：

```typescript
// components/providers/theme-provider-client.tsx
"use client"

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// app/layout.tsx (Server Component)
import { ThemeProvider } from '@/components/providers/theme-provider-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## データフェッチパターン

### Server Componentでのデータフェッチ

```typescript
// Server Component
export default async function Page() {
  // 直接データベースアクセス可能
  const data = await db.query.workLogs.findMany();

  // または API関数を使用
  const workLogs = await getWorkLogs();

  return <ClientComponent data={data} />;
}
```

### Client Componentでのデータフェッチ

```typescript
// Client Component
"use client"

import useSWR from 'swr';

export function WorkLogsClient({ initialData }: { initialData: WorkLog[] }) {
  const { data, mutate } = useSWR('/api/work-logs', fetcher, {
    fallbackData: initialData, // Server Componentから受け取った初期データ
  });

  return <div>{/* レンダリング */}</div>;
}
```

## 移行戦略

### フェーズ1: ページコンポーネント

1. **評価**: どのページがServer Component化できるか評価
2. **データフェッチ移行**: Client SideのデータフェッチをServer Sideに移動
3. **分離**: インタラクティブな部分を`*-client.tsx`に抽出

### フェーズ2: 機能コンポーネント

1. **特定**: 真にインタラクティブなコンポーネントを特定
2. **保持**: 必要な場所にのみ`"use client"`を保持
3. **合成**: 混合コンポーネントには合成パターンを使用

### フェーズ3: 共有コンポーネント

1. **レビュー**: UIライブラリコンポーネントをレビュー
2. **Server First**: ほとんどをServer Componentとして保持
3. **必要時のみ**: インタラクティブなバリアントのみ`"use client"`を追加

## よくある落とし穴

### 1. 不必要な "use client"

❌ 悪い例:
```typescript
"use client"  // 不要！

export function StaticContent({ data }: Props) {
  return <div>{data.title}</div>;
}
```

✅ 良い例:
```typescript
// "use client"なし - Server Componentとして動作

export function StaticContent({ data }: Props) {
  return <div>{data.title}</div>;
}
```

### 2. Server ComponentでHooksを使用

❌ 悪い例:
```typescript
// Server Component（"use client"なし）
export default function Page() {
  const [state, setState] = useState(0); // エラー！
  return <div>{state}</div>;
}
```

✅ 良い例:
```typescript
// app/page.tsx (Server Component)
import { PageClient } from './page-client';

export default function Page() {
  return <PageClient />;
}

// page-client.tsx
"use client"

export function PageClient() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}
```

### 3. Client ComponentにServer Componentをインポート

❌ 悪い例:
```typescript
"use client"

import { ServerComponent } from './server-component'; // 動作しない

export function ClientComponent() {
  return <ServerComponent />; // エラー！
}
```

✅ 良い例:
```typescript
"use client"

export function ClientComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>; // childrenとして渡す
}

// 親コンポーネント（Server Component）
export function ParentComponent() {
  return (
    <ClientComponent>
      <ServerComponent /> {/* これは動作する */}
    </ClientComponent>
  );
}
```

## チェックリスト

コンポーネントをServer Component化する前に：

- [ ] イベントハンドラー（onClick, onChangeなど）を使用していないか？
- [ ] React Hooks（useState, useEffectなど）を使用していないか？
- [ ] ブラウザAPI（window, localStorage）にアクセスしていないか？
- [ ] サードパーティライブラリがクライアント側を要求していないか？

すべて「いいえ」なら、Server Componentとして保持できます！

## パフォーマンス測定

### Before/After比較

```bash
# ビルド前
npm run build
# Bundle size を記録

# Server Component化後
npm run build
# 30-50%の削減を確認
```

### メトリクス

- **Time to First Byte (TTFB)**: サーバーレンダリングで改善
- **First Contentful Paint (FCP)**: 初期ロードの改善
- **Largest Contentful Paint (LCP)**: Core Web Vitalsの改善
- **Bundle Size**: クライアントサイドJSの削減

## 参考資料

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [When to use Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#when-to-use-server-and-client-components)

---

**Last Updated**: 2025-10-15
**Author**: Claude Code
**Related**: Issue #61, Issue #50
