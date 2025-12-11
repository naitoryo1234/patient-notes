import { PrismaClient } from '@prisma/client'
import { subDays, addMinutes, setHours, setMinutes, startOfDay, addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Start seeding with comprehensive test data...')

    // Clean up
    await prisma.appointment.deleteMany({})
    await prisma.clinicalRecord.deleteMany({})
    await prisma.patient.deleteMany({})
    await prisma.staff.deleteMany({})

    // ==========================================
    // 1. STAFF SETUP
    // ==========================================
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

    const trainee = await prisma.staff.create({
        data: {
            id: 'staff-003',
            name: '研修生 佐藤',
            role: 'Other',
            active: false // Inactive staff for testing filters
        }
    })

    // Helper for date manipulation (relative to NOW)
    const today = new Date();
    const setTime = (date: Date, hours: number, minutes: number) => setMinutes(setHours(date, hours), minutes);

    // ==========================================
    // 2. PATIENTS & SCENARIOS
    // ==========================================

    // Scenario A: The "Ideal" Regular Patient
    // - Has consistent history
    // - Currently scheduled
    const patientRegular = await prisma.patient.create({
        data: {
            pId: 1001,
            name: '山田 太郎',
            kana: 'やまだ たろう',
            birthDate: new Date('1980-01-01'),
            gender: '男性',
            phone: '090-1111-1111',
            memo: '典型的な定期通院患者。',
            tags: JSON.stringify(['腰痛', '定期'])
        }
    })

    // Scenario B: The "Edge Case" Limit Tester
    // - Extremely long name
    // - Long kana
    // - Max length tags
    const patientEdge = await prisma.patient.create({
        data: {
            pId: 9999,
            name: '寿限無寿限無五劫の擦り切れ海砂利水魚の水行末雲来末風来末食う寝る処に住む処やぶら小路の藪柑子パイポパイポパイポのシューリンガンシューリンガンのグーリンダイグーリンダイのポンポコピーのポンポコナーの長久命の長助',
            kana: 'じゅげむじゅげむごこうのすりきれかいじゃりすいぎょのすいぎょうまつうんらいまつふうらいまつくうねるところにすむところでやぶらこうじのやぶこうじぱいぽぱいぽぱいぽのしゅーりんがんしゅーりんがんのぐーりんだいぐーりんだいのぽんぽこぴーのぽんぽこなーのちょうきゅうめいのちょうすけ',
            birthDate: new Date('1900-01-01'),
            gender: 'その他',
            phone: '000-0000-0000',
            memo: '名前表示のUI崩れ確認用。',
            tags: JSON.stringify(['名前長過', '要注意', 'テスト', 'VIP', 'クレーマー', '特別対応'])
        }
    })

    // Scenario C: The "Problematic" One (Verification Target)
    // - Specific setup for the "Cancelled but Unresolved Memo" bug
    const patientProblem = await prisma.patient.create({
        data: {
            pId: 2001,
            name: '検証 健太',
            kana: 'けんしょう けんた',
            birthDate: new Date('1995-05-05'),
            gender: '男性',
            phone: '090-2222-2222',
            memo: 'システム検証用。',
            tags: JSON.stringify(['検証'])
        }
    })

    // Scenario D: The "Busy Bee"
    // - Many appointments today
    // - Mixed statuses
    const patientBusy = await prisma.patient.create({
        data: {
            pId: 3001,
            name: '多忙 道子',
            kana: 'たぼう みちこ',
            birthDate: new Date('1988-08-08'),
            gender: '女性',
            phone: '090-3333-3333',
            memo: '1日に複数回予約を入れる患者。',
            tags: JSON.stringify(['集中治療'])
        }
    })

    // Scenario E: The "Gap" History
    // - Came once long ago, then huge gap
    const patientGap = await prisma.patient.create({
        data: {
            pId: 4001,
            name: '久々 久し',
            kana: 'ひさびさ ひさし',
            birthDate: new Date('1970-10-10'),
            gender: '男性',
            phone: '090-4444-4444',
            memo: '5年ぶりの来院。',
            tags: JSON.stringify(['再診'])
        }
    })

    // ==========================================
    // 3. APPOINTMENTS (Dynamic Time)
    // ==========================================

    console.log('📅 Generating Appointments relative to:', today.toLocaleString())

    // --- TODAY'S SCHEDULE ---

    // 1. Morning - Completed (Busy Bee)
    await prisma.appointment.create({
        data: {
            patientId: patientBusy.id,
            startAt: setTime(today, 9, 0),
            duration: 60,
            status: 'completed',
            memo: '朝一番の施術',
            staffId: director.id
        }
    })

    // 2. Noon - Cancelled (Regular)
    await prisma.appointment.create({
        data: {
            patientId: patientRegular.id,
            startAt: setTime(today, 12, 0),
            duration: 30,
            status: 'cancelled',
            memo: '昼休みに来たかったがキャンセル',
            staffId: therapist.id
        }
    })

    // 3. Afternoon - Active/Unassigned (Gap) - "Coming Soon" or "Just Now" depending on run time
    // Let's make it fixed relative to 'now' to ensure it's visible as "Upcoming" or "Recent"
    // If run at night, these might be "past" but "scheduled" (status checks usually handle this)
    // We'll place one near "NOW" to test the time indicator
    const nearFuture = addMinutes(today, 30);
    await prisma.appointment.create({
        data: {
            patientId: patientGap.id,
            startAt: nearFuture,
            duration: 45,
            status: 'scheduled',
            memo: '久しぶりの来院枠。担当未定。',
            staffId: null // Unassigned
        }
    })

    // 4. Evening - The BUG VERIFICATION Case (Problem Patient)
    // Cancelled Appointment with UNRESOLVED Admin Memo
    // This tests if the system incorrectly shows it or if toggling memo reverts status
    await prisma.appointment.create({
        data: {
            patientId: patientProblem.id,
            startAt: setTime(today, 18, 0),
            duration: 30,
            status: 'cancelled',
            memo: '直前キャンセル',
            adminMemo: '【重要検証】キャンセル済みだが、この申し送りは未確認(Unresolved)のまま。これをResolvedにしても復活してはいけない。',
            isMemoResolved: false,
            staffId: director.id
        }
    })

    // 5. Night - Long Name Test
    await prisma.appointment.create({
        data: {
            patientId: patientEdge.id,
            startAt: setTime(today, 20, 0),
            duration: 90,
            status: 'scheduled',
            memo: '名前によるレイアウト崩れを確認。',
            adminMemo: 'VIP対応必須。お茶は熱めで。',
            isMemoResolved: false,
            staffId: director.id
        }
    })

    // 6. Night - Detailed Memo (Resolved)
    await prisma.appointment.create({
        data: {
            patientId: patientBusy.id,
            startAt: setTime(today, 21, 0),
            duration: 30,
            status: 'scheduled',
            memo: '本日2回目の来院。',
            adminMemo: '前回の施術（朝）の経過を聞くこと。申し送りは確認済み。',
            isMemoResolved: true,
            staffId: therapist.id
        }
    })

    // --- FUTURE ---
    await prisma.appointment.create({
        data: {
            patientId: patientRegular.id,
            startAt: addDays(setTime(today, 10, 0), 1), // Tomorrow 10am
            duration: 60,
            status: 'scheduled',
            memo: '明日の予約',
            staffId: director.id
        }
    })

    // ==========================================
    // 4. CLINICAL RECORDS
    // ==========================================

    // Regular Patient: Consistent history
    await prisma.clinicalRecord.create({
        data: {
            patientId: patientRegular.id,
            visitDate: subDays(today, 14),
            visitCount: 1,
            subjective: '腰が痛い',
            objective: 'L4圧痛',
            assessment: '腰痛症',
            plan: '経過観察',
            staffId: director.id
        }
    })
    await prisma.clinicalRecord.create({
        data: {
            patientId: patientRegular.id,
            visitDate: subDays(today, 7),
            visitCount: 2,
            subjective: 'だいぶ良い',
            objective: '可動域改善',
            assessment: '回復期',
            plan: '継続',
            staffId: director.id
        }
    })

    // Gap Patient: One old record
    await prisma.clinicalRecord.create({
        data: {
            patientId: patientGap.id,
            visitDate: subDays(today, 1800), // ~5 years ago
            visitCount: 1,
            subjective: '若い頃の怪我',
            objective: '古傷',
            assessment: '捻挫後遺症',
            plan: '完治',
            staffId: director.id
        }
    })

    console.log('✅ Seeding completed with Comprehensive Stress Test Data!')
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
