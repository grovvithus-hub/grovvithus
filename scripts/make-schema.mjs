// Writes a production schema from prisma/schema.prisma.
//   node scripts/make-schema.mjs mysql        -> prisma/schema.mysql.prisma     (Hostinger)
//   node scripts/make-schema.mjs postgresql   -> prisma/schema.postgres.prisma  (Render)
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2] || "mysql";
if (!["mysql", "postgresql"].includes(target)) {
  console.error('Use "mysql" or "postgresql"');
  process.exit(1);
}

const source = readFileSync("prisma/schema.prisma", "utf8");
const converted = source
  .replace('provider = "sqlite"', `provider = "${target}"`)
  .split("\n")
  .map((line) => {
    // PostgreSQL stores String as text already; MySQL needs explicit long text types.
    if (target === "mysql" && line.includes("// @longtext")) return line.replace("// @longtext", "@db.LongText");
    if (target === "mysql" && line.includes("// @text")) return line.replace("// @text", "@db.Text");
    return line;
  })
  .join("\n");

const out = target === "mysql" ? "prisma/schema.mysql.prisma" : "prisma/schema.postgres.prisma";
writeFileSync(out, converted);
console.log(`Wrote ${out}`);
