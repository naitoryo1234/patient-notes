'use client';

import { useState } from 'react';
import { ConfigForm } from '@/components/form/ConfigForm';
import { PatientFormConfig } from '@/config/forms';
import { Button } from '@/components/ui/button';
import { parseAiText } from '@/services/aiParser';
import { AiUsageGuidePatient } from '@/components/guide/AiUsageGuidePatient';

import { checkDuplicates } from '@/actions/patientActions';
import Link from 'next/link';
import { TERMS, LABELS } from '@/config/labels';

interface PatientFormContainerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: (formData: FormData) => Promise<any>;
    initialValues?: Record<string, unknown>;
}

export function PatientFormContainer({ action, initialValues = {} }: PatientFormContainerProps) {
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [step, setStep] = useState<'input' | 'confirm'>('input'); // New: Step management
    const [aiText, setAiText] = useState('');
    const [formValues, setFormValues] = useState<Record<string, unknown>>(initialValues);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const handleParse = async () => {
        const parsed = parseAiText(aiText);
        // console.log('AI Parsed Result (Patient):', parsed);

        // Merge parsed data into form state
        // Note: ConfigForm uses "name", "kana", "birthDate" etc matching the ParsedRecord keys.
        const mergedValues = {
            ...formValues,
            ...parsed,
            // Handle array to string conversion for tags if ConfigForm expects string input for tags
            // Assuming 'tags' field is a text input in PatientFormConfig
            tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
        };

        // Check duplicates
        if (mergedValues.name || mergedValues.kana) {
            const results = await checkDuplicates((mergedValues.name as string) || '', (mergedValues.kana as string) || '');
            setDuplicates(results);
        } else {
            setDuplicates([]);
        }

        setFormValues(mergedValues);
        setStep('confirm'); // Go to confirm step instead of pure manual mode immediately
    };

    const handleConfirm = () => {
        setStep('input');
        setMode('manual');
        setDuplicates([]);
    };

    const handleBackToAi = () => {
        setStep('input');
        // Keep mode 'ai' and text to let user edit text
        setDuplicates([]);
    };

    // Render Logic
    if (step === 'confirm' && mode === 'ai') {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">新規{TERMS.PATIENT}登録</h2>
                    <span className="text-xs text-slate-500">※内容を直接修正できます</span>
                </div>

                {/* Duplicate Warning */}
                {duplicates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold">
                            <span>⚠️</span> {LABELS.VALIDATION.DUPLICATE_TITLE}
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">{LABELS.VALIDATION.DUPLICATE_DESC}</p>
                        <ul className="space-y-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {duplicates.map((d: any) => (
                                <li key={d.id} className="bg-white border border-yellow-100 rounded-md p-3 text-sm flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col">
                                        <div className="flex items-center">
                                            <span className="font-bold mr-2 text-slate-800">{d.name}</span>
                                            <span className="text-xs text-slate-500">({d.kana})</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">ID: {d.pId}</div>
                                    </div>
                                    <Link
                                        href={`/patients/${d.id}`}
                                        className="h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                                    >
                                        この{TERMS.PATIENT}の{TERMS.RECORD}へ →
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs text-yellow-600 font-medium">{LABELS.VALIDATION.DUPLICATE_IGNORE}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDuplicates([])}
                                className="text-xs text-slate-600 hover:text-slate-800"
                            >
                                {LABELS.VALIDATION.NOT_THIS_PERSON}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.NAME} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={(formValues.name as string) || ''}
                                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white ${formValues.name ? 'border-green-300' : 'border-red-300 border-2'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.KANA} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={(formValues.kana as string) || ''}
                                onChange={(e) => setFormValues({ ...formValues, kana: e.target.value })}
                                className={`w-full text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white ${formValues.kana ? 'border-green-300' : 'border-red-300 border-2'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.BIRTHDATE}</label>
                            <input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={(formValues.birthDate as string) || ''}
                                onChange={(e) => setFormValues({ ...formValues, birthDate: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.PHONE}</label>
                            <input
                                type="text"
                                value={(formValues.phone as string) || ''}
                                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.GENDER}</label>
                            <select
                                value={(formValues.gender as string) || ''}
                                onChange={(e) => setFormValues({ ...formValues, gender: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">{LABELS.PATIENT_FORM.GENDER_OPTIONS.SELECT}</option>
                                <option value={LABELS.PATIENT_FORM.GENDER_OPTIONS.MALE}>{LABELS.PATIENT_FORM.GENDER_OPTIONS.MALE}</option>
                                <option value={LABELS.PATIENT_FORM.GENDER_OPTIONS.FEMALE}>{LABELS.PATIENT_FORM.GENDER_OPTIONS.FEMALE}</option>
                                <option value={LABELS.PATIENT_FORM.GENDER_OPTIONS.OTHER}>{LABELS.PATIENT_FORM.GENDER_OPTIONS.OTHER}</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                        <label className="text-xs text-slate-500 font-bold">{LABELS.PATIENT_FORM.MEMO}</label>
                        <textarea
                            value={(formValues.memo as string) || ''}
                            onChange={(e) => setFormValues({ ...formValues, memo: e.target.value })}
                            className="w-full text-sm border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white min-h-[80px]"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleBackToAi}>{LABELS.PATIENT_FORM.BACK_TO_TEXT}</Button>
                    <Button onClick={handleConfirm} className="bg-blue-600 text-white">{LABELS.PATIENT_FORM.CONFIRM_CREATE_MODE}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">新規{TERMS.PATIENT}登録</h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setMode('manual')}
                        className={`text-xs px-3 py-1.5 rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {LABELS.PATIENT_FORM.MANUAL_MODE}
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={`text-xs px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${mode === 'ai' ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span>✨</span> {LABELS.PATIENT_FORM.AI_MODE_BTN}
                    </button>
                </div>
            </div>

            {mode === 'ai' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 text-sm text-indigo-800">
                        <p className="font-bold mb-2">💡 {LABELS.AI_MODE.TITLE}</p>
                        <p className="mb-2">{LABELS.AI_MODE.DESC}</p>
                        <pre className="bg-white/50 p-2 rounded text-xs font-mono border border-indigo-100/50">
                            {`氏名: 山田 太郎
かな: やまだ たろう
生年月日: 1980-01-01
性別: 男性
電話: 090-1234-5678

[Memo]
友人の紹介で来店。`}
                        </pre>
                        <div className="mt-2 flex justify-end">
                            <AiUsageGuidePatient />
                        </div>
                    </div>
                    <textarea
                        className="w-full h-64 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                        placeholder={LABELS.AI_MODE.PLACEHOLDER}
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setMode('manual')}>{LABELS.DIALOG.DEFAULT_CANCEL}</Button>
                        <Button onClick={handleParse} disabled={!aiText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {LABELS.AI_MODE.ANALYZE_BUTTON}
                        </Button>
                    </div>
                </div>
            ) : (
                <ConfigForm
                    key={JSON.stringify(formValues)}
                    config={PatientFormConfig}
                    action={action}
                    submitLabel={LABELS.PATIENT_FORM.SUBMIT}
                    initialValues={formValues}
                />
            )
            }
        </div >
    );
}
