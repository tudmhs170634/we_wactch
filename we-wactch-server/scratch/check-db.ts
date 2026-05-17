import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.video.count();
    console.log('✅ DB Connected. Video count:', count);
  } catch (err) {
    console.error('❌ DB Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
