'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Search, User, X } from 'lucide-react';
import { searchPatientsForSelect } from '@/actions/patientActions';
import { scheduleAppointment, updateAppointmentAction } from '@/actions/appointmentActions';
import { Staff } from '@/services/staffService';
import { Appointment } from '@/services/appointmentService';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { TERMS, LABELS } from '@/config/labels';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

type PatientInfo = {
    id: string;
    name: string;
    kana: string;
    pId?: number;
};

type PatientResult = {
    id: string;
    name: string;
    kana: string;
    pId: number;
    birthDate: string | null;
};

interface AppointmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffList: Staff[];

    // Mode: create or edit
    mode: 'create' | 'edit';

    // For edit mode
    appointment?: Appointment;

    // For create mode - pre-filled values
    initialPatient?: PatientInfo;
    initialDate?: string;      // 'YYYY-MM-DD' - from calendar
    initialTime?: string;      // 'HH:mm' - from calendar slot click
    initialDuration?: number;  // minutes
}

export function AppointmentFormModal({
    isOpen,
    onClose,
    staffList,
    mode,
    appointment,
    initialPatient,
    initialDate,
    initialTime,
    initialDuration,
}: AppointmentFormModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const { operator } = useAuth();

    // Patient state
    const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
    const [showPatientSearch, setShowPatientSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Form state
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState('60');
    const [staffId, setStaffId] = useState('');
    const [memo, setMemo] = useState('');
    const [adminMemo, setAdminMemo] = useState('');
    const [isMemoResolved, setIsMemoResolved] = useState(false);

    // UI state
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<{ message: string; date?: string } | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

    // Check if form has any changes (to prevent accidental close)
    const hasUnsavedChanges = () => {
        if (mode === 'create') {
            // In create mode, check if any data has been entered
            return selectedPatient !== null || memo.length > 0 || adminMemo.length > 0 || staffId !== '';
        } else {
            // In edit mode, check if anything has changed from initial values
            return memo !== (appointment?.memo || '') ||
                adminMemo !== (appointment?.adminMemo || '') ||
                staffId !== (appointment?.staffId || '') ||
                date !== format(new Date(appointment?.visitDate || new Date()), 'yyyy-MM-dd') ||
                time !== format(new Date(appointment?.visitDate || new Date()), 'HH:mm');
        }
    };

    // Safe close handler - check for unsaved changes
    const handleSafeClose = () => {
        // Skip confirmation if just submitted successfully
        if (isSubmittedSuccessfully) {
            onClose();
            return;
        }
        if (hasUnsavedChanges()) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    };

    // Force close without confirmation (after successful submit)
    const handleForceClose = () => {
        setIsSubmittedSuccessfully(true);
        onClose();
    };

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSearchQuery('');
            setSearchResults([]);
            setShowPatientSearch(false);
            setShowCloseConfirm(false);
            setIsSubmittedSuccessfully(false);

            if (mode === 'edit' && appointment) {
                // Edit mode: populate from appointment
                const visitDate = new Date(appointment.visitDate);
                setSelectedPatient({
                    id: appointment.patientId,
                    name: appointment.patientName,
                    kana: appointment.patientKana || '',
                });
                setDate(format(visitDate, 'yyyy-MM-dd'));
                setTime(format(visitDate, 'HH:mm'));
                setDuration(String(appointment.duration || 60));
                setStaffId(appointment.staffId || '');
                setMemo(appointment.memo || '');
                setAdminMemo(appointment.adminMemo || '');
                setIsMemoResolved(appointment.isMemoResolved || false);
            } else {
                // Create mode
                setSelectedPatient(initialPatient || null);
                setDate(initialDate || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
                setTime(initialTime || '10:00');
                setDuration(String(initialDuration || 60));
                setStaffId('');
                setMemo('');
                setAdminMemo('');
                setIsMemoResolved(false);

                // If no patient provided, show search immediately
                if (!initialPatient) {
                    setShowPatientSearch(true);
                }
            }
        }
    }, [isOpen, mode, appointment, initialPatient, initialDate, initialTime, initialDuration]);

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
        setSelectedPatient({
            id: patient.id,
            name: patient.name,
            kana: patient.kana,
            pId: patient.pId,
        });
        setShowPatientSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setShowPatientSearch(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedPatient) {
            showToast(`${TERMS.PATIENT}を選択してください`, 'error');
            return;
        }

        setIsPending(true);
        setError(null);

        const formData = new FormData();
        formData.set('patientId', selectedPatient.id);
        formData.set('visitDate', date);
        formData.set('visitTime', time);
        formData.set('duration', duration);
        formData.set('staffId', staffId);
        formData.set('memo', memo);
        formData.set('adminMemo', adminMemo);
        if (operator?.id) {
            formData.set('operatorId', operator.id);
        }

        try {
            if (mode === 'edit' && appointment) {
                formData.set('id', appointment.id);
                formData.set('isMemoResolved', isMemoResolved ? 'true' : 'false');
                const res = await updateAppointmentAction(formData);
                if (res.success) {
                    showToast('予約を更新しました', 'success');
                    handleForceClose();
                    router.refresh();
                } else {
                    setError({ message: res.message, date });
                }
            } else {
                const res = await scheduleAppointment(formData);
                if (res.success) {
                    showToast(`${selectedPatient.name}様の予約を登録しました`, 'success');
                    handleForceClose();
                    router.refresh();
                } else {
                    showToast(res.message || '予約の作成に失敗しました', 'error');
                }
            }
        } finally {
            setIsPending(false);
        }
    };

    // Quick action helpers
    const setToday = () => setDate(format(new Date(), 'yyyy-MM-dd'));
    const setTomorrow = () => setDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const setNextWeek = () => setDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));

    const addMinutes = (mins: number) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + mins);
        setTime(format(d, 'HH:mm'));
    };

    const title = mode === 'edit' ? LABELS.APPOINTMENT.EDIT_TITLE : `${LABELS.COMMON.NEW}${TERMS.APPOINTMENT}を作成`;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleSafeClose()}>
                <DialogContent className="w-full max-w-[min(32rem,calc(100vw-2rem))] max-h-[min(95vh,calc(100vh-2rem))] flex flex-col" onPointerDownOutside={(e) => {
                    // Prevent closing on backdrop click if there are unsaved changes
                    if (hasUnsavedChanges()) {
                        e.preventDefault();
                        setShowCloseConfirm(true);
                    }
                }} onEscapeKeyDown={(e) => {
                    // Prevent closing on ESC if there are unsaved changes
                    if (hasUnsavedChanges()) {
                        e.preventDefault();
                        setShowCloseConfirm(true);
                    }
                }}>
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {/* Error Display */}
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

                        {/* Patient Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {TERMS.PATIENT}
                            </label>

                            {selectedPatient && !showPatientSearch ? (
                                <div className="bg-slate-50 p-3 rounded-md flex items-center justify-between border border-slate-200">
                                    <div>
                                        <div className="font-bold text-sm text-slate-700">{selectedPatient.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {selectedPatient.kana}
                                            {selectedPatient.pId && ` / No.${selectedPatient.pId}`}
                                        </div>
                                    </div>
                                    {mode === 'create' && (
                                        <Button type="button" variant="ghost" size="sm" onClick={handleClearPatient} className="h-7">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            placeholder={LABELS.DASHBOARD.SEARCH_PLACEHOLDER}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-[150px] overflow-y-auto border rounded-md bg-slate-50">
                                        {isSearching ? (
                                            <div className="p-3 text-center text-slate-400 text-sm">検索中...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-3 text-center text-slate-400 text-sm">
                                                {searchQuery.length < 1 ? LABELS.DASHBOARD.PLEASE_SEARCH : LABELS.DASHBOARD.NO_SEARCH_RESULT(searchQuery)}
                                            </div>
                                        ) : (
                                            <div className="p-1 space-y-1">
                                                {searchResults.map(patient => (
                                                    <button
                                                        key={patient.id}
                                                        type="button"
                                                        onClick={() => handleSelectPatient(patient)}
                                                        className="w-full text-left p-2 hover:bg-white hover:shadow-sm rounded border border-transparent hover:border-slate-200 transition-all"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="font-bold text-slate-700 text-sm">{patient.name}</div>
                                                                <div className="text-xs text-slate-500">{patient.kana}</div>
                                                            </div>
                                                            <div className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                No.{patient.pId}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date & Time & Duration - Combined */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 block">{LABELS.FORM.DATE_TIME}</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="border rounded px-2 py-1.5 text-sm flex-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <select
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    className="border rounded px-2 py-1.5 text-sm w-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {Array.from({ length: 24 * 12 }).map((_, i) => {
                                        const h = Math.floor(i / 12);
                                        const m = (i % 12) * 5;
                                        const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                        return <option key={t} value={t}>{t}</option>;
                                    })}
                                </select>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="border rounded px-2 py-1.5 text-sm w-20 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="15">15分</option>
                                    <option value="30">30分</option>
                                    <option value="45">45分</option>
                                    <option value="60">60分</option>
                                    <option value="90">90分</option>
                                    <option value="120">120分</option>
                                </select>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                                <button type="button" onClick={setToday} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 border border-slate-200">今日</button>
                                <button type="button" onClick={setTomorrow} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 border border-slate-200">明日</button>
                                <button type="button" onClick={setNextWeek} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 border border-slate-200">来週</button>
                                <div className="flex-1" />
                                <button type="button" onClick={() => addMinutes(15)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">+15分</button>
                                <button type="button" onClick={() => addMinutes(30)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">+30分</button>
                                <button type="button" onClick={() => addMinutes(60)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">+60分</button>
                            </div>
                        </div>



                        {/* Staff Selection */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 block">{TERMS.STAFF}</label>
                            <select
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                className="border rounded px-2 py-1.5 text-sm w-full bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">{LABELS.FORM.SELECT_STAFF(TERMS.STAFF)}</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        {/* Memo - Single line input */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 block">{LABELS.FORM.MEMO_PATIENT}</label>
                            <input
                                type="text"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                className="border rounded px-2 py-1.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={LABELS.FORM.MEMO_PATIENT_PLACEHOLDER}
                            />
                        </div>

                        {/* Admin Memo - Compact */}
                        <div className="bg-red-50 p-2 rounded-md border border-red-100 space-y-1.5">
                            <label className="text-xs font-bold text-red-800 flex items-center gap-1">
                                ⚠️ {LABELS.APPOINTMENT.ADMIN_MEMO}
                            </label>
                            <input
                                type="text"
                                value={adminMemo}
                                onChange={(e) => setAdminMemo(e.target.value)}
                                className="border border-red-200 rounded px-2 py-1 text-sm w-full bg-white focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="スタッフ間での注意事項"
                            />
                            {mode === 'edit' && (
                                <label className="flex items-center gap-2 text-xs text-red-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isMemoResolved}
                                        onChange={(e) => setIsMemoResolved(e.target.checked)}
                                        className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                                    />
                                    {LABELS.FORM.RESOLVE_ACTION}
                                </label>
                            )}
                        </div>

                    </form>

                    {/* Actions - Fixed at bottom */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 flex-shrink-0">
                        <Button type="button" variant="ghost" onClick={handleSafeClose} disabled={isPending}>
                            {LABELS.DIALOG.DEFAULT_CANCEL}
                        </Button>
                        <Button
                            type="submit"
                            form="appointment-form"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isPending || !selectedPatient}
                            onClick={(e) => {
                                e.preventDefault();
                                const form = document.querySelector('form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }}
                        >
                            {isPending
                                ? LABELS.COMMON.UPDATING
                                : mode === 'edit'
                                    ? `${LABELS.COMMON.CHANGE}を${LABELS.COMMON.SAVE}`
                                    : LABELS.FORM.SUBMIT_CONFIRM(TERMS.APPOINTMENT)
                            }
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for unsaved changes */}
            <ConfirmDialog
                open={showCloseConfirm}
                onOpenChange={(open) => {
                    setShowCloseConfirm(open);
                }}
                onConfirm={() => {
                    onClose();
                }}
                title="入力内容を破棄しますか？"
                description="入力中のデータがあります。このまま閉じると入力内容は失われます。"
                confirmLabel="破棄する"
                variant="warning"
            />
        </>
    );
}
