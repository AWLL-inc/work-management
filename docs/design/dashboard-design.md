# ダッシュボード機能 設計書

## 概要

個人とプロジェクトごとの工数消化状況をリアルタイムに可視化するダッシュボード機能を実装する。
チームメンバーの稼働状況も一目で把握できる統合ビューを提供する。

## 目的

### ユーザーのニーズ
1. **個人の工数状況を把握**
   - 今日、今週、今月の作業時間
   - プロジェクト別の工数配分
   - カテゴリ別の作業内訳

2. **プロジェクトの進捗を把握**
   - プロジェクトごとの総工数
   - 予定工数 vs 実績工数（将来拡張）
   - メンバー別の作業時間

3. **チーム全体の稼働状況を把握**
   - チームメンバーの今週の稼働状況
   - プロジェクト別のチーム工数
   - 未入力メンバーの確認

## データ設計

### 必要な集計データ

#### 1. 個人統計
- 今日の総工数
- 今週の総工数（月曜始まり）
- 今月の総工数
- プロジェクト別工数（期間指定）
- カテゴリ別工数（期間指定）
- 最近の工数記録（直近10件）

#### 2. プロジェクト統計
- プロジェクトごとの総工数
- プロジェクトごとのメンバー別工数
- プロジェクトごとのカテゴリ別工数
- 期間別の工数推移（日次・週次・月次）

#### 3. チーム統計
- チームメンバー別の総工数（期間指定）
- チーム全体の総工数
- プロジェクト別のチーム工数
- メンバーの稼働率（工数入力状況）

### データ取得最適化

#### キャッシング戦略
- ダッシュボードデータは5分間キャッシュ
- ユーザーが工数を登録・更新した際にキャッシュを無効化
- Redis を使用したキャッシュ管理（将来拡張）

#### クエリ最適化
- 集計クエリには適切なインデックスを使用
- PostgreSQL の集計関数を活用
- 不要なデータは取得しない（SELECT 文の最適化）

## API設計

### 1. 個人統計API

#### GET /api/dashboard/personal

個人の工数統計を取得。

**認証:** 必須

**クエリパラメータ:**
- `period` (optional): 集計期間
  - `today`: 今日（デフォルト）
  - `week`: 今週
  - `month`: 今月
  - `custom`: カスタム期間（startDate, endDate と併用）
- `startDate` (optional): 開始日（ISO 8601形式）
- `endDate` (optional): 終了日（ISO 8601形式）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "today": {
        "totalHours": "8.0",
        "logCount": 2
      },
      "thisWeek": {
        "totalHours": "32.5",
        "logCount": 8,
        "weekStart": "2024-10-21",
        "weekEnd": "2024-10-27"
      },
      "thisMonth": {
        "totalHours": "152.0",
        "logCount": 38,
        "monthStart": "2024-10-01",
        "monthEnd": "2024-10-31"
      }
    },
    "byProject": [
      {
        "projectId": "uuid",
        "projectName": "プロジェクトA",
        "totalHours": "40.0",
        "percentage": 26.3,
        "logCount": 10
      },
      {
        "projectId": "uuid",
        "projectName": "プロジェクトB",
        "totalHours": "32.5",
        "percentage": 21.4,
        "logCount": 8
      }
    ],
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "設計",
        "totalHours": "50.0",
        "percentage": 32.9,
        "logCount": 12
      },
      {
        "categoryId": "uuid",
        "categoryName": "実装",
        "totalHours": "62.0",
        "percentage": 40.8,
        "logCount": 15
      }
    ],
    "recentLogs": [
      {
        "id": "uuid",
        "date": "2024-10-26",
        "hours": "8.0",
        "projectName": "プロジェクトA",
        "categoryName": "実装"
      }
    ],
    "trend": {
      "daily": [
        {
          "date": "2024-10-21",
          "totalHours": "8.0"
        },
        {
          "date": "2024-10-22",
          "totalHours": "7.5"
        }
      ]
    }
  }
}
```

### 2. プロジェクト統計API

#### GET /api/dashboard/projects

プロジェクト別の工数統計を取得。

**認証:** 必須

**クエリパラメータ:**
- `period` (optional): 集計期間（personalと同じ）
- `startDate` (optional): 開始日
- `endDate` (optional): 終了日
- `projectId` (optional): 特定プロジェクトのみ取得
- `scope` (optional): データスコープ
  - `own`: 自分の工数のみ（デフォルト）
  - `team`: チーム全体の工数
  - `all`: 全体（admin のみ）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "projectId": "uuid",
        "projectName": "プロジェクトA",
        "projectDescription": "説明",
        "totalHours": "240.0",
        "memberCount": 5,
        "logCount": 60,
        "byMember": [
          {
            "userId": "uuid",
            "userName": "山田太郎",
            "totalHours": "80.0",
            "logCount": 20
          },
          {
            "userId": "uuid",
            "userName": "佐藤花子",
            "totalHours": "60.0",
            "logCount": 15
          }
        ],
        "byCategory": [
          {
            "categoryId": "uuid",
            "categoryName": "設計",
            "totalHours": "100.0",
            "percentage": 41.7
          },
          {
            "categoryId": "uuid",
            "categoryName": "実装",
            "totalHours": "140.0",
            "percentage": 58.3
          }
        ],
        "trend": {
          "daily": [
            {
              "date": "2024-10-21",
              "totalHours": "40.0"
            },
            {
              "date": "2024-10-22",
              "totalHours": "38.0"
            }
          ]
        }
      }
    ],
    "summary": {
      "totalProjects": 3,
      "totalHours": "520.0",
      "totalLogs": 130
    }
  }
}
```

