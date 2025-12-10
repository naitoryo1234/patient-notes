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

    try {
        await patientService.createPatient(validated.data);
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Database Error' };
    }

    revalidatePath('/patients');
    revalidatePath('/');
    redirect('/patients');
}
