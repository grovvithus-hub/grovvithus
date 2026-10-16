import { AppError } from "@/lib/errors";
import { calculateBilling } from "./calc";
import { getCompanyForDocument, resolveCompanyId } from "./company";

/** Totals and GST fields shared by quotation and invoice saves. */
export async function buildAmounts(
  body: {
    companyId?: string | null;
    items: { description: string; details?: string; hsnSac?: string; quantity: number; unit?: string; unitPrice: number; taxPercent?: number | null }[];
    taxPercent: number;
    discountAmount: number;
    additionalCharges: number;
    additionalChargesLabel: string | null;
    placeOfSupplyCode: string | null;
    clientGst: string | null;
  },
  currentCompanyId?: string | null,
) {
  const companyId = await resolveCompanyId(body.companyId, currentCompanyId);
  const company = await getCompanyForDocument(companyId);
  const totals = calculateBilling({
    items: body.items,
    taxPercent: body.taxPercent,
    discountAmount: body.discountAmount,
    additionalCharges: body.additionalCharges,
    placeOfSupplyCode: body.placeOfSupplyCode,
    clientGst: body.clientGst,
    supplierStateCode: company.stateCode,
  });
  if (!totals.items.length) throw new AppError("Add at least one item", 400);
  return {
    company,
    data: {
      companyId: companyId ?? undefined,
      items: totals.items as never,
      taxPercent: body.taxPercent,
      subTotal: totals.subTotal,
      discountAmount: totals.discountAmount,
      additionalCharges: totals.additionalCharges,
      additionalChargesLabel: body.additionalChargesLabel,
      taxType: totals.taxType,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      amountInWords: totals.amountInWords,
      placeOfSupply: totals.placeOfSupply,
      placeOfSupplyCode: totals.placeOfSupplyCode,
    },
  };
}