### 3. チーム統計API

#### GET /api/dashboard/team

チームの工数統計を取得。

**認証:** 必須（チームメンバーのみ）

**クエリパラメータ:**
- `period` (optional): 集計期間
- `startDate` (optional): 開始日
- `endDate` (optional): 終了日
- `teamId` (optional): 特定チームのみ取得（admin/manager のみ）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "team": {
      "teamId": "uuid",
      "teamName": "開発チーム",
      "memberCount": 5
    },
    "summary": {
      "totalHours": "400.0",
      "averageHoursPerMember": "80.0",
      "totalLogs": 100
    },
    "byMember": [
      {
        "userId": "uuid",
        "userName": "山田太郎",
        "totalHours": "88.0",
        "logCount": 22,
        "lastLogDate": "2024-10-26",
        "workingDays": 11
      },
      {
        "userId": "uuid",
        "userName": "佐藤花子",
        "totalHours": "80.0",
        "logCount": 20,
        "lastLogDate": "2024-10-25",
        "workingDays": 10
      }
    ],
    "byProject": [
      {
        "projectId": "uuid",
        "projectName": "プロジェクトA",
        "totalHours": "240.0",
        "memberCount": 5,
        "percentage": 60.0
      },
      {
        "projectId": "uuid",
        "projectName": "プロジェクトB",
        "totalHours": "160.0",
        "memberCount": 3,
        "percentage": 40.0
      }
    ],
    "activityStatus": [
      {
        "userId": "uuid",
        "userName": "山田太郎",
        "hasLogToday": true,
        "hasLogThisWeek": true,
        "lastLogDate": "2024-10-26"
      },
      {
        "userId": "uuid",
        "userName": "佐藤花子",
        "hasLogToday": false,
        "hasLogThisWeek": true,
        "lastLogDate": "2024-10-25"
      }
    ]
  }
}
```

## UI設計

### 1. ダッシュボードレイアウト

**パス:** `/dashboard` または `/`（ログイン後のホーム）

#### デスクトップレイアウト
```
+----------------------------------------------------------+
|  ダッシュボード                                           |
+----------------------------------------------------------+
|  期間: [今日▼] [今週] [今月] [カスタム]                   |
+----------------------------------------------------------+
|  +----------------------+  +----------------------------+ |
|  | 個人の工数サマリー    |  |  プロジェクト別工数         | |
|  +----------------------+  +----------------------------+ |
|  | 今日:    8.0h       |  |  [円グラフ]                | |
|  | 今週:   32.5h       |  |  プロジェクトA  40.0h (26%)| |
|  | 今月:  152.0h       |  |  プロジェクトB  32.5h (21%)| |
|  +----------------------+  |  プロジェクトC  25.0h (16%)| |
|                            +----------------------------+ |
+----------------------------------------------------------+
|  +----------------------------------------------------+   |
|  | 工数推移グラフ（週次）                              |   |
|  +----------------------------------------------------+   |
|  | [折れ線グラフ]                                      |   |
|  | 月 火 水 木 金 土 日                                 |   |
|  | 8h 7h 8h 8h 8h 0h 0h                                |   |
|  +----------------------------------------------------+   |
+----------------------------------------------------------+
|  +-------------------------+  +------------------------+  |
|  | カテゴリ別内訳           |  | 最近の工数記録         |  |
|  +-------------------------+  +------------------------+  |
|  | [棒グラフ]               |  | 10/26 8h プロジェクトA |  |
|  | 設計:   50.0h (32.9%)   |  | 10/25 7h プロジェクトB |  |
|  | 実装:   62.0h (40.8%)   |  | 10/24 8h プロジェクトA |  |
|  | テスト: 20.0h (13.2%)   |  | [もっと見る]           |  |
|  +-------------------------+  +------------------------+  |
+----------------------------------------------------------+
|  チーム工数サマリー (チームメンバーのみ表示)               |
+----------------------------------------------------------+
|  +----------------------------------------------------+   |
|  | チーム: 開発チーム                                  |   |
|  | 今週の総工数: 200.0h  (平均: 40.0h/人)              |   |
|  +----------------------------------------------------+   |
|  | メンバー稼働状況                                    |   |
|  | +------------------------------------------------+ |   |
|  | | 山田太郎  | 88.0h | ✅今日入力済み             | |   |
|  | | 佐藤花子  | 80.0h | ⚠️ 今日未入力              | |   |
|  | | 鈴木一郎  | 72.0h | ✅今日入力済み             | |   |
|  | +------------------------------------------------+ |   |
|  +----------------------------------------------------+   |
+----------------------------------------------------------+
```

#### モバイルレイアウト
```
+---------------------------+
| ダッシュボード             |
+---------------------------+
| 期間: [今週 ▼]            |
+---------------------------+
| 個人サマリー              |
| 今日:    8.0h            |
| 今週:   32.5h            |
| 今月:  152.0h            |
+---------------------------+
| プロジェクト別            |
| [円グラフ]                |
| プロジェクトA  40.0h     |
| プロジェクトB  32.5h     |
+---------------------------+
| 工数推移                  |
| [折れ線グラフ]            |
+---------------------------+
| カテゴリ別                |
| 設計:   50.0h            |
| 実装:   62.0h            |
+---------------------------+
| 最近の記録                |
| 10/26 8h プロジェクトA   |
| 10/25 7h プロジェクトB   |
+---------------------------+
| チーム工数                |
| 山田太郎  88.0h ✅       |
| 佐藤花子  80.0h ⚠️       |
+---------------------------+
```

### 2. コンポーネント設計

#### PersonalSummaryCard
個人の工数サマリーを表示するカード。

```typescript
interface PersonalSummaryCardProps {
  summary: {
    today: { totalHours: string; logCount: number };
    thisWeek: { totalHours: string; logCount: number };
    thisMonth: { totalHours: string; logCount: number };
  };
}
```

#### ProjectDistributionChart
プロジェクト別工数の円グラフ。

```typescript
interface ProjectDistributionChartProps {
  data: Array<{
    projectName: string;
    totalHours: string;
    percentage: number;
  }>;
}
```

#### WorkTrendChart
工数推移の折れ線グラフ。

```typescript
interface WorkTrendChartProps {
  data: Array<{
    date: string;
    totalHours: string;
  }>;
  period: 'daily' | 'weekly' | 'monthly';
}
```

#### CategoryBreakdownChart
カテゴリ別工数の棒グラフ。

```typescript
interface CategoryBreakdownChartProps {
  data: Array<{
    categoryName: string;
    totalHours: string;
    percentage: number;
  }>;
}
```

#### RecentWorkLogs
最近の工数記録一覧。

```typescript
interface RecentWorkLogsProps {
  logs: Array<{
    id: string;
    date: string;
    hours: string;
    projectName: string;
    categoryName: string;
  }>;
  maxItems?: number;
}
```

#### TeamActivityTable
チームメンバーの稼働状況テーブル。

```typescript
interface TeamActivityTableProps {
  teamName: string;
  summary: {
    totalHours: string;
    averageHoursPerMember: string;
  };
  members: Array<{
    userId: string;
    userName: string;
    totalHours: string;
    hasLogToday: boolean;
    lastLogDate: string;
  }>;
}
```

## リアルタイム更新

### 更新戦略

#### オプション1: ポーリング（初期実装推奨）
- 定期的にAPIを呼び出してデータを更新
- 更新間隔: 30秒〜1分
- 実装が簡単、サーバー負荷が低い

```typescript
// useEffect でのポーリング実装例
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 30000); // 30秒ごと

  return () => clearInterval(interval);
}, []);
```

#### オプション2: Server-Sent Events（将来拡張）
- サーバーからクライアントへのプッシュ通知
- 工数が登録された際にリアルタイム更新
- より効率的だが実装が複雑

#### オプション3: WebSocket（将来拡張）
- 双方向通信
- チャット機能などと併用する場合に適している

### 実装方針
- Phase 1: ポーリング（30秒間隔）
- Phase 2: Server-Sent Events でのプッシュ更新
- Phase 3: WebSocket への移行（必要に応じて）

## データビジュアライゼーション

### グラフライブラリ

#### 推奨: Recharts
- React 専用の宣言的グラフライブラリ
- TypeScript サポートが充実
- レスポンシブデザイン対応
- カスタマイズ性が高い

```bash
npm install recharts
```

#### 代替案: Chart.js (react-chartjs-2)
- 豊富な機能
- パフォーマンスが良い
- カスタマイズが柔軟

### グラフの種類

1. **円グラフ（Pie Chart）**
   - プロジェクト別工数の割合
   - カテゴリ別工数の割合

2. **棒グラフ（Bar Chart）**
   - カテゴリ別工数の比較
   - メンバー別工数の比較

3. **折れ線グラフ（Line Chart）**
   - 日次・週次の工数推移
   - プロジェクトごとの推移

4. **ヒートマップ（将来拡張）**
   - メンバーの稼働カレンダー
   - プロジェクトの活動状況

## パフォーマンス最適化

### 1. データ取得の最適化

#### 集計クエリの最適化
```sql
-- プロジェクト別集計（最適化例）
SELECT
  p.id,
  p.name,
  SUM(CAST(wl.hours AS DECIMAL)) as total_hours,
  COUNT(wl.id) as log_count
