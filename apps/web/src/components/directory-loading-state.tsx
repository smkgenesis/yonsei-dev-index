"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DirectoryLoadingState() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="empty-state">
      <p>The directory is loading.</p>
      <p className="empty-state-subtle">
        This page will refresh automatically in a moment.
      </p>
    </div>
  );
}
