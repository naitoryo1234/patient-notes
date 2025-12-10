import { getPatientById } from '@/services/patientService';
import { getRecordsByPatientId } from '@/services/recordService';
import { getActiveStaff } from '@/services/staffService';
import { getNextAppointment } from '@/services/appointmentService';
import { PatientDetailSidebar } from '@/components/domain/PatientDetailSidebar';
import { RecordList } from '@/components/domain/RecordList';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
    params: { id: string };
}

export default async function PatientHistoryPage(props: PageProps) {
    const resolvedParams = await props.params;
    const id = resolvedParams.id;

    const patient = await getPatientById(id);
    if (!patient) notFound();

    const records = await getRecordsByPatientId(id);
    const staffList = await getActiveStaff();
    const nextAppt = await getNextAppointment(id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="mb-4">
                    <Link href={`/patients/${id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        カルテ入力へ戻る
                    </Link>
                </div>
                <PatientDetailSidebar patient={patient} nextAppt={nextAppt} staffList={staffList} />
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-slate-800">施術履歴一覧</h2>
                    <span className="text-slate-500 text-sm">{records.length}件</span>
                </div>
                {records.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        記録はまだありません
                    </div>
                ) : (
                    <RecordList records={records} />
                )}
            </div>
        </div>
    );
}
