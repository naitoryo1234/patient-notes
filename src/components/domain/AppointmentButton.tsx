'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Staff } from '@/services/staffService';
import { AppointmentFormModal } from '@/components/domain/AppointmentFormModal';

interface AppointmentButtonProps {
    patientId: string;
    patientName: string;
    patientKana: string;
    staffList: Staff[];
}

export function AppointmentButton({ patientId, patientName, patientKana, staffList }: AppointmentButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setIsOpen(true)}
            >
                <Calendar className="w-4 h-4" />
                次回予約をとる
            </Button>

            <AppointmentFormModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                staffList={staffList}
                mode="create"
                initialPatient={{
                    id: patientId,
                    name: patientName,
                    kana: patientKana,
                }}
            />
        </>
    );
}
