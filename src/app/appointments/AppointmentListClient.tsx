'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { format, isBefore, isToday, differenceInMinutes, isSameDay, addDays, subDays, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cancelAppointmentAction } from '@/actions/appointmentActions';
import { AppointmentEditModal } from '@/components/dashboard/AppointmentEditModal';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Calendar, User, History, CheckCircle2, XCircle, CalendarClock, AlertCircle, ChevronLeft, ChevronRight, X, FileText } from 'lucide-react';

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
    const [filterDate, setFilterDate] = useState<Date | null>(null); // null = all dates
    const [filterPatient, setFilterPatient] = useState<string>(''); // 患者名検索

    const toggleHistory = () => {
        const query = includePast ? '' : '?history=true';
        router.push(`/appointments${query}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当にこの予約をキャンセルしますか？')) return;
        const res = await cancelAppointmentAction(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.message);
        }
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
            setFilterDate(addDays(new Date(), offset > 0 ? 0 : offset));
        }
    };

    const setSpecificDate = (offsetFromToday: number) => {
        setFilterDate(addDays(new Date(), offsetFromToday));
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
        return true;
    });

    const pendingAssignments = initialAppointments.filter(a => !a.staffId && a.status !== 'cancelled').length;

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            {/* Unassigned Warning */}
            {pendingAssignments > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 p-2 flex items-center gap-2 text-xs text-amber-700 font-bold px-4 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>担当未定の予約が {pendingAssignments} 件あります</span>
                </div>
            )}
            {/* Toolbar - Redesigned */}
            <div className="border-b border-slate-100 bg-slate-50">
                {/* Row 1: Filters */}
                <div className="p-3 flex flex-wrap gap-2 items-center">
                    {/* New Appointment Button */}
                    <NewAppointmentButton
                        staffList={staffList}
                        initialDate={filterDate || new Date()}
                    />

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    {/* Patient Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                        <User className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={filterPatient}
                            onChange={(e) => setFilterPatient(e.target.value)}
                            placeholder="患者名・カナで検索..."
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
                        <option value="all">担当: 全員</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                        <option value="unassigned">未定</option>
                    </select>

                    {/* Include Past Toggle Button */}
                    <button
                        onClick={toggleHistory}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${includePast
                            ? 'bg-slate-700 text-white border-slate-700 shadow-inner'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm'
                            }`}
                        title="過去の予約を表示するか切り替えます"
                    >
                        <History className={`w-4 h-4 ${includePast ? 'text-slate-300' : 'text-slate-500'}`} />
                        <span>過去含</span>
                    </button>

                    {/* Result Count */}
                    <div className="ml-auto text-sm text-slate-500 font-medium">
                        全 {filteredAppointments.length} 件
                    </div>
                </div>

                {/* Row 2: Date Navigation */}
                <div className="px-3 pb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />

                    <div className="flex items-center gap-1 bg-white rounded border border-slate-200 p-1">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                            title="前日"
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
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">今日</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400">全期間</span>
                            )}
                        </div>

                        <button
                            onClick={() => navigateDate(1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                            title="翌日"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Jump */}
                    <button onClick={() => setSpecificDate(0)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">今日</button>
                    <button onClick={() => setSpecificDate(1)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">明日</button>
                    <button onClick={() => navigateDate(7)} className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors">+1週</button>

                    {filterDate && (
                        <button
                            onClick={() => setFilterDate(null)}
                            className="ml-1 text-xs px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded flex items-center gap-1 transition-colors"
                        >
                            <X className="w-3 h-3" /> 解除
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap w-14 text-center">状態</th>
                            <th className="px-4 py-3 whitespace-nowrap">日時</th>
                            <th className="px-4 py-3 whitespace-nowrap">患者名</th>
                            <th className="px-4 py-3 whitespace-nowrap">担当</th>
                            <th className="px-4 py-3 whitespace-nowrap w-1/3">メモ</th>
                            <th className="px-4 py-3 whitespace-nowrap text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                    表示する予約はありません
                                </td>
                            </tr>
                        ) : (
                            filteredAppointments.map((apt) => {
                                const visitDate = new Date(apt.visitDate);
                                const diff = differenceInMinutes(visitDate, new Date());
                                const isExpired = diff < -60; // 1 hour passed
                                const isCancelled = apt.status === 'cancelled';

                                const rowClass = isCancelled ? 'bg-slate-50 opacity-60' : (isExpired ? 'bg-slate-50' : 'bg-white');
                                const textClass = isCancelled ? 'text-slate-400 line-through' : (isExpired ? 'text-slate-400' : 'text-slate-700');

                                return (
                                    <tr key={apt.id} className={`${rowClass} group hover:bg-slate-50 transition-colors`}>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center" title={apt.status}>
                                                {getStatusIcon(apt.status)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className={`font-mono font-bold text-base ${isCancelled ? 'text-slate-400 line-through' : (isExpired ? 'text-slate-500' : 'text-slate-800')}`}>
                                                {format(visitDate, 'yyyy/MM/dd (eee)', { locale: ja })}
                                            </div>
                                            <div className="text-xl font-bold">
                                                {format(visitDate, 'HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link href={`/patients/${apt.patientId}`} className="hover:underline flex flex-col">
                                                <span className={`font-bold text-base ${isCancelled ? 'text-slate-400 line-through' : (isExpired ? '' : 'text-indigo-900')}`}>
                                                    {apt.patientName}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {apt.patientKana}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {apt.staffName ? (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                                                    <User className="w-3 h-3" />
                                                    {apt.staffName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 ${textClass} max-w-xs`}>
                                            <div className="relative group/memo">
                                                <div className="line-clamp-3 text-sm leading-snug">
                                                    {apt.memo || <span className="text-slate-300 italic">なし</span>}
                                                </div>
                                                {apt.memo && apt.memo.length > 50 && (
                                                    <button
                                                        onClick={() => setViewingMemo({ patient: apt.patientName, memo: apt.memo || '' })}
                                                        className="absolute bottom-0 right-0 text-xs text-indigo-600 hover:text-indigo-800 bg-white px-1 rounded opacity-0 group-hover/memo:opacity-100 transition-opacity flex items-center gap-1"
                                                        title="全文を表示"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        全文
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2 text-right items-center">
                                                <Link
                                                    href={`/patients/${apt.patientId}#new-record`}
                                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1 font-bold no-underline mr-auto md:mr-0"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    カルテ作成
                                                </Link>
                                                <button
                                                    onClick={() => setEditingAppointment(apt)}
                                                    className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-500"
                                                    title="予約編集"
                                                >
                                                    <CalendarClock className="w-4 h-4" />
                                                </button>
                                                {!isCancelled && (
                                                    <button
                                                        onClick={() => handleDelete(apt.id)}
                                                        className="p-1.5 bg-white border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-slate-500"
                                                        title="キャンセル"
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
            </div >

            {editingAppointment && (
                <AppointmentEditModal
                    appointment={editingAppointment}
                    staffList={staffList}
                    isOpen={!!editingAppointment}
                    onClose={() => {
                        setEditingAppointment(null);
                        router.refresh(); // Refresh after edit
                    }}
                />
            )}

            {/* Memo View Dialog */}
            {viewingMemo && (
                <Dialog open={!!viewingMemo} onOpenChange={() => setViewingMemo(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                予約メモ - {viewingMemo.patient}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {viewingMemo.memo}
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div >
    );
}
