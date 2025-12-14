'use server'

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPatient, findSimilarPatients } from '@/services/patientService';
import { getNow } from '@/lib/dateUtils';
import { getKanaVariants } from '@/lib/kanaUtils';

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
        tags: formData.get('tags') as string || undefined
    }

    if (!rawData.name || !rawData.kana) {
        // Simple server-side validation
        throw new Error('Name and Kana are required');
    }

    // Process tags (comma separated string -> JSON array)
    // Note: createPatient service might need adjustment if tags not passed
    // But createPatient takes PatientCreateInput which expects tags as String (JSON)
    // We should parse it here.
    let tagsJson: string | undefined = undefined;
    if (rawData.tags) {
        tagsJson = JSON.stringify(rawData.tags.split(',').map(t => t.trim()).filter(Boolean));
    }

    const inputData = { ...rawData, tags: tagsJson };
    const newPatient = await createPatient(inputData);

    revalidatePath('/');
    redirect(`/patients/${newPatient.id}`);
}

/**
 * Update entire patient profile
 */
export async function updatePatient(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const kana = formData.get('kana') as string;
    const gender = formData.get('gender') as string;
    const phone = formData.get('phone') as string;
    const birthDateStr = formData.get('birthDate') as string;
    const memo = formData.get('memo') as string;
    const tagsStr = formData.get('tags') as string;

    if (!id || !name || !kana) {
        return { success: false, message: '必須項目が不足しています' };
    }

    let birthDate: Date | null = null;
    if (birthDateStr) {
        birthDate = new Date(birthDateStr);
    }

    let tagsJson: string | undefined = undefined;
    if (tagsStr) {
        tagsJson = JSON.stringify(tagsStr.split(',').map(t => t.trim()).filter(Boolean));
    }

    try {
        await prisma.patient.update({
            where: { id },
            data: {
                name,
                kana,
                gender: gender || null,
                phone: phone || null,
                birthDate: birthDate || null,
                memo: memo || '',
                tags: tagsJson // Update tags if present (ConfigForm sends them)
            }
        });

        revalidatePath(`/patients/${id}`);
    } catch (error) {
        console.error('Failed to update patient:', error);
        return { success: false, error: 'Failed to update patient' };
    }

    // Success redirect
    redirect(`/patients/${id}`);
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
                    startAt: { gte: getNow() },
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

/**
 * Search patients for selection (Lightweight)
 * Supports hiragana/katakana insensitive search
 */
export async function searchPatientsForSelect(query: string) {
    if (!query || query.length < 1) return [];

    const isNumeric = /^\d+$/.test(query);
    const idCondition = isNumeric ? { pId: parseInt(query) } : undefined;

    // Get hiragana and katakana variants of the query
    const kanaVariants = getKanaVariants(query);

    // Build OR conditions for all kana variants
    const nameConditions = kanaVariants.map(v => ({ name: { contains: v } }));
    const kanaConditions = kanaVariants.map(v => ({ kana: { contains: v } }));

    const patients = await prisma.patient.findMany({
        where: {
            OR: [
                ...nameConditions,
                ...kanaConditions,
                ...(idCondition ? [idCondition] : [])
            ],
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            kana: true,
            pId: true,
            birthDate: true,
            phone: true,
            memo: true
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
    });

    return patients.map(p => ({
        ...p,
        birthDate: p.birthDate ? p.birthDate.toISOString() : null
    }));
}
