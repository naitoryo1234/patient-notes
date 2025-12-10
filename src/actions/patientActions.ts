'use server'

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPatient, findSimilarPatients } from '@/services/patientService';

/**
 * Create a new patient
 */
export async function addPatient(formData: FormData) {
    const rawData = {
        name: formData.get('name') as string,
        kana: formData.get('kana') as string,
        birthDate: formData.get('birthDate') as string || undefined,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        memo: formData.get('memo') as string,
    }

    if (!rawData.name || !rawData.kana) {
        // Simple server-side validation
        throw new Error('Name and Kana are required');
    }

    const newPatient = await createPatient(rawData);

    // Check if tags are in formData and update if needed
    // ConfigForm might send tags as string or nothing. 
    // If patient creation handles tags default as empty, we can update them here if present.
    // For now, let's stick to basic creation and redirect.

    revalidatePath('/');
    redirect(`/patients/${newPatient.id}`);
}

/**
 * Check for duplicate patients
 */
export async function checkDuplicates(name: string, kana: string) {
    if (!name && !kana) return [];
    const results = await findSimilarPatients(name, kana);
    // Serialize dates for client component
    return results.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        birthDate: p.birthDate ? p.birthDate.toISOString() : null,
    }));
}

/**
 * Update patient memo
 */
export async function updatePatientMemo(patientId: string, memo: string) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { memo }
        });
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update patient memo:', error);
        return { success: false, error: 'Failed to update memo' };
    }
}

/**
 * Update patient tags
 */
export async function updatePatientTags(patientId: string, tags: string[]) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { tags: JSON.stringify(tags) }
        });
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update patient tags:', error);
        return { success: false, error: 'Failed to update tags' };
    }
}

/**
 * Logically delete a patient and cancel future appointments
 */
export async function deletePatient(patientId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Cancel future appointments (Integrity)
            // Only cancel 'scheduled' appointments in the future
            await tx.appointment.updateMany({
                where: {
                    patientId: patientId,
                    startAt: { gte: new Date() },
                    status: 'scheduled'
                },
                data: { status: 'cancelled' }
            });

            // 2. Logically delete the patient
            await tx.patient.update({
                where: { id: patientId },
                data: { deletedAt: new Date() }
            });
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete patient:', error);
        return { success: false, error: 'Failed to delete patient' };
    }
}
