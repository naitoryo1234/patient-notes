'use client';

import { useState } from 'react';
import { Patient } from '@prisma/client';
import { format } from 'date-fns';
import Link from 'next/link';
import { Pencil, Check, X, Trash2, UserCog } from 'lucide-react';
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

    // Tag Colors Definition
    const TAG_COLORS: Record<string, string> = {
        '重要': 'bg-red-50 text-red-700 border-red-100',
        '注意': 'bg-red-50 text-red-700 border-red-100',
        '禁忌': 'bg-red-50 text-red-700 border-red-100',
        'アレルギー': 'bg-red-50 text-red-700 border-red-100',
        'VIP': 'bg-amber-50 text-amber-700 border-amber-100',
        '紹介': 'bg-amber-50 text-amber-700 border-amber-100',
    };

    const getTagStyle = (tag: string) => {
        return TAG_COLORS[tag] || 'bg-blue-50 text-blue-700 border-blue-100';
    };

    // Memo Logic
    const [isMemoExpanded, setIsMemoExpanded] = useState(false);
    const shouldClampMemo = memo.length > 100 || memo.split('\n').length > 3;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4 group relative">
            {/* ... (Header & Buttons remain same) ... */}
            <div className="pr-12 md:pr-20"> {/* Right padding to avoid overlap with buttons */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-mono shrink-0">
                        No.{patient.pId}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 break-words">{patient.name}</h2>
                    <span className="text-slate-500 text-sm whitespace-normal md:whitespace-nowrap">({patient.kana})</span>
                </div>
                <div className="text-sm text-slate-600 space-x-3">
                    <span>{patient.gender || '-'}</span>
                    <span>{patient.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '-'}</span>
                    <span>{patient.phone || '-'}</span>
                </div>
            </div>

            {/* Action Buttons - Absolute Positioned */}
            <div className="absolute top-4 right-4 flex gap-1">
                <Link href={`/patients/${patient.id}/edit`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-indigo-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-sm transition-all"
                        title="基本情報を変更"
                    >
                        <UserCog className="w-4 h-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-8 w-8 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm transition-all ml-1"
                    title="患者を削除"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Tags Section */}
            <div className="relative">
                {!isEditingTags ? (
                    <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
                        {tags.length > 0 ? (
                            tags.map((tag, i) => (
                                <span key={i} className={`px-2 py-1 text-xs rounded-full border ${getTagStyle(tag)}`}>
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400 italic">タグなし</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditingTags(true)}
                            className="h-6 w-6 ml-1 text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-200 shadow-sm"
                            title="タグを編集"
                        >
                            <Pencil className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, i) => (
                                <span key={i} className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${getTagStyle(tag)} bg-white`} >
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
                    <div className="bg-yellow-50/50 p-3 rounded text-sm text-slate-700 border border-yellow-100 relative group/memo transition-all">
                        <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-xs text-yellow-600 flex items-center gap-2">
                                📌 メモ
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditingMemo(true)}
                                    className="h-6 w-6 text-slate-500 hover:text-indigo-600 bg-white/50 hover:bg-white border border-yellow-200/50 hover:border-indigo-200 shadow-sm transition-all"
                                    title="メモを編集"
                                >
                                    <Pencil className="w-3 h-3" />
                                </Button>
                            </p>
                        </div>
                        <div className={`relative ${!isMemoExpanded && shouldClampMemo ? 'max-h-[4.5em] overflow-hidden' : ''}`}>
                            <p className="whitespace-pre-wrap min-h-[1.5em]">{memo || <span className="text-slate-400 italic">メモを入力...</span>}</p>
                            {!isMemoExpanded && shouldClampMemo && (
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-yellow-50/90 to-transparent pointer-events-none" />
                            )}
                        </div>
                        {!isEditingMemo && shouldClampMemo && (
                            <button
                                onClick={() => setIsMemoExpanded(!isMemoExpanded)}
                                className="text-xs text-yellow-600/70 hover:text-yellow-700 font-bold mt-1 w-full text-center hover:bg-yellow-100/50 rounded py-0.5 transition-colors"
                            >
                                {isMemoExpanded ? '閉じる' : 'もっと見る'}
                            </button>
                        )}
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
