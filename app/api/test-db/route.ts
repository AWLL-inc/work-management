import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { workLogs, users } from "@/drizzle/schema";

export async function GET() {
  try {
    // Simple count query to check if data exists
    const workLogCount = await db
      .select({ count: sql`count(*)` })
      .from(workLogs);

    const userCount = await db
      .select({ count: sql`count(*)` })
      .from(users);

    // Simple select to see actual data
    const sampleWorkLogs = await db
      .select()
      .from(workLogs)
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        workLogCount: workLogCount[0]?.count,
        userCount: userCount[0]?.count,
        sampleWorkLogs,
      },
    });
  } catch (error) {
    console.error("[GET /api/test-db] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Database test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}