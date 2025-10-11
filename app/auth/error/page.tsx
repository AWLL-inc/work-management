import { Suspense } from "react";
import ErrorContent from "./components/ErrorContent";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
