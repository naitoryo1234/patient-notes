export const TERMS = {
    PATIENT: '患者様',
    RECORD: 'カルテ',
    APPOINTMENT: '予約',
    STAFF: '担当者',
    CLINIC: '当院',
} as const;

export const LABELS = {
    // 汎用的なシステムメッセージのみ保持
    DIALOG: {
        DEFAULT_CONFIRM: '確認',
        DEFAULT_CANCEL: 'キャンセル',
    },
    // Appointment用の特殊な文言は一旦保持（後でコンポーネント側に移動検討可だが、ロジック依存度が高いので維持）
    APPOINTMENT: {
        CANCEL_CONFIRM_TITLE: 'この予約をキャンセルしますか？',
        CANCEL_CONFIRM_DESC: 'キャンセルした予約は予約一覧に「キャンセル」と表示されます。',
        CANCEL_EXECUTE: 'キャンセルする',
        MEMO_RESOLVE_TITLE: '申し送り事項を確認済みにしますか？',
        MEMO_UNRESOLVE_TITLE: '申し送り事項を未確認に戻しますか？',
        MEMO_RESOLVE_DESC: '確認済みにすると、この項目のアラート表示が解除されます。',
        MEMO_UNRESOLVE_DESC: '未確認に戻すと、再度アラート表示になります。',
        CHANGE_STATUS: '変更する',
    },
    STATUS: {
        SUCCESS: '保存しました',
        ERROR: 'エラーが発生しました',
    },
    PATIENT_FORM: {
        NAME: '氏名',
        KANA: 'ふりがな',
        PHONE: '電話番号',
        BIRTHDATE: '生年月日',
        GENDER: '性別',
        MEMO: 'メモ (特徴など)',
        TAGS: 'タグ',
        TAGS_PLACEHOLDER: 'Enterで追加 (例: 腰痛)',
        PLACEHOLDER_NAME: '山田 太郎',
        PLACEHOLDER_KANA: 'やまだ たろう',
        PLACEHOLDER_PHONE: '090-1234-5678',
        PLACEHOLDER_DATE: 'YYYY-MM-DD',
        GENDER_OPTIONS: {
            MALE: '男性',
            FEMALE: '女性',
            OTHER: 'その他',
            SELECT: '選択してください',
        },
        SUBMIT: '登録する',
        CONFIRM_CREATE_MODE: 'この内容でフォームを作成',
        BACK_TO_TEXT: 'テキストに戻る',
        MANUAL_MODE: '通常入力',
        AI_MODE_BTN: 'AI取込 (Beta)',
    },
    AI_MODE: {
        TITLE: 'データ自動解析',
        DESC: '既存のカルテやExcelなどから、以下の形式でテキストを貼り付けると自動入力できます。',
        NOTE_EDITABLE: '※内容を直接修正できます',
        ANALYZE_BUTTON: '解析して確認',
        PLACEHOLDER: 'ここにテキストを貼り付けてください...',
        GUIDE: {
            TITLE: '新規登録用プロンプト',
            DESC: 'LINEやメールでの問い合わせ文章から、患者登録データを抽出するためのプロンプトです。AIチャットツールに貼り付けてご使用ください。',
            BUTTON: 'プロンプトをコピー',
        }
    },
    VALIDATION: {
        DUPLICATE_TITLE: `似ている${TERMS.PATIENT}が見つかりました`,
        DUPLICATE_DESC: `以下の${TERMS.PATIENT}は既に登録されています。同一人物の可能性があります。`,
        DUPLICATE_IGNORE: '※ 別人の場合は、そのまま新規登録を行ってください',
    }
} as const;
