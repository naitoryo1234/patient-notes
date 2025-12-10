import { Patient } from '@prisma/client';
import { format } from 'date-fns';

interface PatientProfileProps {
    patient: Patient;
}

export function PatientProfile({ patient }: PatientProfileProps) {
    const tags = JSON.parse(patient.tags || '[]') as string[];
    const attributes = JSON.parse(patient.attributes || '{}') as Record<string, any>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
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
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {patient.memo && (
                <div className="bg-yellow-50/50 p-3 rounded text-sm text-slate-700 border border-yellow-100">
                    <p className="font-semibold text-xs text-yellow-600 mb-1">📌 メモ</p>
                    <p className="whitespace-pre-wrap">{patient.memo}</p>
                </div>
            )}
        </div>
    );
}
