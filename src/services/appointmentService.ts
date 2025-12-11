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

// Helper to calculate overlap
const hasOverlap = (start1: number, end1: number, start2: number, end2: number) => {
    return start1 < end2 && end1 > start2;
};

export const getTodaysAppointments = async (date: Date = new Date()): Promise<Appointment[]> => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: { gte: start, lte: end },
        },
        include: {
            patient: {
                include: {
                    _count: { select: { records: true } }
                }
            },
            staff: true,
        },
        orderBy: { startAt: 'asc' },
    });

    const patientVisitCounter = new Map<string, number>();

    return appointments.map((a: any) => {
        const currentCount = patientVisitCounter.get(a.patientId) || 0;
        patientVisitCounter.set(a.patientId, currentCount + 1);

        // Logic: DB Records + 1 (This Visit) + Previous Visits Today
        const visitCount = (a.patient._count.records || 0) + 1 + currentCount;

        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration || 60,
            visitCount: visitCount,
            tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
            memo: a.memo || a.patient.memo || '',
            staffName: a.staff?.name,
            staffId: a.staffId || undefined,
            status: a.status,
        };
    });
};

export const findAllAppointments = async (options?: { includePast?: boolean; includeCancelled?: boolean }) => {
    const now = new Date();
    const where: any = {};

    if (!options?.includePast) {
        where.startAt = { gte: startOfDay(now) };
    }

    if (!options?.includeCancelled) {
        where.status = { not: 'cancelled' };
    }

    const appointments = await prisma.appointment.findMany({
        where,
        include: {
            patient: {
                include: {
                    _count: { select: { records: true } }
                }
            },
            staff: true,
        },
        orderBy: { startAt: 'asc' },
    });

    const patientVisitCounter = new Map<string, number>();

    return appointments.map((a: any) => {
        // Only increment counter if we are looking at a coherent list (e.g. sorted by time)
        // For general list, this might be tricky if we mix dates, but assuming chronological order it works for "future visits".
        // Note: If we include past, the "db record count" includes those past visits, so double counting might happen.
        // For simplicity in V1.1: We apply the same logic as today's appointment for consistency in the list view.

        const currentCount = patientVisitCounter.get(a.patientId) || 0;
        patientVisitCounter.set(a.patientId, currentCount + 1);

        const visitCount = (a.patient._count.records || 0) + 1 + currentCount;

        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration || 60,
            visitCount: visitCount,
            tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
            memo: a.memo || a.patient.memo || '',
            staffName: a.staff?.name,
            staffId: a.staffId || undefined,
            status: a.status
        };
    });
};

export const getTodaysAppointmentForPatient = async (patientId: string) => {
    // ... (unchanged logic)
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const appointments = await prisma.appointment.findMany({
        where: {
            patientId,
            startAt: { gte: start, lte: end },
            status: { not: 'cancelled' }
        },
        orderBy: { startAt: 'asc' },
        include: { staff: true }
    });

    if (appointments.length === 0) return null;

    const now = new Date();
    const closest = appointments.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.startAt.getTime() - now.getTime());
        const currDiff = Math.abs(curr.startAt.getTime() - now.getTime());
        return currDiff < prevDiff ? curr : prev;
    });

    return closest;
};

// Check if STAFF is available
export const checkStaffAvailability = async (startAt: Date, duration: number, staffId?: string | null, excludeId?: string) => {
    // Staff ID is optional (no staff assigned = always available? or check generic capacity? Assuming always OK if no staff)
    if (!staffId) return true;

    const rangeStart = new Date(startAt.getTime() - 180 * 60000);
    const rangeEnd = new Date(startAt.getTime() + 180 * 60000);

    const candidates = await prisma.appointment.findMany({
        where: {
            status: { not: 'cancelled' },
            staffId: staffId,
            startAt: { gte: rangeStart, lte: rangeEnd },
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    });

    const myStart = startAt.getTime();
    const myEnd = myStart + duration * 60000;

    for (const appt of candidates) {
        const otherStart = appt.startAt.getTime();
        const otherEnd = otherStart + (appt.duration || 60) * 60000;
        if (hasOverlap(myStart, myEnd, otherStart, otherEnd)) return false;
    }
    return true;
};

// Check if PATIENT is available (no double booking for same patient)
export const checkPatientAvailability = async (patientId: string, startAt: Date, duration: number, excludeId?: string) => {
    const rangeStart = new Date(startAt.getTime() - 180 * 60000);
    const rangeEnd = new Date(startAt.getTime() + 180 * 60000);

    const candidates = await prisma.appointment.findMany({
        where: {
            status: { not: 'cancelled' },
            patientId: patientId,
            startAt: { gte: rangeStart, lte: rangeEnd },
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    });

    const myStart = startAt.getTime();
    const myEnd = myStart + duration * 60000;

    for (const appt of candidates) {
        const otherStart = appt.startAt.getTime();
        const otherEnd = otherStart + (appt.duration || 60) * 60000;
        if (hasOverlap(myStart, myEnd, otherStart, otherEnd)) return false;
    }
    return true;
};

export const getNextAppointment = async (patientId: string) => {
    // ... (unchanged)
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
        duration: appointment.duration,
        memo: appointment.memo,
        staffId: appointment.staffId || undefined,
        staffName: appointment.staff?.name
    };
};

export const createAppointment = async (patientId: string, startAt: Date, memo?: string, staffId?: string, duration: number = 60) => {
    // 1. Check Staff Availability
    const isStaffOk = await checkStaffAvailability(startAt, duration, staffId);
    if (!isStaffOk) {
        throw new Error('担当者の予定が重複しています');
    }

    // 2. Check Patient Availability
    const isPatientOk = await checkPatientAvailability(patientId, startAt, duration);
    if (!isPatientOk) {
        throw new Error('この患者は同じ時間帯に既に予約があります');
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
        const targetStart = data.startAt || current.startAt;
        const targetStaffId = data.staffId !== undefined ? data.staffId : current.staffId;
        const targetDuration = data.duration || current.duration;

        // 1. Check Staff
        const isStaffOk = await checkStaffAvailability(targetStart, targetDuration, targetStaffId, id);
        if (!isStaffOk) {
            throw new Error('担当者の予定が重複しています');
        }

        // 2. Check Patient
        // Only need to check if time changed, but checking always is safer
        const isPatientOk = await checkPatientAvailability(current.patientId, targetStart, targetDuration, id);
        if (!isPatientOk) {
            throw new Error('この患者は同じ時間帯に既に予約があります');
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
