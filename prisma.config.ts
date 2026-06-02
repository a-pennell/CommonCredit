import path from "node:path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  migrate: {
    adapter: async (env: NodeJS.ProcessEnv) => {
      const { Pool } = await import("pg")
      const { PrismaPg } = await import("@prisma/adapter-pg")
      return new PrismaPg(new Pool({ connectionString: env.DATABASE_URL }))
    },
  },
})
