import { getPatientById } from '@/services/patientService';
import { notFound } from 'next/navigation';
import { ConfigForm } from '@/components/form/ConfigForm';
import { PatientFormConfig } from '@/config/forms';
import { updatePatient } from '@/actions/patientActions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function EditPatientPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const patient = await getPatientById(id);

    if (!patient) {
        notFound();
    }

    // Prepare initial values
    const initialValues = {
        name: patient.name,
        kana: patient.kana,
        phone: patient.phone || '',
        gender: patient.gender || '',
        birthDate: patient.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '',
        memo: patient.memo || '',
        tags: patient.tags ? JSON.parse(patient.tags).join(', ') : ''
    };

    // Inject ID into config
    const formConfig = [
        { name: 'id', label: '', type: 'hidden' },
        ...PatientFormConfig
    ];

    // Initial values includes ID
    const formInitialValues = {
        ...initialValues,
        id: id
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">基本情報の変更</h1>
                    <p className="text-slate-500">患者情報を修正します</p>
                </div>
                <Link href={`/patients/${id}`}>
                    <Button variant="outline">キャンセル</Button>
                </Link>
            </div>

            <ConfigForm
                config={formConfig}
                action={updatePatient}
                initialValues={formInitialValues}
                submitLabel="変更を保存"
            />
        </div>
    );
}
