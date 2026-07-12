import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/transitops_dev',
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
