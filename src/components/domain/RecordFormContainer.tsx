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
import { useToast } from '@/components/ui/Toast';
import { AiUsageGuide } from '@/components/guide/AiUsageGuide';

interface ActionResult {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

interface LastRecordData {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
}

interface RecordFormContainerProps {
    action: (formData: FormData) => Promise<ActionResult>;
    initialValues?: Record<string, string | number | undefined>;
    staffList: Staff[];
    lastRecord?: LastRecordData;
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
    const { showToast } = useToast();

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

        const validationErrors: Record<string, string[]> = {};

        // Staff validation (required)
        if (staffList.length > 0 && !staffId) {
            validationErrors.staffId = ['担当者を選択してください'];
        }

        // SOAP content validation
        if (!subjective && !objective && !assessment && !plan) {
            validationErrors.subjective = [`${TERMS.RECORD}の内容が空です。S/O/A/Pのいずれかを入力してください。`];
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return { success: false, errors: validationErrors };
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
                    showToast(result.message || 'エラーが発生しました', 'error');
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
            showToast('送信中にエラーが発生しました', 'error');
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
        if (!lastRecord) return;
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
                                value={String(formValues.tags || '')}
                                onChange={(val) => setFormValues({ ...formValues, tags: val })}
                                placeholder="例: 腰痛, 初診"
                                suggestions={RecordFormConfig.find(f => f.name === 'tags')?.options as string[]}
                            />
                        </div>
                    </div>

                    {/* Validation hint */}
                    {!formValues.subjective && !formValues.objective && !formValues.assessment && !formValues.plan && (
                        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200 flex items-center gap-2">
                            <span>⚠️</span> S/O/A/Pのいずれかを入力してください
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-red-400 block">S (Subjective)</label>
                            <textarea
                                value={formValues.subjective || ''}
                                onChange={(e) => setFormValues({ ...formValues, subjective: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px] ${formValues.subjective ? 'border-green-300' : 'border-slate-300'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-blue-400 block">O (Objective)</label>
                            <textarea
                                value={formValues.objective || ''}
                                onChange={(e) => setFormValues({ ...formValues, objective: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px] ${formValues.objective ? 'border-green-300' : 'border-slate-300'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-green-400 block">A (Assessment)</label>
                            <textarea
                                value={formValues.assessment || ''}
                                onChange={(e) => setFormValues({ ...formValues, assessment: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px] ${formValues.assessment ? 'border-green-300' : 'border-slate-300'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-purple-400 block">P (Plan)</label>
                            <textarea
                                value={formValues.plan || ''}
                                onChange={(e) => setFormValues({ ...formValues, plan: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[60px] ${formValues.plan ? 'border-green-300' : 'border-slate-300'}`}
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
                    {/* Compact AI Guide with link to detailed modal */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">✨</div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-indigo-900">AIを使って簡単入力</h4>
                                    <AiUsageGuide />
                                </div>
                                <div className="bg-white/80 border border-indigo-200 rounded-md p-3 text-xs font-mono text-slate-700 relative">
                                    <pre className="whitespace-pre-wrap pr-16">{`以下のメモをSOAP形式に整理してください。
S: 主訴, O: 所見, A: 施術, P: 計画
出力は「S: 〜」の形式で、余計な説明は不要。
---
（メモを追記）`}</pre>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const prompt = `以下のメモをSOAP形式に整理してください。
- S: 主訴（患者の訴え）
- O: 所見（客観的な観察）
- A: 施術内容
- P: 計画（次回への申し送り）

出力は「S: 〜」「O: 〜」の形式で、余計な説明は不要です。

---
`;
                                            navigator.clipboard.writeText(prompt);
                                            showToast('プロンプトをコピーしました', 'success');
                                        }}
                                        className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded shadow-sm transition-colors flex items-center gap-1"
                                    >
                                        <span>📋</span> コピー
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Textarea for AI output */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">AIの返答を貼り付け</label>
                        <textarea
                            className="w-full h-40 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                            placeholder={`AIの返答をここに貼り付けてください\n\n例:\nS: 腰が痛い、仕事中に悪化\nO: 腰部に圧痛あり、可動域制限\nA: 鍼治療（腰部）、マッサージ\nP: 1週間後に経過観察`}
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleInsertTemplate}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                            手動でテンプレートを挿入
                        </button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setMode('manual')}>キャンセル</Button>
                            <Button onClick={handleParse} disabled={!aiText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                解析して確認
                            </Button>
                        </div>
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
