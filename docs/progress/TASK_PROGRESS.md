# 📋 機能実装状況 & タスクリスト (Clinic CRM Lite)

## ✅ 実装完了 (Completed)

### Phase 1: プロジェクト基盤 (Base Kit Setup)
- [x] プロジェクト初期化 (Next.js, Prisma, SQLite)
- [x] デザインシステム基盤 (Tailwind CSS, index.css)
- [x] データベーススキーマ設計 (Patient, ClinicalRecord)

### Phase 2: 患者管理 (Patient Management)
- [x] 患者一覧画面 & 検索機能 (名前・かな)
- [x] 患者詳細画面 (プロフィール表示)
- [x] 新規患者登録フォーム
- [x] 患者情報の編集機能

### Phase 3: カルテ記録 (Clinical Records)
- [x] SOAP形式での記録入力フォーム
- [x] 過去の記録タイムライン表示
- [x] タグ付け機能（JSON保存）
- [x] 画像添付のプレースホルダー（DB設計済み）

### Phase 4: AI テキスト取込 (AI Import Beta)
- [x] 患者登録 AIパース (氏名, 生年月日, メモ等)
- [x] カルテ記録 AIパース (S, O, A, P, Tags)
- [x] AI取込時の確認画面 (Confirm Step)
- [x] 類似患者の重複チェック & 警告表示

### Phase 5 & 6: 予約管理 (Appointments & Dashboard)
- [x] 独立した予約テーブル (`Appointment`) の作成
- [x] ダッシュボード「本日の来院予定」パネル
- [x] 予約の自動ハイライト (直近1時間, 来院時刻)
- [△] 次回予約の簡易登録ボタン (Createのみ)
- [x] 予約の変更・キャンセル機能 (Phase 8で実装)

### Phase 7: 予約連携の強化 (Completed)
- [x] **カルテ連携**: カルテ一覧や詳細に「次回の予約」を表示
- [x] **担当者設定**: 予約・カルテに「担当スタッフ」を紐付け
  - `Staff` マスターの実装 (DB Model & Seed)
  - `staffId` の必須化 & 監査フィールド追加 (v1.0 Review)
- [x] **型定義の修正**: Prisma Client 更新 (完了)

### Phase 8: 予約管理の完全化 (Appointment Completion)
- [x] **予約管理 (CRUD) の完成**:
  - [x] 予約のキャンセル処理
  - [x] 予約日時の変更機能
  - [x] (Optional) 簡易予約一覧画面

### Phase 9: カルテ機能の深化 (Advanced Records & Management)
- [x] **カルテ入力強化**:
    - [x] 「前回コピー(Do)」ボタン
    - [x] 記録の削除機能
- [x] **予約管理強化**:
    - [x] スタッフ別フィルタリング
    - [x] ステータスのアイコン化
    - [x] 未アサイン予約の警告表示
    - [x] スタッフ情報の編集機能
    - [x] 予約の重複チェック (Conflict Check)
- [x] **データ統合性**:
    - [x] 患者削除時の予約自動キャンセル

---

## 🚧 今後の実装予定 (Upcoming / Planned)

### Phase 9.6: Final Polish & Safety (Components & Logic) [Completed]
> **Goal**: 404エラー修正、UX改善、タグ表示など、残存課題の一掃と安全性強化。

- [x] **安全性強化 (Safety)**:
    - [x] `ConfirmDialog` の全面導入 (`window.confirm` の廃止)
    - [x] 予約・カルテ操作時の確認フロー統一
- [x] **UX向上 (UX Polish)**:
    - [x] 申し送りメモ (Admin Memo) の解決トグルと履歴表示ロジック修正
    - [x] ダッシュボードの表示ロジック修正 (解決済みメモの保持)

### Phase 9.7: UI Optimization & Refinement (Completed)
- [x] **予約リスト最適化**:
    - [x] アラートのコンパクト化（インラインバッジ化）
    - [x] ページネーションの配置変更（ツールバー統合）
    - [x] リスト表示領域の最大化（モバイル・デスクトップ）
- [x] **ワークフロー改善**:
    - [x] チェックインUndo機能の実装
    - [x] 予約詳細からのキャンセル機能追加
    - [x] アテンションタブ（患者検索）のフィルター強化

### Phase 10: v1.2 Launch Pad (Optimization & Dist) ✅ Completed
> **Goal**: 配布・本番運用に向けた最終調整と「Base Kit」としての整理。

- [x] **ラベル管理 (Label Management)**:
    - [x] 文言の変数化（ラベル外出し） (`src/config/labels.ts` 作成)
    - [x] `ConfirmDialog` および主要コンポーネントへの適用
- [x] **データ保全 (Backup)**:
    - [x] システム設定画面 (`/settings`) の実装
    - [x] バックアップ機能 (SQLiteファイルのダウンロード) 実装
- [x] **AI取込ガイドUI統一**:
    - [x] ハイブリッド設計（シンプル版・詳細版）
- [x] **ひらがな・カタカナ統一検索**:
    - [x] `kanaUtils.ts` を作成し全検索機能に適用

---

## 🗺️ 今後の方向性

> **重要**: 今後の機能開発ロードマップは [docs/ROADMAP.md](../ROADMAP.md) を参照してください。
> Base Kit（標準機能）とカスタム機能の区分を明確にし、汎用的な土台を維持します。

### 次期候補（要検討）
- 汎用化基盤の確立（業種別プリセット対応）
- 予約カレンダービュー（カスタム機能として設計）
- 繰り返し予約機能

### Phase 11以降: Future Extensions
> AIサマリー、LINE連携、高度な集計機能などは [IDEAS.md](../management/IDEAS.md) にアーカイブ済み。


---

> **Critical Restriction**: Phase 9以降の機能については、**ユーザーとの完全な合意形成（Consensus）が完了するまで実装を禁止します**。「Generic Base Kit」としての品質維持を最優先し、独断でのコード追加は行わないでください。
