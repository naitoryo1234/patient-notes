# Vercel デプロイガイド (for Clinic CRM Lite)

## 概要
Clinic CRM Lite を Vercel にデプロイし、外部からアクセス可能なデモ環境を構築するための手順です。
ローカル開発では `SQLite` を使用していますが、Vercel のサーバーレス環境ではファイル書き込みができないため、データベースを **Vercel Postgres** に切り替える必要があります。

---

## 手順 1: Vercel プロジェクトの作成

1.  [Vercel Dashboard](https://vercel.com/dashboard) にアクセスします。
2.  **"Add New..."** -> **"Project"** をクリックします。
3.  GitHub リポジトリ (`clinic-crm-lite`) をインポートします。
4.  **Important**: まだ "Deploy" ボタンは押さないでください（環境変数未設定のため失敗します）。

## 手順 2: データベース (Vercel Postgres) の作成

1.  Vercel のプロジェクト設定画面で、**"Storage"** タブを開きます。
2.  **"Connect Store"** -> **"Create New"** -> **"Postgres"** を選択します。
3.  利用規約に同意し、Database Name (例: `clinic-crm-db`) を入力して作成します。
4.  作成完了後、自動的に環境変数がセットアップされます。
    - `POSTGRES_PRISMA_URL`
    - `POSTGRES_URL_NON_POOLING`
    - などが追加されていることを確認してください（Settings -> Environment Variables）。

## 手順 3: Prisma スキーマの変更

ローカルのコード (`schema.prisma`) を編集し、PostgreSQL 用の設定に変更します。

**`prisma/schema.prisma`**

```prisma
// [変更前]
// datasource db {
//   provider = "sqlite"
//   url      = env("DATABASE_URL")
// }

// [変更後]
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL") // Vercel Postgres Connection Pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // Direct Connection
}
```

> **注意**: この変更を行うと、ローカル環境でも Postgres が必要になります。
> デモ用に一時的に書き換えるか、ブランチを分けて管理することを推奨します。

## 手順 4: マイグレーションスクリプトの設定

Vercel でのビルド時にデータベースのマイグレーション（テーブル作成）を実行させるため、`package.json` を修正します。

**`package.json`**

```json
"scripts": {
  "build": "prisma generate && next build",
  // Vercelがビルド後に自動で実行するコマンドとして設定する場合もありますが、
  // 安全のため、デプロイ完了後に手動で実行するか、Build Commandをカスタマイズします。
}
```

**推奨: Build Command の上書き**
Vercel の Settings -> General -> **Build & Development Settings** にて：

- **Build Command**: `prisma generate && prisma migrate deploy && next build`

これにより、デプロイのたびに最新のスキーマがDBに適用されます。

## 手順 5: デプロイ実行

1.  変更（`schema.prisma`）を GitHub に Push します。
2.  Vercel が自動的にデプロイを開始します。
3.  ビルドログを確認し、マイグレーションとビルドが成功することを確認します。

## 手順 6: 初期データの投入（Seed）

デプロイ直後はデータベースが空です。アカウント機能がないため、データがないと画面確認ができません。
Vercel の管理画面から、あるいはローカルから本番DBに接続して Seed を実行する必要がありますが、最も簡単なのは「手動で最初の患者を登録する」ことです。

以上で、`https://your-project.vercel.app` のような URL でデモが可能になります。
