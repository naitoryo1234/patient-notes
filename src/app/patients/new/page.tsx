import { PatientFormConfig } from '@/config/forms';
import { addPatient } from '@/actions/patientActions';
import { PatientFormContainer } from '@/components/domain/PatientFormContainer';
import { TERMS } from '@/config/labels';

export default function NewPatientPage() {
    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6 pb-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">新規{TERMS.PATIENT}登録</h1>
                    <p className="text-slate-500">基本情報を入力して{TERMS.RECORD}を作成します。</p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <PatientFormContainer action={addPatient} />
                </div>
            </div>
        </div>
    );
}