FROM work_logs wl
INNER JOIN projects p ON wl.project_id = p.id
WHERE
  wl.user_id = $1
  AND wl.date >= $2
  AND wl.date <= $3
GROUP BY p.id, p.name
ORDER BY total_hours DESC;
```

#### インデックスの活用
- `work_logs` テーブルの既存インデックスを活用
  - `(user_id, date)` - ユーザーの期間指定検索
  - `(project_id)` - プロジェクト別集計
  - `(category_id)` - カテゴリ別集計

### 2. フロントエンド最適化

#### React のメモ化
```typescript
// useMemo でグラフデータをメモ化
const chartData = useMemo(() => {
  return transformToChartData(dashboardData);
}, [dashboardData]);

// React.memo でコンポーネントをメモ化
export const ProjectChart = React.memo(ProjectChartComponent);
```

#### 遅延ロード
```typescript
// グラフコンポーネントの遅延ロード
const ProjectChart = lazy(() => import('./ProjectChart'));
const TrendChart = lazy(() => import('./TrendChart'));
```

### 3. キャッシング

#### クライアントサイドキャッシュ
- React Query / SWR を使用
- データの自動再検証
- バックグラウンド更新

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['dashboard', 'personal', period],
  queryFn: () => fetchPersonalStats(period),
  staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
  refetchInterval: 30 * 1000, // 30秒ごとに再検証
});
```

