import { findAllAppointments } from '@/services/appointmentService';
import { getActiveStaff } from '@/services/staffService';
import { AppointmentListClient } from './AppointmentListClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ history?: string }> }) {
    const params = await searchParams;
    const includePast = params?.history === 'true';
    const appointments = await findAllAppointments({ includePast });
    const staffList = await getActiveStaff();

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">予約管理</h1>
                    <p className="text-slate-500 text-sm">全ての予約の確認・変更・キャンセルを行えます</p>
                </div>
            </div>

            <AppointmentListClient
                initialAppointments={appointments}
                staffList={staffList}
                includePast={includePast}
            />
        </div>
    );
}
