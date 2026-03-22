"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type SubmissionItem = {
  id: string;
  name: string;
  kind: string;
  github_url: string;
  one_liner: string;
  additional_context: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  applicant_github_nickname: string | null;
};

type SubmissionListResponse = {
  items: SubmissionItem[];
};

const kindLabels: Record<string, string> = {
  student_team: "Student Team",
  campus_org: "Campus Org",
  startup: "Startup",
  external: "External",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

export function OrganizationSubmissionsAdmin({
  initialItems,
}: {
  initialItems: SubmissionItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshItems() {
    const data = await apiFetch<SubmissionListResponse>("/admin/organization-submissions");
    setItems(data.items);
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const submission = await apiFetch<SubmissionItem>(
        `/admin/organization-submissions/${id}/approve`,
        {
          method: "POST",
        },
      );
      setMessage(`${submission.name} approved and added to Organizations.`);
      await refreshItems();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reviewNote = window.prompt("Optional decline note for the applicant:", "");
    if (reviewNote === null) {
      return;
    }

    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const submission = await apiFetch<SubmissionItem>(
        `/admin/organization-submissions/${id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ review_note: reviewNote }),
        },
      );
      setMessage(`${submission.name} rejected.`);
      await refreshItems();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="settings-stack">
      <section className="panel settings-panel">
        <div className="panel-header">
          <p className="panel-title">Organization Requests</p>
          <p className="panel-meta">{items.length} requests</p>
        </div>
        <div className="settings-form">
          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}

          {items.length === 0 ? (
            <div className="empty-state">
              <p>No organization requests yet.</p>
            </div>
          ) : (
            <div className="submission-list">
              {items.map((item) => (
              <article key={item.id} className="submission-block">
                <div className="submission-header">
                  <div>
                      <div className="organization-heading">
                        <h2>{item.name}</h2>
                        <span className={`submission-status submission-status-${item.status}`}>
                          {statusLabels[item.status] ?? item.status}
                        </span>
                      </div>
                      <p className="submission-meta">
                        {kindLabels[item.kind] ?? item.kind} / by{" "}
                        {item.applicant_github_nickname ?? "unknown"}
                      </p>
                    </div>
                    <a href={item.github_url} target="_blank" rel="noreferrer">
                      {item.github_url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                  <p className="organization-oneliner">{item.one_liner}</p>
                  {item.additional_context ? (
                    <p className="submission-context">{item.additional_context}</p>
                  ) : null}
                  {item.review_note ? (
                    <p className="submission-context">Decline note: {item.review_note}</p>
                  ) : null}
                  {item.status === "pending" ? (
                    <div className="inline-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void handleReject(item.id)}
                        disabled={busyId === item.id}
                      >
                        {busyId === item.id ? "Reviewing..." : "Reject"}
                      </button>
                      <button
                        className="apply-button"
                        type="button"
                        onClick={() => void handleApprove(item.id)}
                        disabled={busyId === item.id}
                      >
                        {busyId === item.id ? "Reviewing..." : "Approve"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
