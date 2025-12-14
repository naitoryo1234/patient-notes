'use client';

import { useState, useRef, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { DraggableAppointment } from './DraggableAppointment';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, isToday, setHours, setMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LABELS } from '@/config/labels';

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[];
    staffList: Staff[];
    onAppointmentClick: (appointment: Appointment) => void;
    onDateClick: (date: Date, timeStr?: string) => void;
    onDropAppointment: (appointmentId: string, newDate: Date) => void;
    // 営業時間設定
    startHour?: number;
    endHour?: number;
}

export function WeekView({
    currentDate,
    appointments,
    staffList,
    onAppointmentClick,
    onDateClick,
    onDropAppointment,
    startHour: propsStartHour,
    endHour: propsEndHour
}: WeekViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

    const startDate = startOfWeek(currentDate, { locale: ja });
    const endDate = endOfWeek(currentDate, { locale: ja });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    // Hours to display: props経由または デフォルト 9:00 to 21:00
    const startHour = propsStartHour ?? 9;
    const endHour = propsEndHour ?? 21;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Initial scroll to 10:00 or current time
    useEffect(() => {
        if (containerRef.current) {
            // Scroll to 9:00 (0px if starts at 9)
            containerRef.current.scrollTop = 0;
        }
    }, [startDate]);

    // DnD Handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, slotId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverSlot !== slotId) {
            setDragOverSlot(slotId);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDragOverSlot(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number, minute: number = 0) => {
        e.preventDefault();
        setDragOverSlot(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.id) {
                const targetDate = new Date(date);
                targetDate.setHours(hour, minute, 0, 0);
                onDropAppointment(data.id, targetDate);
            }
        } catch (err) {
            console.error('Failed to parse drag data', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-700">
            {/* Header: Days */}
            <div className="grid grid-cols-[60px_1fr] border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="p-2 border-r border-slate-200"></div> {/* Time col header */}
                <div className="grid grid-cols-7 divide-x divide-slate-200">
                    {days.map((day, i) => (
                        <div key={day.toString()} className={cn(
                            "py-2 text-center",
                            isToday(day) && "bg-blue-50/50"
                        )}>
                            <div className={cn(
                                "text-xs font-bold",
                                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"
                            )}>
                                {weekDays[i]}
                            </div>
                            <div className={cn(
                                "text-lg font-bold inline-flex items-center justify-center w-8 h-8 rounded-full mt-1",
                                isToday(day) ? "bg-blue-600 text-white" : "text-slate-700"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrollable Body */}
            <div ref={containerRef} className="flex-1 overflow-y-auto relative grid grid-cols-[60px_1fr]">
                {/* Time Axis */}
                <div className="border-r border-slate-200 bg-slate-50">
                    {hours.map(hour => (
                        <div key={hour} className="h-[60px] border-b border-slate-200 relative">
                            <span className="absolute -top-2.5 left-2 text-xs text-slate-400 bg-slate-50 px-1">
                                {hour}:00
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 relative">
                    {/* Background Grid Lines (Hours) */}
                    <div className="absolute inset-0 grid grid-rows-[repeat(13,60px)] z-0 pointer-events-none">
                        {hours.map(h => (
                            <div key={h} className="border-b border-slate-100 h-[60px]"></div>
                        ))}
                    </div>

                    {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayAppointments = appointments.filter(app =>
                            isSameDay(new Date(app.visitDate), day) && app.status !== 'cancelled'
                        );

                        return (
                            <div key={day.toString()} className="relative h-[calc(13*60px)] z-10 group">
                                {/* Clickable/Droppable Slots (Overlay invisible slots for interaction) */}
                                {hours.map(hour => {
                                    // Split hour into two 30-min slots for finer granularity
                                    const slotId1 = `${dateStr}-${hour}-00`;
                                    const slotId2 = `${dateStr}-${hour}-30`;
                                    const isOver1 = dragOverSlot === slotId1;
                                    const isOver2 = dragOverSlot === slotId2;

                                    return (
                                        <div key={hour} className="h-[60px] relative">
                                            {/* Top half (00-30) */}
                                            <div
                                                className={cn(
                                                    "absolute top-0 left-0 right-0 h-1/2 z-0 transition-colors",
                                                    isOver1 && "bg-indigo-100/50"
                                                )}
                                                onClick={() => onDateClick(day, `${hour.toString().padStart(2, '0')}:00`)}
                                                onDragOver={(e) => handleDragOver(e, slotId1)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day, hour, 0)}
                                            />
                                            {/* Bottom half (30-60) */}
                                            <div
                                                className={cn(
                                                    "absolute bottom-0 left-0 right-0 h-1/2 z-0 transition-colors border-b border-dashed border-slate-100", // half-hour dash
                                                    isOver2 && "bg-indigo-100/50"
                                                )}
                                                onClick={() => onDateClick(day, `${hour.toString().padStart(2, '0')}:30`)}
                                                onDragOver={(e) => handleDragOver(e, slotId2)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day, hour, 30)}
                                            />
                                        </div>
                                    );
                                })}

                                {/* Render Appointments with Overlap Handling */}
                                {(() => {
                                    // 1. Sort by start time, then duration (desc)
                                    const sortedApps = [...dayAppointments].sort((a, b) => {
                                        const dateA = new Date(a.visitDate);
                                        const dateB = new Date(b.visitDate);
                                        if (dateA.getTime() !== dateB.getTime()) {
                                            return dateA.getTime() - dateB.getTime();
                                        }
                                        return (b.duration || 60) - (a.duration || 60);
                                    });

                                    // 2. Simple column packing
                                    // For each appointment, find columns
                                    const columns: Appointment[][] = [];

                                    const positionedApps = sortedApps.map(app => {
                                        const appDate = new Date(app.visitDate);
                                        const start = appDate.getHours() * 60 + appDate.getMinutes();
                                        const end = start + (app.duration || 60);

                                        // Find first column where this app fits
                                        let colIndex = -1;
                                        for (let i = 0; i < columns.length; i++) {
                                            // Check if overlaps with any app in this column
                                            const hasOverlap = columns[i].some(existing => {
                                                const exDate = new Date(existing.visitDate);
                                                const exStart = exDate.getHours() * 60 + exDate.getMinutes();
                                                const exEnd = exStart + (existing.duration || 60);
                                                return start < exEnd && end > exStart;
                                            });
                                            if (!hasOverlap) {
                                                colIndex = i;
                                                break;
                                            }
                                        }

                                        if (colIndex === -1) {
                                            colIndex = columns.length;
                                            columns.push([]);
                                        }

                                        columns[colIndex].push(app);
                                        return { app, colIndex };
                                    });

                                    const totalCols = columns.length;

                                    return positionedApps.map(({ app, colIndex }) => {
                                        const appDate = new Date(app.visitDate);
                                        const startH = appDate.getHours();
                                        const startM = appDate.getMinutes();
                                        if (startH < startHour || startH > endHour) return null;

                                        const topOffset = (startH - startHour) * 60 + startM;
                                        const height = Math.max(app.duration || 60, 20);

                                        // Calculate dynamic width and left position
                                        // width = (100% - padding) / totalCols
                                        // left = colIndex * width
                                        const widthPercent = 95 / (totalCols || 1);
                                        const leftPercent = colIndex * widthPercent + 1; // +1 for left padding

                                        // Staff Color Assignment
                                        // Generate consistent color based on staff ID index in sorted staffList
                                        const getStaffColor = (sId: string | null | undefined) => {
                                            if (!sId) return "border-red-400"; // Unassigned
                                            const sortedStaff = [...staffList].sort((a, b) => a.id.localeCompare(b.id)); // Ensure stable order
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
                                        let bgClass = "bg-white"; // default scheduled
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
                                                className="absolute rounded shadow-sm text-xs z-20 overflow-hidden"
                                                style={{
                                                    top: `${topOffset}px`,
                                                    height: `${height}px`,
                                                    left: `${leftPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    zIndex: 20 + colIndex
                                                }}
                                                // Allow dropping ONTO existing appointments
                                                onDragOver={(e) => handleDragOver(e, `${format(day, 'yyyy-MM-dd')}-${startH}-00`)}
                                                onDrop={(e) => handleDrop(e, day, startH, startM)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAppointmentClick(app);
                                                }}
                                            >
                                                <DraggableAppointment
                                                    appointment={app}
                                                    className={cn(
                                                        "w-full h-full p-1 border border-l-4",
                                                        borderColor,
                                                        bgClass
                                                    )}
                                                >
                                                    <div className="font-bold">{format(appDate, 'HH:mm')}</div>
                                                    <div className="truncate font-medium">{app.patientName}</div>
                                                    {app.memo && (
                                                        <div className="truncate text-[10px] text-slate-500 mt-0.5">
                                                            {app.memo}
                                                        </div>
                                                    )}
                                                    {app.duration && app.duration !== 60 && (
                                                        <div className="text-[10px] opacity-75 mt-0.5">{app.duration}分</div>
                                                    )}
                                                </DraggableAppointment>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
