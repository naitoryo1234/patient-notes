import Link from 'next/link';
import { getPatients } from '@/services/patientService';
import { getTodaysAppointments } from '@/services/appointmentService';
import { DailyAppointmentPanel } from '@/components/dashboard/DailyAppointmentPanel';
import { Users, UserPlus } from 'lucide-react';
import { Patient } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Always fetch latest

export default async function Home(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const patients = await getPatients(query);
  const todaysAppointments = await getTodaysAppointments(); // Fetch appointments

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
      {/* Left Column: Today's Schedule (Fixed Panel) */}
      <div className="lg:col-span-1 h-full">
        <DailyAppointmentPanel appointments={todaysAppointments} />
      </div>

      {/* Right Column: Search & Patient List */}
      <div className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-hidden">
        {/* Header Actions */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">患者検索</h2>
          </div>
          <Link
            href="/patients/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            新規登録
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 shrink-0">
          <form className="relative">
            <input
              type="search"
              name="q"
              placeholder="氏名・ふりがなで検索..."
              defaultValue={query}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>

        {/* Patient List (Scrollable) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto p-2">
            {patients.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                該当する患者が見つかりません
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <li key={patient.id}>
                    <Link
                      href={`/patients/${patient.id}`}
                      className="block p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {patient.name}
                            </span>
                            <span className="text-sm text-slate-500">({patient.kana})</span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1 flex gap-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">No.{patient.pId}</span>
                            <span>{patient.gender || '-'}</span>
                            <span>{patient.phone || '-'}</span>
                          </div>
                        </div>
                        <div className="text-slate-400 group-hover:text-indigo-400">
                          ➔
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
