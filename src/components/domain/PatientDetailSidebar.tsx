import { PatientProfile } from '@/components/domain/PatientProfile';
import { AppointmentButton } from '@/components/domain/AppointmentButton';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Patient } from '@prisma/client';
import { Staff } from '@/services/staffService'; // Use Service Type

// Simplified type for what getNextAppointment returns
interface NextAppointmentSummary {
    id: string;
    startAt: Date;
    memo?: string | null;
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                        <span>📅</span> 次回の予定
                    </h4>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2 text-emerald-900 mb-1">
                            <span className="font-mono text-xl font-bold">
                                {format(nextAppt.startAt, 'MM/dd (eee) HH:mm', { locale: ja })}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            {nextAppt.staffName && (
                                <span className="text-xs bg-white border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                                    担当: {nextAppt.staffName}
                                </span>
                            )}
                        </div>
                    </div>
                    {nextAppt.memo && <div className="text-xs text-emerald-600 mt-2 border-t border-emerald-100 pt-1">{nextAppt.memo}</div>}
                </div>
            )}

            <div className="flex gap-2">
                <AppointmentButton patientId={patient.id} staffList={staffList} />
                <Link href={`/patients/${patient.id}/edit`} className="bg-slate-100 text-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-200 flex items-center">
                    基本情報の変更
                </Link>
            </div>
        </div>
    );
}
