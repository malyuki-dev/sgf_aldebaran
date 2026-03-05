import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'tsx prisma/seed-admin.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL!,
        shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL!,
    },
});
