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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
    staffList?: Staff[];
    unresolvedMemos?: Appointment[]; // All unresolved memos (including past)
}

export function DailyAppointmentPanel({ appointments: initialData, staffList = [], unresolvedMemos = [] }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [detailAppointmentId, setDetailAppointmentId] = useState<string | null>(null);
    const [checkInConfirm, setCheckInConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
    const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

    const router = useRouter();

    // Sync with props if revalidated
    useEffect(() => {
        setAppointments(initialData);
    }, [initialData]);

    // Update time and fetch latest data every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            if (!editingAppointment && !detailAppointmentId) { // Pause refresh if modal is open
                router.refresh();
            }
        }, 60000); // 1 min

        return () => clearInterval(timer);
    }, [router, editingAppointment, detailAppointmentId]);

    // Manual Refresh
    const handleRefresh = () => {
        setCurrentTime(new Date());
        router.refresh();
    };

    // Optimistic Actions
    const handleCheckIn = async () => {
        const { id, name } = checkInConfirm;

        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'arrived', arrivedAt: new Date() } : a
        ));

        if (detailAppointmentId && detailAppointmentId === id) {
            // No need to update local state for detail, traversing appointments prop is enough, 
            // but we are updating 'appointments' state optimistically, so the derived appointment will update automatically.
        }

        await checkInAppointmentAction(id);
        router.refresh();
    };

    const handleCancel = async () => {
        const { id } = cancelConfirm;

        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'cancelled' } : a
        ));

        await cancelAppointmentAction(id);
        router.refresh();
    };

    const pendingAssignments = appointments.filter(a => !a.staffId && a.status !== 'cancelled').length;

    // Count all unresolved memos (only truly unresolved)
    const pendingMemos = unresolvedMemos.filter(m => !m.isMemoResolved).length;


    // Split appointments
    const activeAppointments = appointments.filter(a => {
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;
        const isDone = diff < -duration;
        const isCancelled = a.status === 'cancelled';

        // Keep visible if:
        // 1. Not done AND Not cancelled (Standard active)
        // 2. Has Admin Memo (Even if done, we want to keep it visible for handover)
        // Note: Cancelled items with memos... maybe show? For now, stick to non-cancelled.
        return (!isDone && !isCancelled) || (!!a.adminMemo && !isCancelled);
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
                onClick={() => setDetailAppointmentId(apt.id)}
            >
                <div className="block p-3">
                    {/* Row 1: Time + Status Badge + Visit Count */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold font-mono ${isCancelled ? 'text-slate-400 line-through' : isUpcoming ? 'text-yellow-700' : isJustNow ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {format(aptTime, 'HH:mm')}-{format(new Date(aptTime.getTime() + apt.duration * 60000), 'HH:mm')}
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
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                            {apt.visitCount}回目
                        </span>
                    </div>

                    {/* Row 2: Patient Name + Duration Badge */}
                    <div className="flex justify-between items-center mb-1">
                        <div className={`font-bold text-base transition-colors ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
                            {apt.patientName} <span className="text-xs font-normal text-slate-500 ml-1 decoration-auto">{apt.patientKana}</span>
                        </div>
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                            {apt.duration}分
                        </span>
                    </div>

                    {/* Row 3+: Staff and Tags */}
                    <div>
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
                            {apt.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded text-xs">
                                    {tag}
                                </span>
                            ))}
                            {apt.tags.length > 2 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                                    +{apt.tags.length - 2}
                                </span>
                            )}
                        </div>
                        {apt.adminMemo && (
                            <div className={`mt-2 border rounded p-1.5 flex items-start gap-1.5 leading-tight ${apt.isMemoResolved
                                ? 'bg-slate-50 border-slate-200 text-slate-400'
                                : 'bg-red-50 border-red-100 text-red-700 animate-pulse'
                                }`}>
                                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${apt.isMemoResolved ? 'text-slate-400' : ''}`} />
                                <span className={`text-xs font-bold whitespace-pre-wrap ${apt.isMemoResolved ? 'line-through decoration-slate-300' : ''}`}>
                                    {apt.adminMemo}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {!isCancelled && !isDone && !isArrived && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                setCheckInConfirm({ open: true, id: apt.id, name: apt.patientName });
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
                            setCancelConfirm({ open: true, id: apt.id });
                        }}
                        className="p-1.5 bg-white text-slate-500 hover:text-red-600 rounded-md shadow-sm border border-slate-200 hover:border-red-300 transition-all cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div >
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
                    <span>本日の未確認申し送り: {pendingMemos}件</span>
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

            {/* Detail Mini Panel - Derived from ID to ensure freshness */}
            {detailAppointmentId && (() => {
                const target = appointments.find(a => a.id === detailAppointmentId);
                if (!target) return null; // Should not happen usually, maybe if cancelled and filtered out?

                return (
                    <AppointmentDetailModal
                        appointment={target}
                        isOpen={!!target}
                        onClose={() => setDetailAppointmentId(null)}
                        onEdit={() => {
                            setDetailAppointmentId(null);
                            setEditingAppointment(target);
                        }}
                        onCheckIn={() => {
                            setCheckInConfirm({ open: true, id: target.id, name: target.patientName });
                            setDetailAppointmentId(null);
                        }}
                    />
                );
            })()}

            <ConfirmDialog
                open={checkInConfirm.open}
                onOpenChange={(open) => setCheckInConfirm(prev => ({ ...prev, open }))}
                title={`${checkInConfirm.name}様の来院を記録しますか？`}
                confirmLabel="記録する"
                variant="primary"
                onConfirm={handleCheckIn}
            />

            <ConfirmDialog
                open={cancelConfirm.open}
                onOpenChange={(open) => setCancelConfirm(prev => ({ ...prev, open }))}
                title="この予約をキャンセルしますか？"
                description="キャンセルした予約は予約一覧に「キャンセル」と表示されます。"
                confirmLabel="キャンセルする"
                variant="warning"
                onConfirm={handleCancel}
            />
        </div>
    );
}
