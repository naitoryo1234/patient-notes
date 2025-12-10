'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { cancelAppointmentAction } from '@/actions/appointmentActions';
import { AppointmentEditModal } from './AppointmentEditModal';
import { format, differenceInMinutes, isBefore, isAfter, addMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Bell, Clock, RefreshCw, Pencil, Trash2 } from 'lucide-react';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
    staffList?: Staff[];
}

export function DailyAppointmentPanel({ appointments: initialData, staffList = [] }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Sync with props if revalidated
    useEffect(() => {
        setAppointments(initialData);
    }, [initialData]);

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
                    appointments.filter(apt => {
                        const aptTime = new Date(apt.visitDate);
                        const diff = differenceInMinutes(aptTime, currentTime);
                        return diff >= -60; // Hide if > 60 mins past
                    }).map(apt => {
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
                            <div key={apt.id} className={`relative rounded-lg border transition-all hover:shadow-md ${statusColor} group`}>
                                <Link
                                    href={`/patients/${apt.patientId}`}
                                    className="block p-3"
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
                                        {apt.staffName && (
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                                                <span className="bg-slate-100 px-1 rounded text-[10px]">担</span>
                                                {apt.staffName}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {apt.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {isUpcoming && (
                                        <div className="absolute right-2 bottom-2 pointer-events-none">
                                            <Bell className="w-4 h-4 text-yellow-400 fill-yellow-400 opacity-50" />
                                        </div>
                                    )}
                                </Link>

                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setEditingAppointment(apt);
                                        }}
                                        className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 rounded-md shadow-sm border border-slate-200 hover:border-indigo-300 transition-all"
                                        title="変更"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!confirm('本当にこの予約をキャンセルしますか？')) return;
                                            await cancelAppointmentAction(apt.id);
                                        }}
                                        className="p-1.5 bg-white text-slate-500 hover:text-red-600 rounded-md shadow-sm border border-slate-200 hover:border-red-300 transition-all"
                                        title="キャンセル"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                        );
                    })
                )}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-center text-slate-400">
                AI要約連携 (Beta) / 通知機能 (Coming Soon)
            </div>
            {editingAppointment && (
                <AppointmentEditModal
                    appointment={editingAppointment}
                    staffList={staffList}
                    isOpen={!!editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                />
            )}
        </div>
    );
}
