import { prisma } from "@/lib/db";

export type DocumentPrefix = "INV" | "QUO" | "LEAD";

/**
 * Sequential document numbers such as INV-2026-0001 / QUO-2026-0001.
 *
 * Uses one atomic counter per prefix and year instead of `count() + 1`, which produces
 * duplicates after deletions or when two documents are created at the same moment.
 */

const numberExists = async (prefix: DocumentPrefix, value: string) =>
  prefix === "INV"
    ? (await prisma.invoice.count({ where: { invoiceNumber: value } })) > 0
    : prefix === "LEAD"
      ? (await prisma.lead.count({ where: { leadNumber: value } })) > 0
      : (await prisma.quotation.count({ where: { quotationNumber: value } })) > 0;

// Highest sequence already used for this prefix and year, so a new counter continues after existing documents.
async function highestExisting(prefix: DocumentPrefix, year: number): Promise<number> {
  const base = `${prefix}-${year}-`;
  const numbers =
    prefix === "INV"
      ? (await prisma.invoice.findMany({ where: { invoiceNumber: { startsWith: base } }, select: { invoiceNumber: true } })).map(
          (r) => r.invoiceNumber,
        )
      : prefix === "LEAD"
        ? (await prisma.lead.findMany({ where: { leadNumber: { startsWith: base } }, select: { leadNumber: true } })).map(
            (r) => r.leadNumber,
          )
        : (
            await prisma.quotation.findMany({ where: { quotationNumber: { startsWith: base } }, select: { quotationNumber: true } })
          ).map((r) => r.quotationNumber);
  return numbers.reduce((max, n) => {
    const seq = parseInt(n.slice(base.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
}

async function increment(key: string, prefix: DocumentPrefix, year: number): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.documentCounter.update({ where: { key }, data: { seq: { increment: 1 } } });
      return row.seq;
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2025") throw error; // P2025 = counter row does not exist yet
    }
    try {
      const start = await highestExisting(prefix, year);
      const row = await prisma.documentCounter.create({ data: { key, seq: start + 1 } });
      return row.seq;
    } catch (error) {
      // Another request created the counter first: loop and increment it.
      if ((error as { code?: string })?.code !== "P2002") throw error;
    }
  }
  throw new Error(`Document counter ${key} could not be incremented`);
}

export async function nextDocumentNumber(prefix: DocumentPrefix, date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const key = `${prefix}-${year}`;
  // Skip any number that already exists (created manually or imported).
  for (let attempt = 0; attempt < 20; attempt++) {
    const seq = await increment(key, prefix, year);
    const value = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
    if (!(await numberExists(prefix, value))) return value;
  }
  throw new Error(`Could not allocate a unique ${prefix} number`);
}
