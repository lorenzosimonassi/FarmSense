import { execSync } from "node:child_process"

import { config } from "dotenv"
import pg from "pg"

import { TEST_DATABASE_NAME, testDatabaseUrl } from "./env"

// Cria o banco farmsense_test (se não existir) e aplica as migrations antes da suíte
export default async function setup() {
  config({ quiet: true })
  const adminUrl = process.env.DATABASE_URL
  if (!adminUrl) throw new Error("DATABASE_URL não definido no .env")

  const client = new pg.Client({ connectionString: adminUrl })
  await client.connect()
  const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DATABASE_NAME])
  if (!rowCount) await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`)
  await client.end()

  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl(adminUrl) },
  })
}
