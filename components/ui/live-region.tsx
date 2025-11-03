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
  const [messageKey, setMessageKey] = useState(0);

  useEffect(() => {
    // Listen for custom live-region-announce events
    const handleAnnounce = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { message, priority } = event.detail as LiveRegionMessage;

        // Increment message key to ensure duplicate messages are announced
        setMessageKey((prev) => prev + 1);

        if (priority === "assertive") {
          setAssertiveMessage(message);
          // Clear message after sufficient time for screen readers (1 second minimum)
          setTimeout(() => setAssertiveMessage(""), 1000);
        } else {
          setPoliteMessage(message);
          // Clear message after sufficient time for screen readers (1 second minimum)
          setTimeout(() => setPoliteMessage(""), 1000);
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
      <output
        key={`polite-${messageKey}`}
        aria-live="polite"
        aria-atomic={ariaAtomic}
        className={className}
      >
        {politeMessage}
      </output>

      {/* Assertive announcements */}
      <output
        key={`assertive-${messageKey}`}
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

// Type definition for window with optional toast
interface WindowWithToast extends Window {
  toast?: {
    error: (message: string) => void;
  };
}

export function useLiveRegion() {
  const announce: AnnounceFunction = (message, priority = "polite") => {
    try {
      const event = new CustomEvent<LiveRegionMessage>("live-region-announce", {
        detail: { message, priority },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Live region announcement failed:", message, error);
      // Fallback: visual notification via toast if available
      const windowWithToast = window as unknown as WindowWithToast;
      if (typeof window !== "undefined" && windowWithToast.toast) {
        windowWithToast.toast.error(message);
      }
    }
  };

  return { announce };
}
