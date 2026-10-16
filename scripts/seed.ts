// Creates the first Super Admin and a starter billing company.
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env (never hard-code credentials).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && process.env.RESET_ADMIN_PASSWORD !== "true") {
    // This runs on every deploy on some hosts: never overwrite a password that may have been changed.
    console.log(`Super Admin already exists: ${email} (set RESET_ADMIN_PASSWORD=true once to reset the password)`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, isActive: true, failedLogins: 0, lockedUntil: null },
      create: { email, name: "Admin", passwordHash, role: "SUPER_ADMIN" },
    });
    console.log(`Super Admin ready: ${email}`);
  }

  if ((await prisma.billingCompany.count()) === 0) {
    await prisma.billingCompany.create({
      data: {
        name: "GrovvIthUs",
        country: "India",
        isDefault: true,
        quotationTerms:
          "1. 50% advance before work starts, balance as per the milestones in this quotation.\n2. Prices exclude third-party costs (domain, hosting, plugins, ad spend).\n3. Two revision rounds are included; extra work is quoted separately.\n4. This quotation is valid until the date shown.",
        invoiceTerms: "Payment is due by the due date. Work, files and ownership transfer to the client after full payment.",
      },
    });
    console.log("Created a starter billing company. Complete it in Admin > Billing settings.");
  }
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
