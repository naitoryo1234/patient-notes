'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { AppointmentListClient } from './AppointmentListClient';
import { DailyAppointmentPanel } from '@/components/dashboard/DailyAppointmentPanel';

interface AppointmentsPageClientProps {
    appointments: Appointment[];
    todaysAppointments: Appointment[];
    unresolvedMemos: Appointment[];
    staffList: Staff[];
    includePast: boolean;
}

export function AppointmentsPageClient({
    appointments,
    todaysAppointments,
    unresolvedMemos,
    staffList,
    includePast,
}: AppointmentsPageClientProps) {
    const [patientFilter, setPatientFilter] = useState('');

    // When a patient card is clicked in DailyAppointmentPanel, 
    // update the search filter with the patient's full name
    const handlePatientClick = (patientName: string) => {
        setPatientFilter(patientName);
    };

    return (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-y-auto lg:overflow-hidden">
            {/* Left Column: Today's Schedule (Fixed Panel) */}
            <div className="lg:col-span-1 h-auto lg:h-full lg:overflow-y-auto pr-1">
                <DailyAppointmentPanel
                    appointments={todaysAppointments}
                    staffList={staffList}
                    unresolvedMemos={unresolvedMemos}
                    onPatientClick={handlePatientClick}
                />
            </div>

            {/* Right Column: All Appointments */}
            <div className="lg:col-span-3 h-auto lg:h-full lg:overflow-y-auto min-h-0">
                <AppointmentListClient
                    initialAppointments={appointments}
                    staffList={staffList}
                    includePast={includePast}
                    externalPatientFilter={patientFilter}
                    onPatientFilterChange={setPatientFilter}
                />
            </div>
        </div>
    );
}
