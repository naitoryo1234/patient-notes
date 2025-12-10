import { prisma } from '@/lib/db';

export interface Staff {
    id: string;
    name: string;
    role: string;
    active: boolean;
}

export const getActiveStaff = async (): Promise<Staff[]> => {
    const staff = await prisma.staff.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' }
    });
    return staff;
};

export const getStaffById = async (id: string): Promise<Staff | null> => {
    const staff = await prisma.staff.findUnique({
        where: { id }
    });
    return staff;
};
