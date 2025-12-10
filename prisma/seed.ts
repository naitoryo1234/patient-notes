import { PrismaClient } from '@prisma/client'
import { startOfDay, addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 0. Clean up existing appointments to avoid duplicates
    await prisma.appointment.deleteMany({})

    // 1. Staff Setup
    const staff1 = await prisma.staff.upsert({
        where: { id: 'staff-001' },
        update: {},
        create: {
            id: 'staff-001',
            name: '院長',
            role: 'Doctor',
            active: true
        }
    })

    const staff2 = await prisma.staff.upsert({
        where: { id: 'staff-002' },
        update: {},
        create: {
            id: 'staff-002',
            name: '鈴木ナース',
            role: 'Nurse',
            active: true
        }
    })

    // 2. Patient Data Setup

    // Patient A: 山田 太郎 (Returning, High Visit Count, VIP)
    const patient1 = await prisma.patient.upsert({
        where: { pId: 1001 },
        update: {},
        create: {
            pId: 1001,
            name: '山田 太郎',
            kana: 'やまだ たろう',
            birthDate: new Date('1980-05-15'),
            gender: '男性',
            phone: '090-1111-2222',
            memo: '常連さん。会話好き。',
            tags: JSON.stringify(['腰痛', 'VIP', '定期']),
            records: {
                create: [
                    {
                        visitDate: new Date('2024-10-01'), visitCount: 1, staffId: staff1.id,
                        subjective: '初回。腰が痛い', objective: 'L4圧痛', assessment: '腰痛症', plan: '経過観察'
                    },
                    {
                        visitDate: new Date('2024-10-15'), visitCount: 2, staffId: staff1.id,
                        subjective: '少し良くなった', objective: '可動域改善', assessment: '経過良好', plan: '継続'
                    },
                    {
                        visitDate: new Date('2024-11-01'), visitCount: 3, staffId: staff1.id,
                        subjective: 'また痛い', objective: '筋緊張強い', assessment: '再発', plan: '鍼治療'
                    }
                ]
            }
        },
    })
    // Note: Upsert only creates if not exists, so for existing DBs, records might not update. 
    // Assuming fresh seed or additive. For reliability in "sample data request", we might want to update or rely on cleaning.
    // Since users usually request this on dev, let's assume standard upsert is fine, but for appointments we cleared them.

    // Patient B: 佐藤 花子 (Newer, 1 past record)
    const patient2 = await prisma.patient.upsert({
        where: { pId: 1002 },
        update: {},
        create: {
            pId: 1002,
            name: '佐藤 花子',
            kana: 'さとう はなこ',
            birthDate: new Date('1995-08-20'),
            gender: '女性',
            phone: '090-3333-4444',
            memo: '美容師。',
            tags: JSON.stringify(['肩こり']),
            records: {
                create: [
                    {
                        visitDate: new Date('2024-12-01'), visitCount: 1, staffId: staff1.id,
                        subjective: '肩こりがひどい', objective: '僧帽筋硬結', assessment: '緊張型頭痛疑い', plan: 'マッサージ'
                    }
                ]
            }
        },
    })

    // Patient C: 田中 次郎 (New Patient, No records)
    const patient3 = await prisma.patient.upsert({
        where: { pId: 1003 },
        update: {},
        create: {
            pId: 1003,
            name: '田中 次郎',
            kana: 'たなか じろう',
            birthDate: new Date('2000-01-10'),
            gender: '男性',
            phone: '090-5555-6666',
            memo: '紹介で来院。',
            tags: JSON.stringify(['新患', '紹介']),
            records: {
                create: [] // No prior records
            }
        },
    })

    // Patient D: 高橋 愛子 (Cancelled History)
    const patient4 = await prisma.patient.upsert({
        where: { pId: 1004 },
        update: {},
        create: {
            pId: 1004,
            name: '高橋 愛子',
            kana: 'たかはし あいこ',
            birthDate: new Date('1985-03-03'),
            gender: '女性',
            tags: JSON.stringify([]),
            records: { create: [] }
        }
    })

    // 3. Create Appointments (Various Scenarios)
    const today = new Date()

    // 3-1. Today's Appointments

    // Past (Today Morning) - Needs attention?
    const todayMorning = new Date(today); todayMorning.setHours(9, 30, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: todayMorning,
            status: 'scheduled',
            memo: '朝一番。鍼希望。',
            staffId: staff1.id
        }
    })

    // Just Now / Current - 佐藤さん (Visit Count 2)
    const todayNow = new Date(today); // Keep close to execution time or slightly future for demo
    // We set it to nearest next hour for easy demo
    todayNow.setHours(14, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: todayNow,
            status: 'scheduled',
            staffId: staff2.id // Assigned to Nurse
        }
    })

    // Future (Today Evening) - New Patient
    const todayEvening = new Date(today); todayEvening.setHours(18, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient3.id,
            startAt: todayEvening,
            status: 'scheduled',
            memo: '初診。問診票記入あり。',
            staffId: staff1.id // Doctor
        }
    })

    // Cancelled (Today)
    const todayCancelled = new Date(today); todayCancelled.setHours(11, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient4.id,
            startAt: todayCancelled,
            status: 'cancelled',
            memo: '電話あり。急用のためキャンセル。',
            staffId: staff1.id
        }
    })

    // 3-2. Past Appointments (History)
    const yesterday = subDays(today, 1); yesterday.setHours(15, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: yesterday,
            status: 'completed',
            memo: '前回予約分',
            staffId: staff1.id
        }
    })

    // 3-3. Future Appointments
    const tomorrow = addDays(today, 1); tomorrow.setHours(10, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: tomorrow,
            status: 'scheduled',
            memo: '翌日の予約',
            staffId: staff1.id
        }
    })

    // 3-4. Next Week Future Appointments
    const nextWeek = addDays(today, 7); nextWeek.setHours(11, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient1.id,
            startAt: nextWeek,
            status: 'scheduled',
            memo: '1週間後の定期メンテナンス',
            staffId: staff1.id
        }
    })

    const nextWeek2 = addDays(today, 8); nextWeek2.setHours(15, 30, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: nextWeek2,
            status: 'scheduled',
            memo: 'カラーリング後のケア',
            staffId: staff2.id
        }
    })

    const nextWeek3 = addDays(today, 10); nextWeek3.setHours(10, 0, 0, 0)
    await prisma.appointment.create({
        data: {
            patientId: patient3.id,
            startAt: nextWeek3,
            status: 'scheduled',
            memo: '経過確認',
            staffId: staff1.id
        }
    })

    // 5. Patient E: Long Name
    await prisma.patient.upsert({
        where: { pId: 1005 },
        update: {},
        create: {
            pId: 1005,
            name: 'アレクサンダー・マクシミリアン・スペンサー・ウィリアムズ・ジュニア三世',
            kana: 'あれくさんだー まくしみりあん すぺんさー うぃりあむず じゅにあさんせい',
            birthDate: new Date('1990-01-01'),
            gender: '男性',
            phone: '090-0000-0000',
            memo: '名前が長い患者のテストデータ。',
            tags: JSON.stringify(['テスト', '長文']),
            records: { create: [] }
        }
    })

    // 6. Patient F: Long Memo
    const longMemoText = `この患者は非常に詳細なメモを持っています。例えば、初診時の様子から、趣味、家族構成、ペットの名前（ポチ、タマ、ミケ）、好きな食べ物（カレーライス、特に辛口）、嫌いな食べ物（ピーマン、ニンジン）、過去の病歴（幼少期に水疱瘡、20代で骨折）、最近の旅行先（北海道、沖縄、グアム）、休日の過ごし方（読書、映画鑑賞、ハイキング）、仕事の内容（IT企業のプロジェクトマネージャー、最近は残業が多い）、ストレスの要因（上司との人間関係、満員電車）、睡眠時間（平均6時間、最近は不眠気味）、運動習慣（週に1回のジョギング、ジム通いは続かなかった）、サプリメントの摂取状況（ビタミンC、亜鉛）、アレルギーの有無（花粉症、ハウスダスト）、等々、ありとあらゆる情報がここに記載されています。これにより、UI上でメモ欄がどのように表示されるか、折り返しが正しく行われるか、スクロールが発生するか、レイアウト崩れが起きないかなどを検証することが可能です。さらに文字数を増やすために、同じ文章を繰り返すこともありますが、ここでは意味のある文章を心がけて記述しています。以上、長文メモのテストでした。`

    await prisma.patient.upsert({
        where: { pId: 1006 },
        update: {},
        create: {
            pId: 1006,
            name: '長文 好き子',
            kana: 'ちょうぶん すきこ',
            birthDate: new Date('1985-05-05'),
            gender: '女性',
            memo: longMemoText,
            tags: JSON.stringify(['メモ多め']),
            records: { create: [] }
        }
    })

    // 7. Patient G: Many Appointments
    const patient7 = await prisma.patient.upsert({
        where: { pId: 1007 },
        update: {},
        create: {
            pId: 1007,
            name: '予約 多杉',
            kana: 'よやく おおすぎ',
            birthDate: new Date('1970-01-01'),
            gender: '男性',
            memo: '予約がいっぱいの人。',
            records: { create: [] }
        }
    })

    // Create many appointments for Patient 7
    for (let i = 0; i < 20; i++) {
        const d = addDays(today, i - 10); // Past 10 days to Future 9 days
        d.setHours(10 + (i % 5), 0, 0, 0);
        await prisma.appointment.create({
            data: {
                patientId: patient7.id,
                startAt: d,
                status: i < 10 ? 'completed' : 'scheduled',
                memo: `予約テスト ${i + 1}回目`,
                staffId: staff1.id
            }
        })
    }

    // 8. Patient H: Minimal Data
    await prisma.patient.upsert({
        where: { pId: 1008 },
        update: {},
        create: {
            pId: 1008,
            name: '一見 さん',
            kana: 'いちげん さん',
            birthDate: new Date('2000-01-01'),
            gender: 'その他',
            tags: JSON.stringify(['一見']),
            records: {
                create: [
                    {
                        visitDate: subDays(today, 30),
                        visitCount: 1,
                        staffId: staff1.id,
                        subjective: '一度だけ来た',
                        objective: '特になし',
                        assessment: '異常なし',
                        plan: '様子見'
                    }
                ]
            }
        }
    })

    console.log('Seeding finished with varied data patterns.')
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
