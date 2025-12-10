'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { format, differenceInMinutes, isBefore, isAfter, addMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Bell, Clock, RefreshCw } from 'lucide-react';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
}

export function DailyAppointmentPanel({ appointments: initialData }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // 1 min

        return () => clearInterval(timer);
    }, []);

    // Manual Refresh (Simulated for MVP, ideally re-fetches server data)
    const handleRefresh = () => {
        // In a real app, optimize this to fetch new data via Server Action or API.
        // For now just update 'now' to force re-render checks.
        setCurrentTime(new Date());
        // Could also allow routing.refresh() here.
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-lg">本日の来院予定</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{format(currentTime, 'HH:mm')} 更新</span>
                    <button onClick={handleRefresh} className="hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[500px] lg:max-h-none">
                {appointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        予定はありません
                    </div>
                ) : (
                    appointments.map(apt => {
                        const aptTime = new Date(apt.visitDate);
                        const diff = differenceInMinutes(aptTime, currentTime);

                        // Status Logic
                        const isPast = diff < -15; // 15 mins passed
                        const isUpcoming = diff >= 0 && diff <= 60; // Within 1 hour
                        const isJustNow = diff >= -15 && diff < 0; // Just started/arrived

                        let statusColor = "bg-white border-slate-200";
                        if (isUpcoming) statusColor = "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200";
                        if (isJustNow) statusColor = "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200";
                        if (isPast) statusColor = "bg-slate-50 border-slate-100 opacity-60";

                        return (
                            <Link
                                href={`/patients/${apt.patientId}`}
                                key={apt.id}
                                className={`block p-3 rounded-lg border transition-all hover:shadow-md ${statusColor} group relative`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold font-mono ${isUpcoming ? 'text-yellow-700' : isJustNow ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            {format(aptTime, 'HH:mm')}
                                        </span>
                                        {isUpcoming && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                                                あと{diff}分
                                            </span>
                                        )}
                                        {isJustNow && (
                                            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                来院時刻
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                        {apt.visitCount}回目
                                    </span>
                                </div>

                                <div>
                                    <div className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-blue-600 transition-colors">
                                        {apt.patientName} <span className="text-xs font-normal text-slate-500 ml-1">{apt.patientKana}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {apt.tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {isUpcoming && (
                                    <div className="absolute right-2 bottom-2">
                                        <Bell className="w-4 h-4 text-yellow-400 fill-yellow-400 opacity-50" />
                                    </div>
                                )}
                            </Link>
                        );
                    })
                )}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-center text-slate-400">
                AI要約連携 (Beta) / 通知機能 (Coming Soon)
            </div>
        </div>
    );
}
