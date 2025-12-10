import Link from 'next/link';
import { getPatients } from '@/services/patientService';
import { buttonVariants } from '@/components/ui/button';
import { Patient } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Always fetch latest

export default async function DashboardPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">患者一覧</h1>
      </div>

      <div className="rounded-md border bg-white">
        <div className="p-4">
          <input
            type="search"
            placeholder="氏名・ふりがなで検索..."
            className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50">
                <th className="h-12 px-4 align-middle font-medium text-slate-500">ID</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">氏名</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">最終更新</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    患者データがありません。右上のボタンから登録してください。
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="border-b transition-colors hover:bg-slate-50/50">
                    <td className="p-4 align-middle font-mono text-xs text-slate-400">{patient.pId}</td>
                    <td className="p-4 align-middle font-medium">
                      <Link href={`/patients/${patient.id}`} className="hover:underline">
                        {patient.name} <span className="text-xs text-slate-400 ml-1">({patient.kana})</span>
                      </Link>
                    </td>
                    <td className="p-4 align-middle text-slate-500">
                      {new Date(patient.updatedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link href={`/patients/${patient.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                        カルテを開く
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
