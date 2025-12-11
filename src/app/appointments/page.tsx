import { findAllAppointments, getTodaysAppointments, getUnresolvedAdminMemos } from '@/services/appointmentService';
import { getActiveStaff } from '@/services/staffService';
import { AppointmentListClient } from './AppointmentListClient';
import { DailyAppointmentPanel } from '@/components/dashboard/DailyAppointmentPanel';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { LABELS } from '@/config/labels';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ history?: string }> }) {
    const params = await searchParams;
    // Default to SHOWING past appointments (Ledger mode)
    const includePast = params?.history !== 'false';
    // Include cancelled to show them in list (greyed out)
    const appointments = await findAllAppointments({ includePast, includeCancelled: true });
    const todaysAppointments = await getTodaysAppointments();
    const unresolvedMemos = await getUnresolvedAdminMemos();
    const staffList = await getActiveStaff();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{LABELS.APPOINTMENT.MANAGER_TITLE}</h1>
                    <p className="text-slate-500 text-sm">{LABELS.APPOINTMENT.MANAGER_DESC}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
                {/* Left Column: Today's Schedule (Fixed Panel) */}
                <div className="lg:col-span-1 h-full">
                    <DailyAppointmentPanel
                        appointments={todaysAppointments}
                        staffList={staffList}
                        unresolvedMemos={unresolvedMemos}
                    />
                </div>

                {/* Right Column: All Appointments */}
                <div className="lg:col-span-3 h-full overflow-hidden">
                    <AppointmentListClient
                        initialAppointments={appointments}
                        staffList={staffList}
                        includePast={includePast}
                    />
                </div>
            </div>
        </div>
    );
}
