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
    staffName?: string;
}

export const getTodaysAppointments = async (date: Date = new Date()): Promise<Appointment[]> => {
    const start = startOfDay(date);
    const end = endOfDay(date);

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
            staff: true,
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
        staffName: a.staff?.name,
    }));
};

export const getNextAppointment = async (patientId: string) => {
    const now = new Date();
    const appointment = await prisma.appointment.findFirst({
        where: {
            patientId,
            startAt: { gte: now },
            status: { not: 'cancelled' }
        },
        orderBy: { startAt: 'asc' },
        include: { staff: true }
    });

    if (!appointment) return null;
    return {
        id: appointment.id,
        startAt: appointment.startAt,
        memo: appointment.memo,
        staffName: appointment.staff?.name
    };
};

export const createAppointment = async (patientId: string, startAt: Date, memo?: string, staffId?: string) => {
    return await prisma.appointment.create({
        data: {
            patientId,
            startAt,
            memo,
            staffId,
        }
    });
};
