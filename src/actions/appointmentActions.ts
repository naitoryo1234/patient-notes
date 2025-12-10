'use server';

import { revalidatePath } from 'next/cache';
import { createAppointment } from '@/services/appointmentService';
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
    } catch (e) {
        console.error(e);
        return { success: false, message: '登録に失敗しました' };
    }

    revalidatePath('/');
    revalidatePath(`/patients/${patientId}`);
    return { success: true };
}
