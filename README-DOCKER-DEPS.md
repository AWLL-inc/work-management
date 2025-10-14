# Docker環境での依存関係問題の解決方法

## 問題
Docker環境で新しく追加された依存関係（`@radix-ui/react-popover`, `cmdk`等）が正しく解決されない。

## 原因
- `node_modules_volume` 名前付きボリュームが古い依存関係をキャッシュしている
- ローカルの `package.json` 更新がDocker内に反映されていない

## 解決方法

### 方法1: 完全クリーンビルド（推奨）
```bash
# 作成したスクリプトを実行
./scripts/docker-clean-rebuild.sh
```

### 方法2: 手動でのクリーンアップ
```bash
# 1. コンテナを停止
docker compose down

# 2. node_modules ボリュームを削除
docker volume rm work-management_node_modules_volume
docker volume rm work-management_next_build_volume

# 3. 再ビルド
docker compose build --no-cache

# 4. 起動
docker compose up -d

# 5. 依存関係を再インストール
docker compose exec app npm install
```

### 方法3: コンテナ内で直接インストール
```bash
# 実行中のコンテナ内で依存関係をインストール
docker compose exec app npm install @radix-ui/react-popover @radix-ui/react-icons cmdk react-day-picker date-fns

# または shadcn CLI を使用
docker compose exec app npx shadcn@latest add popover
docker compose exec app npx shadcn@latest add command
```

### 方法4: 開発時の推奨アプローチ
```bash
# ローカル環境で開発し、Dockerは本番環境のみで使用
npm run dev  # ローカル開発

# Docker は本番テスト時のみ
docker compose -f docker-compose.prod.yml up
```

## 予防策

### package.json更新時の手順
1. ローカルで依存関係を追加
2. `package.json` と `package-lock.json` をコミット
3. Docker環境を更新:
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

### .dockerignore の確認
以下がIgnoreされていないことを確認:
- `package.json`
- `package-lock.json`

## トラブルシューティング

### エラー: Module not found
```bash
# コンテナ内の依存関係を確認
docker compose exec app npm list @radix-ui/react-popover

# 再インストール
docker compose exec app npm install
```

### キャッシュ問題
```bash
# Docker キャッシュをクリア
docker system prune -a
```