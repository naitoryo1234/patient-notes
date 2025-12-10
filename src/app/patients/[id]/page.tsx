import { getPatientById } from '@/services/patientService';
import { getRecordsByPatientId } from '@/services/recordService';
import { getActiveStaff } from '@/services/staffService';
import { getNextAppointment, getTodaysAppointmentForPatient } from '@/services/appointmentService';
import { PatientDetailSidebar } from '@/components/domain/PatientDetailSidebar';
import { RecordList } from '@/components/domain/RecordList';
import { RecordFormContainer } from '@/components/domain/RecordFormContainer';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
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
    const todaysAppt = await getTodaysAppointmentForPatient(id);

    // Initial visit date logic:
    // If there is an appointment TODAY, use its start time as default.
    // Otherwise use current time.
    // We adjust to local time offset manually for simple ISO string usage if needed, 
    // but here we just ensure we have a valid Date object to format.
    // Note: initialValues expects "YYYY-MM-DDTHH:mm" format string in local time usually for datetime-local input,
    // but the component might be handling offset. 
    // Standard <input type="datetime-local"> expects local ISO string without Z.
    // We'll generate it carefully.

    const getLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const initialVisitDate = todaysAppt
        ? getLocalISOString(todaysAppt.startAt)
        : getLocalISOString(new Date());

    // Bind patientID to the server action
    const addRecordAction = addRecord.bind(null, id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & Navigation */}
            <div className="lg:col-span-1">
                <PatientDetailSidebar patient={patient} nextAppt={nextAppt} staffList={staffList} />
                <div className="mt-4">
                    <Link href={`/patients/${id}/history`} className="block w-full text-center py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-bold group">
                        <History className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        過去の履歴を見る ({records.length})
                    </Link>
                </div>
            </div>

            {/* Right Column: New Entry Form Only */}
            <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>✏️</span> 新しい記録
                </h2>
                <RecordFormContainer
                    action={addRecordAction}
                    staffList={staffList}
                    initialValues={{
                        visitDate: initialVisitDate,
                        staffId: todaysAppt?.staffId || undefined
                    }}
                />

                {/* Show only the latest record for context if exists */}
                {records.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 pt-6 opacity-80 hover:opacity-100 transition-opacity">
                        <h3 className="text-sm font-bold text-slate-400 mb-4">前回の記録 (参照用)</h3>
                        <RecordList records={[records[0]]} />
                        {records.length > 1 && (
                            <div className="text-center mt-2">
                                <Link href={`/patients/${id}/history`} className="text-xs text-indigo-600 hover:underline">
                                    ...他 {records.length - 1} 件の履歴を表示
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
