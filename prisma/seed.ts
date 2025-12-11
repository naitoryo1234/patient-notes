import { PrismaClient } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Start seeding with realistic test data...')

    // Clean up
    await prisma.appointment.deleteMany({})
    await prisma.clinicalRecord.deleteMany({})
    await prisma.patient.deleteMany({})
    await prisma.staff.deleteMany({})

    // === STAFF SETUP ===
    const director = await prisma.staff.create({
        data: {
            id: 'staff-001',
            name: '院長',
            role: 'Director',
            active: true
        }
    })

    const therapist = await prisma.staff.create({
        data: {
            id: 'staff-002',
            name: '鈴木 施術者',
            role: 'Therapist',
            active: true
        }
    })

    // === PATIENTS ===

    // Patient 1: VIP常連（腰痛）
    const patient1 = await prisma.patient.create({
        data: {
            pId: 1001,
            name: '山田 太郎',
            kana: 'やまだ たろう',
            birthDate: new Date('1975-05-15'),
            gender: '男性',
            phone: '090-1234-5678',
            memo: '常連のVIP患者。IT企業経営者。話好き。',
            tags: JSON.stringify(['腰痛', 'VIP', '定期'])
        }
    })

    // Patient 2: 新患（肩こり）
    const patient2 = await prisma.patient.create({
        data: {
            pId: 1002,
            name: '予約 多杉',
            kana: 'よやく おおすぎ',
            birthDate: new Date('1990-08-20'),
            gender: '男性',
            phone: '080-9876-5432',
            memo: '予約テスト用患者。今日の予約が多め。',
            tags: JSON.stringify(['肩こり', '新患'])
        }
    })

    // Patient 3: 初診予定
    const patient3 = await prisma.patient.create({
        data: {
            pId: 1003,
            name: '田中 花子',
            kana: 'たなか はなこ',
            birthDate: new Date('1988-03-10'),
            gender: '女性',
            phone: '070-1111-2222',
            memo: '友人の紹介。初診予定。',
            tags: JSON.stringify(['紹介', '初診'])
        }
    })

    // Patient 4: キャンセル常習
    const patient4 = await prisma.patient.create({
        data: {
            pId: 1004,
            name: '高橋 愛子',
            kana: 'たかはし あいこ',
            birthDate: new Date('1995-12-25'),
            gender: '女性',
            phone: '090-5555-7777',
            memo: '電話あり。急用のためキャンセル。',
            tags: JSON.stringify(['要注意'])
        }
    })

    // Patient 5: スタッフ未定のケース用
    const patient5 = await prisma.patient.create({
        data: {
            pId: 1005,
            name: '佐藤 次郎',
            kana: 'さとう じろう',
            birthDate: new Date('1982-07-07'),
            gender: '男性',
            phone: '080-3333-4444',
            memo: '担当者指定なし。',
            tags: JSON.stringify(['膝痛'])
        }
    })

    // Patient 6: 長文メモテスト
    const patient6 = await prisma.patient.create({
        data: {
            pId: 1006,
            name: '長文 好き子',
            kana: 'ちょうぶん すきこ',
            birthDate: new Date('1985-05-05'),
            gender: '女性',
            phone: '070-8888-9999',
            memo: 'この患者は非常に詳細なメモを持っています。例えば、初診時の様子から、趣味、家族構成、ペットの名前（ポチ、タマ、ミケ）、好きな食べ物（カレーライス、特に辛口）、嫌いな食べ物（ピーマン、ニンジン）、過去の病歴（幼少期に水疱瘡、20代で骨折）、最近の旅行先（北海道、沖縄、グアム）、休日の過ごし方（読書、映画鑑賞、ハイキング）、仕事の内容（IT企業のプロジェクトマネージャー、最近は残業が多い）、ストレスの要因（上司との人間関係、満員電車）、睡眠時間（平均6時間、最近は不眠気味）等々、ありとあらゆる情報がここに記載されています。',
            tags: JSON.stringify(['頭痛', 'ストレス'])
        }
    })

    // === CLINICAL RECORDS (一部患者に履歴追加) ===
    // Patient 1 (山田): 2回の履歴
    await prisma.clinicalRecord.create({
        data: {
            patientId: patient1.id,
            visitDate: subDays(new Date(), 7),
            visitCount: 1,
            subjective: '腰が重い。朝起きるのがつらい。',
            objective: 'L4/L5圧痛あり。可動域制限。',
            assessment: '腰痛症（筋筋膜性）',
            plan: '鍼治療 + ストレッチ指導',
            staffId: director.id
        }
    })

    await prisma.clinicalRecord.create({
        data: {
            patientId: patient1.id,
            visitDate: subDays(new Date(), 3),
            visitCount: 2,
            subjective: '少し楽になった。',
            objective: '圧痛軽減。',
            assessment: '経過良好',
            plan: '継続治療',
            staffId: director.id
        }
    })

    // Patient 2 (予約多杉): 1回の履歴
    await prisma.clinicalRecord.create({
        data: {
            patientId: patient2.id,
            visitDate: subDays(new Date(), 14),
            visitCount: 1,
            subjective: '首から肩にかけてこりがひどい',
            objective: '僧帽筋緊張',
            assessment: '肩こり症',
            plan: 'マッサージ + 温熱療法',
            staffId: therapist.id
        }
    })

    // Patient 3 (田中): 初診記録
    await prisma.clinicalRecord.create({
        data: {
            patientId: patient3.id,
            visitDate: subDays(new Date(), 5),
            visitCount: 1,
            subjective: '頭痛が続いている',
            objective: '首の可動域制限あり',
            assessment: '緊張型頭痛',
            plan: '鍼治療 + 生活指導',
            staffId: director.id
        }
    })

    // Patient 5 (佐藤): 膝痛の履歴
    await prisma.clinicalRecord.create({
        data: {
            patientId: patient5.id,
            visitDate: subDays(new Date(), 10),
            visitCount: 1,
            subjective: '階段の上り下りで膝が痛い',
            objective: '右膝内側圧痛、腫脹あり',
            assessment: '変形性膝関節症の疑い',
            plan: '電気治療 + 膝周囲筋強化',
            staffId: therapist.id
        }
    })

    // === APPOINTMENTS ===
    // 基準時刻: 2025-12-11 21:30 (夜間テスト用)

    // 1. 21:40 - 直近の未来 (未解決メモあり)
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-11T21:40:00+09:00'),
            duration: 30,
            status: 'scheduled',
            memo: '夜間診療テスト',
            adminMemo: '【重要】夜間料金の適用について説明すること。',
            isMemoResolved: false,
            staffId: director.id
        }
    })

    // 2. 22:00 - 少し先の未来 (メモなし)
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-11T22:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: '遅い時間の予約',
            staffId: therapist.id
        }
    })

    // 3. 23:00 - 深夜 (未解決メモ - 長文)
    await prisma.appointment.create({
        data: {
            patientId: patient3.id,
            startAt: new Date('2025-12-11T23:00:00+09:00'),
            duration: 30,
            status: 'scheduled',
            memo: '深夜枠',
            adminMemo: '深夜対応のため、入り口の施錠に注意してください。患者様には裏口から入っていただくよう案内済みです。',
            isMemoResolved: false,
            staffId: director.id
        }
    })

    // 4. 23:30 - 深夜 (解決済みメモ) -> ここがトグルテストの肝
    await prisma.appointment.create({
        data: {
            patientId: patient5.id,
            startAt: new Date('2025-12-11T23:30:00+09:00'),
            duration: 30,
            status: 'scheduled',
            memo: '最終枠',
            adminMemo: 'この時間帯はスタッフ1名体制です。',
            isMemoResolved: true, // 最初から解決済みになっている
            staffId: director.id
        }
    })

    // 過去の予約（本日）
    await prisma.appointment.create({
        data: {
            patientId: patient4.id,
            startAt: new Date('2025-12-11T16:00:00+09:00'),
            duration: 60,
            status: 'completed',
            memo: '日中の予約（完了済み）',
            staffId: therapist.id
        }
    })

    // --- 12/12（明日）の予約 ---
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-12T10:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            staffId: director.id
        }
    })

    console.log('✅ Seeding completed with Night Scenarios!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
