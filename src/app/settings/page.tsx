import { getAllStaff } from '@/services/staffService';
import { SettingsContainer } from '@/components/features/settings/SettingsContainer';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { LABELS } from '@/config/labels';

export const metadata = {
    title: '設定 | Customer Notebook',
};

export default async function SettingsPage() {
    const staffList = await getAllStaff();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Settings className="w-6 h-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-900">{LABELS.SETTINGS.SYSTEM_SETTINGS}</h1>
                </div>
            </div>

            <SettingsContainer initialStaff={staffList} />
        </div>
    );
}
