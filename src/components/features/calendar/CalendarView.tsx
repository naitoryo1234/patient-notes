'use client';

import { useState, useCallback } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useFeatures } from '@/contexts/FeaturesContext';

interface CalendarViewProps {
    appointments: Appointment[];
    staffList: Staff[];
    initialDate?: Date;
    onAppointmentClick: (appointment: Appointment) => void;
    onDateClick: (date: Date, timeStr?: string) => void;
    onDropAppointment: (appointmentId: string, newDate: Date) => void;
}

export type ViewMode = 'month' | 'week';

export function CalendarView({
    appointments,
    staffList,
    initialDate = new Date(),
    onAppointmentClick,
    onDateClick,
    onDropAppointment
}: CalendarViewProps) {
    const { calendarSettings } = useFeatures();
    const [currentDate, setCurrentDate] = useState<Date>(initialDate);
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    const handlePrev = useCallback(() => {
        if (viewMode === 'month') {
            setCurrentDate(prev => subMonths(prev, 1));
        } else {
            setCurrentDate(prev => subWeeks(prev, 1));
        }
    }, [viewMode]);

    const handleNext = useCallback(() => {
        if (viewMode === 'month') {
            setCurrentDate(prev => addMonths(prev, 1));
        } else {
            setCurrentDate(prev => addWeeks(prev, 1));
        }
    }, [viewMode]);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleDateClickInternal = (date: Date, timeStr?: string) => {
        // If clicking a date in month view, maybe switch to week view? 
        // For now, adhere to requirement: open modal
        // But clicking date number in MonthView could switch to WeekView ideally.
        // Let's keep it simple: date cell click -> open create modal.
        onDateClick(date, timeStr);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToday}>今日</Button>
                    <div className="flex items-center rounded-md border border-slate-200 bg-white">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <span className="text-lg font-bold ml-2 text-slate-700">
                        {format(currentDate, viewMode === 'month' ? 'yyyy年 M月' : 'yyyy年 M月', { locale: ja })}
                        {viewMode === 'week' && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                (第{Math.ceil(currentDate.getDate() / 7)}週)
                            </span>
                        )}
                    </span>
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'month'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        月表示
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'week'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        週表示
                    </button>
                </div>
            </div>

            {/* View Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {viewMode === 'month' ? (
                    <MonthView
                        currentDate={currentDate}
                        appointments={appointments}
                        staffList={staffList}
                        onAppointmentClick={onAppointmentClick}
                        onDateClick={handleDateClickInternal}
                        onDropAppointment={onDropAppointment}
                    />
                ) : (
                    <WeekView
                        currentDate={currentDate}
                        appointments={appointments}
                        staffList={staffList}
                        onAppointmentClick={onAppointmentClick}
                        onDateClick={handleDateClickInternal}
                        onDropAppointment={onDropAppointment}
                        startHour={calendarSettings.startHour}
                        endHour={calendarSettings.endHour}
                    />
                )}
            </div>
        </div>
    );
}
