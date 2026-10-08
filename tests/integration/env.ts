export const TEST_DATABASE_NAME = "farmsense_test"

export function testDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)
  url.pathname = `/${TEST_DATABASE_NAME}`
  return url.toString()
}
