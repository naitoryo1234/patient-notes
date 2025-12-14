'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { DraggableAppointment } from './DraggableAppointment';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LABELS } from '@/config/labels';

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    staffList: Staff[];
    onAppointmentClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onDropAppointment: (appointmentId: string, newDate: Date) => void;
}

export function MonthView({
    currentDate,
    appointments,
    staffList,
    onAppointmentClick,
    onDateClick,
    onDropAppointment
}: MonthViewProps) {
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(monthEnd, { locale: ja });

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks = [];
    let daysInWeek = [];

    for (const day of days) {
        daysInWeek.push(day);
        if (daysInWeek.length === 7) {
            weeks.push(daysInWeek);
            daysInWeek = [];
        }
    }

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    // DnD Handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
        e.preventDefault(); // Essential to allow dropping
        e.dataTransfer.dropEffect = 'move';
        if (dragOverDate !== dateStr) {
            setDragOverDate(dateStr);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDragOverDate(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDate: Date) => {
        e.preventDefault();
        setDragOverDate(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.id) {
                // Preserve original time if available
                const finalDate = new Date(targetDate);
                if (data.visitDate) {
                    const originalDate = new Date(data.visitDate);
                    finalDate.setHours(originalDate.getHours(), originalDate.getMinutes());
                }
                onDropAppointment(data.id, finalDate);
            }
        } catch (err) {
            console.error('Failed to parse drag data', err);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-700">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {weekDays.map((day, i) => (
                    <div key={day} className={cn(
                        "py-2 text-center text-xs font-bold text-slate-500",
                        i === 0 && "text-red-500", // Sunday
                        i === 6 && "text-blue-500"  // Saturday
                    )}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-rows-6">
                {weeks.map((week, i) => (
                    <div key={i} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0 min-h-[100px]">
                        {week.map((day, dayIdx) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayAppointments = appointments.filter(app =>
                                isSameDay(new Date(app.visitDate), day) && app.status !== 'cancelled'
                            );
                            // Sort by time
                            dayAppointments.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isDragOver = dragOverDate === dateStr;

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "relative border-r border-slate-100 last:border-r-0 p-1 flex flex-col group transition-colors",
                                        !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                                        isToday(day) && "bg-blue-50/30",
                                        isDragOver && "bg-indigo-50 ring-2 ring-indigo-300 ring-inset"
                                    )}
                                    onClick={() => onDateClick(day)}
                                    onDragOver={(e) => handleDragOver(e, dateStr)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, day)}
                                >
                                    {/* Date Number */}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn(
                                            "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                            isToday(day) && "bg-blue-600 text-white"
                                        )}>
                                            {format(day, dateFormat)}
                                        </span>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-400 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDateClick(day);
                                            }}
                                        >
                                            <span className="sr-only">追加</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Appointments */}
                                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[120px] scrollbar-hide">
                                        {dayAppointments.map(app => {
                                            const time = format(new Date(app.visitDate), 'HH:mm');
                                            const staff = staffList.find(s => s.id === app.staffId);

                                            // Staff Color Assignment
                                            const getStaffColor = (sId: string | null | undefined) => {
                                                if (!sId) return "border-red-400";
                                                const sortedStaff = [...staffList].sort((a, b) => a.id.localeCompare(b.id));
                                                const index = sortedStaff.findIndex(s => s.id === sId);
                                                const palette = [
                                                    "border-blue-500", "border-emerald-500", "border-violet-500",
                                                    "border-fuchsia-500", "border-cyan-500", "border-rose-500",
                                                    "border-orange-500", "border-indigo-500"
                                                ];
                                                return index >= 0 ? palette[index % palette.length] : "border-slate-400";
                                            };
                                            const borderColor = getStaffColor(app.staffId);

                                            // Status Background
                                            let bgClass = "bg-white";
                                            // let textClass = "text-slate-700";

                                            if (app.status === 'arrived') {
                                                bgClass = "bg-green-50";
                                                // textClass = "text-green-900";
                                            } else if (app.status === 'completed') {
                                                bgClass = "bg-slate-100 text-slate-500";
                                            } else if (app.status === 'cancelled') {
                                                bgClass = "bg-red-50 opacity-50";
                                            } else if (!app.staffId) {
                                                bgClass = "bg-yellow-50";
                                            }

                                            return (
                                                <div
                                                    key={app.id}
                                                    className={cn(
                                                        "text-[10px] p-1 rounded border shadow-sm truncate flex items-center gap-1 leading-tight select-none cursor-pointer hover:brightness-95 transition-all border-l-4",
                                                        borderColor,
                                                        bgClass
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAppointmentClick(app);
                                                    }}
                                                >
                                                    <span className="font-mono font-bold opacity-75">{time}</span>
                                                    <span className="font-medium ml-1 truncate">{app.patientName}</span>
                                                </div>
                                            );
                                        })}
                                        {/* More indicator if needed, for now just scroll */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
