// Role checks: who can reach which admin area. Creates two throwaway users and deletes them afterwards.
// node scripts/e2e-roles.mjs [baseUrl]
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.argv[2] || "http://localhost:3100";
const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

const password = crypto.randomBytes(12).toString("base64url");
const users = [
  { email: `editor-${Date.now()}@test.local`, role: "EDITOR" },
  { email: `sales-${Date.now()}@test.local`, role: "SALES" },
];

async function login(email) {
  const res = await fetch(BASE + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  return (res.headers.get("set-cookie") || "").split(";")[0];
}
const status = async (cookie, path, method = "GET", body) =>
  (await fetch(BASE + path, { method, headers: { Cookie: cookie, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: "manual" })).status;

try {
  const hash = await bcrypt.hash(password, 10);
  for (const u of users) await prisma.user.create({ data: { email: u.email, name: u.role, passwordHash: hash, role: u.role } });
  const [editor, sales] = await Promise.all(users.map((u) => login(u.email)));
  const admin = await (async () => {
    const res = await fetch(BASE + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
    return (res.headers.get("set-cookie") || "").split(";")[0];
  })();
  check("editor and sales can sign in", !!editor && !!sales);

  console.log("Editor (content only)");
  check("editor can list portfolio projects", (await status(editor, "/api/admin/projects")) === 200);
  check("editor cannot see quotations", (await status(editor, "/api/admin/quotations")) === 403);
  check("editor cannot see invoices", (await status(editor, "/api/admin/invoices")) === 403);
  check("editor cannot see leads or clients", (await status(editor, "/api/admin/leads")) === 403 && (await status(editor, "/api/admin/clients")) === 403);
  check("editor cannot change company or bank details", (await status(editor, "/api/admin/companies", "POST", { name: "Evil Co" })) === 403);
  check("editor dashboard shows no money figures", !(await (await fetch(BASE + "/admin", { headers: { Cookie: editor } })).text()).includes("Outstanding"));

  console.log("Sales (billing only)");
  check("sales can list quotations and invoices", (await status(sales, "/api/admin/quotations")) === 200 && (await status(sales, "/api/admin/invoices")) === 200);
  check("sales cannot manage the portfolio", (await status(sales, "/api/admin/projects")) === 403);
  check("sales cannot upload media", (await status(sales, "/api/admin/media", "POST")) === 403);
  check("sales cannot change company or bank details", (await status(sales, "/api/admin/companies", "POST", { name: "Evil Co" })) === 403);
  check("sales cannot read the bank-change history", (await status(sales, "/api/admin/companies/cmv000000000000000000000/bank-history")) === 403);

  console.log("Super Admin");
  check("super admin reaches everything", (await status(admin, "/api/admin/projects")) === 200 && (await status(admin, "/api/admin/quotations")) === 200 && (await status(admin, "/api/admin/companies")) === 200);

  console.log("Deactivated accounts");
  await prisma.user.updateMany({ where: { email: users[0].email }, data: { isActive: false } });
  check("a deactivated user's existing session stops working", (await status(editor, "/api/admin/projects")) === 401);
} finally {
  await prisma.user.deleteMany({ where: { email: { in: users.map((u) => u.email) } } });
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
