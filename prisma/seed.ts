import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Create Admin User ─────────────────────────────
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@virtualtour.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@2026!';

  const existingAdmin = await prisma.admin.findUnique({ where: { username } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });
    console.log(`✅ Admin user created: ${username} / ${email}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${username}`);
  }

  // ─── Create Default Settings ───────────────────────
  const defaultSettings = [
    { key: 'defaultAutoRotate', value: 'false' },
    { key: 'defaultAutoRotateSpeed', value: '1.0' },
    { key: 'defaultLogoPosition', value: 'top-left' },
    { key: 'defaultLogoSize', value: 'medium' },
    { key: 'defaultPrimaryColor', value: '#6366f1' },
    { key: 'defaultSecondaryColor', value: '#818cf8' },
    { key: 'defaultBackgroundColor', value: '#000000' },
    { key: 'defaultTextColor', value: '#ffffff' },
    { key: 'companyName', value: 'Virtual Tour Platform' },
    { key: 'defaultShowControls', value: 'true' },
    { key: 'defaultShowSceneMenu', value: 'true' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Default settings created (${defaultSettings.length} entries)`);

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
