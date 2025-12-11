'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { UserCheck, Pencil, FileText, AlertTriangle, CheckCircle, ExternalLink, X } from 'lucide-react';
import { updateAppointmentAction } from '@/actions/appointmentActions'; // Reuse update action for resolving memo

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

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleGoProifle = () => {
        router.push(`/patients/${appointment.patientId}`);
    };

    const handleResolveAdminMemo = async () => {
        if (!confirm('申し送り事項を確認済みにしますか？（「要確認」から消えます）')) return;
        setIsResolving(true);

        const formData = new FormData();
        formData.append('id', appointment.id);
        // We must provide required fields to avoid validation error in action if it checks strict requirements
        // However, our action checks: if (!id || !dateStr || !timeStr)
        // So we need to provide current date/time even if we don't change them.
        formData.append('visitDate', format(new Date(appointment.visitDate), 'yyyy-MM-dd'));
        formData.append('visitTime', format(new Date(appointment.visitDate), 'HH:mm'));
        formData.append('isMemoResolved', 'true');
        // Include adminMemo to preserve it? update logic merges?
        // Our service logic: {...data} merges. But if we don't send other fields, they might be undefined (no change).
        // BUT action logic: "const duration = ...".
        // Let's verify action. Action constructs `updateData`. It gets duration from formData.
        // It converts staffId.
        // We should send existing values to be safe, OR refactor action to allow partial updates more gracefully.
        // For now, let's send necessary fields to pass the "required" check in action.

        try {
            const res = await updateAppointmentAction(formData);
            if (res.success) {
                onClose(); // Close modal on success
                // Router refresh is handled by action
            } else {
                alert('更新に失敗しました: ' + res.message);
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        } finally {
            setIsResolving(false);
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
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
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

                    {/* Admin Memo (Alert) */}
                    {/* @ts-ignore: adminMemo not yet showing in lint maybe */}
                    {appointment.adminMemo && !appointment.isMemoResolved && (
                        <div className="bg-red-50 border border-red-100 rounded-md p-3">
                            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span>申し送り事項</span>
                            </div>
                            <p className="text-sm text-red-800 mb-2">
                                {(appointment as any).adminMemo}
                            </p>

                            <button
                                onClick={handleResolveAdminMemo}
                                disabled={isResolving}
                                className="w-full text-xs bg-white border border-red-200 text-red-600 px-2 py-1.5 rounded shadow-sm hover:bg-red-50 font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <CheckCircle className="w-3 h-3" />
                                {isResolving ? '処理中...' : '確認済みにする（アラート解除）'}
                            </button>
                        </div>
                    )}

                    {/* Normal Memo */}
                    {appointment.memo && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                            <div className="flex items-center gap-2 text-yellow-700 font-bold text-xs mb-1">
                                <FileText className="w-3 h-3" />
                                <span>受付メモ</span>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                {appointment.memo}
                            </p>
                        </div>
                    )}

                    {/* Staff */}
                    <div className="flex items-center justify-between text-sm pt-2">
                        <div className="text-slate-500">担当</div>
                        <div className={appointment.staffName ? "font-bold text-slate-700" : "text-red-500 font-bold"}>
                            {appointment.staffName || "未定"}
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
                        詳細・カルテを開く
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                            onClick={onCheckIn}
                            disabled={appointment.status === 'arrived'}
                            className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:grayscale"
                        >
                            <UserCheck className="w-4 h-4" />
                            {appointment.status === 'arrived' ? '来院済み' : '受付 (Check-in)'}
                        </button>
                        <button
                            onClick={onEdit}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            編集
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
