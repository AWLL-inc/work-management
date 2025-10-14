export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>
      <div className="grid gap-4">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">機能一覧</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• ユーザー申請 - インクリメンタルサーチ機能を持つ承認者選択</li>
            <li>• AG Grid - 行複製、戻す、やり直しボタンの活性化制御</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
