'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { UserCheck, Pencil, FileText, AlertTriangle, CheckCircle, ExternalLink, X } from 'lucide-react';
import { updateAppointmentAction, toggleAdminMemoResolutionAction } from '@/actions/appointmentActions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TERMS, LABELS } from '@/config/labels';

interface AppointmentDetailModalProps {
    appointment: Appointment;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onCheckIn: () => void;
}

export function AppointmentDetailModal({ appointment, isOpen, onClose, onEdit, onCheckIn }: AppointmentDetailModalProps) {
    const router = useRouter();
    const [isResolving, setIsResolving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleGoProifle = () => {
        router.push(`/patients/${appointment.patientId}`);
    };

    const handleResolveAdminMemo = async () => {
        setIsResolving(true);

        // Toggle logic
        const nextStatus = !appointment.isMemoResolved;

        try {
            const res = await toggleAdminMemoResolutionAction(appointment.id, nextStatus);
            if (res.success) {
                // Keep modal open to show updated state, or close?
                // The prop 'appointment' should update via router.refresh in the action.
                // Keeping modal open is fine as it will rerender with new status.
                // Actually, let's close it if it's "Resolve" (done), but maybe keep if "Unresolve"?
                // User might want to confirm it turned gray.
                // Let's close for now as it's a "Done" action usually. 
                // But wait, user expectation: "Confirm" -> "OK, done" -> Dialog closes.
                // If "Unresolve" -> "OK" -> Dialog closes.
                onClose();
            } else {
                alert(`${LABELS.COMMON.UPDATE}に失敗しました: ` + res.message);
            }
        } catch (e) {
            console.error(e);
            alert(LABELS.STATUS.ERROR);
        } finally {
            setIsResolving(false);
            setConfirmOpen(false); // Close confirm dialog
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold font-mono text-slate-700">
                                {format(new Date(appointment.visitDate), 'HH:mm')}
                            </span>
                            <span className="text-xs text-slate-500">
                                ({appointment.duration || 60}min)
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-3">
                            {appointment.patientName} <span className="text-sm font-normal text-slate-500">{appointment.patientKana}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Tags */}
                    {appointment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {appointment.tags.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Admin Memo (Alert) - Show always if exists, change style based on status */}
                    {appointment.adminMemo && (
                        <div className={`border rounded-md p-3 ${appointment.isMemoResolved ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-100'
                            }`}>
                            <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${appointment.isMemoResolved ? 'text-slate-500' : 'text-red-700'}`}>
                                <AlertTriangle className="w-4 h-4" />
                                <span>{LABELS.APPOINTMENT.ADMIN_MEMO}{appointment.isMemoResolved ? LABELS.FORM.RESOLVED_SUFFIX : ''}</span>
                            </div>
                            <p className={`text-sm mb-2 ${appointment.isMemoResolved ? 'text-slate-500 line-through decoration-slate-400' : 'text-red-800'}`}>
                                {appointment.adminMemo}
                            </p>

                            <button
                                onClick={() => setConfirmOpen(true)}
                                disabled={isResolving}
                                className={`w-full text-xs border px-2 py-1.5 rounded shadow-sm font-bold flex items-center justify-center gap-1 transition-colors ${appointment.isMemoResolved
                                    ? 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                                    : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                <CheckCircle className="w-3 h-3" />
                                {isResolving ? LABELS.COMMON.PROCESSING : (appointment.isMemoResolved ? LABELS.FORM.UNRESOLVE_ACTION : LABELS.FORM.RESOLVE_ACTION)}
                            </button>
                        </div>
                    )}

                    {/* Normal Memo */}
                    {appointment.memo && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                            <div className="flex items-center gap-2 text-yellow-700 font-bold text-xs mb-1">
                                <FileText className="w-3 h-3" />
                                <span>{LABELS.FORM.MEMO_PATIENT}</span>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                {appointment.memo}
                            </p>
                        </div>
                    )}

                    {/* Staff */}
                    <div className="flex items-center justify-between text-sm pt-2">
                        <div className="text-slate-500">{TERMS.STAFF}</div>
                        <div className={appointment.staffName ? "font-bold text-slate-700" : "text-red-500 font-bold"}>
                            {appointment.staffName || LABELS.STATUS.UNASSIGNED}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                    <button
                        onClick={handleGoProifle}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        {LABELS.APPOINTMENT.ENTER_RECORD(TERMS.RECORD)}
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                            onClick={onCheckIn}
                            disabled={appointment.status === 'arrived'}
                            className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:grayscale"
                        >
                            <UserCheck className="w-4 h-4" />
                            {appointment.status === 'arrived' ? LABELS.STATUS.ARRIVED : LABELS.APPOINTMENT.CHECKIN_ACTION}
                        </button>
                        <button
                            onClick={onEdit}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            {LABELS.COMMON.MENU_EDIT}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={appointment.isMemoResolved ? LABELS.APPOINTMENT.MEMO_UNRESOLVE_TITLE : LABELS.APPOINTMENT.MEMO_RESOLVE_TITLE}
                description={appointment.isMemoResolved ? LABELS.APPOINTMENT.MEMO_UNRESOLVE_DESC : LABELS.APPOINTMENT.MEMO_RESOLVE_DESC}
                confirmLabel={appointment.isMemoResolved ? LABELS.FORM.UNRESOLVE_ACTION : LABELS.APPOINTMENT.ADMIN_MEMO_RESOLVED}
                variant={appointment.isMemoResolved ? "warning" : "primary"}
                onConfirm={handleResolveAdminMemo}
            />
        </div>
    );
}
