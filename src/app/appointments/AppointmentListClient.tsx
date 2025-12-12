'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { format, differenceInMinutes, isToday, isSameDay, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cancelAppointmentAction, toggleAdminMemoResolutionAction } from '@/actions/appointmentActions';
import { AppointmentEditModal } from '@/components/dashboard/AppointmentEditModal';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Calendar, User, History, CheckCircle2, XCircle, CalendarClock, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, X, FileText, Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LABELS, TERMS } from '@/config/labels';
import { getNow } from '@/lib/dateUtils';

interface AppointmentListClientProps {
    initialAppointments: Appointment[];
    staffList: Staff[];
    includePast: boolean;
}

export function AppointmentListClient({ initialAppointments, staffList, includePast }: AppointmentListClientProps) {
    const router = useRouter();
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [viewingMemo, setViewingMemo] = useState<{ patient: string; memo: string } | null>(null);
    const [filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<Date | null>(null);
    const [filterPatient, setFilterPatient] = useState<string>('');
    const [filterUnresolved, setFilterUnresolved] = useState<boolean>(false);
    const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
    const [memoConfirm, setMemoConfirm] = useState<{ open: boolean; id: string; resolved: boolean }>({ open: false, id: '', resolved: false });

    const toggleHistory = () => {
        // Default is TRUE (show past). So to hide, we send history=false. To show, we clear param.
        const query = includePast ? '?history=false' : '';
        router.push(`/appointments${query}`);
    };

    const handleDelete = async () => {
        const res = await cancelAppointmentAction(cancelConfirm.id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const handleMemoToggle = async () => {
        await toggleAdminMemoResolutionAction(memoConfirm.id, memoConfirm.resolved);
        router.refresh();
    };

    const getStatusIcon = (status: string | undefined) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-slate-300" />;
            case 'scheduled':
            default:
                return <CalendarClock className="w-5 h-5 text-slate-400" />;
        }
    };

    // Date Navigation
    const navigateDate = (offset: number) => {
        if (offset === 0) {
            setFilterDate(null); // Reset to all
        } else if (filterDate) {
            setFilterDate(addDays(filterDate, offset));
        } else {
            // If no date set, start from today
            setFilterDate(addDays(getNow(), offset > 0 ? 0 : offset));
        }
    };

    const setSpecificDate = (offsetFromToday: number) => {
        setFilterDate(addDays(getNow(), offsetFromToday));
    };

    const filteredAppointments = initialAppointments.filter(apt => {
        // Staff filter
        if (filterStaffId !== 'all') {
            if (filterStaffId === 'unassigned' && apt.staffId) return false;
            if (filterStaffId !== 'unassigned' && apt.staffId !== filterStaffId) return false;
        }
        // Date filter
        if (filterDate) {
            const aptDate = new Date(apt.visitDate);
            if (!isSameDay(aptDate, filterDate)) return false;
        }
        // Patient name filter
        if (filterPatient.trim()) {
            const query = filterPatient.toLowerCase();
            const nameMatch = apt.patientName.toLowerCase().includes(query);
            const kanaMatch = apt.patientKana.toLowerCase().includes(query);
            if (!nameMatch && !kanaMatch) return false;
        }
        // Unresolved Memo filter
        if (filterUnresolved) {
            if (!apt.adminMemo || apt.isMemoResolved) return false;
        }
        return true;
    });

    const pendingAssignments = initialAppointments.filter(a => !a.staffId && a.status !== 'cancelled').length;

    const pendingMemos = initialAppointments.filter(a => {
        return a.adminMemo && !a.isMemoResolved && a.status !== 'cancelled';
    }).length;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset page when filters change
    const [prevFilterKey, setPrevFilterKey] = useState("");
    const currentFilterKey = `${filterStaffId}-${filterDate?.getTime()}-${filterPatient}-${filterUnresolved}`;
    if (prevFilterKey !== currentFilterKey) {
        setPrevFilterKey(currentFilterKey);
        setCurrentPage(1);
    }

    // Pagination Logic
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Toolbar - Redesigned */}
            <div className="border-b border-slate-100 bg-slate-50">
                {/* Row 1: Filters */}
                <div className="p-3 flex flex-wrap gap-2 items-center">
                    {/* Alerts (Compact Badges) */}
                    {pendingAssignments > 0 && (
                        <button
                            onClick={() => {
                                if (filterStaffId === 'unassigned') {
                                    setFilterStaffId('all');
                                } else {
                                    setFilterStaffId('unassigned');
                                    setFilterUnresolved(false);
                                }
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterStaffId === 'unassigned'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-200'
                                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 shadow-sm'
                                }`}
                            title={filterStaffId === 'unassigned' ? "絞り込みを解除" : LABELS.DASHBOARD.UNASSIGNED_ALERT(pendingAssignments)}
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{LABELS.STATUS.UNASSIGNED_SHORT}</span>
                            <span className="bg-amber-200 px-1.5 rounded-full text-[10px]">{pendingAssignments}</span>
                        </button>
                    )}
                    {pendingMemos > 0 && (
                        <button
                            onClick={() => {
                                setFilterUnresolved(!filterUnresolved);
                                if (!filterUnresolved) setFilterStaffId('all');
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterUnresolved
                                ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-200'
                                : 'bg-white text-red-700 border-red-200 hover:bg-red-50 shadow-sm'
                                }`}
                            title={filterUnresolved ? "絞り込みを解除" : LABELS.DASHBOARD.MEMO_ALERT_ALL(pendingMemos)}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{LABELS.STATUS.UNRESOLVED_SHORT}</span>
                            <span className="bg-red-200 px-1.5 rounded-full text-[10px]">{pendingMemos}</span>
                        </button>
                    )}

                    {/* New Appointment Button */}
                    <NewAppointmentButton
                        staffList={staffList}
                        initialDate={filterDate || getNow()}
                    />
                    {/* ... (rest of toolbar logic remains similar, truncating for brevity since we are focusing on the top part and main content replacement) ... */}
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    {/* Patient Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                        <User className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={filterPatient}
                            onChange={(e) => setFilterPatient(e.target.value)}
                            placeholder={LABELS.DASHBOARD.SEARCH_PLACEHOLDER}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {filterPatient && (
                            <button
                                onClick={() => setFilterPatient('')}
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Staff Filter */}
                    <select
                        value={filterStaffId}
                        onChange={(e) => setFilterStaffId(e.target.value)}
                        className="px-2 py-1.5 border border-slate-300 rounded text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 min-w-[120px]"
                    >
                        <option value="all">{LABELS.APPOINTMENT.FILTER_STAFF_ALL}</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                        <option value="unassigned">{LABELS.STATUS.UNASSIGNED}</option>
                    </select>

                    {/* Include Past Toggle Button */}
                    <button
                        onClick={toggleHistory}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${includePast
                            ? 'bg-slate-700 text-white border-slate-700 shadow-inner'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm'
                            }`}
                        title={LABELS.APPOINTMENT.FILTER_PAST_TOOLTIP}
                    >
                        <History className={`w-4 h-4 ${includePast ? 'text-slate-300' : 'text-slate-500'}`} />
                        <span>{LABELS.APPOINTMENT.FILTER_PAST}</span>
                    </button>

                    {/* Result Count */}
                    <div className="ml-auto text-sm text-slate-500 font-medium">
                        {LABELS.COMMON.TOTAL_COUNT(filteredAppointments.length)}
                    </div>
                </div>

                {/* Row 2: Date Navigation */}
                <div className="px-3 pb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />

                    <div className="flex items-center gap-1 bg-white rounded border border-slate-200 p-1">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                            title={LABELS.COMMON.NAV_PREV}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="px-3 min-w-[140px] text-center">
                            {filterDate ? (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">
                                        {format(filterDate, 'M/d (EEE)', { locale: ja })}
                                    </span>
                                    {isToday(filterDate) && (
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{LABELS.COMMON.NAV_TODAY}</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400">{LABELS.COMMON.NAV_ALL_PERIOD}</span>
                            )}
                        </div>

                        <button
                            onClick={() => navigateDate(1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                            title={LABELS.COMMON.NAV_NEXT}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Jump */}
                    <button onClick={() => setSpecificDate(0)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">{LABELS.COMMON.NAV_TODAY}</button>
                    <button onClick={() => setSpecificDate(1)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">{LABELS.COMMON.NAV_TOMORROW}</button>
                    <button onClick={() => navigateDate(7)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">{LABELS.COMMON.NAV_WEEK}</button>
                    <button onClick={() => setFilterDate(null)} className={`text-xs px-2.5 py-1.5 border rounded transition-colors ${!filterDate ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{LABELS.COMMON.NAV_ALL_PERIOD}</button>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    {/* Pagination Controls (Toolbar) */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-500"
                                title="前のページ"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-slate-600 min-w-[40px] text-center">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-500"
                                title="次のページ"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Status Bar */}
            {(filterDate || filterStaffId !== 'all' || filterPatient || filterUnresolved) && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-indigo-900 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 font-bold">
                        <span>🔍 {LABELS.FILTER.CONDITION}:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                        {filterDate && (
                            <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded text-indigo-700">
                                📅 {format(filterDate, 'yyyy/MM/dd (eee)', { locale: ja })}
                            </span>
                        )}
                        {!filterDate && (
                            <span className="bg-white border text-slate-400 border-slate-200 px-2 py-0.5 rounded">
                                📅 {LABELS.COMMON.NAV_ALL_PERIOD}
                            </span>
                        )}

                        {filterStaffId !== 'all' && (
                            <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded text-indigo-700 font-bold">
                                👤 {filterStaffId === 'unassigned' ? LABELS.STATUS.UNASSIGNED : staffList.find(s => s.id === filterStaffId)?.name}
                            </span>
                        )}

                        {filterPatient && (
                            <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded text-indigo-700 font-bold">
                                🔡 &quot;{filterPatient}&quot;
                            </span>
                        )}

                        {filterUnresolved && (
                            <span className="bg-red-100 border border-red-200 px-2 py-0.5 rounded text-red-700 font-bold">
                                ⚠️ {LABELS.STATUS.UNRESOLVED_SHORT}のみ
                            </span>
                        )}
                    </div>

                    <div className="h-4 w-px bg-indigo-200 hidden sm:block"></div>

                    <div className="font-bold flex items-center gap-2 text-indigo-800">
                        <span>📊 {LABELS.FILTER.RESULT}:</span>
                        <span className={`text-lg ${filteredAppointments.length === 0 ? 'text-red-500' : ''}`}>
                            {filteredAppointments.length}
                        </span>
                        <span className="text-xs font-normal">{LABELS.FILTER.UNIT}</span>
                    </div>

                    <button
                        onClick={() => {
                            setFilterDate(null);
                            setFilterStaffId('all');
                            setFilterPatient('');
                            setFilterUnresolved(false);
                        }}
                        className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                    >
                        {LABELS.FILTER.CLEAR}
                    </button>
                </div>
            )
            }

            {/* Desktop Table */}
            <div className="hidden md:block flex-1 overflow-auto">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-2 py-3 whitespace-nowrap w-14 text-center">{LABELS.COMMON.STATUS}</th>
                            <th className="px-2 py-3 whitespace-nowrap">{LABELS.FORM.DATE_TIME}</th>
                            <th className="px-2 py-3 whitespace-nowrap">{TERMS.PATIENT}名</th>
                            <th className="px-2 py-3 whitespace-nowrap">{TERMS.STAFF}</th>
                            <th className="px-2 py-3 whitespace-nowrap w-[200px]">{LABELS.PATIENT_FORM.MEMO.split(' ')[0]}</th>
                            <th className="px-2 py-3 whitespace-nowrap text-right w-[100px]">{LABELS.COMMON.OPERATION}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedAppointments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-slate-200" />
                                        <p>{(filterDate || filterStaffId !== 'all' || filterPatient || filterUnresolved)
                                            ? LABELS.FILTER.NO_MATCH
                                            : LABELS.APPOINTMENT.MSG_NO_DISPLAY_DATA}</p>
                                        {(filterDate || filterStaffId !== 'all' || filterPatient || filterUnresolved) && (
                                            <button
                                                onClick={() => {
                                                    setFilterDate(null);
                                                    setFilterStaffId('all');
                                                    setFilterPatient('');
                                                    setFilterUnresolved(false);
                                                }}
                                                className="mt-2 text-sm text-indigo-600 hover:underline"
                                            >
                                                {LABELS.FILTER.RESET_ALL}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedAppointments.map((apt) => {
                                const visitDate = new Date(apt.visitDate);
                                const diff = differenceInMinutes(visitDate, getNow());
                                const isExpired = diff < -60;
                                const isCancelled = apt.status === 'cancelled';
                                const isUnassigned = !isCancelled && !isExpired && !apt.staffId;

                                let rowClass = isCancelled ? 'bg-slate-50 opacity-60 hover:bg-slate-100' : (isExpired ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-indigo-50');
                                if (isUnassigned) rowClass = 'bg-red-50 hover:bg-red-100 border-l-[3px] border-l-red-400';

                                const textClass = isCancelled ? 'text-slate-400 line-through' : (isExpired ? 'text-slate-400' : 'text-slate-700');

                                return (
                                    <tr key={apt.id} className={`${rowClass} group transition-colors`}>
                                        <td className="px-2 py-3 text-center">
                                            <div className="flex justify-center" title={apt.status}>
                                                {getStatusIcon(apt.status)}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <div className={`font-mono font-bold text-base ${isCancelled ? 'text-slate-400 line-through' : (isExpired ? 'text-slate-500' : 'text-slate-800')}`}>
                                                {format(visitDate, 'yyyy/MM/dd (eee)', { locale: ja })}
                                            </div>
                                            <div className="text-xl font-bold">
                                                {format(visitDate, 'HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 max-w-[180px]">
                                            <Link
                                                href={`/patients/${apt.patientId}`}
                                                className="hover:underline flex flex-col"
                                                title={isCancelled ? "キャンセル済み：詳細を確認して再予約" : "患者詳細を表示"}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-base truncate block ${isCancelled ? 'text-slate-400 line-through' : (isExpired ? '' : 'text-indigo-900')}`}>
                                                        {apt.patientName}
                                                    </span>
                                                    <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 rounded-full whitespace-nowrap">
                                                        {apt.visitCount}回目
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 truncate block">
                                                    {apt.patientKana}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-2 py-3 max-w-[100px]">
                                            {apt.staffName ? (
                                                <span
                                                    className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 w-full"
                                                    title={apt.staffName}
                                                >
                                                    <User className="w-3 h-3 flex-none" />
                                                    <span className="truncate">{apt.staffName}</span>
                                                </span>
                                            ) : (
                                                !isCancelled && !isExpired ? (
                                                    <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs animate-pulse">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        {LABELS.STATUS.UNASSIGNED}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )
                                            )}
                                        </td>
                                        <td className={`px-2 py-3 ${textClass} max-w-[240px]`}>
                                            <div className="relative group/memo">
                                                <div className="line-clamp-3 text-sm leading-snug">
                                                    {apt.memo || <span className="text-slate-300 italic">{LABELS.COMMON.NONE}</span>}
                                                </div>
                                                {apt.memo && apt.memo.length > 50 && (
                                                    <button
                                                        onClick={() => setViewingMemo({ patient: apt.patientName, memo: apt.memo || '' })}
                                                        className="absolute bottom-0 right-0 text-xs text-indigo-600 hover:text-indigo-800 bg-white px-1 rounded opacity-0 group-hover/memo:opacity-100 transition-opacity flex items-center gap-1"
                                                        title={`${LABELS.COMMON.FULL_TEXT}を表示`}
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        {LABELS.COMMON.FULL_TEXT}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Admin Memo Display */}
                                            {apt.adminMemo && (
                                                <div
                                                    className={`mt-2 p-2 rounded text-xs border transition-colors flex items-start gap-1.5 ${!apt.isMemoResolved && !isCancelled
                                                        ? 'bg-red-50 border-red-200 text-red-700'
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                                                        }`}
                                                >
                                                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 min-w-[14px] ${!apt.isMemoResolved && !isCancelled ? 'text-red-500' : 'text-slate-400'
                                                        }`} />
                                                    <div
                                                        className="flex-1 leading-snug truncate cursor-pointer hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewingMemo({ patient: apt.patientName, memo: apt.adminMemo || '' });
                                                        }}
                                                        title="クリックして全文を表示"
                                                    >
                                                        <span className="font-bold mr-1 inline-block text-[10px] opacity-70">{LABELS.APPOINTMENT.ADMIN_MEMO_PREFIX}</span>
                                                        {apt.adminMemo}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMemoConfirm({ open: true, id: apt.id, resolved: !apt.isMemoResolved });
                                                        }}
                                                        className={`p-1 rounded transition-colors ${!apt.isMemoResolved && !isCancelled
                                                            ? 'hover:bg-red-100 text-red-600'
                                                            : 'hover:bg-slate-200 text-slate-400'
                                                            }`}
                                                        title={apt.isMemoResolved ? '未確認に戻す' : '確認済みにする'}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2 text-right items-center">
                                                {!isCancelled && (
                                                    <Link
                                                        href={`/patients/${apt.patientId}#new-record`}
                                                        className="bg-indigo-600 text-white px-2 py-1.5 rounded-md text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                        {TERMS.RECORD}
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => setEditingAppointment(apt)}
                                                    className="bg-white text-slate-600 border border-slate-200 px-2 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                                    title={LABELS.COMMON.MENU_EDIT}
                                                >
                                                    <CalendarClock className="w-3.5 h-3.5" />
                                                    {LABELS.COMMON.MENU_EDIT}
                                                </button>
                                                {!isCancelled && (
                                                    <button
                                                        onClick={() => setCancelConfirm({ open: true, id: apt.id })}
                                                        className="p-1 px-1.5 bg-white border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-slate-500"
                                                        title={LABELS.DIALOG.DEFAULT_CANCEL}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
                {paginatedAppointments.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        {LABELS.APPOINTMENT.MSG_NO_DISPLAY_DATA}
                    </div>
                ) : (
                    paginatedAppointments.map((apt) => {
                        const visitDate = new Date(apt.visitDate);
                        const diff = differenceInMinutes(visitDate, getNow());
                        const isExpired = diff < -60;
                        const isCancelled = apt.status === 'cancelled';
                        const isUnassigned = !isCancelled && !isExpired && !apt.staffId;

                        const cardClass = isCancelled ? 'bg-slate-100 opacity-70' : (isExpired ? 'bg-slate-50' : 'bg-white');
                        let borderClass = isUnassigned ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-indigo-400';
                        if (isCancelled) borderClass = 'border-l-4 border-l-slate-300';

                        return (
                            <div key={apt.id} className={`${cardClass} ${borderClass} rounded-lg shadow-sm border border-slate-200 p-4 space-y-3`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="font-mono font-bold text-lg text-slate-700">
                                            {format(visitDate, 'HH:mm')}
                                        </div>
                                        <div className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {format(visitDate, 'MM/dd')}
                                        </div>
                                    </div>
                                    <div>{getStatusIcon(apt.status)}</div>
                                </div>

                                <div>
                                    <Link href={`/patients/${apt.patientId}`} className="block">
                                        <div className="font-bold text-lg text-indigo-900 line-clamp-2">{apt.patientName}</div>
                                        <div className="text-xs text-slate-500">{apt.patientKana}</div>
                                    </Link>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500 text-xs">{TERMS.STAFF}:</span>
                                    {apt.staffName ? (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-xs flex items-center gap-1">
                                            <User className="w-3 h-3" /> {apt.staffName}
                                        </span>
                                    ) : (
                                        !isCancelled && !isExpired ? (
                                            <span className="text-red-600 font-bold text-xs flex items-center gap-1 animate-pulse">
                                                <AlertCircle className="w-3 h-3" /> {LABELS.STATUS.UNASSIGNED}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )
                                    )}
                                </div>

                                {(apt.memo || apt.adminMemo) && (
                                    <div className="border-t border-slate-100 pt-2 space-y-2">
                                        {apt.memo && (
                                            <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                                {apt.memo}
                                            </div>
                                        )}
                                        {apt.adminMemo && (
                                            <div
                                                className={`text-xs p-2 rounded border flex items-start gap-2 ${!apt.isMemoResolved && !isCancelled
                                                    ? 'bg-red-50 border-red-200 text-red-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                                                    }`}
                                                onClick={() => setMemoConfirm({ open: true, id: apt.id, resolved: !apt.isMemoResolved })}
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                                                <span className="flex-1">{apt.adminMemo}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    {!isCancelled && (
                                        <button
                                            onClick={() => setCancelConfirm({ open: true, id: apt.id })}
                                            className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-full transition-colors"
                                            title={LABELS.DIALOG.DEFAULT_CANCEL}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingAppointment(apt)}
                                        className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                        title={LABELS.COMMON.MENU_EDIT}
                                    >
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        {LABELS.COMMON.MENU_EDIT}
                                    </button>

                                    {/* Create Record - Only if not cancelled */}
                                    {!isCancelled && (
                                        <Link
                                            href={`/patients/${apt.patientId}#new-record`}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            {TERMS.RECORD}{LABELS.COMMON.CREATE}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {
                editingAppointment && (
                    <AppointmentEditModal
                        appointment={editingAppointment}
                        staffList={staffList}
                        isOpen={!!editingAppointment}
                        onClose={() => {
                            setEditingAppointment(null);
                            router.refresh();
                        }}
                    />
                )
            }

            {/* Memo View Dialog */}
            {
                viewingMemo && (
                    <Dialog open={!!viewingMemo} onOpenChange={() => setViewingMemo(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    {LABELS.APPOINTMENT.MEMO_TITLE} - {viewingMemo.patient}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200 max-h-[60vh] overflow-y-auto">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {viewingMemo.memo}
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                )
            }

            <ConfirmDialog
                open={cancelConfirm.open}
                onOpenChange={(open) => setCancelConfirm(prev => ({ ...prev, open }))}
                title={LABELS.APPOINTMENT.CANCEL_CONFIRM_TITLE}
                description={LABELS.APPOINTMENT.CANCEL_CONFIRM_DESC}
                confirmLabel={LABELS.APPOINTMENT.CANCEL_EXECUTE}
                variant="warning"
                onConfirm={handleDelete}
            />

            <ConfirmDialog
                open={memoConfirm.open}
                onOpenChange={(open) => setMemoConfirm(prev => ({ ...prev, open }))}
                title={memoConfirm.resolved ? LABELS.APPOINTMENT.MEMO_RESOLVE_TITLE : LABELS.APPOINTMENT.MEMO_UNRESOLVE_TITLE}
                description={memoConfirm.resolved ? LABELS.APPOINTMENT.MEMO_RESOLVE_DESC : LABELS.APPOINTMENT.MEMO_UNRESOLVE_DESC}
                confirmLabel={LABELS.APPOINTMENT.CHANGE_STATUS}
                variant="primary"
                onConfirm={handleMemoToggle}
            />
        </div >
    );
}
