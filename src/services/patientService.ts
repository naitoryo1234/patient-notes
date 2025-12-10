import { prisma } from '@/lib/db';
import { PatientInput } from '@/config/schema';

// Pure Service Functions

export const getPatients = async (query?: string) => {
    const where = query
        ? {
            OR: [
                { name: { contains: query } },
                { kana: { contains: query } },
            ],
        }
        : {};

    return await prisma.patient.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
    });
};

export const getPatientById = async (id: string) => {
    return await prisma.patient.findUnique({
        where: { id },
        include: {
            records: {
                orderBy: { visitDate: 'desc' },
            },
        },
    });
};

export const createPatient = async (data: PatientInput) => {
    // Manual Auto-increment for SQLite
    const lastPatient = await prisma.patient.findFirst({
        orderBy: { pId: 'desc' },
    });
    const nextPId = (lastPatient?.pId ?? 0) + 1;

    return await prisma.patient.create({
        data: {
            pId: nextPId,
            name: data.name,
            kana: data.kana,
            phone: data.phone,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            gender: data.gender,
            memo: data.memo,
            // Default JSONs
            tags: '[]',
            attributes: '{}',
            externalRef: '{}',
            importMeta: '{}',
        },
    });
};
