# ADR-006: AG Grid標準準拠の実装ガイドライン

## ステータス
承認済み

## コンテキスト
AG Gridを使用したデータテーブルコンポーネントの実装において、カスタム実装による問題が発生した：
- セルデータの消失問題
- データ同期の不整合
- 非標準的なイベントハンドリング
- 独自実装による保守性の低下

## 決定
AG Grid実装では**標準準拠を最優先**とし、以下のガイドラインに従う：

### 1. 基本原則
- **AG Grid標準を最優先**：公式ドキュメントの推奨パターンに従う
- **カスタム実装の最小化**：独自実装は必要最小限に留める
- **明示的な承認**：標準から外れる場合は事前にADRで文書化

### 2. データ管理の標準パターン

#### ✅ 推奨：AG Grid標準
```typescript
// 行追加
gridApi.applyTransaction({ add: [newRow], addIndex: 0 });

// 行削除  
gridApi.applyTransaction({ remove: selectedRows });

// データ取得
gridApi.forEachNode((node) => {
  if (node.data) currentData.push(node.data);
});
```

#### ❌ 非推奨：独自の状態管理
```typescript
// React stateとAG Grid内部データの重複管理
const [gridRowData, setGridRowData] = useState([]);
const [originalData, setOriginalData] = useState([]);
```

### 3. イベントハンドリングの標準パターン

#### ✅ 推奨：AG Grid標準イベント
```typescript
// セル値変更
onCellValueChanged: (event) => { /* 最小限の処理 */ }

// キーボード操作
onCellKeyDown: (event) => { /* 標準ショートカット */ }
```

#### ❌ 非推奨：独自イベント処理
```typescript
// valueParser内でのバリデーションとtoast表示
valueParser: (params) => {
  if (!isValid(params.newValue)) {
    toast.error("エラー"); // 非標準
    return params.oldValue;
  }
}
```

### 4. バリデーションの標準パターン

#### ✅ 推奨：保存時一括バリデーション
```typescript
const handleBatchSave = async () => {
  // AG Gridからデータ取得
  const currentData = [];
  gridApi.forEachNode(node => currentData.push(node.data));
  
  // 一括バリデーション
  const validationErrors = validateAllRows(currentData);
  
  // 視覚的フィードバック
  setFailedRowIds(new Set(validationErrors.keys()));
};
```

#### ❌ 非推奨：セル編集時の即座バリデーション
```typescript
// valueParserでのtoast表示は非標準
valueParser: (params) => {
  if (!valid) toast.error("エラー"); // 避けるべき
}
```

### 5. カスタマイゼーションが許可される範囲

#### ✅ 許可されるカスタマイゼーション
- **cellRenderer**: カスタム表示コンポーネント
- **cellEditor**: 専用入力コンポーネント  
- **valueFormatter**: 表示形式の変更
- **cellClass**: 条件付きスタイリング

#### ⚠️ 慎重に検討すべきカスタマイゼーション
- **valueGetter/valueSetter**: 必要最小限に留める
- **onCellValueChanged**: 複雑な処理は避ける
- **gridOptions**: 標準設定からの大幅な変更

### 6. AG Grid Community版における制約とカスタマイゼーション

#### クリップボード機能
AG Grid Community版では、Enterprise版のClipboard/RangeSelection機能が利用できないため、以下のカスタム実装を承認済み：

**✅ 承認済みカスタムクリップボード実装**
```typescript
// セル単位のコピー&ペースト（Ctrl+C / Ctrl+V）
onCellKeyDown: (event: CellKeyDownEvent) => {
  const { event: keyboardEvent, node, column } = event;
  
  // Ctrl+C: セル値のコピー
  if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'c') {
    const cellValue = node.data[column.getId()];
    navigator.clipboard.writeText(String(cellValue || ''));
  }
  
  // Ctrl+V: セル値のペースト（詳細フィールドでの複数行コンテンツサポート）
  if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'v') {
    // 実装詳細は省略
  }
}
```

**技術的根拠**: 
- Enterprise機能へのアップグレードまでの暫定措置
- Community版の制約を補完する必要最小限の実装
- 標準的なClipboard APIの使用

**機能仕様**:
- セル単位のコピー&ペースト（Ctrl+C / Ctrl+V）
- 詳細（Details）フィールドでの複数行コンテンツのサポート
- 通常フィールドでは最初の値のみ（タブ・改行区切りの最初の要素）
- バッチ編集モード有効時のみ動作

**将来計画**: Enterprise版導入時に標準機能へ移行予定

### 7. 標準から外れる場合の手順

1. **技術的必要性の明確化**
   - なぜ標準パターンでは実現できないのか
   - どのような問題を解決するのか

2. **ADRでの文書化**
   - 決定理由の詳細記録
   - 代替案の検討結果
   - 将来的な影響の評価

3. **レビューと承認**
   - チーム内でのレビュー
   - 技術的妥当性の確認

## 結果と影響

### ポジティブな影響
- **安定性向上**: 標準パターンによる予測可能な動作
- **保守性向上**: 公式ドキュメントとの整合性
- **学習コスト削減**: 標準的なAG Gridの知識が活用できる
- **バグ削減**: 独自実装による予期しない副作用を回避

### 制約とトレードオフ
- **柔軟性の制限**: カスタム要件への対応が制約される場合がある
- **実装時間**: 標準パターンの学習と適用に時間が必要

### 既存実装への影響
- **enhanced-work-log-table.tsx**: 標準準拠への大幅リファクタリング実施済み
- **enhanced-ag-grid.tsx**: 汎用コンポーネントとしての標準化完了

## 実装例

### 現在の標準準拠実装
```typescript
// 行追加（標準）
const handleRowAdd = useCallback(() => {
  const newRow = createEmptyRow();
  const result = gridApi.applyTransaction({ add: [newRow], addIndex: 0 });
  if (result.add?.length > 0) {
    toast.success("新しい行を追加しました（Ctrl+N で連続追加可能）");
  }
}, [gridApi]);

// バッチ保存（標準）
const handleBatchSave = useCallback(async () => {
  // AG Gridからデータ取得（単一の真実の源）
  const currentData = [];
  gridApi.forEachNode(node => {
    if (node.data) currentData.push(node.data);
  });
  
  // 変更の分類
  const { newRows, updatedRows, deletedRows } = categorizeChanges(currentData, originalData);
  
  // 一括API呼び出し
  await Promise.all([
    ...deletePromises,
    ...createPromises, 
    ...updatePromises
  ]);
}, [gridApi, originalData]);
```

## 関連文書
- [AG Grid公式ドキュメント](https://www.ag-grid.com/documentation/)
- [ADR-001: Next.js with Vercel Architecture](./001-nextjs-vercel-architecture.md)
- [ADR-005: UIライブラリとデータテーブルの選定](./005-ui-library-and-data-table.md)

## 更新履歴
- 2024-10-13: 初版作成 - AG Grid標準準拠ガイドライン策定