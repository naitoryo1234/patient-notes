'use server';

import { revalidatePath } from 'next/cache';
import { createAppointment, cancelAppointment, updateAppointment } from '@/services/appointmentService';
import { redirect } from 'next/navigation';

export async function scheduleAppointment(formData: FormData) {
    const patientId = formData.get('patientId') as string;
    const dateStr = formData.get('visitDate') as string;
    const timeStr = formData.get('visitTime') as string;
    const memo = formData.get('memo') as string;
    const staffId = formData.get('staffId') as string;

    if (!patientId || !dateStr || !timeStr) {
        return { success: false, message: '必須項目が不足しています' };
    }

    const startAt = new Date(`${dateStr}T${timeStr}`);
    const adminMemo = formData.get('adminMemo') as string | undefined;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : 60;

    try {
        await createAppointment(patientId, startAt, memo, staffId || undefined, duration, adminMemo);
        revalidatePath('/');
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '登録に失敗しました' };
    }
}

export async function cancelAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await cancelAppointment(appointmentId);
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || 'キャンセルに失敗しました' };
    }
}

export async function updateAppointmentAction(formData: FormData) {
    const id = formData.get('id') as string;
    const dateStr = formData.get('visitDate') as string;
    const timeStr = formData.get('visitTime') as string;
    const memo = formData.get('memo') as string;
    const staffId = formData.get('staffId') as string;

    if (!id || !dateStr || !timeStr) {
        return { success: false, message: '必須項目が不足しています' };
    }

    const startAt = new Date(`${dateStr}T${timeStr}`);
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;

    const adminMemo = formData.get('adminMemo') as string | null;
    const isMemoResolved = formData.get('isMemoResolved') === 'true'; // Checkbox value

    // Convert staffId: "" -> null (unassign), string -> string (assign), null/undefined -> undefined (no change, but form always sends something)
    // Actually, form data "staffId" will be "" if "Unassigned" is selected.
    // So:
    const updateData: any = { startAt, memo, duration, adminMemo, isMemoResolved };

    if (staffId === "") {
        updateData.staffId = null; // Unassign
    } else if (staffId) {
        updateData.staffId = staffId; // Assign
    }
    // If we wanted "no change", we wouldn't include staffId in the updateData, but here we always get it from form.

    try {
        await updateAppointment(id, updateData);
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '更新に失敗しました' };
    }
}

export async function checkInAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentService').then(s => s.checkInAppointment(appointmentId));
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || 'チェックインに失敗しました' };
    }
}

export async function toggleAdminMemoResolutionAction(appointmentId: string, isResolved: boolean) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentService').then(s => s.updateAppointment(appointmentId, { isMemoResolved: isResolved }));
        revalidatePath('/');
        revalidatePath('/appointments');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '更新に失敗しました' };
    }
}
