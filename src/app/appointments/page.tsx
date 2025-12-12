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
        <div className="h-full flex flex-col gap-4">
            {/* Header removed for space optimization */}

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-y-auto lg:overflow-hidden">
                {/* Left Column: Today's Schedule (Fixed Panel) */}
                <div className="lg:col-span-1 h-auto lg:h-full lg:overflow-y-auto pr-1">
                    <DailyAppointmentPanel
                        appointments={todaysAppointments}
                        staffList={staffList}
                        unresolvedMemos={unresolvedMemos}
                    />
                </div>

                {/* Right Column: All Appointments */}
                <div className="lg:col-span-3 h-auto lg:h-full lg:overflow-y-auto min-h-0">
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
