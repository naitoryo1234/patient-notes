'use client';

import { ClinicalRecord } from '@prisma/client';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { deleteRecord } from '@/actions/recordActions';

interface RecordListProps {
    records: ClinicalRecord[];
}

export function RecordList({ records }: RecordListProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                <p>施術記録がまだありません</p>
            </div>
        );
    }

    const handleDelete = async (recordId: string, patientId: string) => {
        if (window.confirm('この記録を完全に削除してもよろしいですか？\n※この操作は取り消せません。')) {
            const result = await deleteRecord(recordId, patientId);
            if (!result.success) {
                alert('削除に失敗しました');
            }
        }
    };

    return (
        <div className="space-y-6">
            {records.map((record) => {
                const tags = JSON.parse(record.tags || '[]') as string[];

                return (
                    <div key={record.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden group">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-700">
                                    {format(new Date(record.visitDate), 'yyyy/MM/dd HH:mm')}
                                </span>
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                    {record.visitCount}回目
                                </span>
                                {tags.map((tag, i) => (
                                    <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div>
                                <button
                                    onClick={() => handleDelete(record.id, record.patientId)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="記録を削除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-red-400 block">S (Subjective)</span>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap min-h-[1.5rem]">{record.subjective}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-blue-400 block">O (Objective)</span>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap min-h-[1.5rem]">{record.objective}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-green-400 block">A (Assessment)</span>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap min-h-[1.5rem]">{record.assessment}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-purple-400 block">P (Plan)</span>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap min-h-[1.5rem]">{record.plan}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
