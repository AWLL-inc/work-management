/**
 * LiveRegion - Screen Reader Announcements Component
 *
 * Provides accessible announcements for screen readers using ARIA live regions.
 * Messages are announced automatically when they change.
 *
 * @example
 * ```tsx
 * const { announce } = useLiveRegion();
 * announce("Item saved successfully");
 * ```
 */

"use client";

import { useEffect, useState } from "react";

interface LiveRegionProps {
  "aria-live"?: "polite" | "assertive";
  "aria-atomic"?: boolean;
  className?: string;
}

export function LiveRegion({
  "aria-live": ariaLive = "polite",
  "aria-atomic": ariaAtomic = true,
  className = "sr-only",
}: LiveRegionProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Listen for custom live-region-announce events
    const handleAnnounce = (event: Event) => {
      if (event instanceof CustomEvent) {
        setMessage(event.detail);
        // Clear message after announcement to allow re-announcement of same message
        setTimeout(() => setMessage(""), 100);
      }
    };

    window.addEventListener("live-region-announce", handleAnnounce);

    return () => {
      window.removeEventListener("live-region-announce", handleAnnounce);
    };
  }, []);

  return (
    <output aria-live={ariaLive} aria-atomic={ariaAtomic} className={className}>
      {message}
    </output>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useLiveRegion() {
  const announce = (
    message: string,
    _priority: "polite" | "assertive" = "polite",
  ) => {
    const event = new CustomEvent("live-region-announce", {
      detail: message,
    });
    window.dispatchEvent(event);
  };

  return { announce };
}
