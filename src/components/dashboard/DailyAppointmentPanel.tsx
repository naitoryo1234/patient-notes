'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { cancelAppointmentAction, checkInAppointmentAction } from '@/actions/appointmentActions';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { AppointmentEditModal } from './AppointmentEditModal';
import { format, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Clock, RefreshCw, Pencil, Trash2, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
    staffList?: Staff[];
}

export function DailyAppointmentPanel({ appointments: initialData, staffList = [] }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null); // New state for mini panel

    const router = useRouter();

    // Sync with props if revalidated
    useEffect(() => {
        setAppointments(initialData);
    }, [initialData]);

    // Update time and fetch latest data every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            if (!editingAppointment && !detailAppointment) { // Pause refresh if modal is open
                router.refresh();
            }
        }, 60000); // 1 min

        return () => clearInterval(timer);
    }, [router, editingAppointment, detailAppointment]);

    // Manual Refresh
    const handleRefresh = () => {
        setCurrentTime(new Date());
        router.refresh();
    };

    // Optimistic Actions
    const handleCheckIn = async (aptId: string, patientName: string) => {
        if (!confirm(`${patientName}様の来院を記録しますか？`)) return;

        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === aptId ? { ...a, status: 'arrived', arrivedAt: new Date() } : a
        ));

        // Also update local detail/edit state if needed (though usually we close it)
        if (detailAppointment && detailAppointment.id === aptId) {
            setDetailAppointment(prev => prev ? { ...prev, status: 'arrived', arrivedAt: new Date() } : null);
        }

        await checkInAppointmentAction(aptId);
        router.refresh(); // Sync with server
    };

    const handleCancel = async (aptId: string) => {
        if (!confirm('本当にこの予約をキャンセルしますか？')) return;

        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === aptId ? { ...a, status: 'cancelled' } : a
        ));

        await cancelAppointmentAction(aptId);
        router.refresh();
    };

    const pendingAssignments = appointments.filter(a => !a.staffId && a.status !== 'cancelled').length;

    const pendingMemos = appointments.filter(a => {
        // @ts-ignore
        return a.adminMemo && !a.isMemoResolved && a.status !== 'cancelled';
    }).length;

    // Split appointments
    const activeAppointments = appointments.filter(a => {
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;
        const isDone = diff < -duration;
        const isCancelled = a.status === 'cancelled';
        return !isDone && !isCancelled;
    });

    const pastAppointments = appointments.filter(a => {
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;
        const isDone = diff < -duration;
        const isCancelled = a.status === 'cancelled';
        return isDone || isCancelled;
    });

    // Helper to render card (keep existing logic but extracted or reused)
    const renderCard = (apt: Appointment) => {
        const aptTime = new Date(apt.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = apt.duration || 60;

        // Status Logic
        const isCancelled = apt.status === 'cancelled';
        const isArrived = apt.status === 'arrived';

        // Time-based states
        const isUpcoming = !isCancelled && !isArrived && diff > 0 && diff <= 60;
        const isJustNow = !isCancelled && !isArrived && diff <= 0 && diff >= -15;
        const isInProgress = !isCancelled && !isArrived && diff < -15 && diff >= -duration;
        const isDone = !isCancelled && diff < -duration;
        const isUnassigned = !isCancelled && !isDone && !apt.staffId;

        let statusColor = "bg-white border-slate-200";
        if (isCancelled) statusColor = "bg-slate-50 border-slate-100 opacity-60 grayscale";
        else if (isDone) statusColor = "bg-slate-50 border-slate-200 opacity-75";
        else if (isArrived) statusColor = "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-100";
        else if (isUnassigned) statusColor = "bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100";
        else if (isUpcoming) statusColor = "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200";
        else if (isJustNow) statusColor = "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200";
        else if (isInProgress) statusColor = "bg-white border-slate-300 shadow-md ring-1 ring-slate-100";

        // Important Check
        const isImportant = apt.tags.some(t => ['重要', '禁忌', '要注意'].includes(t));
        if (isImportant && !isCancelled && !isDone && !isUnassigned) {
            statusColor += " border-l-4 border-l-red-400";
        }

        return (
            <div
                key={apt.id}
                className={`relative rounded-lg border transition-all hover:shadow-md cursor-pointer ${statusColor} group`}
                onClick={() => setDetailAppointment(apt)}
            >
                <div className="block p-3">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold font-mono ${isCancelled ? 'text-slate-400 line-through' : isUpcoming ? 'text-yellow-700' : isJustNow ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {format(aptTime, 'HH:mm')}
                            </span>
                            {isArrived && (
                                <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                    <UserCheck className="w-3 h-3" />
                                    来院済み
                                </span>
                            )}
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
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {!isCancelled && !isDone && !isArrived && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                handleCheckIn(apt.id, apt.patientName);
                            }}
                            className="p-1.5 bg-white text-slate-500 hover:text-emerald-600 rounded-md shadow-sm border border-slate-200 hover:border-emerald-300 transition-all font-bold flex items-center gap-1 cursor-pointer"
                            title="来院チェックイン"
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            setEditingAppointment(apt);
                        }}
                        className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 rounded-md shadow-sm border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handleCancel(apt.id);
                        }}
                        className="p-1.5 bg-white text-slate-500 hover:text-red-600 rounded-md shadow-sm border border-slate-200 hover:border-red-300 transition-all cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
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

            {pendingAssignments > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 p-2 flex items-center gap-2 text-xs text-amber-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>担当未定の予約が {pendingAssignments} 件あります</span>
                </div>
            )}
            {pendingMemos > 0 && (
                <div className="bg-red-50 border-b border-red-100 p-2 flex items-center gap-2 text-xs text-red-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>未確認の申し送り事項が {pendingMemos} 件あります</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-4 min-h-0">
                {appointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        予定はありません
                    </div>
                ) : (
                    <>
                        {/* Active Appointments */}
                        <div className="space-y-2">
                            {activeAppointments.length > 0 ? (
                                activeAppointments.map(apt => renderCard(apt))
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4">これからの予約はありません</p>
                            )}
                        </div>

                        {/* Past Appointments Separator - Hidden per user request */}
                        {/* 
                        {pastAppointments.length > 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-4 space-y-2">
                                <h3 className="text-xs font-bold text-slate-400 px-2">完了・キャンセル</h3>
                                <div className="space-y-2 opacity-75">
                                    {pastAppointments.map(apt => renderCard(apt))}
                                </div>
                            </div>
                        )}
                        */}
                    </>
                )}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-center text-slate-400">
                AI要約連携 (Beta) / 通知機能 (Coming Soon)
            </div>

            {/* Edit Modal (Detailed Full Edit) */}
            {editingAppointment && (
                <AppointmentEditModal
                    appointment={editingAppointment}
                    staffList={staffList}
                    isOpen={!!editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                />
            )}

            {/* Detail Mini Panel */}
            {detailAppointment && (
                <AppointmentDetailModal
                    appointment={detailAppointment}
                    isOpen={!!detailAppointment}
                    onClose={() => setDetailAppointment(null)}
                    onEdit={() => {
                        setDetailAppointment(null);
                        setEditingAppointment(detailAppointment);
                    }}
                    onCheckIn={() => {
                        handleCheckIn(detailAppointment.id, detailAppointment.patientName);
                        setDetailAppointment(null);
                    }}
                />
            )}
        </div>
    );
}
