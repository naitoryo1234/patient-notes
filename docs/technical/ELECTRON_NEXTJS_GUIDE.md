# Electron + Next.js Standalone 統合ガイド

本ドキュメントは、Next.js（Server Actions使用）をElectronアプリとしてパッケージングする際の技術的なガイドです。

---

## 🏗️ アーキテクチャ: 内蔵サーバー方式

### 方式の選定

| 方式 | Server Actions | 実装難易度 | 採用 |
|:---|:---|:---|:---|
| Static Export (`output: 'export'`) | ❌ 使用不可 | 低 | - |
| IPC通信への書き換え | ⚠️ 全Actions書き換え | 高 | - |
| **内蔵サーバー方式** | ✅ そのまま使用可 | 中 | ✅ |

### 仕組み

```
Electron Main Process
    ↓ spawn('node', ['server.js'])
Next.js Standalone Server (localhost:3000)
    ↑ loadURL()
Electron Renderer (BrowserWindow)
```

Electronのメインプロセスから`child_process.spawn`でNext.jsサーバーを起動し、準備完了後にBrowserWindowでURLを読み込む。

---

## ⚠️ 遭遇した問題と解決策

### 1. 本番モードの判定失敗

**症状**: パッケージ版で開発モード扱いになり、localhost:3000に接続しようとして失敗

**原因**: `process.env.NODE_ENV !== 'production'` はパッケージ後も機能しない

**解決策**:
```javascript
const isDev = !app.isPackaged;  // Electron提供のプロパティを使用
```

---

### 2. サーバーがホスト名でリッスン

**症状**: `ERR_CONNECTION_REFUSED` でlocalhost:3000に接続失敗

**原因**: Next.js standaloneはデフォルトでPCのホスト名（例: `kcrugby`）でリッスンする

**解決策**:
```javascript
serverProcess = spawn('node', [serverPath], {
    env: {
        ...process.env,
        PORT: '3000',
        HOSTNAME: 'localhost',  // ← これを追加
        NODE_ENV: 'production',
    },
});
```

---

### 3. 静的ファイル（CSS/JS）が404

**症状**: ダッシュボードは表示されるがCSSが崩れる、DevToolsで大量の404エラー

**原因**: Next.js standaloneビルドでは`static`と`public`フォルダが自動的にコピーされない

**解決策**: ビルド後に手動でコピー
```bash
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

`package.json`に自動化:
```json
"electron:build": "npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && electron-builder"
```

---

### 4. preload.js not found

**症状**: DevToolsでpreloadスクリプトが見つからないエラー

**原因**: `main/index.js`でpreloadを参照しているがファイルが存在しない

**解決策**: `main/preload.js`を作成
```javascript
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
});
```

---

### 5. winCodeSignダウンロード失敗

**症状**: electron-builderがネットワークエラーで停止

**原因**: ファイアウォール/プロキシによるダウンロードブロック

**解決策**: 手動ダウンロード
1. https://github.com/AzureSignTool/winCodeSign/releases から `.7z` をダウンロード
2. 7-Zipで展開
3. `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\` に配置

---

## 📂 ファイル構成

```
/
├── main/
│   ├── index.js       # Electronメインプロセス
│   └── preload.js     # プリロードスクリプト
├── .next/
│   └── standalone/    # Next.jsビルド出力
│       ├── server.js
│       ├── .next/
│       │   └── static/  # ← ビルド後にコピー必須
│       └── public/      # ← ビルド後にコピー必須
├── electron-builder.yml
└── package.json
```

---

## 🔧 ビルドコマンド

```bash
# 開発モード（Next.js dev + Electron）
npm run electron

# 本番ビルド（exe生成）
npm run electron:build
# → dist/win-unpacked/Customer Notebook.exe
```

---

## 📝 注意点

- **asar無効化**: 現在`asar: false`で直接ファイル配置。セキュリティのため将来的にasar有効化を検討
- **認証**: 本番exeでは`.env`がstandalone内にコピーされるため、設定に注意
- **Prisma**: standaloneにはPrismaのquery engineバイナリが含まれる

---

*最終更新: 2025-12-14*
