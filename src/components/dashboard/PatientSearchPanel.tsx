'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, History, AlertCircle, Search, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from '@/services/appointmentService';
import { Patient } from '@prisma/client';

// Minimal patient type for Recent History (stored in localStorage)
export interface RecentPatient {
    id: string;
    name: string;
    kana: string;
    lastAccess: number;
}

interface PatientSearchPanelProps {
    initialPatients: any[]; // Using any for now to match flexible Prisma return type, ideally defined properly
    appointments: Appointment[];
    searchQuery: string;
}

export function PatientSearchPanel({ initialPatients, appointments, searchQuery }: PatientSearchPanelProps) {
    const router = useRouter();
    const [query, setQuery] = useState(searchQuery);
    const [activeTab, setActiveTab] = useState<'recent' | 'search' | 'attention'>('recent');
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);

    // Determine attention items (e.g. unassigned appointments)
    const unassignedAppointments = appointments.filter(a => !a.staffId && a.status !== 'cancelled');
    const attentionCount = unassignedAppointments.length;

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
        <div className="flex flex-col h-full space-y-4">
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
                        <AlertCircle className={`w-4 h-4 ${attentionCount > 0 ? 'text-amber-500' : ''}`} />
                        要確認
                        {attentionCount > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-1.5 rounded-full ml-0.5">
                                {attentionCount}
                            </span>
                        )}
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
                            {unassignedAppointments.length === 0 ? (
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
                                    {unassignedAppointments.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">担当未定の予約</h3>
                                            <ul className="space-y-1">
                                                {unassignedAppointments.map(apt => (
                                                    <li key={apt.id} className="p-3 bg-white border border-amber-100 rounded-md shadow-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-slate-700">{format(new Date(apt.visitDate), 'HH:mm')}</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">{apt.patientName}</div>
                                                                <div className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    担当スタッフ未定
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* In future, link to assign actions */}
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
    );
}

// Helper icons required
import { UserCheck } from 'lucide-react';
