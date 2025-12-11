'use client';

import { useState } from 'react';
import { ConfigForm } from '@/components/form/ConfigForm';
import { RecordFormConfig } from '@/config/forms';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/form/TagInput';
import { parseAiText } from '@/services/aiParser';
import { format } from 'date-fns';
import { Staff } from '@/services/staffService';
import { FormFieldConfig } from '@/components/form/ConfigForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TERMS } from '@/config/labels';

interface RecordFormContainerProps {
    action: (formData: FormData) => Promise<any>;
    initialValues?: Record<string, any>;
    staffList: Staff[];
    lastRecord?: any; // ClinicalRecord type but simple any to avoid import issues for now or use the Type
}

export function RecordFormContainer({ action, initialValues = {}, staffList, lastRecord }: RecordFormContainerProps) {
    // Dynamic Config Construction
    const formConfig: FormFieldConfig[] = [...RecordFormConfig];

    // Add Staff Select if staff exists
    if (staffList.length > 0) {
        formConfig.unshift({
            name: 'staffId',
            label: '担当者',
            type: 'select',
            required: false,
            options: staffList.map(s => ({
                label: s.name,
                value: s.id
            }))
        });
    }
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [step, setStep] = useState<'input' | 'confirm'>('input');
    const [aiText, setAiText] = useState('');
    const [formValues, setFormValues] = useState(initialValues);
    const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
    const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Process Input from ConfigForm or AI Parser
    const processInput = async (formData: FormData) => {
        setErrors(null);
        // Extract values from FormData
        const visitDate = formData.get('visitDate') as string;
        const staffId = formData.get('staffId') as string;
        const tags = formData.get('tags') as string;
        const subjective = (formData.get('subjective') as string)?.trim() || '';
        const objective = (formData.get('objective') as string)?.trim() || '';
        const assessment = (formData.get('assessment') as string)?.trim() || '';
        const plan = (formData.get('plan') as string)?.trim() || '';

        // Validation
        if (!subjective && !objective && !assessment && !plan) {
            const errorMsg = [`${TERMS.RECORD}の内容が空です。S/O/A/Pのいずれかを入力してください。`];
            setErrors({ subjective: errorMsg });
            return { success: false, errors: { subjective: errorMsg } };
        }

        // Update state for preview
        setFormValues(prev => ({
            ...prev,
            visitDate,
            staffId,
            tags,
            subjective,
            objective,
            assessment,
            plan
        }));

        setStep('confirm');
        return { success: true };
    };

    // 2. Final Submit State
    const handleFinalSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Reconstruct FormData from state
            const formData = new FormData();
            Object.entries(formValues).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value as string);
                }
            });

            const result = await action(formData);

            if (result && !result.success) {
                if (result.errors) {
                    setErrors(result.errors);
                    setStep('input'); // Back to input on error
                } else {
                    alert(result.message || 'エラーが発生しました');
                }
            } else {
                // Success
                // Clear SOAP fields but keep Date/Staff/Tags for smooth workflow
                setFormValues(prev => ({
                    ...prev,
                    subjective: '',
                    objective: '',
                    assessment: '',
                    plan: '',
                    // Keep visitDate, tags, staffId as is
                }));
                // Reset AI text if used
                setAiText('');
                setStep('input');
                // Optional: Show success toast (handled by Server Action revalidate usually, but maybe alert?)
            }
        } catch (error) {
            console.error(error);
            alert('送信中にエラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleParse = () => {
        const parsed = parseAiText(aiText);
        console.log('AI Parsed Result:', parsed); // Debug Log

        // Merge parsed data into form values
        setFormValues(prev => ({
            ...prev,
            ...parsed,
            // If date is found in text, use it, otherwise keep default or today
            visitDate: parsed.visitDate ? parsed.visitDate + 'T10:00' : (prev.visitDate || new Date().toISOString().slice(0, 16)),
            tags: parsed.tags.join(', '), // Convert array back to comma string for input
            // rawText is not in the form config yet, but good to keep in mind
        }));

        // Switch to confirm step to let user verify
        setStep('confirm');
    };

    const handleBackToInput = () => {
        setStep('input');
    };

    const handleCopyLastRecord = () => {
        if (!lastRecord) return;

        // Check if form has existing content
        const hasContent = formValues.subjective || formValues.objective || formValues.assessment || formValues.plan;

        if (hasContent) {
            setCopyConfirmOpen(true);
        } else {
            executeCopy();
        }
    };

    const executeCopy = () => {
        setFormValues(prev => ({
            ...prev,
            subjective: lastRecord.subjective || '',
            objective: lastRecord.objective || '',
            assessment: lastRecord.assessment || '',
            plan: lastRecord.plan || '',
        }));
    };

    const handleInsertTemplate = () => {
        const today = new Date().toISOString().slice(0, 10);
        setAiText(`来院日: ${today}
タグ: 

S: 
O: 
A: 
P: `);
    };

    // Render Logic
    if (step === 'confirm') {
        const isAiMode = mode === 'ai';
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">登録内容の確認</h2>
                    <span className="text-xs text-slate-500">※以下の内容で保存します</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold block">来院日時</label>
                            <input
                                type="datetime-local"
                                value={formValues.visitDate || ''}
                                onChange={(e) => setFormValues({ ...formValues, visitDate: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                        {staffList.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold block">{TERMS.STAFF}</label>
                                <select
                                    value={formValues.staffId || ''}
                                    onChange={(e) => setFormValues({ ...formValues, staffId: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">選択なし</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs text-slate-500 font-bold block">タグ</label>
                            <TagInput
                                value={formValues.tags || ''}
                                onChange={(val) => setFormValues({ ...formValues, tags: val })}
                                placeholder="例: 腰痛, 初診"
                                suggestions={RecordFormConfig.find(f => f.name === 'tags')?.options as string[]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-red-400 block">S (Subjective)</label>
                            <textarea
                                value={formValues.subjective || ''}
                                onChange={(e) => setFormValues({ ...formValues, subjective: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-blue-400 block">O (Objective)</label>
                            <textarea
                                value={formValues.objective || ''}
                                onChange={(e) => setFormValues({ ...formValues, objective: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-green-400 block">A (Assessment)</label>
                            <textarea
                                value={formValues.assessment || ''}
                                onChange={(e) => setFormValues({ ...formValues, assessment: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-purple-400 block">P (Plan)</label>
                            <textarea
                                value={formValues.plan || ''}
                                onChange={(e) => setFormValues({ ...formValues, plan: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleBackToInput} disabled={isSubmitting}>
                        {isAiMode ? 'テキストに戻る' : '入力に戻る'}
                    </Button>
                    <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                        {isSubmitting ? '保存中...' : '確定して保存'}
                    </Button>
                </div>
            </div>
        );
    }


    // Use window.location hash to detect if we should focus the form
    // Note: In Next.js App Router we might use simpler CSS scroll-margin with the Link anchor
    // But we want to ensure focus or visual highlight if possible.
    // For now, let's just make sure the container has an ID.

    return (
        <div id="new-record" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 shrink-0">
                    <span>📝</span> 新しい{TERMS.RECORD}
                </h3>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${mode === 'manual' ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            通常入力
                        </button>
                        <button
                            onClick={() => setMode('ai')}
                            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1 whitespace-nowrap ${mode === 'ai' ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span>✨</span> AI取込 (Beta)
                        </button>
                    </div>

                    {/* Copy Button */}
                    {lastRecord && mode === 'manual' && (
                        <button
                            onClick={handleCopyLastRecord}
                            className="w-full sm:w-auto text-xs text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                            title={`前回のS/O/A/Pをコピーします`}
                        >
                            📋 <span className="md:hidden">前回コピー</span><span className="hidden md:inline">前回の{TERMS.RECORD}をコピー</span>
                        </button>
                    )}
                </div>
            </div>

            {mode === 'ai' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 text-xs text-indigo-800 flex justify-between items-start">
                        <div>
                            <p className="font-bold mb-1">💡 AI出力テキストを貼り付けてください</p>
                            <p>Geminiなどで作成した「S: 〜 O: 〜」形式のテキストを解析し、下のフォームに自動入力します。</p>
                        </div>
                        <button
                            onClick={handleInsertTemplate}
                            className="bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap ml-2 shadow-sm"
                        >
                            テンプレートを挿入
                        </button>
                    </div>
                    <textarea
                        className="w-full h-48 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                        placeholder={`(例)\n来院日: 2024-12-10\nS: 腰が痛い\nO: 圧痛あり\nA: 鍼治療\nP: 経過観察`}
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setMode('manual')}>キャンセル</Button>
                        <Button onClick={handleParse} disabled={!aiText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            解析して確認
                        </Button>
                    </div>
                </div>
            ) : (
                /* Manual Form (ConfigForm) */
                <div className="space-y-4">
                    {errors && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm mb-4 animate-in slide-in-from-top-1">
                            <p className="font-bold flex items-center gap-2">
                                <span>⚠️</span> 入力エラー
                            </p>
                            <ul className="list-disc list-inside mt-1 ml-1">
                                {Object.entries(errors).map(([key, msgs]) => (
                                    msgs.map((msg, i) => <li key={`${key}-${i}`}>{msg}</li>)
                                ))}
                            </ul>
                        </div>
                    )}
                    <ConfigForm
                        key={JSON.stringify(formValues)}
                        config={formConfig}
                        action={processInput}
                        submitLabel="確認画面へ"
                        initialValues={formValues}
                    />
                </div>
            )}

            <ConfirmDialog
                open={copyConfirmOpen}
                onOpenChange={setCopyConfirmOpen}
                title="現在の入力内容を上書きしますか？"
                description={`前回の${TERMS.RECORD}をコピーすると、現在入力中のS/O/A/Pの内容が上書きされます。`}
                confirmLabel="コピーする"
                variant="warning"
                onConfirm={executeCopy}
            />
        </div>
    );
}
