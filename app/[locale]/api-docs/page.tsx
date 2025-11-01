"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

/**
 * API Documentation Page
 * Displays interactive API documentation using Scalar
 * Automatically generated from Zod schemas
 */
export default function ApiDocsPage() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ApiReferenceReact
        configuration={{
          url: "/api/openapi",
        }}
      />
    </div>
  );
}
