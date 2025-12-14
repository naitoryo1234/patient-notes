# ブランチ管理ドキュメント

**更新日**: 2025-12-12

---

## 現在のブランチ構成

| ブランチ名 | 役割 | 状態 |
|-----------|------|------|
| `main` | 本番ブランチ | ✅ 最新（DEMO モード + Toast通知 + ダッシュボード最適化を含む） |
| `backup/main-pre-demo-mode` | バックアップ | 📦 DEMO モード実装前の状態を保存 |
| `feature/dashboard-optimization` | 開発ブランチ | 完了・main にマージ済み |
| `release/v1.1.0` | リリースブランチ | 過去リリース |
| `milestone/v1.1_ui_ux_improvements` | マイルストーン | 過去作業 |
| `feature/electron-init` | 開発ブランチ | 🚧 Electron環境構築 (Phase 11) |

---

## ブランチの詳細

### `main` - 本番ブランチ
- **用途**: Vercel で Production としてデプロイされるブランチ
- **内容**: 
  - デモモード機能（`NEXT_PUBLIC_DEMO_MODE=true`）
  - Toast 通知システム
  - ダッシュボード検索パネル改善
  - カルテ登録バリデーション強化
- **最新コミット**: `561eee9`

### `backup/main-pre-demo-mode` - バックアップ
- **用途**: DEMO モード実装前の状態を復元したい場合に使用
- **復元方法**:
  ```bash
  git checkout backup/main-pre-demo-mode
  # または main をこの状態に戻す場合
  git checkout main
  git reset --hard backup/main-pre-demo-mode
  git push origin main --force
  ```

> ⚠️ **注意**: `--force` プッシュは履歴を書き換えるため、慎重に実行してください。

---

## 今後の運用方針

### 新機能開発時
```bash
git checkout main
git pull origin main
git checkout -b feature/新機能名
# 開発作業...
git push origin feature/新機能名
# GitHubでPRを作成 → main にマージ
```

### リリース時
```bash
git checkout main
git pull origin main
git tag v1.2.0  # 適切なバージョン
git push origin v1.2.0
```

---

## Vercel デプロイ設定

| 設定項目 | 値 |
|---------|-----|
| Production Branch | `main` |
| Preview Branches | `feature/*`, `release/*` |
| Ignored Build Step | なし（全ブランチビルド） |

### 環境変数（DEMO モード用）
```
NEXT_PUBLIC_DEMO_MODE=true
DEMO_FIXED_DATE=2025-01-15
```

---

## 参考: Git コマンド一覧

```bash
# ブランチ一覧を確認
git branch -a

# リモートの最新状態を取得
git fetch origin

# 不要なローカルブランチを削除
git branch -d feature/dashboard-optimization

# 不要なリモートブランチを削除
git push origin --delete ブランチ名
```
