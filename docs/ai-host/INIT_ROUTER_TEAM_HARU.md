# INIT_ROUTER_TEAM_HARU.md

**Team HARU（Fullstack Development: UI/Backend/DB）** のエージェント用・初期化ルーターです。
「やさしいミニCRM」を実現するため、以下の手順に従って情報をロードし、自身のモードと役割を確立してください。

---

## 🌏 グローバルルール（必ず遵守してください）

### 📝 言語・ログ出力ルール

- コード以外の自然言語（作業ログ、進捗コメント、説明、提案、コミットメッセージなど）は、**すべて日本語**で記述してください。
- ツール側が自動で付与するセクション名  
  （例: `Progress Updates`, `Files Edited` など）は英語のままで構いません。
- ただし、その配下に表示する本文は **日本語で統一** してください。
- 一度英語で出力してしまった場合も、その直後に **同内容を日本語で書き直す** ことを推奨します。

### 💻 ターミナル利用ルール（Windows / PowerShell）

- PowerShell 環境では、`grep` コマンドは使用しないでください。  
  （Windows 素の環境では利用できず、エラーになります）
- 文字列検索・参照確認には、以下のいずれかを利用してください：
  - `rg`（ripgrep）が利用可能な場合は **優先して使用** する
  - エディタ内の検索機能（VS Code / Cursor の検索）
  - 必要に応じて Node/TypeScript スクリプトによる検索
- ターミナルコマンドが環境依存になりそうな場合は、  
  **実行前に環境前提をコメントで明示** してください。

---

## 🚀 初期化シーケンス

以下の順序でリンク先のドキュメントを読み込み、理解してください。

### 1. 基本ルールのロード（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **チーム定義** | [`guidelines/TEAM_STRUCTURE_AND_ROLES.md`](guidelines/TEAM_STRUCTURE_AND_ROLES.md) | Team HARUのフルスタックな役割と責任範囲 |
| **行動指針** | [`guidelines/CORE_PRINCIPLES.md`](guidelines/CORE_PRINCIPLES.md) | "Doctor First" & "System Robustness" |
| **禁止事項** | [`guidelines/RESTRICTIONS.md`](guidelines/RESTRICTIONS.md) | データ消失防止・スキーマ管理の鉄則 |

### 2. モード・プロトコルの確立（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **モード切替** | [`guidelines/MODE_DEFINITIONS.md`](guidelines/MODE_DEFINITIONS.md) | 設計/実装/安全チェック等のモード判定ルール |
| **運用プロトコル** | [`guidelines/PROTOCOLS.md`](guidelines/PROTOCOLS.md) | アイデア保存・提案プロセス等の運用ルール |

### 3. プロジェクト知識のロード（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **システム設計** | [`../design/CRM_SYSTEM_DESIGN.md`](../design/CRM_SYSTEM_DESIGN.md) | (To Be Created) 全体アーキテクチャ・DBスキーマ・API設計 |
| **UIコンセプト** | [`../design/CRM_UI_DESIGN.md`](../design/CRM_UI_DESIGN.md) | 画面構成、遷移フロー、UIトーン（参照用） |

---

## 🛠️ 運用ガイド（必要に応じて参照）

現在の状況に合わせて、以下のガイドを参照してください。
※ リンク先のファイルはプロジェクトに合わせて作成・修正してください。

- **実装・コーディング** → (未作成)
- **議論・設計相談** → (未作成)
- **Git・安全管理** → (未作成)

---

## 🔄 運用変更について

このファイルは「リンク集（ルーター）」に過ぎません。
運用ルールを変更したい場合は、リンク先のファイルを修正するか、このファイル自体の参照先を変更してください。

*最終更新: 2025-12-11 (Team HARU Initialized)*

