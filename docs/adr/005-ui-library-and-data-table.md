# ADR-005: UIライブラリとデータテーブルの選定

## Status
Superseded by Update 2025-01-10

## Context
work-managementプロジェクトにおいて、以下の要件を満たすUIコンポーネントライブラリとデータテーブル/グリッドライブラリを選定する必要がある：

### 要件
1. **ベースUIコンポーネント**
   - Next.js 15 + React 19対応
   - TypeScript完全対応
   - 既存のTailwind CSS 4との親和性
   - アクセシビリティ（a11y）対応
   - 無料で利用可能

2. **データテーブル/グリッド**
   - 工数管理などの表形式データ入力
   - ソート、フィルタリング、ページネーション
   - 行の追加、編集、削除
   - キーボードナビゲーション、コピー&ペースト（必須ではないが望ましい）
   - 将来的な拡張性（他のライブラリへの移行可能性）
   - 無料で利用可能

### 調査した選択肢

#### ベースUIライブラリ
- **shadcn/ui + Radix UI**: コピー&ペースト型、完全カスタマイズ可能、Tailwind CSS統合
- **MUI (Material-UI)**: 包括的コンポーネント、やや重量級
- **Chakra UI**: 使いやすいAPI、デザインシステム統合

#### データテーブル/グリッド
- **TanStack Table v8**: ヘッドレスUI、完全無料、軽量、柔軟
- **AG Grid Community**: 機能豊富、UIバッテリー込み、高度機能は有料
- **ReactGrid Community**: スプレッドシートライク、オープンソース
- **Handsontable**: Excel風UI、無料版は機能制限あり

## Decision
以下の技術スタックを採用する：

### ベースUIライブラリ
**shadcn/ui + Radix UI**

#### 採用理由
- Next.js 15 + React 19完全対応（2025年10月時点）
- 完全無料（MIT License）
- コピー&ペースト型アプローチ
  - 依存関係が最小限
  - コードの完全な所有権
  - カスタマイズが容易
- 既存のTailwind CSS 4と完璧に統合
- Radix UIによる高品質なアクセシビリティ
- TypeScript完全対応

### データテーブル/グリッド
**TanStack Table v8 + shadcn/ui Data Table**

#### 採用理由
- 完全無料（MIT License、全機能利用可能）
- ヘッドレスUIアーキテクチャ
  - UIとロジックの分離
  - 将来的な変更が容易
- shadcn/uiに実装テンプレートあり
- 豊富な機能
  - ソート、フィルタリング、ページネーション
  - 行選択、展開/折りたたみ
  - 列の表示/非表示、リサイズ
  - サーバーサイド/クライアントサイド両対応
- 軽量で高パフォーマンス
- TypeScript完全対応

### 実装アプローチ
1. **Phase 1（初期実装）**
   ```bash
   # shadcn/ui初期化
   npx shadcn@latest init

   # 基本UIコンポーネント
   npx shadcn@latest add button
   npx shadcn@latest add input
   npx shadcn@latest add form
   npx shadcn@latest add card
   npx shadcn@latest add dialog

   # データテーブル
   npx shadcn@latest add table
   npm install @tanstack/react-table
   ```

2. **Phase 2（拡張機能）**
   - キーボードナビゲーション強化
   - インライン編集機能
   - コピー&ペースト対応
   - 必要に応じてReactGridやAG Gridへの移行を検討

### ディレクトリ構成
```
components/
├── ui/                    # shadcn/uiベースコンポーネント
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── table.tsx
│   └── ...
├── data-table/           # TanStack Tableラッパー
│   ├── data-table.tsx
│   ├── data-table-toolbar.tsx
│   ├── data-table-pagination.tsx
│   └── columns.tsx
└── features/             # 機能別コンポーネント
    └── work-management/
        ├── work-table.tsx
        └── work-form.tsx
```

## Rationale

### shadcn/ui + Radix UIの選定理由
1. **依存関係の最小化**: コピー&ペースト型のため、必要なコンポーネントのみを導入
2. **完全なカスタマイズ性**: コードを直接編集可能
3. **アクセシビリティ**: Radix UIの高品質なa11y実装
4. **エコシステム**: Next.js + Tailwind CSSとの完璧な統合
5. **将来性**: React 19対応済み、活発なコミュニティ

### TanStack Tableの選定理由
1. **無料で全機能利用可能**: ライセンス費用なし
2. **ヘッドレスアーキテクチャ**: UIとロジックの分離により変更容易
3. **段階的な実装**: 基本機能から開始し、必要に応じて拡張
4. **移行容易性**: データ層を抽象化すれば他ライブラリへの移行も容易
5. **パフォーマンス**: 軽量で高速

### 代替案との比較
| 項目 | TanStack Table | AG Grid Community | ReactGrid |
|------|---------------|-------------------|-----------|
| ライセンス | MIT（完全無料） | MIT（基本機能のみ） | MIT（オープンソース） |
| UI | ヘッドレス | バッテリー込み | バッテリー込み |
| カスタマイズ性 | 高 | 中 | 中 |
| 実装工数 | 中（テンプレートあり） | 低 | 中 |
| Excel風体験 | 拡張必要 | 標準対応 | 標準対応 |
| 将来の拡張性 | 高 | 低（移行困難） | 中 |

## Consequences

