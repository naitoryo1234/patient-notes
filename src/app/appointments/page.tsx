import { findAllAppointments, getTodaysAppointments, getUnresolvedAdminMemos } from '@/services/appointmentService';
import { getActiveStaff } from '@/services/staffService';
import { AppointmentsPageClient } from './AppointmentsPageClient';

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
            <AppointmentsPageClient
                appointments={appointments}
                todaysAppointments={todaysAppointments}
                unresolvedMemos={unresolvedMemos}
                staffList={staffList}
                includePast={includePast}
            />
        </div>
    );
}
