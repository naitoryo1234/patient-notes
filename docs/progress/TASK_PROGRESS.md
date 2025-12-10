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

### Phase 10: v1.2 Launch Pad (Optimization & Dist) [Current]
> **Goal**: 配布・本番運用に向けた最終調整と「Base Kit」としての整理。

- [ ] **導入・設定機能**:
    - [ ] 文言の変数化（ラベル外出し）の下準備 (configの作成)
    - [ ] バックアップ機能 (CSV/SQL Export)
- [ ] **パッケージング**:
    - [ ] 起動スクリプトの整理
    - [ ] 初期データ投入フローの整備

### Phase 11: Future Extensions (See IDEAS.md)
> **Note**: AIサマリー、LINE連携、高度な集計機能などは `docs/management/IDEAS.md` にアーカイブされました。v2.0以降での実装を検討します。


---

> **Critical Restriction**: Phase 9以降の機能については、**ユーザーとの完全な合意形成（Consensus）が完了するまで実装を禁止します**。「Generic Base Kit」としての品質維持を最優先し、独断でのコード追加は行わないでください。
