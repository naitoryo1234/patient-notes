import { prisma } from '@/lib/db';
import { RecordInput } from '@/config/schema';

export const getRecordsByPatientId = async (patientId: string) => {
    return await prisma.clinicalRecord.findMany({
        where: { patientId },
        orderBy: { visitDate: 'desc' },
        include: {
            attachments: true,
            staff: true
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

export const deleteRecord = async (recordId: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Get record to find patientId and visitCount
        const target = await tx.clinicalRecord.findUnique({
            where: { id: recordId },
            select: { patientId: true, visitCount: true }
        });

        if (!target) {
            throw new Error("Record not found");
        }

        // 2. Delete the record
        const deleted = await tx.clinicalRecord.delete({
            where: { id: recordId }
        });

        // 3. Decrement visitCount for all subsequent records of this patient
        await tx.clinicalRecord.updateMany({
            where: {
                patientId: target.patientId,
                visitCount: { gt: target.visitCount }
            },
            data: {
                visitCount: { decrement: 1 }
            }
        });

        return deleted;
    });
};
