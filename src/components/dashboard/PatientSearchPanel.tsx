'use client';

// Imports updated
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, History, AlertCircle, Search, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from '@/services/appointmentService';
import { updateAppointmentAction, toggleAdminMemoResolutionAction, completeAppointmentAction } from '@/actions/appointmentActions';
import { UserCheck, FileText } from 'lucide-react';
import { AppointmentEditModal } from './AppointmentEditModal';
import { Staff } from '@/services/staffService';
import { checkInAppointmentAction } from '@/actions/appointmentActions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TERMS, LABELS } from '@/config/labels';
import { differenceInMinutes } from 'date-fns';
import { Patient, ClinicalRecord } from '@prisma/client';
import { getNow } from '@/lib/dateUtils';

// Minimal patient type for Recent History (stored in localStorage)
export interface RecentPatient {
    id: string;
    name: string;
    kana: string;
    lastAccess: number;
}

interface PatientSearchPanelProps {
    initialPatients: (Patient & { records: ClinicalRecord[] })[];
    appointments: Appointment[];
    unassignedAppointments?: Appointment[];
    unresolvedMemos?: Appointment[];
    activeStaff?: Staff[];
    searchQuery: string;
}

export function PatientSearchPanel({ initialPatients, appointments, unassignedAppointments = [], unresolvedMemos = [], activeStaff = [], searchQuery }: PatientSearchPanelProps) {
    const router = useRouter();
    const [query, setQuery] = useState(searchQuery);
    const [activeTab, setActiveTab] = useState<'recent' | 'search' | 'attention'>('recent');
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
    const [memoConfirm, setMemoConfirm] = useState<{ open: boolean; id: string; targetStatus: boolean }>({ open: false, id: '', targetStatus: true });
    const [completeConfirm, setCompleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
    const [currentTime, setCurrentTime] = useState(getNow());

    const [attentionFilter, setAttentionFilter] = useState<'all' | 'delayed' | 'unassigned' | 'memo'>('all');
    //  Modal State
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getNow()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleComplete = async () => {
        const { id } = completeConfirm;
        try {
            await completeAppointmentAction(id);
            // Router refresh handled in action
        } catch (e) {
            console.error(e);
            alert('完了処理に失敗しました');
        }
    };

    const handleMemoResolve = async () => {
        // Find existing state
        const target = memoAppointments.find(a => a.id === memoConfirm.id);
        const nextStatus = !target?.isMemoResolved;

        try {
            await toggleAdminMemoResolutionAction(memoConfirm.id, nextStatus);
            // Router refresh is handled in the action
        } catch (e) {
            console.error(e);
            alert('更新に失敗しました');
        }
    };

    // Filter Logic
    // 1. Unresolved Memos
    // Use unresolvedMemos directly. It already includes "unresolved" + "resolved today".
    // Filter out any empty adminMemo (defensive check)
    const memoAppointments = [...unresolvedMemos]
        .filter(a => a.adminMemo && a.adminMemo.trim() !== '')
        .sort((a, b) =>
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        );

    // 2. Delayed Appointments (Waiting for Chart Creation)
    // Status Arrived + >30 mins past end time
    const delayedAppointments = appointments.filter(a => {
        if (a.status !== 'arrived') return false;
        const aptTime = new Date(a.visitDate);
        const diff = differenceInMinutes(aptTime, currentTime);
        const duration = a.duration || 60;
        return diff < -(duration + 30);
    });

    // Counts
    // Counts: Only count genuinely unresolved items for the badge
    const unresolvedMemoCount = memoAppointments.filter(a => !a.isMemoResolved).length;
    const delayedCount = delayedAppointments.length;

    const unassignedCount = unassignedAppointments.length;
    const totalAttention = unresolvedMemoCount + unassignedCount + delayedCount;
    // Show list if there are ANY unassigned OR ANY unresolved memos OR ANY resolved memos history OR ANY delayed appointments
    const hasAnyAttentionItems = unassignedCount > 0 || memoAppointments.length > 0 || delayedCount > 0;

    // Load recent patients from localStorage and validate with current DB
    useEffect(() => {
        const stored = localStorage.getItem('recent_patients');
        if (stored) {
            try {
                const parsed: RecentPatient[] = JSON.parse(stored);

                // Auto-cleanup: remove patients that no longer exist in the DB (initialPatients)
                // This prevents 404s after DB resets/seeds
                const validRecents = parsed.filter(recent =>
                    initialPatients.some(current => current.id === recent.id)
                );

                // If we filtered out garbage, update storage immediately
                if (validRecents.length !== parsed.length) {
                    localStorage.setItem('recent_patients', JSON.stringify(validRecents));
                }

                setRecentPatients(validRecents);
            } catch (e) {
                console.error("Failed to parse recent patients", e);
                // If corrupt, clear it
                localStorage.removeItem('recent_patients');
            }
        }
    }, [initialPatients]);

    // Switch tab based on search query from URL (only on initial load or URL change)
    // Do NOT include activeTab in deps - that causes a loop
    useEffect(() => {
        if (searchQuery) {
            setActiveTab('search');
            setQuery(searchQuery);
        }
        // Only react to searchQuery changes from URL, not tab switches

    }, [searchQuery]);

    // Handle manual search input
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/?q=${query}`);
        }
    };

    // Handle tab click - clear URL query when switching away from search
    const handleTabClick = (tab: 'recent' | 'search' | 'attention') => {
        if (tab === 'search' && query.trim() && !searchQuery) {
            // Clicking search tab with text in input: trigger search
            router.push(`/?q=${query}`);
        } else if (tab !== 'search' && searchQuery) {
            // Clear URL query parameter when leaving search
            router.push('/');
        }
        setActiveTab(tab);
    };

    // Save to recent on click
    const handlePatientClick = (patient: { id: string, name: string, kana: string }) => {
        const newRecent: RecentPatient = {
            id: patient.id,
            name: patient.name,
            kana: patient.kana,
            lastAccess: Date.now()
        };

        const updated = [newRecent, ...recentPatients.filter(p => p.id !== patient.id)].slice(0, 10);
        setRecentPatients(updated);
        localStorage.setItem('recent_patients', JSON.stringify(updated));
    };

    return (
        <>
            <div className="flex flex-col h-full space-y-4 relative">
                {/* Edit Modal */}
                {editingAppointment && (
                    <AppointmentEditModal
                        appointment={editingAppointment}
                        staffList={activeStaff}
                        isOpen={!!editingAppointment}
                        onClose={() => setEditingAppointment(null)}
                    />
                )}

                {/* Context/Tab Switcher Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 shrink-0 overflow-hidden">
                    {/* Search Bar Area */}
                    <div className="p-4 border-b border-slate-100">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={LABELS.DASHBOARD.SEARCH_PLACEHOLDER}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                            />
                            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                        </form>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex text-sm font-medium bg-slate-50">
                        <button
                            onClick={() => handleTabClick('recent')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'recent' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <History className="w-4 h-4" />
                            {LABELS.COMMON.RECENT}
                        </button>
                        <button
                            onClick={() => handleTabClick('search')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'search' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <Users className="w-4 h-4" />
                            {LABELS.COMMON.SEARCH_RESULT}
                        </button>
                        <button
                            onClick={() => handleTabClick('attention')}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'attention' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <AlertCircle className={`w-4 h-4 ${totalAttention > 0 ? 'text-amber-500' : ''}`} />
                            {LABELS.COMMON.ATTENTION}
                            <div className="flex gap-1 ml-1">
                                {delayedCount > 0 && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full" title="カルテ未作成">
                                        {delayedCount}
                                    </span>
                                )}
                                {unassignedCount > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs px-1.5 rounded-full" title="担当未定">
                                        {unassignedCount}
                                    </span>
                                )}
                                {unresolvedMemoCount > 0 && (
                                    <span className="bg-rose-100 text-rose-700 text-xs px-1.5 rounded-full" title="未読メモ">
                                        {unresolvedMemoCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-y-auto h-full p-2">

                        {/* Recent Tab */}
                        {activeTab === 'recent' && (
                            <div className="space-y-1">
                                {recentPatients.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        {LABELS.DASHBOARD.NO_HISTORY}
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {recentPatients.map(patient => (
                                            <li key={patient.id}>
                                                <Link
                                                    href={`/patients/${patient.id}`}
                                                    className="block p-3 hover:bg-slate-50 transition-colors rounded-md group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors shrink-0">
                                                                <User className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-700 group-hover:text-indigo-700 truncate max-w-[300px]">{patient.name}</div>
                                                                <div className="text-xs text-slate-400 truncate max-w-[200px]">{patient.kana}</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-300 shrink-0">
                                                            {/* Optional: Show relative time if accessed recently */}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Search Tab */}
                        {activeTab === 'search' && (
                            <div>
                                {!searchQuery ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>患者様の名前またはふりがなを入力して検索してください</p>
                                    </div>
                                ) : initialPatients.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        {LABELS.DASHBOARD.NO_SEARCH_RESULT(query)}
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {initialPatients.map(patient => (
                                            <li key={patient.id}>
                                                <Link
                                                    href={`/patients/${patient.id}`}
                                                    onClick={() => handlePatientClick(patient)}
                                                    className="block p-3 hover:bg-slate-50 transition-colors rounded-md group"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="max-w-[500px]">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800 group-hover:text-indigo-600 truncate block max-w-[360px]">
                                                                    {patient.name}
                                                                </span>
                                                                <span className="text-xs text-slate-500 truncate max-w-[200px]">({patient.kana})</span>
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                                                <span className="bg-slate-50 px-1.5 rounded">No.{patient.pId}</span>
                                                                {patient.gender && <span>{patient.gender}</span>}
                                                                {patient.records?.[0]?.visitDate && (
                                                                    <span className="text-slate-500 border-l pl-2">
                                                                        最終: {format(new Date(patient.records[0].visitDate), 'yyyy/MM/dd')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Attention Tab */}
                        {activeTab === 'attention' && (
                            <div>
                                {!hasAnyAttentionItems ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        <div className="flex justify-center mb-2">
                                            <span className="bg-green-100 p-2 rounded-full text-green-500">
                                                <UserCheck className="w-6 h-6" />
                                            </span>
                                        </div>
                                        {LABELS.DASHBOARD.NO_ATTENTION}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Filter Toggles (Radio Style) */}
                                        <div className="flex gap-2 pb-2 overflow-x-auto">
                                            <button
                                                onClick={() => setAttentionFilter('all')}
                                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${attentionFilter === 'all'
                                                    ? 'bg-slate-800 border-slate-800 text-white font-bold'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                {LABELS.COMMON.ALL}
                                            </button>
                                            <button
                                                onClick={() => setAttentionFilter('memo')}
                                                className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${attentionFilter === 'memo'
                                                    ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold ring-1 ring-rose-100'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <AlertTriangle className="w-3 h-3" />
                                                未読メモ
                                                {unresolvedMemoCount > 0 && <span className={`px-1.5 rounded-full text-[10px] ${attentionFilter === 'memo' ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>{unresolvedMemoCount}</span>}
                                            </button>
                                            <button
                                                onClick={() => setAttentionFilter('unassigned')}
                                                className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${attentionFilter === 'unassigned'
                                                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold ring-1 ring-amber-100'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <AlertCircle className="w-3 h-3" />
                                                担当未定
                                                {unassignedCount > 0 && <span className={`px-1.5 rounded-full text-[10px] ${attentionFilter === 'unassigned' ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{unassignedCount}</span>}
                                            </button>
                                            <button
                                                onClick={() => setAttentionFilter('delayed')}
                                                className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${attentionFilter === 'delayed'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold ring-1 ring-blue-100'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <FileText className="w-3 h-3" />
                                                カルテ未作成
                                                {delayedCount > 0 && <span className={`px-1.5 rounded-full text-[10px] ${attentionFilter === 'delayed' ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>{delayedCount}</span>}
                                            </button>
                                        </div>

                                        {/* Memos List */}
                                        {(attentionFilter === 'all' || attentionFilter === 'memo') && memoAppointments.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {LABELS.APPOINTMENT.ADMIN_MEMO}
                                                </h3>
                                                <ul className="space-y-1">
                                                    {memoAppointments.map(apt => {
                                                        const isResolved = apt.isMemoResolved;

                                                        const handleResolveClick = async (e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            // Toggle logic
                                                            setMemoConfirm({
                                                                open: true,
                                                                id: apt.id,
                                                                targetStatus: !isResolved
                                                            });
                                                        };

                                                        return (
                                                            <li
                                                                key={apt.id}
                                                                onClick={handleResolveClick}
                                                                className={`p-3 border rounded-md shadow-sm transition-all cursor-pointer ${isResolved
                                                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                                                    : 'bg-white border-red-100 hover:shadow-md hover:border-red-300'
                                                                    }`}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className={`text-sm font-bold flex items-center gap-2 ${isResolved ? 'text-slate-500' : 'text-slate-700'}`}>
                                                                        {(() => {
                                                                            const aptDate = new Date(apt.visitDate);
                                                                            const now = new Date();
                                                                            const isPast = aptDate < now;
                                                                            return (
                                                                                <>
                                                                                    {isPast && (
                                                                                        <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                                                                            {LABELS.STATUS.PAST}
                                                                                        </span>
                                                                                    )}
                                                                                    {format(aptDate, 'MM/dd HH:mm')} {apt.patientName}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    {isResolved && (
                                                                        <div className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            {LABELS.APPOINTMENT.ADMIN_MEMO_RESOLVED}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm p-2 rounded mb-2 ${isResolved
                                                                    ? 'text-slate-500 bg-slate-100'
                                                                    : 'text-red-800 bg-red-50'
                                                                    }`}>
                                                                    {apt.adminMemo}
                                                                </p>
                                                                <div className="text-right">
                                                                    <span className="text-xs text-blue-600 font-bold hover:underline">
                                                                        {isResolved ? LABELS.APPOINTMENT.CLICK_TO_UNRESOLVE : LABELS.APPOINTMENT.CLICK_TO_RESOLVE}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Unassigned List */}
                                        {(attentionFilter === 'all' || attentionFilter === 'unassigned') && unassignedAppointments.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                    {LABELS.STATUS.UNASSIGNED}の{TERMS.APPOINTMENT} ({unassignedAppointments.length}件)
                                                </h3>
                                                <ul className="space-y-1">
                                                    {unassignedAppointments.map(apt => (
                                                        <li
                                                            key={apt.id}
                                                            className="p-3 bg-white border border-amber-100 rounded-md shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                                                            onClick={() => setEditingAppointment(apt)} // Open Modal to set staff
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-center bg-slate-50 p-1 rounded min-w-[3.5rem]">
                                                                    <div className="text-[10px] text-slate-500">{format(new Date(apt.visitDate), 'MM/dd')}</div>
                                                                    <div className="text-sm font-bold text-slate-700">{format(new Date(apt.visitDate), 'HH:mm')}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-800 text-sm">{apt.patientName}</div>
                                                                    <div className="text-xs text-amber-600 font-bold flex items-center gap-1 group-hover:underline">
                                                                        <AlertCircle className="w-3 h-3" />
                                                                        {LABELS.STATUS.UNASSIGNED}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-slate-300">
                                                                編集 &gt;
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Delayed (Chart Pending) List - BLUE THEME */}
                                        {(attentionFilter === 'all' || attentionFilter === 'delayed') && delayedAppointments.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-2">
                                                    <FileText className="w-3 h-3" />
                                                    カルテ未作成 / 確認待ち ({delayedAppointments.length}件)
                                                </h3>
                                                <ul className="space-y-1">
                                                    {delayedAppointments.map(apt => (
                                                        <li
                                                            key={apt.id}
                                                            className="p-3 bg-white border border-blue-200 rounded-md shadow-sm hover:shadow-md hover:border-blue-400 transition-all group"
                                                        >
                                                            <Link href={`/patients/${apt.patientId}#new-record`} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-center bg-blue-50 p-1 rounded min-w-[3.5rem] text-blue-800">
                                                                        <div className="text-[10px] opacity-70">Over</div>
                                                                        <div className="text-sm font-bold">{format(new Date(apt.visitDate), 'HH:mm')}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 block">
                                                                            {apt.patientName}
                                                                        </span>
                                                                        <div className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            カルテ作成待ち
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition-colors">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={memoConfirm.open}
                onOpenChange={(open) => setMemoConfirm(prev => ({ ...prev, open }))}
                title={memoConfirm.targetStatus ? LABELS.APPOINTMENT.MEMO_RESOLVE_TITLE : LABELS.APPOINTMENT.MEMO_UNRESOLVE_TITLE}
                description={memoConfirm.targetStatus ? LABELS.APPOINTMENT.MEMO_RESOLVE_DESC : LABELS.APPOINTMENT.MEMO_UNRESOLVE_DESC}
                confirmLabel={LABELS.APPOINTMENT.CHANGE_STATUS}
                variant={memoConfirm.targetStatus ? "primary" : "warning"}
                onConfirm={handleMemoResolve}
            />

            <ConfirmDialog
                open={completeConfirm.open}
                onOpenChange={(open) => setCompleteConfirm(prev => ({ ...prev, open }))}
                title={`${completeConfirm.name}様の${TERMS.APPOINTMENT}を完了しますか？`}
                description="完了すると、リストから消去されます。"
                confirmLabel="完了する"
                variant="primary"
                onConfirm={handleComplete}
            />
        </>
    );
}

