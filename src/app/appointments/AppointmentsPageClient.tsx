'use client';

import { useState } from 'react';
import { Appointment } from '@/services/appointmentService';
import { Staff } from '@/services/staffService';
import { AppointmentListClient } from './AppointmentListClient';
import { DailyAppointmentPanel } from '@/components/dashboard/DailyAppointmentPanel';
import { CalendarView } from '@/components/features/calendar/CalendarView';
import { AppointmentFormModal } from '@/components/domain/AppointmentFormModal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { updateAppointmentAction } from '@/actions/appointmentActions';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface AppointmentsPageClientProps {
    appointments: Appointment[];
    todaysAppointments: Appointment[];
    unresolvedMemos: Appointment[];
    staffList: Staff[];
    includePast: boolean;
    initialDateStr?: string;
}

type PageViewMode = 'list' | 'calendar';

export function AppointmentsPageClient({
    appointments,
    todaysAppointments,
    unresolvedMemos,
    staffList,
    includePast,
    initialDateStr,
}: AppointmentsPageClientProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [pageViewMode, setPageViewMode] = useState<PageViewMode>('list');
    const [patientFilter, setPatientFilter] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
    const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
    const [targetTime, setTargetTime] = useState<string | undefined>(undefined);

    // Filter Logic
    const handlePatientClick = (patientName: string) => {
        setPatientFilter(patientName);
    };

    // Modal Handlers
    const handleCreateClick = (date?: Date, timeStr?: string) => {
        setModalMode('create');
        setSelectedAppointment(undefined);
        if (date) setTargetDate(format(date, 'yyyy-MM-dd'));
        else setTargetDate(undefined);
        if (timeStr) setTargetTime(timeStr);
        else setTargetTime(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (appointment: Appointment) => {
        setModalMode('edit');
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    // DnD Handler
    const handleDropAppointment = async (appointmentId: string, newDate: Date) => {
        // Find appointment
        const app = appointments.find(a => a.id === appointmentId);
        if (!app) return;

        const formData = new FormData();
        formData.set('id', app.id);
        formData.set('patientId', app.patientId);
        // New Time
        formData.set('visitDate', format(newDate, 'yyyy-MM-dd'));
        formData.set('visitTime', format(newDate, 'HH:mm'));

        // Preserve existing
        formData.set('duration', String(app.duration || 60));
        formData.set('staffId', app.staffId || '');
        formData.set('memo', app.memo || '');
        formData.set('adminMemo', app.adminMemo || '');
        formData.set('isMemoResolved', app.isMemoResolved ? 'true' : 'false');

        try {
            const res = await updateAppointmentAction(formData);
            if (res.success) {
                showToast('予約日時を変更しました', 'success');
                router.refresh();
            } else {
                showToast(res.message || '移動に失敗しました', 'error');
            }
        } catch (error) {
            showToast('エラーが発生しました', 'error');
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
            {/* Left Column: Today's Schedule (Fixed Panel) - Always visible or collapsible? 
                Keeping layout consistent.
            */}
            <div className="lg:w-80 h-auto lg:h-full lg:overflow-y-auto pr-1 flex-shrink-0 hidden lg:block">
                <DailyAppointmentPanel
                    appointments={todaysAppointments}
                    staffList={staffList}
                    unresolvedMemos={unresolvedMemos}
                    onPatientClick={handlePatientClick}
                />
            </div>

            {/* Right Column: Main Content */}
            <div className="flex-1 h-full flex flex-col min-h-0 overflow-hidden">
                {/* View Switcher Header (Inline with page title or separate?) */}
                <div className="flex justify-end pb-2">
                    <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex">
                        <button
                            onClick={() => setPageViewMode('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${pageViewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ListIcon className="w-4 h-4" />
                            台帳
                        </button>
                        <button
                            onClick={() => setPageViewMode('calendar')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${pageViewMode === 'calendar'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            カレンダー
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {pageViewMode === 'list' ? (
                        <div className="h-full overflow-y-auto">
                            <AppointmentListClient
                                initialAppointments={appointments}
                                staffList={staffList}
                                includePast={includePast}
                                externalPatientFilter={patientFilter}
                                onPatientFilterChange={setPatientFilter}
                                onEditAppointment={handleEditClick}
                            />
                        </div>
                    ) : (
                        <CalendarView
                            appointments={appointments}
                            staffList={staffList}
                            initialDate={initialDateStr ? new Date(initialDateStr) : new Date()}
                            onAppointmentClick={handleEditClick}
                            onDateClick={handleCreateClick}
                            onDropAppointment={handleDropAppointment}
                        />
                    )}
                </div>
            </div>

            {/* Shared Modal */}
            <AppointmentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                appointment={selectedAppointment}
                initialDate={targetDate}
                initialTime={targetTime}
                staffList={staffList}
            />
        </div>
    );
}