## セキュリティ考慮事項

### 1. データアクセス制御
- ユーザーは自分のデータのみ取得可能
- チーム統計はチームメンバーのみアクセス可能
- 管理者権限の適切なチェック

### 2. 集計データの検証
- 異常な値のフィルタリング
- SQL インジェクション対策（Drizzle ORM 使用）
- レート制限（頻繁なリクエストの防止）

### 3. 機密情報の除外
- レスポンスに不要な個人情報を含めない
- 必要最小限のデータのみ返す

## テスト計画

### 1. ユニットテスト
- 集計ロジックのテスト
- データ変換関数のテスト
- グラフデータ生成のテスト

### 2. 統合テスト
- API エンドポイントのテスト
- 権限チェックのテスト
- エラーハンドリングのテスト

### 3. E2Eテスト
- ダッシュボードの表示テスト
- 期間切り替えのテスト
- グラフの描画テスト
- リアルタイム更新のテスト

### 4. パフォーマンステスト
- 大量データでの集計速度
- API レスポンスタイム
- フロントエンドのレンダリング速度

## 実装順序

### Sprint 1: バックエンドAPI
1. 個人統計API の実装
2. プロジェクト統計API の実装
3. チーム統計API の実装
4. 集計ロジックの最適化

### Sprint 2: フロントエンド基盤
1. ダッシュボードページの作成
2. 基本レイアウトの実装
3. データ取得ロジックの実装
4. React Query の統合

