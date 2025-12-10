'use client';

import { useState } from 'react';
import { ConfigForm } from '@/components/form/ConfigForm';
import { PatientFormConfig } from '@/config/forms';
import { Button } from '@/components/ui/button';
import { parseAiText } from '@/services/aiParser';

import { checkDuplicates } from '@/actions/patientActions';
import Link from 'next/link';

interface PatientFormContainerProps {
    action: (formData: FormData) => Promise<any>;
    initialValues?: Record<string, any>;
}

export function PatientFormContainer({ action, initialValues = {} }: PatientFormContainerProps) {
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [step, setStep] = useState<'input' | 'confirm'>('input'); // New: Step management
    const [aiText, setAiText] = useState('');
    const [formValues, setFormValues] = useState(initialValues);
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const handleParse = async () => {
        setIsChecking(true);
        const parsed = parseAiText(aiText);
        console.log('AI Parsed Result (Patient):', parsed);

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
            const results = await checkDuplicates(mergedValues.name || '', mergedValues.kana || '');
            setDuplicates(results);
        } else {
            setDuplicates([]);
        }

        setFormValues(mergedValues);
        setStep('confirm'); // Go to confirm step instead of pure manual mode immediately
        setIsChecking(false);
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
                <h2 className="text-xl font-bold text-slate-800">登録内容の確認</h2>

                {/* Duplicate Warning */}
                {duplicates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold">
                            <span>⚠️</span> 似ている患者が見つかりました
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">以下の患者は既に登録されています。同一人物の可能性があります。</p>
                        <ul className="space-y-2">
                            {duplicates.map((d: any) => (
                                <li key={d.id} className="bg-white border border-yellow-100 rounded p-2 text-sm flex justify-between items-center shadow-sm">
                                    <div>
                                        <span className="font-bold mr-2">{d.name}</span>
                                        <span className="text-xs text-slate-500">({d.kana})</span>
                                        <span className="ml-2 text-xs text-slate-400">ID: {d.pId}</span>
                                    </div>
                                    <Link
                                        href={`/patients/${d.id}`}
                                        target="_blank"
                                        className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-600"
                                    >
                                        詳細を開く ↗
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 text-xs text-yellow-600 font-medium text-right">
                            ※ 別人の場合は、そのまま新規登録を行ってください
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs text-slate-500 block">氏名</span><span className="font-semibold">{formValues.name || '-'}</span></div>
                        <div><span className="text-xs text-slate-500 block">ふりがな</span><span className="font-semibold">{formValues.kana || '-'}</span></div>
                        <div><span className="text-xs text-slate-500 block">生年月日</span><span className="font-semibold">{formValues.birthDate || '-'}</span></div>
                        <div><span className="text-xs text-slate-500 block">電話番号</span><span className="font-semibold">{formValues.phone || '-'}</span></div>
                        <div><span className="text-xs text-slate-500 block">性別</span><span className="font-semibold">{formValues.gender || '-'}</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                        <span className="text-xs text-slate-500 block">メモ</span>
                        <p className="text-sm whitespace-pre-wrap">{formValues.memo || '-'}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleBackToAi}>テキストに戻る</Button>
                    <Button onClick={handleConfirm} className="bg-blue-600 text-white">この内容でフォームを作成</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">新規患者登録</h2>
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
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 text-sm text-indigo-800">
                        <p className="font-bold mb-2">💡 患者データをテキストから取り込む</p>
                        <p className="mb-2">既存のカルテやExcelなどから、以下の形式でテキストを貼り付けると自動入力できます。</p>
                        <pre className="bg-white/50 p-2 rounded text-xs font-mono border border-indigo-100/50">
                            {`氏名: 山田 太郎
かな: やまだ たろう
生年月日: 1980-01-01
性別: 男性
電話: 090-1234-5678

[Memo]
持病あり。紹介で来院。`}
                        </pre>
                    </div>
                    <textarea
                        className="w-full h-64 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                        placeholder="ここにテキストを貼り付けてください..."
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
                <ConfigForm
                    key={JSON.stringify(formValues)}
                    config={PatientFormConfig}
                    action={action}
                    submitLabel="登録する"
                    initialValues={formValues}
                />
            )}
        </div>
    );
}
