import { prisma } from "@/lib/db";
import { clientIp, jsonBody, message, route } from "@/lib/http";
import { nextDocumentNumber } from "@/lib/billing/numbers";
import { publicInquirySchema } from "@/lib/billing/validators";
import { rateLimit } from "@/lib/ratelimit";

const INTENT_LABEL = { QUOTE: "Requested a quote", DEMO: "Wants to book a demo", CALL: "Wants to discuss on a call" } as const;

/** Website form: Request a quote, Book a demo or Discuss on a call. Creates a lead for the sales team. */
export const POST = route({}, async (req) => {
  rateLimit(`inquiry:${clientIp(req)}`, 5, 60 * 60_000);
  const body = publicInquirySchema.parse(await jsonBody(req));
  // Honeypot: bots fill the hidden field. Pretend it worked.
  if (body.website) return message("Thank you! We will contact you shortly.");

  const lead = await prisma.lead.create({
    data: {
      leadNumber: await nextDocumentNumber("LEAD"),
      clientName: body.clientName,
      companyName: body.companyName,
      email: body.email,
      phone: body.phone,
      serviceOfInterest: body.serviceOfInterest,
      projectDetails: [`[${INTENT_LABEL[body.intent]}]`, body.projectDetails].filter(Boolean).join("\n"),
      timeline: body.timeline,
      source: "WEBSITE",
      status: "NEW",
    },
  });

  const staff = await prisma.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "SALES"] }, isActive: true }, select: { id: true } });
  if (staff.length) {
    await prisma.notification.createMany({
      data: staff.map((s) => ({ userId: s.id, title: "New website enquiry", message: `${lead.clientName} (${INTENT_LABEL[body.intent]}) - ${lead.leadNumber}` })),
    });
  }
  return message("Thank you! We will contact you shortly.", { leadNumber: lead.leadNumber }, 201);
});
