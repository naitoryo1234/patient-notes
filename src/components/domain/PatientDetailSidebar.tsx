import { PatientProfile } from '@/components/domain/PatientProfile';
import { AppointmentButton } from '@/components/domain/AppointmentButton';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Patient } from '@prisma/client';
import { Staff } from '@/services/staffService'; // Use Service Type

import { NextAppointmentCard } from '@/components/domain/NextAppointmentCard';

// ... (imports)

// Type matching what getNextAppointment returns
interface NextAppointmentSummary {
    id: string;
    startAt: Date;
    duration: number; // added
    memo?: string | null;
    staffId?: string; // added
    staffName?: string;
}

interface PatientDetailSidebarProps {
    patient: Patient;
    nextAppt: NextAppointmentSummary | null;
    staffList: Staff[];
}

export function PatientDetailSidebar({ patient, nextAppt, staffList }: PatientDetailSidebarProps) {
    return (
        <div className="space-y-6">
            <PatientProfile patient={patient} />

            {nextAppt && (
                <NextAppointmentCard
                    appointment={nextAppt}
                    staffList={staffList}
                    patientName={patient.name}
                    patientKana={patient.kana}
                />
            )}

            <div className="flex gap-2">
                <AppointmentButton patientId={patient.id} patientName={patient.name} patientKana={patient.kana} staffList={staffList} />
            </div>
        </div>
    );
}
