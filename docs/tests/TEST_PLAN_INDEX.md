# 🧪 テスト仕様書インデックス (Test Plan Index)

## 📌 概要
本ドキュメントは、システム全体の動作確認手順書の一覧と、テストID体系を定義します。

---

## 📂 手順書一覧

| # | ファイル名 | 対象機能 | シナリオ数 |
|---|-----------|---------|----------|
| 1 | [TEST_PLAN_DASHBOARD.md](./TEST_PLAN_DASHBOARD.md) | ダッシュボード | 14件 |
| 2 | [TEST_PLAN_PATIENT.md](./TEST_PLAN_PATIENT.md) | 顧客管理 | 17件 |
| 3 | [TEST_PLAN_APPOINTMENT.md](./TEST_PLAN_APPOINTMENT.md) | 予約管理 | 26件 |
| 4 | [TEST_PLAN_CALENDAR.md](./TEST_PLAN_CALENDAR.md) | カレンダー | 24件 |
| 5 | [TEST_PLAN_RECORD.md](./TEST_PLAN_RECORD.md) | カルテ/記録 | 21件 |
| 6 | [TEST_PLAN_SETTINGS.md](./TEST_PLAN_SETTINGS.md) | 設定/認証 | 26件 |
| - | **合計** | - | **128件** |

---

## 🔤 テストID体系

| プレフィックス | 領域 | 例 |
|--------------|------|-----|
| DA- | ダッシュボード (Dashboard) | DA-01, DA-02 |
| PS- | 患者検索 (Patient Search) | PS-01, PS-02 |
| NAV- | ナビゲーション | NAV-01 |
| PT- | 患者管理 (Patient) | PT-01, PT-02 |
| AP- | 予約管理 (Appointment) | AP-01, AP-02 |
| C- | カレンダー表示 (Calendar) | C-01, C-02 |
| F- | フィルタ (Filter) | F-01, F-02 |
| P- | 永続化 (Persistence) | P-01 |
| D- | 詳細表示 (Details) | D-01, D-02 |
| N- | 新規作成 (New) | N-01 |
| U- | URL連携 | U-01 |
| RC- | 記録 (Record) | RC-01, RC-02 |
| AI- | AI取込 | AI-01, AI-02 |
| AT- | 添付ファイル (Attachment) | AT-01, AT-02 |
| OT- | 操作者追跡 (Operator Tracking) | OT-01 |
| ST- | スタッフ (Staff) | ST-01, ST-02 |
| AU- | 認証 (Authentication) | AU-01, AU-02 |
| PL- | プラグイン (Plugin) | PL-01 |
| BK- | バックアップ (Backup) | BK-01, BK-02 |
| SY- | システム (System) | SY-01 |
| ENV- | 環境依存 (Environment) | ENV-01 |

---

## ✅ テスト結果記録の使い方

各手順書には「✅ テスト実施記録」セクションがあります。

### 記録方法
1. テスト実施後、該当IDの行を以下の形式で更新:
   ```
   | DA-01 | ✅ | 2025-12-15 10:30 | 山田 | - |
   ```
2. 失敗した場合は `❌` を記入し、備考欄に問題の概要を記載

### 凡例
| 記号 | 意味 |
|:---:|:---|
| ✅ | 通過（期待通りの動作） |
| ❌ | 失敗（バグ発見） |
| ⬜ | 未実施 |

---

## 更新履歴

| 日付 | 内容 |
|:---|:---|
| 2025-12-15 | `docs/tests/`フォルダに移動、テスト結果記録セクションを追加 |
| 2025-12-15 | 初版作成。6種類の手順書、128件のテストシナリオを定義 |
