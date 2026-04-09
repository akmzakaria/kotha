import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const result = await User.updateMany(
      { status: 'away' },
      { $set: { status: 'offline' } }
    );

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${result.modifiedCount} users updated from "away" to "offline"`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
