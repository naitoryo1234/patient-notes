'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { cancelAppointmentAction, checkInAppointmentAction, completeAppointmentAction, cancelCheckInAction } from '@/actions/appointmentActions';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { AppointmentEditModal } from './AppointmentEditModal';
import { format, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Clock, RefreshCw, Pencil, Trash2, AlertCircle, AlertTriangle, UserCheck, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TERMS, LABELS } from '@/config/labels';
import { getNow, isDemoMode, getDemoDateString } from '@/lib/dateUtils';

interface DailyAppointmentPanelProps {
    appointments: Appointment[]; // Initial server data
    staffList?: Staff[];
    unresolvedMemos?: Appointment[]; // All unresolved memos (including past)
    onPatientClick?: (patientName: string) => void; // Callback when patient card is clicked (for search)
}

export function DailyAppointmentPanel({ appointments: initialData, staffList = [], unresolvedMemos = [], onPatientClick }: DailyAppointmentPanelProps) {
    const [currentTime, setCurrentTime] = useState(getNow());
    const [appointments, setAppointments] = useState(initialData);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [detailAppointmentId, setDetailAppointmentId] = useState<string | null>(null);

    const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
    const [completeConfirm, setCompleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

    const router = useRouter();

    // Sync with props if revalidated
    useEffect(() => {
        setAppointments(initialData);
    }, [initialData]);

    // Update time and fetch latest data every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(getNow());
            if (!editingAppointment && !detailAppointmentId) { // Pause refresh if modal is open
                router.refresh();
            }
        }, 60000); // 1 min

        return () => clearInterval(timer);
    }, [router, editingAppointment, detailAppointmentId]);

    // Manual Refresh
    const handleRefresh = () => {
        setCurrentTime(getNow());
        router.refresh();
    };

    // Optimistic Actions
    // Optimistic Actions
    const handleCheckIn = async (id: string) => {
        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'arrived', arrivedAt: new Date() } : a
        ));

        await checkInAppointmentAction(id);
        router.refresh();
    };

    const handleUndoCheckIn = async (id: string) => {
        // Optimistic Update
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'pending', arrivedAt: undefined } : a
        ));

        await cancelCheckInAction(id);
        router.refresh();
    };

    const handleComplete = async () => {
        const { id } = completeConfirm;

        // Optimistic Update (Move to past/done)
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'completed' } : a
        ));

        await completeAppointmentAction(id);
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

    const pendingAssignments = appointments.filter(a => !a.staffId && a.status !== 'cancelled' && a.status !== 'completed').length;

    // Count all unresolved memos (only truly unresolved)
    const pendingMemos = unresolvedMemos.filter(m => !m.isMemoResolved).length;


    // Split appointments
    const activeAppointments = appointments.filter(a => {
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;

        const isTimeOver = diff < -duration;
        const isCancelled = a.status === 'cancelled';
        const isCompleted = a.status === 'completed';
        const isArrived = a.status === 'arrived';

        // Keep visible if:
        // 1. Not Cancelled AND Not Completed
        // 2. AND ( Time is NOT over OR (Status is Arrived - Keep showing as In Progress) OR Has Admin Memo )

        if (isCancelled || isCompleted) return false;

        // If time is over, remove ONLY IF NOT arrived, and NO admin memo.
        // If arrived, keep it UNLESS it is significantly overdue (30 mins past end time) -> Move to Attention tab
        if (isTimeOver) {
            if (isArrived) {
                // Hide if > 30 mins passed after end time
                // diff is negative. e.g. -91. duration 60. limit -(60+30) = -90. -91 < -90. True.
                if (diff < -(duration + 30)) return false;
                return true;
            }
            if (a.adminMemo) return true; // Keep Items with Handover
            return false; // Otherwise hide
        }

        return true;
    });

    // Past = Cancelled OR Completed OR (Time Over AND Not Arrived)
    const pastAppointments = appointments.filter(a => {
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;

        const isTimeOver = diff < -duration;
        const isCancelled = a.status === 'cancelled';
        const isCompleted = a.status === 'completed';
        const isArrived = a.status === 'arrived';

        if (isCancelled || isCompleted) return true;
        if (isTimeOver && !isArrived) return true;

        return false;
    });

    // Helper to render card (keep existing logic but extracted or reused)
    const renderCard = (apt: Appointment) => {
        const aptTime = new Date(apt.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = apt.duration || 60;

        // Time-based states
        const isCancelled = apt.status === 'cancelled';
        const isCompleted = apt.status === 'completed'; // New explicit done state
        const isArrivedStatus = apt.status === 'arrived';

        // "Done" based on time is only if NOT arrived and NOT completed explicitly
        // If arrived, it persists until manually completed.
        const isTimeOver = diff < -duration;
        const isDone = !isCancelled && !isArrivedStatus && !isCompleted && isTimeOver;

        // "In Progress" (対応中) = Arrived (Always, regardless of time)
        // User request: Check-in -> In Progress immediately.
        const isInProgress = isArrivedStatus;
        const isArrived = false; // "Arrived" distinction removed

        const isUpcoming = !isCancelled && !isArrivedStatus && !isCompleted && diff > 0 && diff <= 60;
        const isJustNow = !isCancelled && !isArrivedStatus && !isCompleted && diff <= 0 && diff >= -15;
        const isDuringSlot = !isCancelled && !isArrivedStatus && !isCompleted && diff < -15 && diff >= -duration;
        const isUnassigned = !isCancelled && !isDone && !isCompleted && !apt.staffId;

        let statusColor = "bg-white border-slate-200";
        if (isCancelled) statusColor = "bg-slate-50 border-slate-100 opacity-60 grayscale";
        else if (isCompleted || isDone) statusColor = "bg-slate-50 border-slate-200 opacity-75";
        else if (isInProgress) statusColor = "bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200"; // Highlight for In Progress
        else if (isUnassigned) statusColor = "bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100";
        else if (isUpcoming) statusColor = "bg-yellow-50 border-yellow-300 shadow-sm ring-1 ring-yellow-200";
        else if (isJustNow) statusColor = "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200";
        else if (isDuringSlot) statusColor = "bg-white border-slate-300 shadow-md ring-1 ring-slate-100";

        // Important Check
        const isImportant = apt.tags.some(t => ['重要', '禁忌', '要注意'].includes(t));
        if (isImportant && !isCancelled && !isDone && !isCompleted && !isUnassigned) {
            statusColor += " border-l-4 border-l-red-400";
        }

        return (
            <div
                key={apt.id}
                className={`relative rounded-lg border transition-all hover:shadow-md cursor-pointer ${statusColor} group`}
                onClick={() => {
                    // If onPatientClick is provided (e.g., from appointments page), filter by patient name
                    // Otherwise, open the detail modal (dashboard behavior)
                    if (onPatientClick) {
                        onPatientClick(apt.patientName);
                    } else {
                        setDetailAppointmentId(apt.id);
                    }
                }}
            >
                <div className="block p-3">
                    {/* Row 1: Time + Status Badge + Visit Count */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold font-mono ${isCancelled ? 'text-slate-400 line-through' : isUpcoming ? 'text-yellow-700' : isJustNow ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {format(aptTime, 'HH:mm')}-{format(new Date(aptTime.getTime() + apt.duration * 60000), 'HH:mm')}
                            </span>
                            {isInProgress && (
                                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 animate-pulse">
                                    <UserCheck className="w-3 h-3" />
                                    {LABELS.STATUS.IN_PROGRESS}
                                </span>
                            )}
                            {/* isArrived logic removed from display */}
                            {isUpcoming && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                                    {LABELS.STATUS.COMING_SOON(diff)}
                                </span>
                            )}
                            {isJustNow && (
                                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {LABELS.STATUS.JUST_NOW}
                                </span>
                            )}
                            {isCancelled && (
                                <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {LABELS.STATUS.CANCELLED}
                                </span>
                            )}
                            {(isDone || isCompleted) && (
                                <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {LABELS.STATUS.DONE}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                            {apt.visitCount}回目
                        </span>
                    </div>

                    {/* Row 2: Patient Name + Duration Badge */}
                    <div className="flex justify-between items-center mb-1 gap-2">
                        <div className={`font-bold text-base transition-colors truncate flex-1 min-w-0 ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
                            {apt.patientName} <span className="text-[10px] font-normal text-slate-400 ml-1">{apt.patientKana}</span>
                        </div>
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 flex-none">
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
                        ) : !isCancelled && !isDone && !isCompleted ? (
                            <div className="text-xs text-red-600 flex items-center gap-1 mb-1 font-bold animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                <span>{LABELS.STATUS.UNASSIGNED}</span>
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
                    {/* Check-in Button (Only if not arrived yet) */}
                    {!isCancelled && !isDone && !isCompleted && !isArrivedStatus && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                handleCheckIn(apt.id);
                            }}
                            className="p-1.5 bg-white text-slate-500 hover:text-emerald-600 rounded-md shadow-sm border border-slate-200 hover:border-emerald-300 transition-all font-bold flex items-center gap-1 cursor-pointer"
                            title={`${LABELS.STATUS.ARRIVED}記録`}
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {/* COMPLETE Button (If arrived or in progress) */}
                    {(isInProgress || isArrived) && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                setCompleteConfirm({ open: true, id: apt.id, name: apt.patientName });
                            }}
                            className="p-1.5 bg-white text-indigo-500 hover:text-indigo-700 rounded-md shadow-sm border border-indigo-200 hover:border-indigo-400 transition-all font-bold flex items-center gap-1 cursor-pointer"
                            title={LABELS.STATUS.COMPLETED_ACTION}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                    )}

                </div>
            </div >
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px] lg:h-full max-h-full">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-lg">
                        {LABELS.DASHBOARD.TITLE}
                        {isDemoMode() && (
                            <span className="text-xs text-amber-400 ml-2 font-normal">（デモ日: {getDemoDateString()}）</span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{format(currentTime, 'HH:mm')} {LABELS.COMMON.UPDATE}</span>
                    <button onClick={handleRefresh} className="hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {pendingAssignments > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 p-2 flex items-center gap-2 text-xs text-amber-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>{LABELS.DASHBOARD.UNASSIGNED_ALERT(pendingAssignments)}</span>
                </div>
            )}
            {pendingMemos > 0 && (
                <div className="bg-red-50 border-b border-red-100 p-2 flex items-center gap-2 text-xs text-red-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{LABELS.DASHBOARD.MEMO_ALERT(pendingMemos)}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-4 min-h-0">
                {appointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        {LABELS.DASHBOARD.NO_APPOINTMENTS}
                    </div>
                ) : (
                    <>
                        {/* Active Appointments */}
                        <div className="space-y-2">
                            {activeAppointments.length > 0 ? (
                                activeAppointments.map(apt => renderCard(apt))
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4">{LABELS.DASHBOARD.NO_UPCOMING_APPOINTMENTS}</p>
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
                            handleCheckIn(target.id);
                            // Do not close modal immediately so user sees "Undo" option? 
                            // DailyAppointmentPanel logic:
                            // "setDetailAppointmentId(null)" was closing it.
                            // If we want to allow immediate Undo, we should KEEP it open?
                            // User request: "Undo Check-in" is in Modal. So we must keep Modal open.
                            // But Check-in button was "Check-in" -> "Undo Check-in".
                            // If I close it, user has to reopen.
                            // Let's TRY keeping it open.
                            // But wait, "handleCheckIn" updates state optimistically.
                            // The modal relies on `target` which is `appointments.find(...)`. 
                            // So it should update.
                        }}
                        onUndoCheckIn={() => {
                            handleUndoCheckIn(target.id);
                        }}
                    />
                );
            })()}



            <ConfirmDialog
                open={completeConfirm.open}
                onOpenChange={(open) => setCompleteConfirm(prev => ({ ...prev, open }))}
                title={`${completeConfirm.name}様の${TERMS.APPOINTMENT}を完了しますか？`}
                description={LABELS.STATUS.COMPLETE_DESC}
                confirmLabel={LABELS.STATUS.COMPLETE_EXECUTE}
                variant="primary"
                onConfirm={handleComplete}
            />

            <ConfirmDialog
                open={cancelConfirm.open}
                onOpenChange={(open) => setCancelConfirm(prev => ({ ...prev, open }))}
                title={LABELS.APPOINTMENT.CANCEL_CONFIRM_TITLE}
                description={LABELS.APPOINTMENT.CANCEL_CONFIRM_DESC}
                confirmLabel={LABELS.APPOINTMENT.CANCEL_EXECUTE}
                variant="warning"
                onConfirm={handleCancel}
            />
        </div>
    );
}
