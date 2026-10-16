// Runs the Prisma CLI against the right schema for the database in DATABASE_URL:
//   file:...        -> prisma/schema.prisma           (SQLite, local development)
//   postgres(ql)://  -> prisma/schema.postgres.prisma  (Render)
//   mysql://         -> prisma/schema.mysql.prisma     (Hostinger)
// Usage: node scripts/prisma.mjs generate | db push | ...   (extra args are passed through)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (existsSync(".env")) {
    const m = readFileSync(".env", "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1];
  }
  return "file:./dev.db";
}

const url = databaseUrl();
const target = /^postgres(ql)?:/i.test(url) ? "postgresql" : /^mysql:/i.test(url) ? "mysql" : "sqlite";

let schema = "prisma/schema.prisma";
if (target !== "sqlite") {
  const made = spawnSync(process.execPath, ["scripts/make-schema.mjs", target], { stdio: "inherit" });
  if (made.status !== 0) process.exit(made.status ?? 1);
  schema = target === "postgresql" ? "prisma/schema.postgres.prisma" : "prisma/schema.mysql.prisma";
}

const args = process.argv.slice(2);
const needsSchemaFlag = args.length > 0;
console.log(`[prisma] ${target} -> ${schema}`);
const result = spawnSync("npx", ["prisma", ...args, ...(needsSchemaFlag ? ["--schema", schema] : [])], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(result.status ?? 1);
