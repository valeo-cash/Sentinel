import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { fetchComplianceData } from "@/lib/compliance/data";
import { generateCompliancePDF } from "@/lib/compliance/pdf";
import { generateCompliancePPTX } from "@/lib/compliance/pptx";
import archiver from "archiver";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = auth.team.id;
  const teamName = auth.team.name ?? "Team";

  let body: { startDate?: string; endDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { startDate, endDate } = body;
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  if (new Date(startDate) > new Date(endDate)) {
    return NextResponse.json(
      { error: "startDate must be before endDate" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchComplianceData(teamId, teamName, startDate, endDate);

    const [pdfBuffer, pptxBuffer] = await Promise.all([
      generateCompliancePDF(data),
      generateCompliancePPTX(data),
    ]);

    const csv = generateReceiptCSV(data);

    const zipBuffer = await createZip(pdfBuffer, pptxBuffer, csv);

    const safeName = teamName.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
    const filename = `sentinel-compliance-${safeName}-${startDate}-to-${endDate}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Compliance report error:", error);
    const message = error instanceof Error
      ? error.message + "\n" + error.stack
      : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function generateReceiptCSV(data: Awaited<ReturnType<typeof fetchComplianceData>>): string {
  const headers = ["Receipt ID", "Payment ID", "Agent ID", "Verified", "Created At"];
  const rows = data.receipts.map((r) =>
    [r.id, r.paymentId ?? "", r.agentId, r.verified ? "Yes" : "No", r.createdAt.toISOString()].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

async function createZip(
  pdfBuffer: Buffer,
  pptxBuffer: Buffer,
  csv: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.append(pdfBuffer, { name: "compliance-report.pdf" });
    archive.append(pptxBuffer, { name: "executive-deck.pptx" });
    archive.append(csv, { name: "receipts/receipts-summary.csv" });

    archive.finalize();
  });
}
