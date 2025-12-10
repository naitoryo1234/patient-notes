import { getAllStaff } from '@/services/staffService';
import { StaffManager } from '@/components/features/settings/StaffManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function StaffSettingsPage() {
    const staffList = await getAllStaff();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">スタッフ管理</h1>
            </div>

            <p className="text-slate-600 mb-8">
                カルテや予約に紐付ける担当者を管理します。ここで登録したスタッフは、カルテ作成画面や予約画面の選択肢として表示されます。
            </p>

            <StaffManager initialStaff={staffList} />
        </div>
    );
}
