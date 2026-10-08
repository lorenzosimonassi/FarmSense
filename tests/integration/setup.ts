import { config } from "dotenv"
import { vi } from "vitest"

import { testDatabaseUrl } from "./env"

// Roda antes de cada arquivo de teste importar o app: aponta para o banco e o Redis de teste
config({ quiet: true })
process.env.DATABASE_URL = testDatabaseUrl(process.env.DATABASE_URL!)
process.env.REDIS_URL = "redis://localhost:6379/1"

// Nenhum e-mail sai durante os testes
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))
