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
    }
} as const;
