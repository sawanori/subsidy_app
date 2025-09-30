import { PrismaClient } from '../generated/prisma';
import * as schemeTemplates from './seeds/scheme-templates.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding scheme templates...');

  for (const template of schemeTemplates) {
    const existing = await prisma.schemeTemplate.findUnique({
      where: { schemeId: template.schemeId },
    });

    if (existing) {
      console.log(`  ℹ️  Template ${template.schemeId} already exists, updating...`);
      await prisma.schemeTemplate.update({
        where: { schemeId: template.schemeId },
        data: {
          name: template.name,
          type: template.type,
          path: template.path,
          version: template.version,
          requirements: template.requirements as any,
        },
      });
    } else {
      console.log(`  ✓ Creating template ${template.schemeId}`);
      await prisma.schemeTemplate.create({
        data: {
          schemeId: template.schemeId,
          name: template.name,
          type: template.type,
          path: template.path,
          version: template.version,
          requirements: template.requirements as any,
        },
      });
    }
  }

  console.log('✓ Scheme templates seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding scheme templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });