import { prisma } from '@/lib/db';
import { PatientInput } from '@/config/schema';

// Pure Service Functions

export const getPatients = async (query?: string) => {
    // Check if query is numeric for ID search
    const isNumeric = query && /^\d+$/.test(query);

    const where: any = {
        deletedAt: null, // Always exclude deleted patients
    };

    if (query) {
        where.OR = [
            { name: { contains: query } },
            { kana: { contains: query } },
        ];

        if (isNumeric) {
            where.OR.push({ pId: parseInt(query) });
        }
    }

    return await prisma.patient.findMany({
        where,
        include: {
            records: {
                orderBy: { visitDate: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' },
    });
};

export const findSimilarPatients = async (name: string, kana: string) => {
    if (!name && !kana) return [];

    return await prisma.patient.findMany({
        where: {
            OR: [
                { name: { contains: name } },
                { kana: { contains: kana } }
            ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
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
