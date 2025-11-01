"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

/**
 * API Documentation Page
 * Displays interactive Swagger UI for the Work Management API
 */
export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Work Management API Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Interactive API documentation powered by OpenAPI 3.0 and Swagger UI
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <SwaggerUI url="/api/openapi" />
      </div>
    </div>
  );
}
