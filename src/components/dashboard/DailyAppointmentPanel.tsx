'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { cancelAppointmentAction } from '@/actions/appointmentActions';
import { AppointmentEditModal } from './AppointmentEditModal';
import { format, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Clock, RefreshCw, Pencil, Trash2, AlertCircle } from 'lucide-react';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
    staffList?: Staff[];
}

export function DailyAppointmentPanel({ appointments: initialData, staffList = [] }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const router = useRouter();

    // Sync with props if revalidated
    useEffect(() => {
        setAppointments(initialData);
    }, [initialData]);

    // Update time and fetch latest data every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            // Refresh server data to show new appointments
            // Only refresh if not editing to avoid disrupting UI state (though Next.js preserves client state)
            if (!editingAppointment) {
                router.refresh();
            }
        }, 60000); // 1 min

        return () => clearInterval(timer);
    }, [router, editingAppointment]);

    // Manual Refresh
    const handleRefresh = () => {
        setCurrentTime(new Date());
        router.refresh();
    };

    const pendingAssignments = appointments.filter(a => !a.staffId && a.status !== 'cancelled').length;

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

            {/* Unassigned Warning */}
            {pendingAssignments > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 p-2 flex items-center gap-2 text-xs text-amber-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>担当未定の予約が {pendingAssignments} 件あります</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                {appointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        予定はありません
                    </div>
                ) : (
                    appointments.map(apt => {
                        const aptTime = new Date(apt.visitDate);
                        const diff = differenceInMinutes(aptTime, currentTime);
                        const duration = apt.duration || 60;

                        // Status Logic
                        const isCancelled = apt.status === 'cancelled';

                        // Time-based states
                        // Upcoming: Within 60 mins before start
                        const isUpcoming = !isCancelled && diff > 0 && diff <= 60;

                        // Just Started: 0 to 15 mins after start
                        const isJustNow = !isCancelled && diff <= 0 && diff >= -15;

                        // In Progress: 15 mins after start until End (duration)
                        const isInProgress = !isCancelled && diff < -15 && diff >= -duration;

                        // Done: After duration
                        const isDone = !isCancelled && diff < -duration;

                        // Unassigned: Future or Active, but no staff
                        const isUnassigned = !isCancelled && !isDone && !apt.staffId;

                        let statusColor = "bg-white border-slate-200";
                        if (isCancelled) statusColor = "bg-slate-50 border-slate-100 opacity-60 grayscale"; // Cancelled
                        else if (isDone) statusColor = "bg-slate-50 border-slate-200 opacity-75"; // Done (Past)
                        else if (isUnassigned) statusColor = "bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100"; // Unassigned (Alert)
                        else if (isUpcoming) statusColor = "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200";
                        else if (isJustNow) statusColor = "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200";
                        else if (isInProgress) statusColor = "bg-white border-slate-300 shadow-md ring-1 ring-slate-100";

                        // Check for Important/Caution tags to add subtle visual cue
                        const isImportant = apt.tags.some(t => ['重要', '禁忌', '要注意'].includes(t));
                        if (isImportant && !isCancelled && !isDone && !isUnassigned) {
                            statusColor += " border-l-4 border-l-red-400"; // Add accent to important active appointments
                        }

                        return (
                            <div key={apt.id} className={`relative rounded-lg border transition-all hover:shadow-md ${statusColor} group`}>
                                <Link
                                    href={`/patients/${apt.patientId}`}
                                    className="block p-3"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-bold font-mono ${isCancelled ? 'text-slate-400 line-through' : isUpcoming ? 'text-yellow-700' : isJustNow ? 'text-emerald-700' : 'text-slate-700'}`}>
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
                                            {isCancelled && (
                                                <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                    キャンセル
                                                </span>
                                            )}
                                            {isDone && (
                                                <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                    完了
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {apt.visitCount}回目
                                        </span>
                                    </div>

                                    <div>
                                        <div className={`font-bold text-base mb-0.5 transition-colors ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                            {apt.patientName} <span className="text-xs font-normal text-slate-500 ml-1 decoration-auto">{apt.patientKana}</span>
                                        </div>

                                        {/* Staff Display */}
                                        {apt.staffName ? (
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                                                <span className="bg-slate-100 px-1 rounded text-[10px]">担</span>
                                                {apt.staffName}
                                            </div>
                                        ) : !isCancelled && !isDone ? (
                                            <div className="text-xs text-red-600 flex items-center gap-1 mb-1 font-bold animate-pulse">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>担当未定</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-300 mb-1">-</div>
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
