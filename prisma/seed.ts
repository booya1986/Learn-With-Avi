import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create initial admin user
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: 'admin@learnwithavi.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Skipping...');
  } else {
    const passwordHash = await bcrypt.hash('admin123', 12);

    const admin = await prisma.admin.create({
      data: {
        email: 'admin@learnwithavi.com',
        passwordHash,
        name: 'Admin User',
      },
    });

    console.log('✅ Created admin user:', {
      email: admin.email,
      name: admin.name,
    });
  }

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
