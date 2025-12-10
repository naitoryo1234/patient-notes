import { getPatientById } from '@/services/patientService';
import { getRecordsByPatientId } from '@/services/recordService';
import { getActiveStaff } from '@/services/staffService';
import { getNextAppointment } from '@/services/appointmentService';
import { PatientProfile } from '@/components/domain/PatientProfile';
import { RecordList } from '@/components/domain/RecordList';
import { RecordFormContainer } from '@/components/domain/RecordFormContainer';
import { AppointmentButton } from '@/components/domain/AppointmentButton';
import { addRecord } from '@/actions/recordActions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PageProps {
    params: { id: string };
}

export default async function PatientDetailPage(props: PageProps) {
    const resolvedParams = await props.params;
    const id = resolvedParams.id;

    const patient = await getPatientById(id);
    if (!patient) {
        notFound();
    }

    const records = await getRecordsByPatientId(id);
    const staffList = await getActiveStaff();
    const nextAppt = await getNextAppointment(id);

    // Bind patientID to the server action
    const addRecordAction = addRecord.bind(null, id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & New Entry */}
            <div className="lg:col-span-1 space-y-6">
                <PatientProfile patient={patient} />

                {nextAppt && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                            <span>📅</span> 次回の予定
                        </h4>
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2 text-emerald-900 mb-1">
                                <span className="font-mono text-xl font-bold">
                                    {format(nextAppt.startAt, 'MM/dd (eee) HH:mm', { locale: ja })}
                                </span>
                            </div>
                            <div className="flex gap-2 items-center">
                                {nextAppt.staffName && (
                                    <span className="text-xs bg-white border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">
                                        担当: {nextAppt.staffName}
                                    </span>
                                )}
                            </div>
                        </div>
                        {nextAppt.memo && <div className="text-xs text-emerald-600 mt-2 border-t border-emerald-100 pt-1">{nextAppt.memo}</div>}
                    </div>
                )}

                <div className="flex gap-2">
                    <AppointmentButton patientId={id} staffList={staffList} />
                    <Link href={`/patients/${id}/edit`} className="bg-slate-100 text-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-200 flex items-center">
                        編集
                    </Link>
                </div>

                <RecordFormContainer
                    action={addRecordAction}
                    staffList={staffList}
                    initialValues={{
                        visitDate: new Date().toISOString().slice(0, 16)
                    }}
                />
            </div>

            {/* Right Column: Timeline */}
            <div className="lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">施術履歴 ({records.length})</h3>
                <RecordList records={records} />
            </div>
        </div>
    );
}
