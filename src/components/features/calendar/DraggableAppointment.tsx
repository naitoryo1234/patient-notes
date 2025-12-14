'use client';

import { useRef } from 'react';
import { Appointment } from '@/services/appointmentService';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { features } from '@/config/features';

interface DraggableAppointmentProps {
    appointment: Appointment;
    children: React.ReactNode;
    className?: string;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, appointment: Appointment) => void;
}

export function DraggableAppointment({
    appointment,
    children,
    className,
    onDragStart
}: DraggableAppointmentProps) {
    const { operator } = useAuth();

    // Only allow drag if authenticated OR auth is disabled
    const canDrag = (!features.auth.enabled || !!operator) && appointment.status !== 'cancelled';

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (!canDrag) return;

        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: appointment.id,
            duration: appointment.duration || 60,
            patientName: appointment.patientName,
            visitDate: appointment.visitDate
        }));

        // Add ghost image style if needed, or browser default is usually fine
        // e.dataTransfer.setDragImage(e.currentTarget, 0, 0);

        if (onDragStart) {
            onDragStart(e, appointment);
        }
    };

    return (
        <div
            draggable={canDrag}
            onDragStart={handleDragStart}
            className={cn(
                "touch-none select-none transition-all active:shadow-none",
                "hover:brightness-95 hover:shadow-md hover:border-slate-300 hover:z-30", // Visual feedback
                canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer", // cursor-pointer if not draggable (but clickable)
                className
            )}
        >
            {children}
        </div>
    );
}
