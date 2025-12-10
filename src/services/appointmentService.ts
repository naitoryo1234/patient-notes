import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export interface Appointment {
    id: string; // record id
    patientId: string;
    patientName: string;
    patientKana: string;
    visitDate: Date;
    duration: number; // minutes
    visitCount: number;
    tags: string[];
    memo?: string; // patient memo
    staffName?: string;
    staffId?: string;
    status?: string;
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
            // status: { not: 'cancelled' } // Include cancelled for display
        },
        include: {
            patient: {
                include: {
                    _count: {
                        select: { records: true }
                    }
                }
            },
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
        duration: a.duration || 60, // Default to 60 if missing
        visitCount: a.patient._count.records + 1,
        tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
        memo: a.memo || a.patient.memo || '',
        staffName: a.staff?.name,
        staffId: a.staffId || undefined,
        status: a.status,
    }));
};

export const findAllAppointments = async (options?: { includePast?: boolean; includeCancelled?: boolean }) => {
    const now = new Date();
    const where: any = {};

    if (!options?.includePast) {
        // Default: Show future appointments (and today's)
        where.startAt = {
            gte: startOfDay(now)
        };
    }

    if (!options?.includeCancelled) {
        where.status = { not: 'cancelled' };
    }

    const appointments = await prisma.appointment.findMany({
        where,
        include: {
            patient: {
                include: {
                    _count: {
                        select: { records: true }
                    }
                }
            },
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
        duration: a.duration || 60,
        visitCount: a.patient._count.records + 1,
        tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
        memo: a.memo || a.patient.memo || '',
        staffName: a.staff?.name,
        staffId: a.staffId || undefined,
        status: a.status
    }));
};

export const getTodaysAppointmentForPatient = async (patientId: string) => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Get all appointments for today, sorted by time
    const appointments = await prisma.appointment.findMany({
        where: {
            patientId,
            startAt: {
                gte: start,
                lte: end,
            },
            status: { not: 'cancelled' }
        },
        orderBy: { startAt: 'asc' },
        include: { staff: true }
    });

    if (appointments.length === 0) return null;

    // Logic: Return the one closest to current time? Or the first uncompleted?
    // For default input value, if multiple exist:
    // 1. If there's an appointment in the future (from now), pick the nearest future one (upcoming).
    // 2. If all are in the past (today), pick the latest one (just finished).

    // Simple approach: Pick the one closest to NOW.
    const now = new Date();
    const closest = appointments.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.startAt.getTime() - now.getTime());
        const currDiff = Math.abs(curr.startAt.getTime() - now.getTime());
        return currDiff < prevDiff ? curr : prev;
    });

    return closest;
};

export const checkStaffAvailability = async (startAt: Date, duration: number, staffId?: string | null, excludeId?: string) => {
    // Check range: +/- 3 hours to cover long appointments
    const rangeStart = new Date(startAt.getTime() - 180 * 60000);
    const rangeEnd = new Date(startAt.getTime() + 180 * 60000);

    const candidates = await prisma.appointment.findMany({
        where: {
            status: { not: 'cancelled' },
            staffId: staffId || null,
            startAt: {
                gte: rangeStart,
                lte: rangeEnd
            },
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    });

    const myStart = startAt.getTime();
    const myEnd = myStart + duration * 60000;

    for (const appt of candidates) {
        const otherStart = appt.startAt.getTime();
        const otherEnd = otherStart + (appt.duration || 30) * 60000;

        if (myStart < otherEnd && myEnd > otherStart) {
            return false;
        }
    }
    return true;
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

export const createAppointment = async (patientId: string, startAt: Date, memo?: string, staffId?: string, duration: number = 60) => {
    const isAvailable = await checkStaffAvailability(startAt, duration, staffId);
    if (!isAvailable) {
        throw new Error('重複する予約が存在します');
    }

    return await prisma.appointment.create({
        data: {
            patientId,
            startAt,
            memo,
            staffId,
            duration
        }
    });
};

export const cancelAppointment = async (id: string) => {
    return await prisma.appointment.update({
        where: { id },
        data: { status: 'cancelled' }
    });
};

export const updateAppointment = async (id: string, data: { startAt?: Date, memo?: string, staffId?: string, duration?: number }) => {
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) throw new Error('Appointment not found');

    if (data.startAt || data.staffId !== undefined || data.duration) {
        // Use new values or fallback to current
        const targetStart = data.startAt || current.startAt;
        const targetStaffId = data.staffId !== undefined ? data.staffId : current.staffId;
        const targetDuration = data.duration || current.duration;

        // Skip availability check if only memo is updated and time/staff/duration are same...
        // But for safety, always check if these changed. 
        // We really only need to check if start, duration, or staff changed.

        const isAvailable = await checkStaffAvailability(targetStart, targetDuration, targetStaffId, id);
        if (!isAvailable) {
            throw new Error('重複する予約が存在します');
        }
    }

    return await prisma.appointment.update({
        where: { id },
        data: {
            ...data,
            status: 'scheduled'
        }
    });
};
