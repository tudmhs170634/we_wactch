import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoom() {
  const room = await prisma.room.findUnique({
    where: { id: '9bbdc40c-ba6a-4388-b73b-95e91727ed86' },
    include: { video: true }
  });
  console.log('Room Data:', JSON.stringify(room, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

checkRoom()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
