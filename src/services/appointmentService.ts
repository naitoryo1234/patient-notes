import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export interface Appointment {
    id: string; // record id
    patientId: string;
    patientName: string;
    patientKana: string;
    visitDate: Date;
    visitCount: number;
    tags: string[];
    memo?: string; // patient memo
}

export const getTodaysAppointments = async (date: Date = new Date()): Promise<Appointment[]> => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    // @ts-ignore: Prisma Client types need restart to update
    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: start,
                lte: end,
            },
            status: { not: 'cancelled' }
        },
        include: {
            patient: true,
        },
        orderBy: {
            startAt: 'asc',
        },
    });

    return appointments.map((a: any) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patient.name,
        patientKana: a.patient.kana,
        visitDate: a.startAt,
        visitCount: 0, // Appointments don't track visit count yet
        tags: [], // Appointments don't have tags yet, maybe fetch from patient tags?
        memo: a.memo || a.patient.memo || '',
    }));
};

export const createAppointment = async (patientId: string, startAt: Date, memo?: string) => {
    // @ts-ignore
    return await prisma.appointment.create({
        data: {
            patientId,
            startAt,
            memo,
        }
    });
};