### Positive
- **完全無料**: 全機能を無料で利用可能、コスト懸念なし
- **柔軟性**: コピー&ペースト型により完全なカスタマイズが可能
- **型安全性**: TypeScript完全対応、開発体験の向上
- **パフォーマンス**: 軽量なライブラリ、バンドルサイズの最小化
- **将来性**: ヘッドレスUIにより他ライブラリへの移行が容易
- **学習コスト**: shadcn/uiのドキュメントが充実、実装例が豊富

### Negative
- **初期実装工数**: ヘッドレスUIのため、UIの実装が必要
  - 緩和策: shadcn/uiのData Tableテンプレートを活用
- **Excel風機能**: キーボードナビゲーション、コピー&ペーストは追加実装が必要
  - 緩和策: 段階的に実装、必要に応じてライブラリ変更
- **メンテナンス**: コピーしたコンポーネントは自己管理が必要
  - 緩和策: 定期的なアップデート確認、テストカバレッジの確保

### Migration Path（将来的な移行）
Excel風の高度な機能が必須となった場合の移行パス：
1. **データ層の抽象化**: Repository/Service層でデータロジックを分離
2. **段階的移行**: 一部の画面からReactGridやAG Gridへ移行
3. **共存**: TanStack TableとReactGridを用途に応じて使い分け

## Implementation Notes

### インストール手順
```bash
# shadcn/ui初期化（対話型）
npx shadcn@latest init

# 必須コンポーネント
npx shadcn@latest add button input label form table
npx shadcn@latest add select checkbox dropdown-menu

# TanStack Table
npm install @tanstack/react-table
```

### 設定ファイル
`components.json`（shadcn/ui設定）:
```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### コーディング規約
- **コンポーネント**: Functional components with TypeScript interfaces
- **スタイリング**: Tailwind CSS with `cn()` utility for conditional classes
- **アクセシビリティ**: ARIA attributes and semantic HTML
- **テスト**: Unit tests for component behavior

## References
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [shadcn/ui Data Table Example](https://ui.shadcn.com/docs/components/data-table)
- [Next.js 15 + React 19 Compatibility](https://ui.shadcn.com/docs/react-19)

## Related ADRs
- ADR-001: Next.js with Vercel Architecture
- ADR-004: Development Guidelines and Best Practices

---

**作成日**: 2024-10-04
**最終更新**: 2025-01-10

---

## Update 2025-01-10: AG Grid採用への変更

### Status
Accepted

### Updated Decision
以下の技術スタックに変更する：

#### ベースUIライブラリ
**shadcn/ui + Radix UI**（変更なし）

#### データテーブル/グリッド
**AG Grid Community Edition** + **shadcn/ui Data Table**（併用）

### 変更理由
実際の開発・運用を通じて以下の課題とニーズが判明：

1. **ユーザビリティの向上**
   - Excel風の直感的な操作が必要
   - インライン編集機能の重要性
   - キーボードナビゲーションの必要性

2. **開発効率の向上**
   - AG Gridのバッテリー込み機能により開発工数削減
   - 豊富な機能がそのまま利用可能
   - メンテナンスコストの削減

3. **実装の現実性**
   - TanStack TableでExcel風の機能実装には大きな工数が必要
   - AG Grid Community Editionで十分な機能が無料利用可能
   - 現在両方の実装が存在し、AG Gridの方が評価が高い

### 新しい実装方針

#### データテーブル使い分け
- **AG Grid**: メインの工数管理、複雑なデータ操作が必要な画面
- **shadcn/ui Data Table**: シンプルな一覧表示、レポート画面

#### 実装アプローチ
1. **メイン機能（Work Logs）**: AG Gridを標準とする
2. **管理機能（Projects, Categories）**: 用途に応じて選択
3. **レポート機能**: shadcn/ui Data Tableを継続使用

### Updated Directory Structure
```
components/
├── ui/                    # shadcn/uiベースコンポーネント
├── data-table/           # TanStack Tableラッパー（レポート用）
├── ag-grid/              # AG Grid共通コンポーネント
│   ├── ag-grid-theme.css
│   └── grid-utils.ts
└── features/             # 機能別コンポーネント
    ├── work-logs/
    │   ├── ag-grid-work-log-table.tsx    # メイン
    │   └── work-log-table.tsx            # バックアップ
    └── admin/
        ├── projects/
        └── work-categories/
```

### Installation Updates
```bash
# AG Grid Community
npm install ag-grid-community ag-grid-react

# 既存のshadcn/ui + TanStack Tableは維持
npm install @tanstack/react-table
```

### Benefits of Updated Decision
1. **ユーザー体験の向上**: Excel風の直感的操作
2. **開発効率**: 機能豊富なAG Gridで実装工数削減
3. **柔軟性**: 用途に応じて両ライブラリを使い分け
4. **将来性**: Community Editionの範囲で十分、必要時にEnterprise移行可能

### Migration Strategy
1. **Phase 1**: Work LogsでAG Gridを標準化
2. **Phase 2**: 他の複雑なデータ操作画面をAG Gridに移行
3. **Phase 3**: シンプルな画面はshadcn/ui Data Tableを維持

### 学習リソース
- [AG Grid Community Documentation](https://www.ag-grid.com/documentation/)
- [AG Grid React Integration](https://www.ag-grid.com/react-data-grid/)
- [AG Grid Community vs Enterprise](https://www.ag-grid.com/license-pricing/)
