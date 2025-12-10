'use client';

import { useState } from 'react';
import { ConfigForm } from '@/components/form/ConfigForm';
import { RecordFormConfig } from '@/config/forms';
import { Button } from '@/components/ui/button';
import { parseAiText } from '@/services/aiParser';
import { format } from 'date-fns';
import { Staff } from '@/services/staffService';
import { FormFieldConfig } from '@/components/form/ConfigForm';

interface RecordFormContainerProps {
    action: (formData: FormData) => Promise<any>;
    initialValues?: Record<string, any>;
    staffList: Staff[];
}

export function RecordFormContainer({ action, initialValues = {}, staffList }: RecordFormContainerProps) {
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
    const [aiText, setAiText] = useState('');
    const [formValues, setFormValues] = useState(initialValues);

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

        // Switch back to manual mode to let user verify
        setMode('manual');
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span>📝</span> 新しい記録
                </h3>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setMode('manual')}
                        className={`text-xs px-3 py-1.5 rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        通常入力
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={`text-xs px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${mode === 'ai' ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span>✨</span> AI取込 (Beta)
                    </button>
                </div>
            </div>

            {mode === 'ai' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 text-xs text-indigo-800">
                        <p className="font-bold mb-1">💡 AI出力テキストを貼り付けてください</p>
                        <p>Geminiなどで作成した「S: 〜 O: 〜」形式のテキストを解析し、下のフォームに自動入力します。</p>
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
                            解析してフォームに入力
                        </Button>
                    </div>
                </div>
            ) : (
                /* Manual Form (ConfigForm) */
                /* Key helps reset form when switching modes or values change significantly */
                <ConfigForm
                    key={JSON.stringify(formValues)}
                    config={formConfig}
                    action={action}
                    submitLabel="記録を保存"
                    initialValues={formValues}
                />
            )}
        </div>
    );
}
