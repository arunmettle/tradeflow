import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { getCurrentAuthUserAsync } from "@/lib/auth/session";
import { getQuoteByIdAsync } from "@/features/quotes/repo/quoteRepo";
import { renderQuotePdfBufferAsync } from "@/features/quotes/render/quotePdfDocument";

export const runtime = "nodejs";

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentAuthUserAsync();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tradie = await prisma.tradieProfile.findFirst({
    where: { authUserId: user.id },
    select: { id: true },
  });

  if (!tradie) {
    return NextResponse.json({ error: "Tradie profile not found" }, { status: 404 });
  }

  const { id } = await params;
  const quote = await getQuoteByIdAsync(tradie.id, id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const buffer = await renderQuotePdfBufferAsync({
    quote,
    tradie: quote.tradie,
  });
  const pdfBytes = new Uint8Array(buffer);
  const safeCustomer = sanitizeFilename(quote.customerName || "customer");
  const filename = `quote-${quote.number}-${safeCustomer}.pdf`;

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
