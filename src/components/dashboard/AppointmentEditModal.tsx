'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { updateAppointmentAction } from '@/actions/appointmentActions';
import { format } from 'date-fns';

interface AppointmentEditModalProps {
    appointment: Appointment;
    staffList: Staff[];
    isOpen: boolean;
    onClose: () => void;
}

export function AppointmentEditModal({ appointment, staffList, isOpen, onClose }: AppointmentEditModalProps) {
    const [isPending, setIsPending] = useState(false);

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
        const res = await updateAppointmentAction(formData);
        setIsPending(false);
        if (res.success) {
            onClose();
        } else {
            alert(res.message);
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
                    <h3 className="font-bold">予約日時の変更</h3>
                </div>

                <form action={handleSubmit} className="p-4 space-y-4">
                    <input type="hidden" name="id" value={appointment.id} />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">日付</label>
                            <input
                                type="date"
                                name="visitDate"
                                required
                                defaultValue={defaultDate}
                                className="w-full border-slate-300 rounded-md focus:ring-indigo-500 max-w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">時間 & 所要時間</label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    name="visitTime"
                                    required
                                    defaultValue={defaultTime}
                                    className="w-full border-slate-300 rounded-md focus:ring-indigo-500"
                                />
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">担当者</label>
                        <select
                            name="staffId"
                            defaultValue={appointment.staffId || ''}
                            className="w-full border-slate-300 rounded-md focus:ring-indigo-500"
                        >
                            <option value="">-- 指定なし --</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">メモ</label>
                        <textarea
                            name="memo"
                            rows={3}
                            defaultValue={appointment.memo || ''}
                            className="w-full border-slate-300 rounded-md focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            disabled={isPending}
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            disabled={isPending}
                        >
                            {isPending ? '更新中...' : '変更を保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
