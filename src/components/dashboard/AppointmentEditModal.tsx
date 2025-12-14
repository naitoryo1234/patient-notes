'use client';

import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { AppointmentFormModal } from '@/components/domain/AppointmentFormModal';

interface AppointmentEditModalProps {
    appointment: Appointment;
    staffList: Staff[];
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Legacy wrapper for AppointmentFormModal in edit mode.
 * Maintains backward compatibility with existing code.
 */
export function AppointmentEditModal({ appointment, staffList, isOpen, onClose }: AppointmentEditModalProps) {
    return (
        <AppointmentFormModal
            isOpen={isOpen}
            onClose={onClose}
            staffList={staffList}
            mode="edit"
            appointment={appointment}
        />
    );
}
