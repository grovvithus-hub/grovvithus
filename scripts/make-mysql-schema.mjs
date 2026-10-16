// Writes prisma/schema.mysql.prisma from prisma/schema.prisma for production on MySQL (Hostinger).
// Usage: npm run db:mysql-schema
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("prisma/schema.prisma", "utf8");

const converted = source
  .replace('provider = "sqlite"', 'provider = "mysql"')
  .split("\n")
  .map((line) => {
    if (line.includes("// @longtext")) return line.replace("// @longtext", "@db.LongText");
    if (line.includes("// @text")) return line.replace("// @text", "@db.Text");
    return line;
  })
  .join("\n");

writeFileSync("prisma/schema.mysql.prisma", converted);
console.log("Wrote prisma/schema.mysql.prisma");
console.log("Next: set DATABASE_URL to mysql://USER:PASSWORD@127.0.0.1:3306/DBNAME, then run");
console.log("  npx prisma generate --schema prisma/schema.mysql.prisma");
console.log("  npx prisma db push --schema prisma/schema.mysql.prisma");

