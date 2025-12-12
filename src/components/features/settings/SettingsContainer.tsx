'use client';

import { useState } from 'react';
import { StaffManager } from './StaffManager';
import { SystemSettings } from './SystemSettings';
import { type Staff } from '@prisma/client';
import { LayoutDashboard, Users, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LABELS } from '@/config/labels';

interface SettingsContainerProps {
    initialStaff: Staff[];
}

type Tab = 'staff' | 'system';

export const SettingsContainer = ({ initialStaff }: SettingsContainerProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('staff');

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 space-y-1">
                <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                            activeTab === 'staff'
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        {LABELS.STAFF.TITLE}
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                            activeTab === 'system'
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <Database className="w-4 h-4" />
                        {LABELS.SETTINGS.TITLE}
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg border shadow-sm p-6">
                    {activeTab === 'staff' && (
                        <StaffManager initialStaff={initialStaff} />
                    )}
                    {activeTab === 'system' && (
                        <SystemSettings />
                    )}
                </div>
            </div>
        </div>
    );
};
