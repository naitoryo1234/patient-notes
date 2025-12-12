'use client';

import { useState } from 'react';
import { Staff } from '@/services/staffService';
import { createStaff, toggleStaffStatus, updateStaff } from '@/actions/staffActions';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LABELS } from '@/config/labels';
import { useToast } from '@/components/ui/Toast';

interface StaffManagerProps {
    initialStaff: Staff[];
}

export function StaffManager({ initialStaff }: StaffManagerProps) {
    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState('Director');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toggleConfirm, setToggleConfirm] = useState<{ open: boolean; id: string; active: boolean; name: string }>({ open: false, id: '', active: false, name: '' });
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('role', role);

        let result;
        if (editingId) {
            result = await updateStaff(editingId, formData);
        } else {
            result = await createStaff(formData);
        }

        setIsSubmitting(false);

        if (result.success) {
            setName('');
            setEditingId(null);
            // Default reset
            if (!editingId) setRole('Director');
            // Optional: Toast success
        } else {
            showToast(`${LABELS.COMMON.OPERATION}に失敗しました: ` + (result.message || JSON.stringify(result.errors)), 'error');
        }
    };

    const startEdit = (staff: Staff) => {
        setEditingId(staff.id);
        setName(staff.name);
        setRole(staff.role);
        // Scroll to top or form if needed, maybe simple focus is enough
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setRole('Director');
    };

    const handleToggle = async () => {
        await toggleStaffStatus(toggleConfirm.id, toggleConfirm.active);
    };

    return (
        <div className="space-y-8">
            {/* Add/Edit Staff Form */}
            <div className={`p-6 rounded-lg shadow-sm border transaction-colors ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-bold ${editingId ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {editingId ? LABELS.STAFF.EDIT_TITLE : LABELS.STAFF.NEW_TITLE}
                    </h3>
                    {editingId && (
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-slate-500 hover:text-slate-700">
                            {LABELS.STAFF.CANCEL_EDIT}
                        </Button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{LABELS.STAFF.NAME}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={LABELS.STAFF.NAME_PLACEHOLDER}
                            required
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{LABELS.STAFF.ROLE}</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Director">{LABELS.STAFF.ROLES.DIRECTOR}</option>
                            <option value="Therapist">{LABELS.STAFF.ROLES.THERAPIST}</option>
                            <option value="Clerk">{LABELS.STAFF.ROLES.CLERK}</option>
                            <option value="Other">{LABELS.STAFF.ROLES.OTHER}</option>
                        </select>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className={`w-full md:w-auto text-white ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                        {isSubmitting ? LABELS.COMMON.PROCESSING : (editingId ? LABELS.COMMON.UPDATE : LABELS.STAFF.ADD)}
                    </Button>
                </form>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">{LABELS.STAFF.LIST_TITLE}</h3>
                    <span className="text-xs text-slate-500">{LABELS.COMMON.TOTAL_COUNT(initialStaff.length)}</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">{LABELS.STAFF.NAME}</th>
                            <th className="px-6 py-3">{LABELS.STAFF.ROLE}</th>
                            <th className="px-6 py-3">{LABELS.COMMON.STATUS}</th>
                            <th className="px-6 py-3 text-right">{LABELS.COMMON.OPERATION}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialStaff.map((staff) => (
                            <tr key={staff.id} className={`bg-white border-b hover:bg-slate-50 ${editingId === staff.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}>
                                <td className="px-6 py-4 font-medium text-slate-900">{staff.name}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 py-1 px-2 rounded text-xs font-bold border border-slate-200">
                                        {staff.role === 'Director' && LABELS.STAFF.ROLES.DIRECTOR}
                                        {staff.role === 'Therapist' && LABELS.STAFF.ROLES.THERAPIST}
                                        {staff.role === 'Clerk' && LABELS.STAFF.ROLES.CLERK}
                                        {staff.role === 'Other' && LABELS.STAFF.ROLES.OTHER}
                                        {!['Director', 'Therapist', 'Clerk', 'Other'].includes(staff.role) && staff.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {staff.active ? (
                                        <span className="text-green-600 flex items-center gap-1 font-bold text-xs">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span> {LABELS.STAFF.STATUS.ACTIVE}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 flex items-center gap-1 font-bold text-xs">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span> {LABELS.STAFF.STATUS.INACTIVE}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => startEdit(staff)}
                                        className="text-xs font-medium px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        {LABELS.COMMON.MENU_EDIT}
                                    </button>
                                    <button
                                        onClick={() => setToggleConfirm({ open: true, id: staff.id, active: staff.active, name: staff.name })}
                                        className={`text-xs font-medium px-3 py-1 rounded border transition-colors ${staff.active
                                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                                            : 'text-green-600 border-green-200 hover:bg-green-50'
                                            }`}
                                    >
                                        {staff.active ? LABELS.STAFF.ACTIONS.DEACTIVATE : LABELS.STAFF.ACTIONS.ACTIVATE}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {initialStaff.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    {LABELS.STAFF.NO_DATA}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={toggleConfirm.open}
                onOpenChange={(open) => setToggleConfirm(prev => ({ ...prev, open }))}
                title={LABELS.STAFF.ACTIONS.TOGGLE_CONFIRM_TITLE(toggleConfirm.name, !toggleConfirm.active)}
                description={LABELS.STAFF.ACTIONS.TOGGLE_CONFIRM_DESC(!toggleConfirm.active)}
                confirmLabel={!toggleConfirm.active ? LABELS.STAFF.ACTIONS.ACTIVATE : LABELS.STAFF.ACTIONS.DEACTIVATE}
                variant="warning"
                onConfirm={handleToggle}
            />
        </div>
    );
}
