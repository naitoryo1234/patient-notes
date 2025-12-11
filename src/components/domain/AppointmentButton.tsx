'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { scheduleAppointment } from '@/actions/appointmentActions';
import { Calendar, Clock, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';
import Link from 'next/link';

import { Staff } from '@/services/staffService';

export function AppointmentButton({ patientId, staffList }: { patientId: string, staffList: Staff[] }) {
    const [isOpen, setIsOpen] = useState(false);

    // State for controlled inputs to allow quick setting
    const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [time, setTime] = useState("10:00");
    const [duration, setDuration] = useState("60"); // Default 60 min

    const handleSubmit = async (formData: FormData) => {
        const result = await scheduleAppointment(formData);
        if (result.success) {
            setIsOpen(false);
            // Optional: Reload logic could go here if needed, but server action revalidates path
        } else {
            alert(result.message || '予約の作成に失敗しました');
        }
    };

    // Quick Action Handlers
    const setToday = () => setDate(format(new Date(), 'yyyy-MM-dd'));
    const setTomorrow = () => setDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const setNextWeek = () => setDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));

    const addMinutes = (mins: number) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + mins);
        setTime(format(d, 'HH:mm'));
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
        <div className="bg-white border border-indigo-100 rounded-lg p-4 shadow-sm animate-in zoom-in-95 duration-200 w-full max-w-sm">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> 次回予約</span>
                <Link href="/appointments" className="text-xs text-indigo-400 hover:text-indigo-600 hover:underline flex items-center gap-1">
                    予約状況を確認 <Users className="w-3 h-3" />
                </Link>
            </h3>
            <form action={handleSubmit} className="space-y-3">
                <input type="hidden" name="patientId" value={patientId} />

                {/* Date Selection */}
                <div className="space-y-1">
                    <div className="flex gap-2">
                        <input
                            type="date"
                            name="visitDate"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="border rounded px-2 py-1 text-sm w-full font-mono"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={setToday} className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 border border-slate-200">今日</button>
                        <button type="button" onClick={setTomorrow} className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 border border-slate-200">明日</button>
                        <button type="button" onClick={setNextWeek} className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 border border-slate-200">来週</button>
                    </div>
                </div>

                {/* Time Selection */}
                <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                        <input
                            type="time"
                            name="visitTime"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="border rounded px-2 py-1 text-sm w-2/3 font-mono"
                        />
                        <select
                            name="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="border rounded px-2 py-1 text-sm bg-white w-1/3"
                        >
                            <option value="15">15分</option>
                            <option value="30">30分</option>
                            <option value="45">45分</option>
                            <option value="60">60分</option>
                            <option value="90">90分</option>
                            <option value="120">120分</option>
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => addMinutes(15)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded border border-indigo-100 font-bold">+15分</button>
                        <button type="button" onClick={() => addMinutes(30)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded border border-indigo-100 font-bold">+30分</button>
                        <button type="button" onClick={() => addMinutes(60)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded border border-indigo-100 font-bold">+1時間</button>
                    </div>
                </div>

                {/* Staff Selection */}
                <div>
                    <select
                        name="staffId"
                        className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-700 border-slate-200"
                        defaultValue=""
                    >
                        <option value="">担当者 (任意)</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Memo */}
                <div className="space-y-2">
                    <input
                        type="text"
                        name="memo"
                        placeholder="受付メモ (患者要望など)"
                        className="border rounded px-2 py-1 text-sm w-full"
                    />
                    <div className="bg-red-50 p-2 rounded border border-red-100">
                        <input
                            type="text"
                            name="adminMemo"
                            placeholder="⚠️ 申し送り (管理者メモ)"
                            className="border border-red-200 rounded px-2 py-1 text-sm w-full bg-white placeholder:text-red-300 text-red-700"
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
                        キャンセル
                    </Button>
                    <Button type="submit" size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                        予約確定
                    </Button>
                </div>
            </form>
        </div>
    );
}
