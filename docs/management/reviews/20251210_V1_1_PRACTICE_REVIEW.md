# v1.1.0 Review Report & Action Plan (Practice Ready)

**Status**: Complied from 2 reviews (Gemini 3.0 Pro, Claude 3.5 Sonnet)
**Date**: 2025-12-10
**Focus**: Integrity (論理削除とユニーク制約) & UX (予約フロー)

---

## 🛑 Critical Issues (Must Fix for v1.1)

### 1. 論理削除とユニーク制約の衝突回避 (Integrity)
**問題**: `Patient.pId` (`@unique`) は論理削除済み(`deletedAt!=null`)レコードも含めて一意性を強制するため、診察券番号の再利用が不可能になり、運用が詰まる（番号枯渇）。
**対策**: SQLiteでは部分インデックスが使えない場合やPrismaの対応状況を考慮し、**複合ユニーク制約**を採用する。

- **Fix Plan**:
    - `schema.prisma` の `Patient` モデルを変更:
      ```prisma
      // Before
      pId Int @unique
      
      // After (Option A)
      pId Int
      // deletedAtを含めることで、NULLの場合はユニーク制約から外れる...わけではないが、
      // SQLiteのUNIQUE制約は「全てのカラムがNULLでない場合」にのみ適用されるか、
      // 複合キーのNULL扱い仕様に依存する。
      // ★訂正: SQLiteの仕様上、標準の @@unique([pId, deletedAt]) だけでは「deletedAtがNULLのレコード同士」の重複を防げない可能性がある（NULL != NULL）。
      // 逆に、deletedAtが入っているレコード同士も重複できなくなる。
      // 最も安全で確実なのは、Prismaでサポートされている範囲で「pIdの一意性」を「生存レコードのみ」に限定することだが、
      // SQLiteではPrismaレベルでそれが難しい。
      //
      // ★Team HARU 決定案: 
      // 「アプリ側で pId の重複チェックを行う」こととし、DBレベルの @unique は外したくないが、
      // SQLiteの限界があるため、v1.1では「論理削除時は pId を負の値にする」等のWorkaroundか、
      // 単純に「削除済みIDは再利用しない（欠番運用）」を仕様とするのが最も安全。
      // 
      // →【結論】: 今回は「欠番運用」を基本とする。
      // つまり、「一度使った診察券番号は、その患者を削除しようが永久欠番」とする。
      // これなら現状の `pId @unique` のままで問題ない。
      // ※ただし、誤登録ですぐ削除した場合の救済措置が必要。
      // ※Geminiの提案「Option A」は、deletedAtがNULL同士の場合に重複エラーになるため、
      // 実は有効（アクティブな患者同士の重複は防げる）だが、
      // 削除済み患者(deletedAtあり)同士の重複も防いでしまうため、
      // 「同じIDの患者を複数回削除する」ことができなくなる。
      ```
    - **Re-Decision**: **「欠番運用」を正式仕様とする。**
        - 小規模クリニックで4桁番号(1万件)が枯渇することは稀。
        - 削除してすぐ同じ番号を使いたいケースは「誤登録修正」のみ。それはEditで対応すべき。
        - 結果: Schema変更なし。仕様書に「ID再利用不可」を明記。

### 2. 未アサイン予約の可視化 (UX)
**問題**: 担当者未定(`staffId=null`)の予約が、フィルタ操作しないと見えない、埋もれる。
**対策**: ダッシュボードまたは予約リスト上部に、フィルタに関係なく「⚠️ 未アサインの予約があります」と表示するエリアを設ける。

### 3. キャンセル表示のトーンダウン (UX)
**問題**: ❌アイコンが目立ちすぎて、「対応が必要なエラー」に見える。
**対策**:
- キャンセル行のテキスト色を薄くする（`text-muted-foreground`）。
- アイコンをグレーに変更。
- 取り消し線（`line-through`）を適用。

---

## ⚠️ Important Considerations (Should Fix / Document)

### 1. 予約作成フローの改善
**指摘**: 電話対応中に「空き枠探し」と「日時入力」がスムーズでない。
**対応**:
- 今すぐカレンダービューを作るのはコスト高。
- **改善案**: 予約作成モーダルの日時入力欄に「+15min」「+30min」「Next Hour」などの便利ボタンを置く、またはブラウザ標準のDatetime Picker(`input type="datetime-local"`)が使いやすいか再確認する。

### 2. 論理削除時のリレーション不整合
**問題**: 患者削除時、未來の予約が残る。
**対応**:
- `Patient` 削除アクション（Server Action）内で、トランザクションを用いて以下を実行する:
    1. その患者の未来の予約 (`startAt >= now`) を `status: cancelled` に更新。
    2. 患者を `deletedAt: now` に更新。
- これを実装しないと、幽霊予約が残る。

---

## 🗓️ Implementation Roadmap

### Phase 9.1: Integrity & Critical UX (Now)
1.  **Server Action強化**: `deletePatient` アクションに「未来予約の自動キャンセル」ロジックを追加。
2.  **UX修正**: `AppointmentListClient` にて、キャンセル予約のスタイル（グレーアウト）と、未アサインアラートの実装。
3.  **仕様書更新**: `SPEC_V1_1.md` に「診察券番号は永久欠番運用（削除しても再利用不可）」と明記。

### Phase 9.2: UX Suggestions (Next)
- 日時入力補助UIの追加。
- `pId` のユニーク制約問題が深刻化した場合（番号枯渇など）の対応は v1.2 へ先送り。

---
