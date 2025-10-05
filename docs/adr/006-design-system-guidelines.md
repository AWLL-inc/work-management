# ADR-006: デザインシステムとUIガイドライン

## Status
Accepted

## Context
work-managementプロジェクトにおいて、一貫性のあるユーザー体験を提供し、視認性とアクセシビリティを確保するため、包括的なデザインシステムガイドラインを策定する必要がある。

### 課題
1. **視認性の問題**
   - 背景色と文字色のコントラストが不十分
   - モーダル内で文字が見えない（背景色と文字色が同じ）
   - フォーカス状態が不明瞭

2. **一貫性の欠如**
   - コンポーネント間でスタイルが統一されていない
   - カラーパレットの使用方法が不明確
   - スペーシングルールが定義されていない

3. **アクセシビリティ**
   - WCAG AA基準のコントラスト比（最低4.5:1）を満たす必要がある
   - キーボードナビゲーションの視認性確保
   - スクリーンリーダー対応

## Decision

### 1. カラーパレット

#### プライマリカラー（ブランドカラー）
```css
/* Primary - Indigo/Blue */
--primary: 221 83% 53%;           /* #3B82F6 - 主要アクション */
--primary-foreground: 0 0% 100%;  /* #FFFFFF - プライマリ上のテキスト */
--primary-hover: 221 83% 45%;     /* ホバー時 */
```

#### セマンティックカラー
```css
/* Success - 成功状態 */
--success: 142 71% 45%;           /* #22C55E */
--success-foreground: 0 0% 100%;  /* #FFFFFF */

/* Warning - 警告 */
--warning: 38 92% 50%;            /* #F59E0B */
--warning-foreground: 222 47% 11%; /* #1E293B - 暗いテキスト */

/* Error/Destructive - エラー・削除 */
--destructive: 0 84% 60%;         /* #EF4444 */
--destructive-foreground: 0 0% 100%; /* #FFFFFF */

/* Info - 情報 */
--info: 199 89% 48%;              /* #0EA5E9 */
--info-foreground: 0 0% 100%;     /* #FFFFFF */
```

#### ニュートラルカラー
```css
/* Background & Surface */
--background: 0 0% 100%;          /* #FFFFFF - ページ背景 */
--foreground: 222 47% 11%;        /* #1E293B - 主要テキスト */
--card: 0 0% 100%;                /* #FFFFFF - カード背景 */
--card-foreground: 222 47% 11%;   /* #1E293B - カード内テキスト */

/* Muted - 控えめな要素 */
--muted: 210 40% 96%;             /* #F1F5F9 - 控えめな背景 */
--muted-foreground: 215 16% 47%;  /* #64748B - 控えめなテキスト */

/* Border & Input */
--border: 214 32% 91%;            /* #E2E8F0 */
--input: 214 32% 91%;             /* #E2E8F0 */
--ring: 221 83% 53%;              /* #3B82F6 - フォーカスリング */
```

#### コントラスト比の保証
すべてのテキストと背景の組み合わせは、WCAG AA基準を満たす：
- **通常テキスト**: 最低4.5:1
- **大きなテキスト（18px以上、または14px太字）**: 最低3:1
- **UI コンポーネント**: 最低3:1

### 2. タイポグラフィ

#### フォントファミリー
```css
--font-sans: var(--font-geist-sans, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
--font-mono: var(--font-geist-mono, "SF Mono", Monaco, "Cascadia Code",
  "Roboto Mono", Consolas, "Courier New", monospace);
```

#### フォントサイズスケール
| 用途 | サイズ | 行間 |
|------|--------|------|
| Display (h1) | 36px (2.25rem) | 1.2 |
| Heading 1 | 30px (1.875rem) | 1.3 |
| Heading 2 | 24px (1.5rem) | 1.3 |
| Heading 3 | 20px (1.25rem) | 1.4 |
| Body Large | 18px (1.125rem) | 1.5 |
| Body | 16px (1rem) | 1.5 |
| Body Small | 14px (0.875rem) | 1.5 |
| Caption | 12px (0.75rem) | 1.4 |

#### 最小フォントサイズ
- **本文テキスト**: 最低14px（0.875rem）
- **ボタン・ラベル**: 最低14px
- **キャプション**: 12px（限定的に使用）

### 3. スペーシングシステム

8pxベースのスケール：
```css
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

#### コンポーネント別スペーシング
- **ボタンパディング**: 16px (水平) × 10px (垂直)
- **カードパディング**: 24px
- **テーブルセル**: 16px
- **入力フィールド**: 12px (水平) × 10px (垂直)
- **セクション間マージン**: 24px - 48px

### 4. コンポーネントガイドライン

#### ボタン
```typescript
// サイズバリエーション
default: "h-10 px-4 py-2"    // 40px高さ、最低44×44pxタップ領域
sm: "h-9 px-3"               // 36px高さ
lg: "h-11 px-8"              // 44px高さ
icon: "h-10 w-10"            // 正方形

