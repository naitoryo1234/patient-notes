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

    // Helper for date manipulation (FIXED DATE for testing: 2026-01-15)
    // This allows consistent demo data regardless of when seed is run
    const today = new Date('2026-01-15T00:00:00');
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

    // Scenario B: The "Edge Case" Name Tester
    // - Slightly longer than average name
    // - For testing text overflow handling
    const patientEdge = await prisma.patient.create({
        data: {
            pId: 9999,
            name: '西園寺 美智子',
            kana: 'さいおんじ みちこ',
            birthDate: new Date('1975-03-20'),
            gender: '女性',
            phone: '090-5555-5555',
            memo: '名前がやや長めの患者。UI確認用。',
            tags: JSON.stringify(['VIP', '要注意', '特別対応'])
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
    // 3. APPOINTMENTS (2026-01-15 基準)
    // ==========================================

    console.log('📅 Generating Bulk Appointments for demo date:', today.toLocaleString())

    const appointments = [];

    // 1. Generate 30 Appointments for TODAY (2026-01-15) to test Pagination (20 items/page)
    for (let i = 0; i < 30; i++) {
        const hour = 9 + Math.floor(i / 2); // 9:00, 9:30, 10:00...
        const minute = (i % 2) * 30;
        const time = setTime(today, hour, minute);

        // Mix of patients
        const patients = [patientRegular, patientEdge, patientProblem, patientBusy, patientGap];
        const patient = patients[i % patients.length];

        // Status Variation
        let status = 'scheduled';
        if (i < 5) status = 'completed'; // Morning done
        if (i === 12) status = 'cancelled'; // Lunch cancellation
        if (i > 15 && i < 18) status = 'arrived'; // Currently waiting

        // Staff Variation
        let staffId: string | null = (i % 2 === 0) ? director.id : therapist.id;
        if (i === 10 || i === 25) staffId = null; // Unassigned cases (Warning Badge)

        // Memo Variation
        let adminMemo = undefined;
        let isMemoResolved = false;

        // Scenario: Unresolved Memo (Red Badge)
        if (i === 7 || i === 22) {
            adminMemo = '【要確認】持病の薬が変わったとのこと。必ず確認してください。';
            isMemoResolved = false;
        }
        // Scenario: Resolved Memo (History)
        if (i === 3) {
            adminMemo = '前回のクレーム対応完了。本日は特別対応不要。';
            isMemoResolved = true;
        }
        // Scenario: Problem Case (Cancelled but Unresolved)
        if (i === 12) {
            status = 'cancelled';
            adminMemo = 'キャンセル連絡あり。来週へ変更希望とのこと。';
            isMemoResolved = false; // Should show red badge? Or be grayed out?
        }

        appointments.push({
            patientId: patient.id,
            startAt: time,
            duration: (i % 3 + 1) * 30, // 30, 60, 90 mins
            status: status,
            memo: i % 5 === 0 ? '定期的なメンテナンス' : (i % 7 === 0 ? '少し痛みがあるとのこと' : undefined),
            adminMemo: adminMemo,
            isMemoResolved: isMemoResolved,
            staffId: staffId
        });
    }

    // ==========================================
    // 2026-01-16 (明日) の予約
    // ==========================================
    const tomorrow = addDays(today, 1); // 2026-01-16

    appointments.push({
        patientId: patientRegular.id,
        startAt: setTime(tomorrow, 10, 0),
        duration: 60,
        status: 'scheduled',
        memo: '明日の予約テスト',
        staffId: director.id
    });
    appointments.push({
        patientId: patientBusy.id,
        startAt: setTime(tomorrow, 10, 0), // Same time, different staff - overlap test
        duration: 60,
        status: 'scheduled',
        staffId: therapist.id
    });
    appointments.push({
        patientId: patientGap.id,
        startAt: setTime(tomorrow, 14, 30),
        duration: 90,
        status: 'scheduled',
        staffId: director.id
    });

    // ==========================================
    // 2026-01-17 (明後日) の予約
    // ==========================================
    const dayAfterTomorrow = addDays(today, 2); // 2026-01-17

    appointments.push({
        patientId: patientProblem.id,
        startAt: setTime(dayAfterTomorrow, 9, 30),
        duration: 60,
        status: 'scheduled',
        adminMemo: '前回キャンセル分の振替。',
        staffId: therapist.id
    });
    appointments.push({
        patientId: patientEdge.id,
        startAt: setTime(dayAfterTomorrow, 11, 0),
        duration: 90,
        status: 'scheduled',
        staffId: director.id
    });

    // ==========================================
    // 2026-01-20 (来週月曜) の予約
    // ==========================================
    const nextMonday = addDays(today, 5); // 2026-01-20

    appointments.push({
        patientId: patientRegular.id,
        startAt: setTime(nextMonday, 10, 0),
        duration: 60,
        status: 'scheduled',
        memo: '来週の定期予約',
        staffId: director.id
    });
    appointments.push({
        patientId: patientBusy.id,
        startAt: setTime(nextMonday, 13, 0),
        duration: 60,
        status: 'scheduled',
        staffId: null // Unassigned
    });

    for (const apt of appointments) {
        await prisma.appointment.create({ data: apt });
    }

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
