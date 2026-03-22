"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBaseUrl } from "@/lib/api";

const HEALTH_POLL_MS = 5000;
const MAX_LOADING_MS = 65000;

export function DirectoryLoadingState({
  label = "The directory",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const healthUrl = useMemo(() => `${apiBaseUrl}/health`, []);

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setHasTimedOut(true);
      }
    }, MAX_LOADING_MS);

    const poll = async () => {
      try {
        const response = await fetch(healthUrl, {
          cache: "no-store",
        });

        if (response.ok && !cancelled) {
          router.refresh();
          return;
        }
      } catch {
        // Keep the page in a loading state while the backend wakes up.
      }

      if (!cancelled) {
        window.setTimeout(poll, HEALTH_POLL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [healthUrl, router]);

  return (
    <div className="empty-state">
      <p>{hasTimedOut ? `${label} is still loading.` : `${label} is loading.`}</p>
      <p className="empty-state-subtle">
        {hasTimedOut
          ? "Please wait a bit longer, then refresh this page if it still does not appear."
          : "This page will refresh automatically as soon as the content is ready."}
      </p>
    </div>
  );
}
