import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { messageId, userId } = await request.json();
    if (!messageId || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await Message.findByIdAndUpdate(messageId, { $addToSet: { hiddenFor: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to hide message" }, { status: 500 });
  }
}
