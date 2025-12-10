'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PatientSchema } from '@/config/schema';
import * as patientService from '@/services/patientService';

export async function addPatient(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Validation
    const validated = PatientSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors };
    }

    let newPatient;
    try {
        newPatient = await patientService.createPatient(validated.data);
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Database Error' };
    }

    revalidatePath('/');
    redirect(`/patients/${newPatient.id}`);
}

export async function checkDuplicates(name: string, kana: string) {
    if (!name && !kana) return [];
    try {
        const results = await patientService.findSimilarPatients(name, kana);
        // Serialize dates if necessary, but server components handles simple objects mostly.
        // Prisma Date objects need to be serializable if passed to client components directly?
        // Server Action returns to Client Component -> Needs serialization
        return results.map((p: any) => ({
            ...p,
            birthDate: p.birthDate ? p.birthDate.toISOString() : null,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}
