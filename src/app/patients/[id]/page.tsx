import { getPatientById } from '@/services/patientService';
import { getRecordsByPatientId } from '@/services/recordService';
import { PatientProfile } from '@/components/domain/PatientProfile';
import { RecordList } from '@/components/domain/RecordList';
import { ConfigForm } from '@/components/form/ConfigForm';
import { RecordFormConfig } from '@/config/forms';
import { addRecord } from '@/actions/recordActions';
import { notFound } from 'next/navigation';

interface PageProps {
    params: { id: string };
}

export default async function PatientDetailPage(props: PageProps) {
    const resolvedParams = await props.params; // Await params in Next.js 15+ (if using 15, but 16 is installed, usually params is promise-like or async access suggested)
    // Actually Next 15 changes params to be a promise. The user installed Next 16.0.8, let's treat it as promise to be safe or check docs.
    // Standard way in latest canary: params is a promise.

    const id = resolvedParams.id;

    const patient = await getPatientById(id);
    if (!patient) {
        notFound();
    }

    const records = await getRecordsByPatientId(id);

    // Bind patientID to the server action
    const addRecordAction = addRecord.bind(null, id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & New Entry */}
            <div className="lg:col-span-1 space-y-6">
                <PatientProfile patient={patient} />

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📝</span> 新しい記録
                    </h3>
                    <ConfigForm
                        config={RecordFormConfig}
                        action={addRecordAction}
                        submitLabel="記録を保存"
                        initialValues={{
                            visitDate: new Date().toISOString().slice(0, 16) // "YYYY-MM-DDTHH:mm" for datetime-local
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Timeline */}
            <div className="lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">施術履歴 ({records.length})</h3>
                <RecordList records={records} />
            </div>
        </div>
    );
}
