# 個人院向けミニCRM システム設計書 (v3.0)

> **設計哲学: Data-First & AI-Ready for Migration**
> 1.  **既存データ親和性**: CSVインポートや外部システム連携を前提としたスキーマ。
> 2.  **デジタル化の架け橋**: 紙カルテ画像やOCRテキストを許容可能なデータ構造。
> 3.  **AIナレッジ化**: 構造化データと非構造化データを両立し、将来のAI解析に備える。

---

## 1. データベース設計 (Schema Design)

### ER図概要
`Patient` (1) -- (*) `ClinicalRecord`
`Patient` (1) -- (*) `Attachment` (画像/PDF)

### Table: Patient (患者マスタ)
外部システム(レセコン等)からのインポートに耐えうる柔軟な構造。

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, UUID | システム内部ID |
| `pId` | Int | Unique | 診察券番号 (Human Readable ID) |
| `name` | String | | 氏名 (必須) |
| `kana` | String | | かな (推奨/あいまい検索用) |
| `birthDate`| DateTime?| | マッチングキー候補1 |
| `phone` | String? | | マッチングキー候補2 (ハイフン有無揺らぎを許容) |
| `gender` | String? | | |
| `address` | String? | | 住所 (DM送付用など) |
| `memo` | String? | Text | 自由記述・備考 |
| `tags` | String | JSON | 特徴タグ配列 |
| `externalRef`| String | JSON | **[Migration]** 外部システムIDマップ (例: `{ "recept_id": "12345" }`) |
| `importMeta`| String | JSON | **[Migration]** インポート元情報 (例: `{ "source": "2024_list.csv", "row": 10 }`) |
| `attributes`| String | JSON | 拡張属性 |

### Table: ClinicalRecord (施術記録)
SOAP形式 + インポート/OCR対応。

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, UUID | |
| `patientId`| String | FK | |
| `visitDate`| DateTime | | 来院日時 |
| `visitCount`| Int | | 回数 |
| `subjective`| String | Text | S (主訴) |
| `objective` | String | Text | O (所見) |
| `assessment`| String | Text | A (施術) |
| `plan` | String | Text | P (計画) |
| `rawText` | String? | Text | **[OCR/Import]** 未整形の生テキストやOCR結果 |
| `tags` | String | JSON | 施術・症状タグ |
| `metadata` | String | JSON | AI解析結果など |

### Table: Attachment (添付ファイル・将来拡張)
紙カルテ画像や問診票スキャン用。MVPでは「箱」だけ用意する、または簡易実装。

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, UUID | |
| `patientId`| String | FK | |
| `recordId` | String? | FK | 特定の施術記録に紐づく場合 |
| `fileType` | String | | MIME type (image/jpeg, application/pdf etc) |
| `filePath` | String | | ローカル保存パス |
| `ocrText` | String? | Text | **[OCR]** 画像から抽出されたテキスト (将来用) |
| `createdAt` | DateTime | | |

---

## 2. データ移行・連携戦略 (Migration Strategy)

### A. CSVインポート (Future Feature)
- **柔軟なマッピング**:
  - `Patient` テーブルのカラム名をあえて標準的(name, kana, phone)にしておき、インポート機能実装時に「列のマッピング」をしやすくする。
- **名寄せ (Identity Resolution)**:
  - 氏名だけでなく `kana`, `birthDate`, `phone` を複合的に見て「同一人物候補」を提示するロジックをService層に組み込みやすくする。
- **生データの保持**:
  - 解析不能なデータやメタデータは `importMeta` (JSON) にそのまま突っ込んでおき、後で救出できるようにする。

### B. 紙データ/画像活用 (Future Feature)
- **段階的デジタル化**:
  1. まず画像を `Attachment` に放り込む。
  2. 画像を見ながら `ClinicalRecord` を手入力。
  3. (将来) AI/OCRが `Attachment.ocrText` を埋める。
  4. (将来) AIが `ocrText` を要約して `subjective/objective` に提案する。
- このフローを実現するため、**「画像」と「記録」がDBレベルで緩く結合できる `recordId` nullable FK** を用意しておく。

---

## 3. アーキテクチャ構成 (v3.0)

(基本はv2.0と同じだが、Import Serviceの居場所を確保)

```text
src/
├── app/
├── components/
│   ├── form/            # Config-Driven Forms
├── services/
│   ├── patientService.ts
│   ├── recordService.ts
│   ├── importService.ts  # ★ [New] CSV解析・バリデーションロジック (Future)
│   └── ocrService.ts     # ★ [New] 画像処理・OCR連携 (Future)
├── config/
│   ├── schema.ts
│   └── forms.ts
```

---

## 4. MVP機能選定

**In Scope (MVPで実装)**:
1.  **Patient CRUD**: 拡張カラム(`externalRef` 等)を含むスキーマ定義と基本的な登録編集。
2.  **ClinicalRecord CRUD**: S/O/A/P入力。
3.  **Attachment Table Definition**: テーブル作成のみ（UI実装はしない、または簡易的な"ファイル選択"のみ）。

**Out of Scope (将来実装)**:
1.  **CSV Import UI**: 複雑なマッピングUIはMVP外。ただし「シードデータ投入スクリプト」等でインポート検証は行う。
2.  **OCR/AI Integration**: 将来の楽しみにとっておく。構造だけ準備。

---

*この設計は、「今あるデータを捨てずに活かす」ための受け皿として機能します。*
