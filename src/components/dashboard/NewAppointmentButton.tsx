'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { Staff } from '@/services/staffService';
import { format } from 'date-fns';
import { TERMS, LABELS } from '@/config/labels';
import { AppointmentFormModal } from '@/components/domain/AppointmentFormModal';

interface NewAppointmentButtonProps {
    staffList: Staff[];
    initialDate?: Date; // Current filtered date
    className?: string;
}

export function NewAppointmentButton({ staffList, initialDate, className }: NewAppointmentButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className={`bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md gap-3 px-6 h-11 rounded-lg text-base font-bold transition-all hover:shadow-lg ${className}`}
            >
                <CalendarPlus className="w-5 h-5" />
                {LABELS.COMMON.NEW}{TERMS.APPOINTMENT}
            </Button>

            <AppointmentFormModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                staffList={staffList}
                mode="create"
                initialDate={initialDate ? format(initialDate, 'yyyy-MM-dd') : undefined}
            />
        </>
    );
}
