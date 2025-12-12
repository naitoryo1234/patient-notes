/**
 * デモ用シードデータ - 患者
 * 
 * 完全に架空の患者データ。
 * 本番環境のデータとは一切関係ありません。
 */

export const demoPatients = [
    {
        pId: 1,
        name: 'デモ 太郎',
        kana: 'デモ タロウ',
        gender: '男性',
        phone: '090-0000-0001',
        birthDate: new Date('1980-05-15'),
        memo: '腰痛で定期的に通院中。デスクワークが多い。',
        tags: JSON.stringify(['腰痛', '常連']),
        attributes: '{}',
        externalRef: '{}',
        importMeta: '{}',
    },
    {
        pId: 2,
        name: 'サンプル 花子',
        kana: 'サンプル ハナコ',
        gender: '女性',
        phone: '090-0000-0002',
        birthDate: new Date('1975-08-22'),
        memo: '肩こりと眼精疲労。PC作業が原因か。',
        tags: JSON.stringify(['肩こり', '眼精疲労']),
        attributes: '{}',
        externalRef: '{}',
        importMeta: '{}',
    },
    {
        pId: 3,
        name: 'テスト 次郎',
        kana: 'テスト ジロウ',
        gender: '男性',
        phone: '090-0000-0003',
        birthDate: new Date('1990-12-01'),
        memo: 'スポーツ後の膝痛。週1回の施術を希望。',
        tags: JSON.stringify(['膝痛', 'スポーツ']),
        attributes: '{}',
        externalRef: '{}',
        importMeta: '{}',
    },
    {
        pId: 4,
        name: '架空 三子',
        kana: 'カクウ ミコ',
        gender: '女性',
        phone: '090-0000-0004',
        birthDate: new Date('1988-03-10'),
        memo: '妊娠中のマタニティケア。',
        tags: JSON.stringify(['マタニティ', '要配慮']),
        attributes: '{}',
        externalRef: '{}',
        importMeta: '{}',
    },
    {
        pId: 5,
        name: '見本 四郎',
        kana: 'ミホン シロウ',
        gender: '男性',
        phone: '090-0000-0005',
        birthDate: new Date('1965-07-20'),
        memo: '高齢者向け全身ケア。血圧注意。',
        tags: JSON.stringify(['高齢者', '血圧注意']),
        attributes: '{}',
        externalRef: '{}',
        importMeta: '{}',
    },
];

