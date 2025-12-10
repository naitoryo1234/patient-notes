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
- [ ] 予約の変更・キャンセル機能 (未実装)

---

## 🚧 今後の実装予定 (Upcoming / Planned)

### Phase 7: 予約連携の強化 (Completed)
- [x] **カルテ連携**: カルテ一覧や詳細に「次回の予約」を表示
- [x] **担当者設定**: 予約・カルテに「担当スタッフ」を紐付け
  - `Staff` マスターの実装 (DB Model & Seed)
  - `staffId` の必須化 & 監査フィールド追加 (v1.0 Review)
- [x] **型定義の修正**: Prisma Client 更新 (完了)

### Phase 8: 予約管理の補完 & カルテ機能の深化 (Recovery & Advanced Records)
> **Priority High**: プロトタイプとして欠けている「予約の変更・キャンセル」を最優先で実装します。

- [ ] **予約管理 (CRUD) の完成**:
  - [ ] 予約のキャンセル処理
  - [ ] 予約日時の変更機能
  - [ ] (Optional) 簡易予約一覧画面
- [ ] **画像アップロード**: 施術写真などのアップロードと表示
- [ ] **定型文/テンプレート**: よく使う処置や所見の呼び出し機能
- [ ] **過去カルテ引用**: 前回の施術内容をコピーまたは参照入力

### Phase 9: AI / 通知機能の拡張 (AI & Notification)
- [ ] **本日のサマリー**: AIによる「今日の患者傾向」要約
- [ ] **リマインド通知**: LINE等の外部連携API (Concept)
- [ ] **音声入力**: ブラウザ音声認識によるテキスト化 (Experimental)

### Phase 10: 集計・管理 (Analytics & Admin)
- [ ] **患者数集計**: 月別来院数などのグラフ表示
- [ ] **データエクスポート**: CSV出力機能
- [ ] **バックアップ機能**: SQLiteファイルのダウンロード

---

> **Critical Restriction**: Phase 8以降の機能については、**ユーザーとの完全な合意形成（Consensus）が完了するまで実装を禁止します**。「Generic Base Kit」としての品質維持を最優先し、独断でのコード追加は行わないでください。
