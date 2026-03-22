"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

type OrganizationSubmissionResponse = {
  id: string;
  name: string;
  kind: string;
  github_url: string;
  one_liner: string;
  additional_context: string | null;
  status: string;
  created_at: string;
  applicant_github_nickname: string | null;
};

const kindOptions = [
  { value: "student_team", label: "Student Team" },
  { value: "campus_org", label: "Campus Org" },
  { value: "startup", label: "Startup" },
  { value: "external", label: "External" },
];

export function OrganizationSubmissionForm() {
  const [form, setForm] = useState({
    name: "",
    kind: "campus_org",
    github_url: "",
    one_liner: "",
    additional_context: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<OrganizationSubmissionResponse>("/organization-submissions", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          kind: form.kind,
          github_url: form.github_url,
          one_liner: form.one_liner,
          additional_context: form.additional_context || null,
        }),
      });
      setForm({
        name: "",
        kind: "campus_org",
        github_url: "",
        one_liner: "",
        additional_context: "",
      });
      setMessage(`Request submitted for ${data.name}. It will appear after approval.`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit organization.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel settings-panel">
      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            maxLength={255}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Organization name"
            required
          />
        </label>

        <label className="field">
          <span>Kind</span>
          <select
            value={form.kind}
            onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}
          >
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>GitHub URL</span>
          <input
            type="url"
            maxLength={500}
            value={form.github_url}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, github_url: event.target.value }))
            }
            placeholder="https://github.com/your-organization"
            required
          />
        </label>

        <label className="field">
          <span>One-line</span>
          <input
            type="text"
            maxLength={120}
            value={form.one_liner}
            onChange={(event) => setForm((prev) => ({ ...prev, one_liner: event.target.value }))}
            placeholder="One-line identity for the organization"
            required
          />
          <small className="field-hint">{form.one_liner.length}/120</small>
        </label>

        <label className="field">
          <span>Additional context (optional)</span>
          <textarea
            rows={5}
            maxLength={1000}
            value={form.additional_context}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, additional_context: event.target.value }))
            }
            placeholder="Anything useful for review, approval, or contact."
          />
          <small className="field-hint">{form.additional_context.length}/1000</small>
        </label>

        <p className="inline-note">
          Approved requests are added to Organizations with public visibility.
        </p>

        {error ? <p className="form-message error">{error}</p> : null}
        {message ? <p className="form-message success">{message}</p> : null}

        <div className="inline-actions">
          <Link className="secondary-button" href="/organizations">
            Back to organizations
          </Link>
          <button className="apply-button" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit organization"}
          </button>
        </div>
      </form>
    </section>
  );
}
