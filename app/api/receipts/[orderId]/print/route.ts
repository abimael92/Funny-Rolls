import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    message: "Print stub: open GET /api/receipts/" + orderId + "/html in a new window and use browser Print.",
    url: `/api/receipts/${orderId}/html`,
  });
}