// スタイルバリエーション
default: "bg-primary text-primary-foreground"
outline: "border-2 border-input hover:bg-muted"
ghost: "hover:bg-muted"
destructive: "bg-destructive text-destructive-foreground"
```

**必須要件**:
- 最小タップ領域: 44×44px（モバイルアクセシビリティ）
- フォーカスリング: 2px solid、2pxオフセット
- ホバー状態: 明確な視覚的フィードバック
- アクティブ状態: scale(0.95)でプレスを示す

#### テーブル
```css
/* ヘッダー */
TableHead: "h-12 px-4 bg-muted/50 font-semibold text-foreground"

/* セル */
TableCell: "p-4 align-middle"

/* 行 */
TableRow: "border-b hover:bg-muted/50 transition-all duration-200"
```

**必須要件**:
- ヘッダー背景: `bg-muted/50`（明確な区別）
- ホバー効果: `hover:bg-muted/50`（視認性）
- セルパディング: 最低16px
- ボーダー: `border-border`（統一色）

#### モーダル・ダイアログ
```css
/* オーバーレイ */
DialogOverlay: "bg-black/50"  /* 50%透明度（修正：80%は強すぎ）*/

/* コンテンツ */
DialogContent: "bg-card text-card-foreground border border-border"

/* ヘッダー */
DialogTitle: "text-foreground font-semibold"
DialogDescription: "text-muted-foreground"
```

**必須要件**:
- オーバーレイ: 50%透明度（背景が見える）
- コンテンツ背景: `bg-card`（白またはカード色）
- テキスト: `text-card-foreground`（明確なコントラスト）
- ボーダー: `border-border`（明確な境界）

#### バッジ
```css
/* サイズ */
default: "px-3 py-1 text-xs"  /* 12px フォント */

/* バリエーション */
default: "bg-primary text-primary-foreground"
success: "bg-success text-success-foreground"
warning: "bg-warning text-warning-foreground"
destructive: "bg-destructive text-destructive-foreground"
secondary: "bg-secondary text-secondary-foreground"
```

**必須要件**:
- 角丸: `rounded-full`（ピル型）
- コントラスト比: 最低4.5:1
- パディング: 12px水平、4px垂直

#### フォーム要素
```css
/* Input, Textarea, Select */
base: "border-2 border-input bg-background text-foreground"
focus: "ring-2 ring-ring ring-offset-2"
disabled: "opacity-50 cursor-not-allowed"
error: "border-destructive ring-destructive"
```

**必須要件**:
- ボーダー: 2px（視認性）
- フォーカス: リング2px、オフセット2px
- プレースホルダー: `text-muted-foreground`
- エラー状態: 赤いボーダーとリング
- ラベル: 必須（アクセシビリティ）

### 5. アクセシビリティ要件

#### キーボードナビゲーション
- すべてのインタラクティブ要素にフォーカス可能
- フォーカスリング: `ring-2 ring-ring ring-offset-2`
- タブ順序: 論理的な順序を維持

#### カラーコントラスト
- **AAA基準（推奨）**: 7:1以上
- **AA基準（必須）**: 4.5:1以上
- ツール: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### ARIAラベル
- ボタン: `aria-label`（アイコンのみの場合）
- フォーム: `aria-describedby`（エラー・ヘルプテキスト）
- モーダル: `aria-modal="true"`、`role="dialog"`

#### スクリーンリーダー
- セマンティックHTML使用
- `sr-only`クラスで視覚的に隠れたテキスト提供

### 6. アニメーション

#### トランジション
```css
/* デフォルト */
transition-all duration-200 ease-in-out

/* インタラクション */
hover: 200ms
active: 150ms
focus: 100ms

/* ページ遷移 */
enter: 300ms
exit: 200ms
```

#### アニメーション削減
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7. レスポンシブブレークポイント

Tailwind CSS標準：
```css
sm: 640px   /* タブレット縦 */
md: 768px   /* タブレット横 */
lg: 1024px  /* ラップトップ */
xl: 1280px  /* デスクトップ */
2xl: 1536px /* 大画面 */
```

#### モバイルファースト設計
- デフォルト: モバイル（< 640px）
- プログレッシブエンハンスメント
- タッチ対応（最小44×44pxタップ領域）

## Consequences

### 良い影響
1. **一貫性**: 全ページで統一されたルック&フィール
2. **視認性**: WCAG AA準拠のコントラスト比で読みやすい
3. **保守性**: 明確なガイドラインで開発速度向上
4. **アクセシビリティ**: すべてのユーザーが利用可能
5. **拡張性**: 新しいコンポーネント追加が容易

### 課題
1. **移行コスト**: 既存コンポーネントの修正が必要
2. **学習曲線**: チーム全体でガイドライン共有が必要
3. **メンテナンス**: ガイドラインの継続的な更新

### 対応策
1. **段階的移行**: 優先度の高いコンポーネントから修正
2. **ドキュメント化**: Storybookやコンポーネントカタログの整備
3. **自動化**: ESLintルールでガイドライン遵守を強制
4. **レビュー**: PRでデザインガイドライン準拠をチェック

## 関連ADR
- ADR-001: Next.js with Vercel Architecture
- ADR-004: Development Guidelines and Best Practices
- ADR-005: UIライブラリとデータテーブルの選定

## 参照
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [shadcn/ui Design System](https://ui.shadcn.com/)
- [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design/overview)
