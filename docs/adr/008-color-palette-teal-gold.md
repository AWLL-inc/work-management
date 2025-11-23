# ADR-008: カラーパレット更新（Teal + Gold）

## Status
Accepted (2025-01-23)

## Context
work-managementプロジェクトにおいて、統一感のあるブランディングとユーザーエクスペリエンスの向上を目的として、カラーパレットの見直しを実施した。

### 背景
- 既存のUIデザインプロトタイプ（`code.html`）がTeal + Goldのカラーパレットを採用
- ブランディングの統一性と視認性の向上が必要
- ダークモード対応の強化が求められていた

### 従来のカラーパレット
- **Primary**: Blue系（特定の色指定なし）
- **Accent**: 標準のTailwindカラー
- **Background**: デフォルトのグレー系

### 課題
1. UIプロトタイプとの不整合
2. ブランディングカラーの未定義
3. ダークモードでの視認性の問題
4. カラーパレットの文書化不足

## Decision
以下のカラーパレットを採用し、プロジェクト全体で統一する：

### メインカラー

#### Primary（プライマリ）
- **色**: Teal（ティール）
- **Hex**: `#5AB5B2`
- **HSL**: `hsl(178, 40%, 53%)`
- **用途**:
  - プライマリボタン
  - リンク
  - フォーカス状態
  - アクティブな要素
  - ブランドアクセント

#### Accent（アクセント）
- **色**: Gold（ゴールド）
- **Hex**: `#D9A62E`
- **HSL**: `hsl(43, 70%, 52%)`
- **用途**:
  - 重要なアクション（追加ボタンなど）
  - ハイライト
  - 警告・注意喚起（警告レベルではない）
  - セカンダリアクセント

### 背景・サーフェスカラー

#### ライトモード
- **Background**: `#F8FAFC` (Light Gray)
- **Foreground**: `#020817` (Dark Text)
- **Card**: `#FFFFFF` (White)
- **Muted**: `#F1F5F9` (Subtle Gray)
- **Border**: `#E2E8F0` (Light Border)

#### ダークモード（GitHub風）
- **Background**: `#0d1117` (Very Dark Blue-Gray)
- **Foreground**: `#e6edf3` (Light Text)
- **Card**: `#161b22` (Dark Card)
- **Muted**: `#21262d` (Subtle Dark)
- **Border**: `#30363d` (Dark Border)

### セマンティックカラー

#### Success（成功）
- **Hex**: `#22C55E`
- **HSL**: `hsl(142, 71%, 45%)`

#### Warning（警告）
- **Hex**: `#F59E0B`
- **HSL**: `hsl(38, 92%, 50%)`

#### Destructive（削除・エラー）
- **Hex**: `#EF4444`
- **HSL**: `hsl(0, 84%, 60%)`

#### Info（情報）
- **Hex**: `#0EA5E9`
- **HSL**: `hsl(199, 89%, 48%)`

## Implementation

### 実装箇所

#### 1. グローバルスタイル（`app/globals.css`）
```css
:root {
  /* Primary - Teal */
  --primary: 178 40% 53%; /* #5AB5B2 */
  --primary-foreground: 0 0% 100%;

  /* Accent - Gold */
  --accent: 43 70% 52%; /* #D9A62E */
  --accent-foreground: 0 0% 100%;

  /* ... その他の変数 */
}

.dark {
  /* GitHub-inspired dark mode */
  --background: 210 24% 7%; /* #0d1117 */
  --foreground: 214 33% 91%; /* #e6edf3 */
  --card: 215 28% 11%; /* #161b22 */
  /* ... */
}
```

#### 2. Tailwindテーマ統合
```css
@theme inline {
  --color-primary: hsl(var(--primary));
  --color-accent: hsl(var(--accent));
  /* ... */
}
```

#### 3. コンポーネントでの使用
```tsx
// Button with primary color
<Button className="bg-primary hover:bg-primary/90">
  Primary Action
</Button>

// Accent button
<Button className="bg-accent hover:bg-accent/90">
  Add New
</Button>
```

### AG Grid統合
AG Gridテーマもカラーパレットに準拠：
```css
.ag-theme-quartz {
  --ag-foreground-color: hsl(var(--foreground));
  --ag-background-color: hsl(var(--background));
  --ag-header-background-color: hsl(var(--card));
  --ag-odd-row-background-color: hsl(var(--muted) / 0.3);
}
```

## Rationale

### Teal（#5AB5B2）を採用した理由
1. **視認性**: Blue系より落ち着いた印象で、長時間の作業に適している
2. **アクセシビリティ**: ほとんどの色覚特性に対応（色覚多様性対応）
3. **ブランディング**: 技術系プロダクトに適した信頼感のある色
4. **差別化**: 一般的なBlueから差別化できる独自性

### Gold（#D9A62E）を採用した理由
1. **コントラスト**: Tealとの相性が良く、視覚的なアクセントとして効果的
2. **行動喚起**: 重要なアクションに注目を集める効果
3. **温かみ**: Tealのクールな印象を補完し、バランスの取れたUI
4. **プレミアム感**: Goldの持つ価値・品質のイメージ

### GitHub風ダークモードの採用理由
1. **開発者親和性**: エンジニア向けプロダクトとして親しみやすい
2. **実績ある配色**: GitHubの長年の実績とユーザビリティ研究の成果
3. **目に優しい**: 深い青みがかった黒で目の疲労を軽減
4. **コントラスト**: 適切なコントラスト比でアクセシビリティ確保

## Consequences

### ポジティブな影響
1. **ブランディング統一**: UIプロトタイプと実装の一貫性確保
2. **ユーザビリティ向上**: 視認性とアクセシビリティの改善
3. **保守性**: カラーパレットの明確な定義により変更が容易
4. **拡張性**: CSS変数により、将来的なテーマ切り替えも可能

### ネガティブな影響・考慮事項
1. **既存コンポーネントの更新**: 段階的な移行が必要
2. **カスタムカラーの削減**: 原則としてパレット内の色のみ使用
3. **学習コスト**: チームメンバーへの新しいカラー規則の周知

### 今後の対応
1. **カラーガイドライン**: デザインシステム文書の整備
2. **Storybook統合**: カラーパレットのビジュアルドキュメント化
3. **アクセシビリティテスト**: コントラスト比の定期的な検証
4. **ダークモード最適化**: ユーザーフィードバックに基づく調整

## Related Decisions
- [ADR-001: Next.js with Vercel Architecture](./001-nextjs-vercel-architecture.md) - Tailwind CSS統合
- [ADR-005: UIライブラリとデータテーブルの選定](./005-ui-library-and-data-table.md) - shadcn/ui統合
- [ADR-006: Design System Guidelines](./006-design-system-guidelines.md) - デザインシステム全体

## References
- `app/globals.css` - カラーパレット定義
- `code.html` - UIプロトタイプ（カラーパレット参考元）
- [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [GitHub Primer Design System](https://primer.style/foundations/color)

---

**決定日**: 2025-01-23
**最終更新**: 2025-01-23
**ステータス**: Accepted
