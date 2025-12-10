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

    try {
        await createAppointment(patientId, startAt, memo, staffId || undefined);
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

    try {
        await updateAppointment(id, { startAt, memo, staffId: staffId || undefined });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '更新に失敗しました' };
    }
}
