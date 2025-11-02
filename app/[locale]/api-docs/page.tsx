"use client";

import dynamic from "next/dynamic";
import "@scalar/api-reference-react/style.css";

/**
 * API Documentation Page
 * Displays interactive API documentation using Scalar
 * Uses lazy loading to reduce initial bundle size
 */

// Lazy load Scalar API Reference to reduce initial bundle size
const ApiReferenceReact = dynamic(
  () =>
    import("@scalar/api-reference-react").then((mod) => mod.ApiReferenceReact),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading API Documentation...</p>
      </div>
    ),
  },
);

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
