import Link from 'next/link';
import { getPatients } from '@/services/patientService';
import { getTodaysAppointments } from '@/services/appointmentService';
import { DailyAppointmentPanel } from '@/components/dashboard/DailyAppointmentPanel';
import { Users, UserPlus } from 'lucide-react';
import { Patient } from '@prisma/client';
import { getActiveStaff } from '@/services/staffService';
import { format } from 'date-fns';
import { PatientSearchPanel } from '@/components/dashboard/PatientSearchPanel';

export const dynamic = 'force-dynamic'; // Always fetch latest

export default async function Home(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const patients = await getPatients(query);
  const todaysAppointments = await getTodaysAppointments(); // Fetch today's appointments
  const activeStaff = await getActiveStaff();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
      {/* Left Column: Today's Schedule (Fixed Panel) */}
      <div className="lg:col-span-1 h-full">
        <DailyAppointmentPanel appointments={todaysAppointments} staffList={activeStaff} />
      </div>

      {/* Right Column: Search & Patient List (Smart Directory) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <PatientSearchPanel
          initialPatients={patients}
          appointments={todaysAppointments}
          searchQuery={query}
        />
      </div>
    </div>
  );
}
