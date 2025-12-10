---
description: セッション完了時の引き継ぎレポート（完了タスク、次回のステップ、初期化手順）を作成します。
---

1. **セッション状態の確認 (Review Session Status)**:
   - `git status` を確認し、作業内容が保存されているかチェックします。
   - specific command: `git status`

2. **完了作業の要約 (Summarize Completed Work)**:
   - このセッションで実装した機能（例: Phase 4, 5, 6）を日本語で列挙します。
   - 大きな設計変更（例: 新テーブル `Appointment` 追加）があれば記述します。

3. **保留タスクと次のステップ (Identify Pending Tasks & Next Steps)**:
   - 次回セッションの直近の目標（例: 「予約とカルテの紐付け」「担当者設定」）を要約します。
   - specific command: `grep -r "TODO" src/` (任意: コード内メモの確認)

4. **技術的なコンテキスト (Document Technical Context)**:
   - 環境固有の要件（例: 「`prisma generate` が必要」「サーバー再起動が必要」）を記述します。
   - 一時的な修正（`@ts-ignore` 等）があれば明記します。

5. **引き継ぎメッセージの生成 (Generate Handover Message)**:
   - 以下の形式に従い、**すべて日本語で** Markdownメッセージを出力します。
   - **必須**: 次回開始時に読むべき初期化ドキュメント (`docs/ai-host/INIT_ROUTER_TEAM_HARU.md`) への誘導を含めてください。
   - また、「AIからの返答や、私が確認すべきドキュメントについてはすべて日本語で書くこと」という指示を次回初期化時のプロンプトに含めるよう促してください。
   
   - 出力フォーマット例:
     ```markdown
     # 🔄 Session Handover: [チーム名/トピック]

     ## ✅ 今回の実装内容
     - [機能 1]
     - [機能 2]

     ## 🚧 次回のタスク (Phase X)
     - [タスク 1]
     - [タスク 2]

     ## ⚠️ 技術的な注意点
     - [DB、環境変数、再起動に関するメモなど]

     ## 🚀 次回セッションの初期化手順
     作業を再開する際は、以下のドキュメントを読み込んでください：
     `docs/ai-host/INIT_ROUTER_TEAM_HARU.md`

     > **Note for Next Session**: ユーザーへの返答および確認用ドキュメントは、すべて **日本語** で記述してください。
     ```
