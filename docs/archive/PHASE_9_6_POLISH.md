# Phase 9.6: Quality & Robustness Polish (Based on IMPROVEMENT_PROPOSALS)

ユーザーフィードバックに基づき、UIの洗練、モバイル対応、データの安全性を強化する補正フェーズ。
`docs/management/IMPROVEMENT_PROPOSALS.md` の項目 1 & 2 に対応。

---

## ✅ 1. 患者詳細ページ (`/patients/[id]`)
- [x] **タグの視認性向上**: 「重要」「禁忌」などを色分け表示。`PatientProfile.tsx`
- [x] **メモのUI改善**: 長文メモを自動で折りたたみ（Read More）、グラデーション表示。
- [x] **スマホ対応**: プロフィールカード、ヘッダーボタン群のレスポンシブ崩れを修正（縦積み等）。
- [x] **カルテ入力の安全性**:
    - [x] 「通常入力」モードでも確認画面を表示。
    - [x] 送信後の二重防止ロック、フォームクリア処理。
    - [x] 「削除ボタン」の常時表示化（スマホでの発見容易性）。

## ✅ 2. データ整合性と堅牢性
- [x] **削除時のリナンバリング**: カルテ削除時、未来の `visitCount` を自動デクリメントするトランザクション処理を追加。 `recordService.deleteRecord`
- [x] **予約重複防止**:
    - [x] `checkPatientAvailability`: 患者自身のダブルブッキング防止。
    - [x] `checkStaffAvailability`: スタッフのダブルブッキング防止。
- [x] **来院回数表示の適正化**: 同日複数回予約時でも、当日の予約順序に応じて「○回目」を正しくカウントアップ表示。 `appointmentService.getTodaysAppointments`

## ✅ 3. プロセス改善
- [x] **品質チェックフロー導入**: `.agent/workflows/quality_check.md` を作成。実装完了時の必須ワークフローとして定義。
- [x] **ドキュメント整備**: `IMPROVEMENT_PROPOSALS.md` を「Base Kit」方針に更新。

---

## Next Steps
- IMPROVEMENT_PROPOSALS の項目 3 (ダッシュボード) への着手
- Phase 10 (Settings & Export) への準備
