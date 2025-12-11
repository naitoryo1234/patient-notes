import { PrismaClient } from '@prisma/client'
import { addDays, subDays, addMinutes } from 'date-fns'

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
    // 基準時刻: 2025-12-11 10:13 (現在時刻)
    const baseDate = new Date('2025-12-11T10:13:00+09:00')

    // --- 12/11（今日）の予約 ---

    // 1. 08:00 - すでに終了（過去2時間以上）
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-11T08:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: '朝一番。鍼希望。',
            staffId: director.id
        }
    })

    // 2. 09:30 - 終了直後（所要時間経過）
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-11T09:30:00+09:00'),
            duration: 15,
            status: 'scheduled',
            memo: '短め。',
            staffId: therapist.id
        }
    })

    // 3. 10:00 - 施術中（開始13分後）
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-11T10:00:00+09:00'),
            duration: 30,
            status: 'scheduled',
            memo: '予約テスト 1回目',
            staffId: director.id
        }
    })

    // 4. 11:00 - これから（約50分後）- キャンセル済み
    await prisma.appointment.create({
        data: {
            patientId: patient4.id,
            startAt: new Date('2025-12-11T11:00:00+09:00'),
            duration: 60,
            status: 'cancelled',
            memo: '電話あり。急用のためキャンセル。',
            staffId: director.id
        }
    })

    // 5. 11:30 - これから（1時間後以内）- 担当未定
    await prisma.appointment.create({
        data: {
            patientId: patient5.id,
            startAt: new Date('2025-12-11T11:30:00+09:00'),
            duration: 45,
            status: 'scheduled',
            memo: '担当者未定。至急アサイン必要。',
            staffId: null // 未アサイン
        }
    })

    // 6. 12:00 - これから（約2時間後）
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-11T12:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            staffId: therapist.id
        }
    })

    // 7. 13:00 - 同時刻・院長
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-11T13:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: '定期メンテナンス（院長）',
            staffId: director.id
        }
    })

    // 8. 13:00 - 同時刻・施術者（並行診療のテスト）
    await prisma.appointment.create({
        data: {
            patientId: patient5.id,
            startAt: new Date('2025-12-11T13:00:00+09:00'),
            duration: 45,
            status: 'scheduled',
            memo: '膝の治療（施術者）',
            staffId: therapist.id
        }
    })

    // 9. 14:00 - 午後の予約（申し送りあり・未確認）
    await prisma.appointment.create({
        data: {
            patientId: patient3.id,
            startAt: new Date('2025-12-11T14:00:00+09:00'),
            duration: 90,
            status: 'scheduled',
            memo: '初診。問診票記入あり。時間多めに確保。',
            adminMemo: '初診のため、問診票の記入時間を考慮してください。',
            isMemoResolved: false,
            staffId: director.id
        }
    })

    // 10. 15:30 - 午後の予約（長文メモテスト、申し送りあり・確認済み）
    await prisma.appointment.create({
        data: {
            patientId: patient6.id,
            startAt: new Date('2025-12-11T15:30:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: 'この患者は非常に詳細なメモを持っています。例えば、初診時の様子から、趣味、家族構成、ペットの名前（ポチ、タマ、ミケ）、好きな食べ物（カレーライス、特に辛口）、嫌いな食べ物（ピーマン、ニンジン）、過去の病歴（幼少期に水疱瘡、20代で骨折）、最近の旅行先（北海道、沖縄、グアム）、休日の過ごし方（読書、映画鑑賞、ハイキング）、仕事の内容（IT企業のプロジェクトマネージャー、最近は残業が多い）、ストレスの要因（上司との人間関係、満員電車）、睡眠時間（平均6時間、最近は不眠気味）、運動習慣（週に1回のジョギング、ジム通いは続かなかった）、サプリメントの摂取状況（ビタミンC、亜鉛）、アレルギーの有無（花粉症、ハウスダスト）、等々、ありとあらゆる情報がここに記載されています。これにより、UI上でメモ欄がどのように表示されるか、折り返しが正しく行われるか、スクロールが発生するか、レイアウト崩れが起きないかなどを検証することが可能です。',
            adminMemo: '長文患者のため、カウンセリング時間を長めに確保済み。',
            isMemoResolved: true,
            staffId: director.id
        }
    })

    // 11. 17:00 - 夕方の予約
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-11T17:00:00+09:00'),
            duration: 30,
            status: 'scheduled',
            staffId: therapist.id
        }
    })

    // 12. 18:30 - 最終枠
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-11T18:30:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: '定期メンテナンス',
            staffId: director.id
        }
    })

    // --- 昨日（12/10）の予約（完了済み） ---
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-10T15:00:00+09:00'),
            duration: 60,
            status: 'completed',
            memo: '前回治療分',
            staffId: director.id
        }
    })

    // --- 明日（12/12）の予約 ---
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: new Date('2025-12-12T10:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            staffId: director.id
        }
    })

    await prisma.appointment.create({
        data: {
            patientId: patient3.id,
            startAt: new Date('2025-12-12T14:00:00+09:00'),
            duration: 30,
            status: 'scheduled',
            memo: '初診後のフォローアップ',
            staffId: therapist.id
        }
    })

    // --- 来週（12/18）の予約 ---
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: new Date('2025-12-18T10:00:00+09:00'),
            duration: 60,
            status: 'scheduled',
            memo: '1週間後の定期',
            staffId: director.id
        }
    })

    await prisma.appointment.create({
        data: {
            patientId: patient5.id,
            startAt: new Date('2025-12-18T15:00:00+09:00'),
            duration: 120,
            status: 'scheduled',
            memo: '長時間治療（2時間）',
            staffId: null // 未アサイン
        }
    })

    console.log('✅ Seeding completed!')
    console.log('📊 Created:')
    console.log('   - 2 Staff members')
    console.log('   - 6 Patients (various cases)')
    console.log('   - 5 Clinical Records (with visit history)')
    console.log('   - 18 Appointments (12 today, 6 other days)')
    console.log('')
    console.log('⏰ Current simulation time: 2025-12-11 10:13')
    console.log('📅 Today\'s appointments showcase:')
    console.log('   - Past (already finished)')
    console.log('   - In progress (施術中)')
    console.log('   - Upcoming (within 1 hour)')
    console.log('   - Cancelled')
    console.log('   - Unassigned (要対応)')
    console.log('   - Admin Memos (confirmed + unconfirmed)')
    console.log('   - Various durations (15/30/45/60/90 mins)')
    console.log('   - Long memo test')
    console.log('   - 🔥 Same time slot with different staff (13:00)')
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
