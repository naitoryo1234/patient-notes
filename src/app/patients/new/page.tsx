import { PatientFormConfig } from '@/config/forms';
import { addPatient } from '@/actions/patientActions';
import { PatientFormContainer } from '@/components/domain/PatientFormContainer';

export default function NewPatientPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">新規患者登録</h1>
                <p className="text-slate-500">基本情報を入力して電子カルテを作成します。</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <PatientFormContainer action={addPatient} />
            </div>
        </div>
    );
}
