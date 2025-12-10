import { prisma } from '@/lib/db';
import { RecordInput } from '@/config/schema';

export const getRecordsByPatientId = async (patientId: string) => {
    return await prisma.clinicalRecord.findMany({
        where: { patientId },
        orderBy: { visitDate: 'desc' },
        include: {
            attachments: true
        }
    });
};

export const createRecord = async (data: RecordInput, patientId: string) => {
    // Auto-increment visit count
    const count = await prisma.clinicalRecord.count({
        where: { patientId },
    });

    return await prisma.clinicalRecord.create({
        data: {
            patientId,
            visitCount: count + 1,
            visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
            subjective: data.subjective || '',
            objective: data.objective || '',
            assessment: data.assessment || '',
            plan: data.plan || '',
            tags: JSON.stringify(data.tags || []),
            metadata: '{}',
            rawText: '', // Future use
            staffId: data.staffId || null,
        },
    });
};
