'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { updateAppointmentAction } from '@/actions/appointmentActions';
import { format } from 'date-fns';
import { TERMS, LABELS } from '@/config/labels';

interface AppointmentEditModalProps {
    appointment: Appointment;
    staffList: Staff[];
    isOpen: boolean;
    onClose: () => void;
}

export function AppointmentEditModal({ appointment, staffList, isOpen, onClose }: AppointmentEditModalProps) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<{ message: string; date?: string } | null>(null);

    // Default values
    const defaultDate = format(new Date(appointment.visitDate), 'yyyy-MM-dd');
    const defaultTime = format(new Date(appointment.visitDate), 'HH:mm');

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsPending(true);
        setError(null);

        const res = await updateAppointmentAction(formData);
        setIsPending(false);

        if (res.success) {
            onClose();
        } else {
            // Extract date from form data to construct link
            const visitDate = formData.get('visitDate') as string;
            setError({
                message: res.message,
                date: visitDate
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-800 text-white p-4">
                    <h3 className="font-bold">{LABELS.APPOINTMENT.EDIT_TITLE}</h3>
                </div>

                <form action={handleSubmit} className="p-4 space-y-4">
                    <input type="hidden" name="id" value={appointment.id} />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm space-y-2">
                            <p className="font-bold flex items-center gap-2">
                                ⚠️ {LABELS.STATUS.ERROR}
                            </p>
                            <p>{error.message}</p>
                            {error.date && (
                                <a
                                    href={`/appointments?date=${error.date}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center w-full bg-white border border-red-300 hover:bg-red-50 text-red-600 py-1.5 rounded mt-2 font-bold transition-colors"
                                >
                                    📅 予約台帳で空き状況を確認する
                                </a>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{LABELS.FORM.DATE}</label>
                            <input
                                type="date"
                                name="visitDate"
                                required
                                defaultValue={defaultDate}
                                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 max-w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{LABELS.FORM.TIME_DURATION}</label>
                            <div className="flex gap-2">
                                <select
                                    name="visitTime"
                                    required
                                    defaultValue={defaultTime}
                                    className="w-full border-slate-300 rounded-md focus:ring-indigo-500"
                                >
                                    {Array.from({ length: 24 * 12 }).map((_, i) => {
                                        const h = Math.floor(i / 12);
                                        const m = (i % 12) * 5;
                                        const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                        return <option key={t} value={t}>{t}</option>;
                                    })}
                                </select>
                                <select
                                    name="duration"
                                    defaultValue={appointment.duration || 60}
                                    className="w-24 border-slate-300 rounded-md focus:ring-indigo-500 text-sm"
                                >
                                    <option value="15">15分</option>
                                    <option value="30">30分</option>
                                    <option value="45">45分</option>
                                    <option value="60">60分</option>
                                    <option value="90">90分</option>
                                    <option value="120">120分</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{TERMS.STAFF}</label>
                        <select
                            name="staffId"
                            defaultValue={appointment.staffId || ''}
                            className="w-full border-slate-300 rounded-md focus:ring-indigo-500"
                        >
                            <option value="">{LABELS.FORM.UNSPECIFIED}</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{LABELS.FORM.MEMO_PATIENT}</label>
                        <textarea
                            name="memo"
                            rows={2}
                            defaultValue={appointment.memo || ''}
                            className="w-full border-slate-300 rounded-md focus:ring-indigo-500 text-sm"
                            placeholder={LABELS.FORM.MEMO_PATIENT_PLACEHOLDER}
                        />
                    </div>

                    <div className="bg-red-50 p-3 rounded-md border border-red-100">
                        <label className="block text-sm font-bold text-red-800 mb-1 flex items-center gap-1">
                            ⚠️ {LABELS.APPOINTMENT.ADMIN_MEMO}
                        </label>
                        <textarea
                            name="adminMemo"
                            rows={2}
                            defaultValue={appointment.adminMemo || ''}
                            className="w-full border-red-200 rounded-md focus:ring-red-500 text-sm bg-white mb-2"
                            placeholder={LABELS.FORM.MEMO_ADMIN_PLACEHOLDER}
                        />
                        <label className="flex items-center gap-2 text-sm text-red-800 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isMemoResolved"
                                value="true"
                                defaultChecked={appointment.isMemoResolved}
                                className="rounded border-red-300 text-red-600 focus:ring-red-500"
                            />
                            {LABELS.FORM.RESOLVE_ACTION}
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            disabled={isPending}
                        >
                            {LABELS.DIALOG.DEFAULT_CANCEL}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            disabled={isPending}
                        >
                            {isPending ? LABELS.COMMON.UPDATING : `${LABELS.COMMON.CHANGE}を${LABELS.COMMON.SAVE}`}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
