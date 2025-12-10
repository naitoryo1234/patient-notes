import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 0. Staff (院長) - Create First
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

    // 1. 山田 太郎 (腰痛・定期メンテ)
    const patient1 = await prisma.patient.upsert({
        where: { pId: 1001 },
        update: {},
        create: {
            pId: 1001,
            name: '山田 太郎',
            kana: 'やまだ たろう',
            birthDate: new Date('1980-05-15'), // 40代
            phone: '090-1111-2222',
            gender: '男性',
            address: '東京都渋谷区...',
            memo: 'ITエンジニア。座り仕事が多い。趣味はフットサル。',
            tags: JSON.stringify(['腰痛', 'デスクワーク', '定期']),
            attributes: JSON.stringify({ occupation: 'Engineer', referral: 'HP' }),
            records: {
                create: [
                    {
                        visitDate: new Date('2024-11-01T10:00:00'),
                        visitCount: 1,
                        subjective: '3日前から腰に違和感。深くかがむと痛い。',
                        objective: 'L4/L5 圧痛(+)。SLR 陰性。前屈制限あり。',
                        assessment: '腰部脊柱管狭窄症の疑いは低い。筋筋膜性腰痛。',
                        plan: '鍼通電とストレッチ指導。',
                        tags: JSON.stringify(['鍼', '腰部']),
                        staffId: staff1.id,
                    },
                    {
                        visitDate: new Date('2024-11-08T10:00:00'),
                        visitCount: 2,
                        subjective: '痛みは半分くらいになった。まだ張りがある。',
                        objective: '可動域改善。圧痛軽減。',
                        assessment: '経過良好。',
                        plan: '継続してメンテナンス。次回2週間後。',
                        tags: JSON.stringify(['マッサージ', '経過観察']),
                        staffId: staff1.id,
                    }
                ]
            }
        },
    })

    // 2. 佐藤 花子 (肩こり・頭痛)
    const patient2 = await prisma.patient.upsert({
        where: { pId: 1002 },
        update: {},
        create: {
            pId: 1002,
            name: '佐藤 花子',
            kana: 'さとう はなこ',
            birthDate: new Date('1990-10-20'), // 30代
            phone: '090-3333-4444',
            gender: '女性',
            memo: '美容師。立ち仕事で肩が凝る。',
            tags: JSON.stringify(['肩こり', '頭痛']),
            records: {
                create: [
                    {
                        visitDate: new Date('2024-12-01T14:30:00'),
                        visitCount: 1,
                        subjective: '右肩が上がらない。夕方になると頭痛がする。',
                        objective: '右僧帽筋硬結(+)。ストレートネック気味。',
                        assessment: '胸郭出口症候群のテスト陰性。眼精疲労からの緊張型頭痛疑い。',
                        plan: '頚部・肩甲骨周囲の調整。',
                        tags: JSON.stringify(['整体', '眼精疲労']),
                        staffId: staff1.id,
                    }
                ]
            }
        },
    })

    // 3. 鈴木 一郎 (急性・ぎっくり腰)
    const patient3 = await prisma.patient.upsert({
        where: { pId: 1003 },
        update: {},
        create: {
            pId: 1003,
            name: '鈴木 一郎',
            kana: 'すずき いちろう',
            birthDate: new Date('1975-03-01'),
            gender: '男性',
            memo: '引越し業者。',
            tags: JSON.stringify(['急性', 'ぎっくり腰']),
            records: {
                create: [
                    {
                        visitDate: new Date('2025-12-09T09:00:00'), // updated to 2025
                        visitCount: 1,
                        subjective: '今朝、重い荷物を持った瞬間にグキッとなった。歩くのも辛い。',
                        objective: '腰部熱感あり。疼痛緩和姿勢（前傾）。',
                        assessment: '急性腰痛発作。炎症所見あり。',
                        plan: 'アイシングとテーピング固定。安静指導。',
                        tags: JSON.stringify(['アイシング', 'テーピング', '急性期']),
                        staffId: staff1.id,
                    }
                ]
            }
        },
    })

    // 4. Appointments (本日の予約 - 動作確認用)
    const today = new Date()

    // 10:00 - 山田さん
    const appt1 = new Date(today)
    appt1.setHours(10, 0, 0, 0)

    await prisma.appointment.create({
        data: {
            patientId: patient1.id, // upsert returns the record
            startAt: appt1,
            status: 'scheduled',
            memo: '動作確認データ',
            staffId: staff1.id
        }
    })

    // 14:30 - 佐藤さん
    const appt2 = new Date(today)
    appt2.setHours(14, 30, 0, 0)

    await prisma.appointment.create({
        data: {
            patientId: patient2.id,
            startAt: appt2,
            status: 'scheduled',
            staffId: staff1.id
        }
    })

    console.log({ patient1, patient2, patient3, staff1 })
    console.log('Seeding finished.')
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
