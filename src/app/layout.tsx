import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { UserPlus, Calendar, Settings, LayoutDashboard } from 'lucide-react';
import { TERMS } from '@/config/labels';
import { getActiveStaff } from '@/services/staffService';
import { NewAppointmentButton } from '@/components/dashboard/NewAppointmentButton';
import { isDemoMode, getDemoDateString } from '@/lib/dateUtils';
import { Providers } from '@/components/Providers';

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
  const demoMode = isDemoMode();
  const demoDate = getDemoDateString();

  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden`}>
        <Providers>
          <div className="h-full flex flex-col bg-slate-50 text-slate-900">
            <header className="flex-none z-10 w-full border-b bg-white/80 backdrop-blur-sm">
              <div className="container mx-auto flex h-14 items-center justify-between px-4">
                <Link href="/" className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <span>🩺</span>
                  Clinic Notebook
                  {demoMode && (
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ml-2">
                      DEMO
                    </span>
                  )}
                </Link>
                <nav className="flex gap-4 items-center">
                  <Link
                    href="/"
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    title="ダッシュボード"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">ホーム</span>
                  </Link>
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
                    href="/settings"
                    className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    title="設定"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                </nav>
              </div>
            </header>
            {/* Main area: Fills remaining height, clips overflow. Children must handle scroll. */}
            <main className="flex-1 min-h-0 container mx-auto px-4 py-4 md:py-6 overflow-hidden flex flex-col">
              {children}
            </main>
            {/* Demo Mode Footer Notice */}
            {demoMode && (
              <footer className="flex-none bg-amber-50 border-t border-amber-200 text-amber-700 text-xs text-center py-2 px-4">
                ※ これはデモ環境です。表示されているデータは架空のものです。（システム日付: {demoDate}）
              </footer>
            )}
          </div>
        </Providers>
      </body >
    </html >
  );
}

