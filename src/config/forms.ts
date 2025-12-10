// Config-Driven Form Definitions

export const PatientFormConfig = [
    { name: 'name', label: '氏名', type: 'text', required: true, placeholder: '山田 太郎' },
    { name: 'kana', label: 'ふりがな', type: 'text', required: true, placeholder: 'やまだ たろう' },
    { name: 'phone', label: '電話番号', type: 'tel', placeholder: '090-1234-5678' },
    { name: 'birthDate', label: '生年月日', type: 'date' },
    { name: 'gender', label: '性別', type: 'select', options: ['男性', '女性', 'その他'] },
    { name: 'memo', label: 'メモ (特徴など)', type: 'textarea', rows: 3 },
];

export const RecordFormConfig = [
    { name: 'visitDate', label: '来院日時', type: 'datetime-local', required: true },
    { name: 'subjective', label: 'S (主訴)', type: 'textarea', rows: 4, placeholder: '「腰が痛い」「昨晩から」' },
    { name: 'objective', label: 'O (所見)', type: 'textarea', rows: 4, placeholder: '可動域制限あり...' },
    { name: 'assessment', label: 'A (施術・評価)', type: 'textarea', rows: 4, placeholder: '鍼通電を実施' },
    { name: 'plan', label: 'P (計画)', type: 'textarea', rows: 2, placeholder: '次回3日後' },
    { name: 'tags', label: 'タグ', type: 'text', placeholder: 'カンマ区切り (例: 腰痛, 急性)' }, // MVPはテキスト入力で代用
];
