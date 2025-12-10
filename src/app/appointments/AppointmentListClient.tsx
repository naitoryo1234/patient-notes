'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { format, isBefore, isToday, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cancelAppointmentAction } from '@/actions/appointmentActions';
import { AppointmentEditModal } from '@/components/dashboard/AppointmentEditModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Calendar, User, History } from 'lucide-react';

interface AppointmentListClientProps {
    initialAppointments: Appointment[];
    staffList: Staff[];
    includePast: boolean;
}

export function AppointmentListClient({ initialAppointments, staffList, includePast }: AppointmentListClientProps) {
    const router = useRouter();
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

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

    const statusMap: Record<string, string> = {
        'scheduled': '予定',
        'completed': '完了',
        'cancelled': '取消',
    };

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex gap-2">
                    <button
                        onClick={toggleHistory}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold border transition-colors ${includePast
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        過去の予約も含める
                    </button>
                </div>
                <div className="text-sm text-slate-500">
                    全 {initialAppointments.length} 件
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">日時</th>
                            <th className="px-4 py-3 whitespace-nowrap">患者名</th>
                            <th className="px-4 py-3 whitespace-nowrap">担当</th>
                            <th className="px-4 py-3 whitespace-nowrap w-1/3">メモ</th>
                            <th className="px-4 py-3 whitespace-nowrap text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialAppointments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    表示する予約はありません
                                </td>
                            </tr>
                        ) : (
                            initialAppointments.map((apt) => {
                                const visitDate = new Date(apt.visitDate);
                                const diff = differenceInMinutes(visitDate, new Date());
                                const isExpired = diff < -60; // 1 hour passed
                                const rowClass = isExpired ? 'bg-slate-50' : 'bg-white';
                                const textClass = isExpired ? 'text-slate-400' : 'text-slate-700';

                                return (
                                    <tr key={apt.id} className={`${rowClass} group hover:bg-indigo-50/30 transition-colors`}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className={`font-mono font-bold text-base ${isExpired ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {format(visitDate, 'yyyy/MM/dd (eee)', { locale: ja })}
                                            </div>
                                            <div className="text-xl font-bold">
                                                {format(visitDate, 'HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link href={`/patients/${apt.patientId}`} className="hover:underline flex flex-col">
                                                <span className={`font-bold text-base ${isExpired ? '' : 'text-indigo-900'}`}>
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
                                        <td className={`px-4 py-3 ${textClass}`}>
                                            {apt.memo || <span className="text-slate-300 italic">なし</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingAppointment(apt)}
                                                    className="p-2 bg-white border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                                                    title="編集"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(apt.id)}
                                                    className="p-2 bg-white border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                                    title="キャンセル"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

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
        </div>
    );
}
