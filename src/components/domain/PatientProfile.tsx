'use client';

import { useState } from 'react';
import { Patient } from '@prisma/client';
import { format } from 'date-fns';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updatePatientMemo, updatePatientTags, deletePatient } from '@/actions/patientActions';
import { useRouter } from 'next/navigation';

interface PatientProfileProps {
    patient: Patient;
}

export function PatientProfile({ patient }: PatientProfileProps) {
    const router = useRouter();
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);

    // Initial State from Props
    const [memo, setMemo] = useState(patient.memo || '');
    const [tags, setTags] = useState<string[]>(JSON.parse(patient.tags || '[]'));
    const [tagInput, setTagInput] = useState('');

    const attributes = JSON.parse(patient.attributes || '{}') as Record<string, any>;

    // Memo Handlers
    const handleSaveMemo = async () => {
        await updatePatientMemo(patient.id, memo);
        setIsEditingMemo(false);
        router.refresh(); // Refresh to ensure server state is sync
    };

    const handleCancelMemo = () => {
        setMemo(patient.memo || '');
        setIsEditingMemo(false);
    };

    // Tag Handlers
    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
                setTagInput('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSaveTags = async () => {
        await updatePatientTags(patient.id, tags);
        setIsEditingTags(false);
        router.refresh();
    };

    const handleCancelTags = () => {
        setTags(JSON.parse(patient.tags || '[]'));
        setIsEditingTags(false);
    };

    const handleDelete = async () => {
        if (!confirm('本当にこの患者を削除しますか？\n※未来の予約は自動的にキャンセルされます。')) {
            return;
        }

        const result = await deletePatient(patient.id);
        if (result.success) {
            router.push('/');
        } else {
            alert('削除に失敗しました。');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4 group">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-mono">
                            No.{patient.pId}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                        <span className="text-slate-500 text-sm">({patient.kana})</span>
                    </div>
                    <div className="text-sm text-slate-600 space-x-3">
                        <span>{patient.gender || '-'}</span>
                        <span>{patient.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '-'}</span>
                        <span>{patient.phone || '-'}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Tags Section */}
            <div className="relative">
                {!isEditingTags ? (
                    <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
                        {tags.length > 0 ? (
                            tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400 italic">タグなし</span>
                        )}
                        <button
                            onClick={() => setIsEditingTags(true)}
                            className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-white border border-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                    #{tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            className="w-full text-sm border-slate-300 rounded-md py-1 px-2 focus:ring-2 focus:ring-indigo-500"
                            placeholder="タグを入力してEnter..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button size="sm" variant="ghost" onClick={handleCancelTags} className="h-7 text-xs">キャンセル</Button>
                            <Button size="sm" onClick={handleSaveTags} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">保存</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Memo Section */}
            <div className="relative">
                {!isEditingMemo ? (
                    <div className="bg-yellow-50/50 p-3 rounded text-sm text-slate-700 border border-yellow-100 relative group/memo">
                        <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-xs text-yellow-600">📌 メモ</p>
                            <button
                                onClick={() => setIsEditingMemo(true)}
                                className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover/memo:opacity-100 transition-opacity"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        </div>
                        <p className="whitespace-pre-wrap min-h-[1.5em]">{memo || <span className="text-slate-400 italic">メモを入力...</span>}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            placeholder="患者に関するメモを入力..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={handleCancelMemo} className="h-7 text-xs">キャンセル</Button>
                            <Button size="sm" onClick={handleSaveMemo} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">保存</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
