import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { UserPlus, Calendar, Settings } from 'lucide-react';
import { TERMS } from '@/config/labels';
import { getActiveStaff } from '@/services/staffService';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clinic Notebook',
  description: 'A simple CRM for private clinics.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staffList = await getActiveStaff();

  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
              <Link href="/" className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span>🩺</span>
                Clinic Notebook
              </Link>
              <nav className="flex gap-4 items-center">
                <Link
                  href="/appointments"
                  className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  {TERMS.APPOINTMENT}一覧

                </Link>
                <NewAppointmentButton
                  staffList={staffList}
                  className="bg-indigo-600 hover:bg-indigo-700 h-10 px-4 text-sm"
                />
                <Link
                  href="/patients/new"
                  className="hidden md:flex bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-md text-sm font-bold items-center gap-2 transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  新規{TERMS.PATIENT}
                </Link>
                <Link
                  href="/settings/staff"
                  className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title={`設定 (${TERMS.STAFF}管理)`}
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </nav>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body >
    </html >
  );
}