### Sprint 3: データビジュアライゼーション
1. グラフライブラリの導入
2. 各種グラフコンポーネントの実装
3. レスポンシブデザイン対応
4. アニメーション・インタラクション

### Sprint 4: リアルタイム更新
1. ポーリングの実装
2. 自動更新機能
3. エラーハンドリング
4. ローディング状態の最適化

### Sprint 5: テスト & 最適化
1. ユニットテスト・統合テストの追加
2. E2Eテストの追加
3. パフォーマンステスト
4. アクセシビリティ対応

## アクセシビリティ

### WCAG 2.1 準拠
- キーボードナビゲーション対応
- スクリーンリーダー対応
- カラーコントラスト比の確保（4.5:1以上）
- ARIA属性の適切な使用

### グラフのアクセシビリティ
- グラフの代替テキスト（alt属性）
- データテーブルでの代替表示オプション
- カラーブラインド対応（色のみに依存しない）

## 拡張性

### 将来の機能拡張

1. **予実管理**
   - プロジェクトごとの予定工数設定
   - 予定 vs 実績の比較グラフ
   - 進捗率の自動計算

2. **目標設定**
   - 個人の月間目標工数
   - チームの目標達成率
   - 目標に対する進捗アラート

3. **カスタムダッシュボード**
   - ユーザーごとのウィジェット配置
   - 表示項目のカスタマイズ
   - ダッシュボードテンプレート

4. **エクスポート機能**
   - ダッシュボードのPDF出力
   - Excel形式でのデータエクスポート
   - レポート自動生成

5. **アラート・通知**
   - 未入力日の通知
   - 異常値の検出
   - 目標達成の通知

## まとめ

このダッシュボード機能により、以下が実現されます:

✅ 個人の工数状況をリアルタイムに把握
✅ プロジェクトごとの進捗を可視化
✅ チーム全体の稼働状況を一目で確認
✅ データビジュアライゼーションによる直感的な理解
✅ パフォーマンスとセキュリティを両立
✅ 将来の機能拡張に対応した設計

---

**作成日:** 2024-10-26
**バージョン:** 1.0
