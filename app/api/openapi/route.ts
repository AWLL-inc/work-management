import { type NextRequest, NextResponse } from "next/server";
import openapiConfig from "@/.openapirc.json";

/**
 * GET /api/openapi
 * Returns the OpenAPI 3.0 specification for the Work Management API
 * @public No authentication required
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(openapiConfig, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
