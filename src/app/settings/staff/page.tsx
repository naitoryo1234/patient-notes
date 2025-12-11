import { getAllStaff } from '@/services/staffService';
import { StaffManager } from '@/components/features/settings/StaffManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TERMS, LABELS } from '@/config/labels';

export default async function StaffSettingsPage() {
    const staffList = await getAllStaff();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">{LABELS.STAFF.TITLE}</h1>
            </div>

            <p className="text-slate-600 mb-8">
                {LABELS.STAFF.DESC(TERMS.RECORD, TERMS.APPOINTMENT)}
            </p>

            <StaffManager initialStaff={staffList} />
        </div>
    );
}
