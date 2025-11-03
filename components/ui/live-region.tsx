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
 * announce("Critical error occurred", "assertive");
 * ```
 */

"use client";

import { useEffect, useState } from "react";

export type LiveRegionPriority = "polite" | "assertive";

export interface LiveRegionMessage {
  message: string;
  priority: LiveRegionPriority;
}

interface LiveRegionProps {
  "aria-atomic"?: boolean;
  className?: string;
}

export function LiveRegion({
  "aria-atomic": ariaAtomic = true,
  className = "sr-only",
}: LiveRegionProps) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  useEffect(() => {
    // Listen for custom live-region-announce events
    const handleAnnounce = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { message, priority } = event.detail as LiveRegionMessage;

        if (priority === "assertive") {
          setAssertiveMessage(message);
          setTimeout(() => setAssertiveMessage(""), 100);
        } else {
          setPoliteMessage(message);
          setTimeout(() => setPoliteMessage(""), 100);
        }
      }
    };

    window.addEventListener("live-region-announce", handleAnnounce);

    return () => {
      window.removeEventListener("live-region-announce", handleAnnounce);
    };
  }, []);

  return (
    <>
      {/* Polite announcements */}
      <output aria-live="polite" aria-atomic={ariaAtomic} className={className}>
        {politeMessage}
      </output>

      {/* Assertive announcements */}
      <output
        aria-live="assertive"
        aria-atomic={ariaAtomic}
        className={className}
      >
        {assertiveMessage}
      </output>
    </>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export type AnnounceFunction = (
  message: string,
  priority?: LiveRegionPriority,
) => void;

export function useLiveRegion() {
  const announce: AnnounceFunction = (message, priority = "polite") => {
    try {
      const event = new CustomEvent<LiveRegionMessage>("live-region-announce", {
        detail: { message, priority },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.warn("Live region announcement failed:", message, error);
    }
  };

  return { announce };
}
