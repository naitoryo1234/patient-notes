import { LABELS } from './labels';

// Config-Driven Form Definitions

export const PatientFormConfig = [
    { name: 'name', label: LABELS.PATIENT_FORM.NAME, type: 'text', required: true, placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_NAME },
    { name: 'kana', label: LABELS.PATIENT_FORM.KANA, type: 'text', required: true, placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_KANA },
    { name: 'phone', label: LABELS.PATIENT_FORM.PHONE, type: 'tel', placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_PHONE },
    { name: 'birthDate', label: LABELS.PATIENT_FORM.BIRTHDATE, type: 'date' },
    {
        name: 'gender', label: LABELS.PATIENT_FORM.GENDER, type: 'select', options: [
            LABELS.PATIENT_FORM.GENDER_OPTIONS.MALE,
            LABELS.PATIENT_FORM.GENDER_OPTIONS.FEMALE,
            LABELS.PATIENT_FORM.GENDER_OPTIONS.OTHER
        ]
    },
    { name: 'memo', label: LABELS.PATIENT_FORM.MEMO, type: 'textarea', rows: 3 },
    {
        name: 'tags',
        label: LABELS.PATIENT_FORM.TAGS,
        type: 'tags',
        placeholder: LABELS.PATIENT_FORM.TAGS_PLACEHOLDER,
        options: []
    }
];

export const RecordFormConfig = [
    { name: 'visitDate', label: '来院日時', type: 'datetime-local', required: true },
    { name: 'subjective', label: 'S (主訴)', type: 'textarea', rows: 4, placeholder: '「腰が痛い」「昨晩から」' },
    { name: 'objective', label: 'O (所見)', type: 'textarea', rows: 4, placeholder: '可動域制限あり...' },
    { name: 'assessment', label: 'A (施術・評価)', type: 'textarea', rows: 4, placeholder: '鍼通電を実施' },
    { name: 'plan', label: 'P (計画)', type: 'textarea', rows: 2, placeholder: '次回3日後' },
    {
        name: 'tags',
        label: 'タグ',
        type: 'tags',
        placeholder: 'カンマ区切り (例: 腰痛, 急性)',
        options: ['腰痛', '肩こり', '首の痛み', '膝痛', '頭痛', '初診', '再診', '鍼治療', '灸', 'マッサージ', '電気療法', '急性', '慢性', '労災', '自賠責']
    },
];
