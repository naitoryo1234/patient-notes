'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { scheduleAppointment } from '@/actions/appointmentActions';
import { Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

import { Staff } from '@/services/staffService';

export function AppointmentButton({ patientId, staffList }: { patientId: string, staffList: Staff[] }) {
    const [isOpen, setIsOpen] = useState(false);

    // ... (lines 10-38 is same, keep if possible or replace block)
    // Actually I'll replace the full component start to include prop change and render.

    // Default to tomorrow 10:00
    const tomorrow = addDays(new Date(), 1);
    const defaultDate = format(tomorrow, 'yyyy-MM-dd');
    const defaultTime = "10:00";

    const handleSubmit = async (formData: FormData) => {
        await scheduleAppointment(formData);
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setIsOpen(true)}
            >
                <Calendar className="w-4 h-4" />
                次回予約をとる
            </Button>
        );
    }

    return (
        <div className="bg-white border border-indigo-100 rounded-lg p-4 shadow-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> 次回予約
            </h3>
            <form action={handleSubmit} className="space-y-3">
                <input type="hidden" name="patientId" value={patientId} />
                <div className="flex gap-2">
                    <input
                        type="date"
                        name="visitDate"
                        defaultValue={defaultDate}
                        required
                        className="border rounded px-2 py-1 text-sm w-full"
                    />
                    <input
                        type="time"
                        name="visitTime"
                        defaultValue={defaultTime}
                        required
                        className="border rounded px-2 py-1 text-sm w-full"
                    />
                </div>
                {staffList.length > 0 && (
                    <select
                        name="staffId"
                        className="border rounded px-2 py-1 text-sm w-full bg-white"
                        defaultValue=""
                    >
                        <option value="">担当者 (任意)</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
                <input
                    type="text"
                    name="memo"
                    placeholder="メモ (任意)"
                    className="border rounded px-2 py-1 text-sm w-full"
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>キャンセル</Button>
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">予約確定</Button>
                </div>
            </form>
        </div>
    );
}
