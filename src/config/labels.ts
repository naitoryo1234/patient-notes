export const LABELS = {
    COMMON: {
        SAVE: '保存',
        CANCEL: 'キャンセル',
        DELETE: '削除',
        EDIT: '編集',
        CLOSE: '閉じる',
        CONFIRM: '確認',
        BACK: '戻る',
        NEXT: '次へ',
        SEARCH: '検索',
        LOADING: '読み込み中...',
        PROCESSING: '処理中...',
        MENU: 'メニュー',
        ADD: '追加',
        CREATE_NEW: '新規作成',
    },
    DIALOG: {
        DEFAULT_CONFIRM: '確認',
        DEFAULT_CANCEL: 'キャンセル',
    },
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
