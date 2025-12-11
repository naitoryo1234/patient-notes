'use client';

// Imports updated
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, History, AlertCircle, Search, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react'; // Added icons
import { format } from 'date-fns';
import { Appointment } from '@/services/appointmentService';
import { updateAppointmentAction, toggleAdminMemoResolutionAction } from '@/actions/appointmentActions'; // Needs server action to resolve

// Helper icons required
import { UserCheck } from 'lucide-react';
// import { AppointmentDetailModal } from './AppointmentDetailModal'; // Reuse if needed, or just Edit
import { AppointmentEditModal } from './AppointmentEditModal';
import { Staff } from '@/services/staffService';
import { checkInAppointmentAction } from '@/actions/appointmentActions';



// Minimal patient type for Recent History (stored in localStorage)
export interface RecentPatient {
    id: string;
    name: string;
    kana: string;
    lastAccess: number;
}

interface PatientSearchPanelProps {
    initialPatients: any[]; // Using any for now to match flexible Prisma return type, ideally defined properly
    appointments: Appointment[]; // For memos (today's)
    unassignedAppointments?: Appointment[]; // Future unassigned
    unresolvedMemos?: Appointment[]; // All unresolved memos (including past)
    activeStaff?: Staff[];
    searchQuery: string;
}

export function PatientSearchPanel({ initialPatients, appointments, unassignedAppointments = [], unresolvedMemos = [], activeStaff = [], searchQuery }: PatientSearchPanelProps) {
    const router = useRouter();
    const [query, setQuery] = useState(searchQuery);
    const [activeTab, setActiveTab] = useState<'recent' | 'search' | 'attention'>('recent');
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);

    // Modal State
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Filter Logic
    // Use unresolvedMemos (all unresolved, including past) instead of only today's
    const memoAppointments = unresolvedMemos; // All unresolved memos

    // Counts
    const unresolvedMemoCount = memoAppointments.length; // Already filtered to unresolved

    const unassignedCount = unassignedAppointments.length;
    const totalAttention = unresolvedMemoCount + unassignedCount;
    // Show list if there are ANY unassigned OR ANY unresolved memos
    const hasAnyAttentionItems = unassignedCount > 0 || unresolvedMemoCount > 0;

    // Load recent patients from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recent_patients');
        if (stored) {
            try {
                setRecentPatients(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse recent patients", e);
            }
        }
    }, []);

    // Switch tab based on search query
    useEffect(() => {
        if (searchQuery) {
            setActiveTab('search');
            setQuery(searchQuery);
        } else if (activeTab === 'search' && !searchQuery) {
            // If search is cleared, go back to recent or attention
            setActiveTab('recent');
        }
    }, [searchQuery]);

    // Handle manual search input
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/?q=${query}`);
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
                            placeholder="患者検索（氏名・ふりがな）"
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                    </form>
                </div>

                {/* Tab Navigation */}
                <div className="flex text-sm font-medium bg-slate-50">
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'recent' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <History className="w-4 h-4" />
                        最近見た
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'search' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <Users className="w-4 h-4" />
                        検索結果
                    </button>
                    <button
                        onClick={() => setActiveTab('attention')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'attention' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <AlertCircle className={`w-4 h-4 ${totalAttention > 0 ? 'text-amber-500' : ''}`} />
                        要確認
                        <div className="flex gap-1 ml-1">
                            {unassignedCount > 0 && (
                                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 rounded-full" title="担当未定">
                                    {unassignedCount}
                                </span>
                            )}
                            {unresolvedMemoCount > 0 && (
                                <span className="bg-red-100 text-red-700 text-xs px-1.5 rounded-full" title="未読メモ">
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
                                    履歴はありません
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
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-700 group-hover:text-indigo-700">{patient.name}</div>
                                                            <div className="text-xs text-slate-400">{patient.kana}</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-300">
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
                            {initialPatients.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    {query ? '該当する患者が見つかりません' : 'キーワードを入力して検索'}
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
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800 group-hover:text-indigo-600">
                                                                {patient.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500">({patient.kana})</span>
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
                                    要確認事項はありません
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Unassigned List */}
                                    {unassignedAppointments.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                担当未定の予約 ({unassignedAppointments.length}件)
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
                                                                    担当スタッフ未定
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

                                    {/* Memos List */}
                                    {memoAppointments.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                申し送り事項
                                            </h3>
                                            <ul className="space-y-1">
                                                {memoAppointments.map(apt => {
                                                    const isResolved = apt.isMemoResolved;

                                                    const handleResolveClick = async (e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        if (isResolved) return; // Already resolved
                                                        if (!confirm('この申し送り事項を確認済みにしますか？')) return;

                                                        try {
                                                            await toggleAdminMemoResolutionAction(apt.id, true);
                                                        } catch (e) {
                                                            console.error(e);
                                                            alert('更新に失敗しました');
                                                        }
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
                                                                                        【過去】
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
                                                                        確認済
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm p-2 rounded mb-2 ${isResolved
                                                                ? 'text-slate-500 bg-slate-100'
                                                                : 'text-red-800 bg-red-50'
                                                                }`}>
                                                                {apt.adminMemo}
                                                            </p>
                                                            {!isResolved && (
                                                                <div className="text-right">
                                                                    <span className="text-xs text-blue-600 font-bold hover:underline">
                                                                        クリックで確認済みにする
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
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
    );
}


