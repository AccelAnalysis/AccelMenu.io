import { execSync } from "child_process";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  "file:./test.db?mode=memory&cache=shared&connection_limit=1";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.API_KEY = process.env.API_KEY ?? "test-api-key";
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

execSync("npx prisma db push --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
});
