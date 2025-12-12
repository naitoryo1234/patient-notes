
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const patients = await prisma.patient.findMany({
        select: { id: true, name: true, pId: true }
    });
    console.log("Total Patients:", patients.length);
    patients.forEach(p => console.log(`- [${p.id}] ${p.name} (ID: ${p.pId})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
