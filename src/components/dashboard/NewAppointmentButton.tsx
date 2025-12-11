'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Search, User, Plus, Clock, CalendarPlus } from 'lucide-react';
import { searchPatientsForSelect } from '@/actions/patientActions';
import { scheduleAppointment } from '@/actions/appointmentActions';
import { Staff } from '@/services/staffService';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { TERMS } from '@/config/labels';

interface NewAppointmentButtonProps {
    staffList: Staff[];
    initialDate?: Date; // Current filtered date
}

type PatientResult = {
    id: string;
    name: string;
    kana: string;
    pId: number;
    birthDate: string | null;
};

export function NewAppointmentButton({ staffList, initialDate }: NewAppointmentButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'search' | 'form'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Form State
    const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [time, setTime] = useState("10:00");
    const [duration, setDuration] = useState("60"); // Default 60 min

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setStep('search');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedPatient(null);
            // Default date: Use initialDate if provided, otherwise tomorrow
            setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'));
            // Reset duration
            setDuration("60");
        }
    }, [isOpen, initialDate]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 1) {
                setIsSearching(true);
                try {
                    const results = await searchPatientsForSelect(searchQuery);
                    setSearchResults(results);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectPatient = (patient: PatientResult) => {
        setSelectedPatient(patient);
        setStep('form');
    };

    const handleSubmit = async (formData: FormData) => {
        setIsPending(true);
        try {
            const result = await scheduleAppointment(formData);
            if (result.success) {
                setIsOpen(false);
                router.refresh();
            } else {
                alert(result.message || '予約の作成に失敗しました');
            }
        } finally {
            setIsPending(false);
        }
    };

    // Quick Time Handlers
    const addMinutes = (mins: number) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + mins);
        setTime(format(d, 'HH:mm'));
    };

    const setJustTime = (hour: number) => {
        setTime(`${hour.toString().padStart(2, '0')}:00`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md gap-3 px-6 h-11 rounded-lg text-base font-bold transition-all hover:shadow-lg">
                    <CalendarPlus className="w-5 h-5" />
                    新規{TERMS.APPOINTMENT}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>新規{TERMS.APPOINTMENT}を作成</DialogTitle>
                </DialogHeader>

                {step === 'search' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                placeholder={`${TERMS.PATIENT}名・フリガナ・No.で検索...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                autoFocus
                            />
                        </div>

                        <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-md p-1 bg-slate-50">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    {searchQuery.length < 1 ? '検索してください' : `該当する${TERMS.PATIENT}がいません`}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {searchResults.map(patient => (
                                        <button
                                            key={patient.id}
                                            onClick={() => handleSelectPatient(patient)}
                                            className="w-full text-left p-2 hover:bg-white hover:shadow-sm rounded border border-transparent hover:border-slate-200 transition-all group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-700">{patient.name}</div>
                                                    <div className="text-xs text-slate-500">{patient.kana}</div>
                                                </div>
                                                <div className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                                    No.{patient.pId}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* FORM STEP */
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-md flex items-center justify-between border border-slate-100">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <div>
                                    <div className="font-bold text-sm text-slate-700">{selectedPatient?.name}</div>
                                    <div className="text-xs text-slate-500">No.{selectedPatient?.pId}</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setStep('search')} className="text-xs h-7">
                                変更
                            </Button>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            <input type="hidden" name="patientId" value={selectedPatient?.id} />

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block">日時・時間</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="visitDate"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="border rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <select
                                        name="visitTime"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        required
                                        className="border rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none max-h-48"
                                    >
                                        {Array.from({ length: 24 * 12 }).map((_, i) => {
                                            const h = Math.floor(i / 12);
                                            const m = (i % 12) * 5;
                                            const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                            return <option key={t} value={t}>{t}</option>;
                                        })}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <select
                                        name="duration"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="border rounded px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-32"
                                    >
                                        <option value="15">15分</option>
                                        <option value="30">30分</option>
                                        <option value="45">45分</option>
                                        <option value="60">60分</option>
                                        <option value="90">90分</option>
                                        <option value="120">120分</option>
                                    </select>
                                    <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
                                        <button type="button" onClick={() => addMinutes(15)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-100">+15分</button>
                                        <button type="button" onClick={() => addMinutes(30)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-100">+30分</button>
                                        <button type="button" onClick={() => setJustTime(10)} className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-1.5 py-1 rounded">10:00</button>
                                        <button type="button" onClick={() => setJustTime(11)} className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-1.5 py-1 rounded">11:00</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block">担当者</label>
                                <select
                                    name="staffId"
                                    className="border rounded px-3 py-2 text-sm w-full bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    defaultValue=""
                                >
                                    <option value="">担当者 (未定)</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block">メモ</label>
                                <input
                                    type="text"
                                    name="memo"
                                    placeholder="例: 電話予約 抜糸希望"
                                    className="border rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>キャンセル</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                                    {isPending ? `${TERMS.APPOINTMENT}中...` : `${TERMS.APPOINTMENT}を確定`}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
