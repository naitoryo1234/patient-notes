'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentEditModal } from '@/components/dashboard/AppointmentEditModal';
import { Staff } from '@/services/staffService';
import { Appointment } from '@/services/appointmentService';
import { useRouter } from 'next/navigation';

// Type matching the actual return value of getNextAppointment + extra fields we might need
interface NextAppointmentSummary {
    id: string;
    startAt: Date;
    duration: number;
    memo?: string | null;
    staffId?: string;
    staffName?: string;
}

interface NextAppointmentCardProps {
    appointment: NextAppointmentSummary;
    staffList: Staff[];
    patientName?: string; // For dummy Appointment object
    patientKana?: string; // For dummy Appointment object
}

export function NextAppointmentCard({ appointment, staffList, patientName = '', patientKana = '' }: NextAppointmentCardProps) {
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Convert NextAppointmentSummary to Appointment object for the modal
    const appointmentForModal: Appointment = {
        id: appointment.id,
        patientId: '', // Not used in modal
        patientName: patientName,
        patientKana: patientKana,
        visitDate: appointment.startAt,
        duration: appointment.duration,
        visitCount: 0, // Not used
        tags: [], // Not used
        memo: appointment.memo || '',
        staffName: appointment.staffName,
        staffId: appointment.staffId || undefined,
        status: 'scheduled'
    };

    const handleClose = () => {
        setIsEditOpen(false);
        router.refresh();
    };

    return (
        <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm relative group">
                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                    <span>📅</span> 次回の予定
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditOpen(true)}
                        className="h-6 w-6 ml-2 text-emerald-600 hover:text-emerald-800 bg-emerald-100/50 hover:bg-emerald-200 border border-emerald-200/50 hover:border-emerald-300 shadow-sm transition-all"
                        title="予約を変更"
                    >
                        <Pencil className="w-3 h-3" />
                    </Button>
                </h4>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2 text-emerald-900 mb-1">
                        <span className="font-mono text-xl font-bold">
                            {format(new Date(appointment.startAt), 'MM/dd (eee) HH:mm', { locale: ja })}
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        {appointment.staffName && (
                            <span className="text-xs bg-white border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                                担当: {appointment.staffName}
                            </span>
                        )}
                        <span className="text-xs text-emerald-600/80">
                            ({appointment.duration}分)
                        </span>
                    </div>
                </div>
                {appointment.memo && (
                    <div className="text-xs text-emerald-600 mt-2 border-t border-emerald-100 pt-1">
                        {appointment.memo}
                    </div>
                )}
            </div>

            <AppointmentEditModal
                isOpen={isEditOpen}
                onClose={handleClose}
                appointment={appointmentForModal}
                staffList={staffList}
            />
        </>
    );
}
