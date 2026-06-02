import path from "node:path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  // Use process.env so this works after `source .env.local` or in any
  // environment where DATABASE_URL is set. Falls back gracefully when
  // DATABASE_URL is absent (e.g. during `prisma generate` on CI).
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
