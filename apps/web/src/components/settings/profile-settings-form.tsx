"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { apiFetch } from "../../lib/api";

type ProfileResponse = {
  github_nickname: string | null;
  github_link: string | null;
  is_public: boolean;
  verified: boolean;
  real_name: string | null;
  major: string | null;
  show_name: boolean;
  show_major: boolean;
  self_reported_notice: string;
  verification_notice: string;
};

type ProfileFormState = {
  real_name: string;
  major: string;
  show_name: boolean;
  show_major: boolean;
};

export function ProfileSettingsForm({ initialProfile }: { initialProfile: ProfileResponse }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(initialProfile);
  const [form, setForm] = useState<ProfileFormState>({
    real_name: initialProfile.real_name ?? "",
    major: initialProfile.major ?? "",
    show_name: initialProfile.show_name,
    show_major: initialProfile.show_major,
  });
  const [saving, setSaving] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<ProfileResponse>("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          is_public: profile.is_public,
          real_name: form.real_name,
          major: form.major,
          show_name: form.show_name,
          show_major: form.show_major,
        }),
      });
      setProfile(data);
      setForm({
        real_name: data.real_name ?? "",
        major: data.major ?? "",
        show_name: data.show_name,
        show_major: data.show_major,
      });
      setMessage("Profile settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleHideListing() {
    if (!profile) {
      return;
    }

    const currentProfile = profile;
    setHiding(true);
    setError(null);
    setMessage(null);

    try {
      const data = currentProfile.is_public
        ? await apiFetch<ProfileResponse>("/me/profile/hide", {
            method: "POST",
          })
        : await apiFetch<ProfileResponse>("/me/profile", {
            method: "PATCH",
            body: JSON.stringify({
              is_public: true,
              real_name: form.real_name,
              major: form.major,
              show_name: form.show_name,
              show_major: form.show_major,
            }),
          });
      setProfile(data);
      setForm({
        real_name: data.real_name ?? "",
        major: data.major ?? "",
        show_name: data.show_name,
        show_major: data.show_major,
      });
      setMessage(
        data.is_public
          ? "Your listing is public again."
          : "Your listing is now hidden from the directory.",
      );
    } catch (hideError) {
      setError(
        hideError instanceof Error
          ? hideError.message
          : currentProfile.is_public
            ? "Failed to hide listing."
            : "Failed to show listing.",
      );
    } finally {
      setHiding(false);
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm(
      "Disconnect GitHub and remove your directory entry? You can register again later by logging in with GitHub.",
    );
    if (!confirmed) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch<{ ok: boolean }>("/me/account", {
        method: "DELETE",
      });
      window.location.href = "/";
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Failed to disconnect GitHub account.",
      );
      setDisconnecting(false);
    }
  }

  if (!profile) {
    return <div className="settings-state error">{error ?? "Profile unavailable."}</div>;
  }

  return (
    <div className="settings-stack">
      <section className="panel settings-panel">
        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="readonly-grid">
            <div className="readonly-item">
              <span>GitHub Nickname</span>
              <strong>{profile.github_nickname ?? "-"}</strong>
            </div>
            <div className="readonly-item">
              <span>GitHub Link</span>
              {profile.github_link ? (
                <a href={profile.github_link} target="_blank" rel="noreferrer">
                  {profile.github_link.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <strong>-</strong>
              )}
            </div>
          </div>

          <p className="inline-note">
            GitHub nickname and GitHub link are fixed by GitHub login and cannot be edited here.
          </p>

          <div className="readonly-grid single-row">
            <div className="readonly-item">
              <span>Verified</span>
              <strong>{profile.verified ? "Yonsei Email Verified" : "Not verified"}</strong>
            </div>
            {!profile.verified ? (
              <div className="readonly-item action-item">
                <span>Verification</span>
                <Link className="secondary-button" href="/settings/verification">
                  Verify Yonsei Email
                </Link>
              </div>
            ) : null}
          </div>

          <p className="inline-note">
            Verification only confirms control of a @yonsei.ac.kr email address.
          </p>

          <label className="field">
            <span>Name</span>
            <input
              type="text"
              maxLength={10}
              value={form.real_name}
              onChange={(event) => setForm((prev) => ({ ...prev, real_name: event.target.value }))}
              placeholder="Optional self-reported name"
            />
            <small className="field-hint">{form.real_name.length}/10</small>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.show_name}
              onChange={(event) => setForm((prev) => ({ ...prev, show_name: event.target.checked }))}
            />
            <span>Show my name in the public directory</span>
          </label>

          <label className="field">
            <span>Major</span>
            <input
              type="text"
              maxLength={20}
              value={form.major}
              onChange={(event) => setForm((prev) => ({ ...prev, major: event.target.value }))}
              placeholder="Optional self-reported major"
            />
            <small className="field-hint">{form.major.length}/20</small>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.show_major}
              onChange={(event) => setForm((prev) => ({ ...prev, show_major: event.target.checked }))}
            />
            <span>Show my major in the public directory</span>
          </label>

          <p className="inline-note">{profile.self_reported_notice}</p>

          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}

          <button className="apply-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile settings"}
          </button>
        </form>
      </section>

      <section className="panel settings-panel">
        <div className="panel-header">
          <p className="panel-title">Danger Zone</p>
        </div>
        <div className="settings-form">
          <div className="danger-block">
            <p className="danger-title">{profile.is_public ? "Hide listing" : "Show listing"}</p>
            <p className="danger-copy">
              {profile.is_public
                ? "Remove your row from the public directory without deleting your account data."
                : "Make your row visible in the public directory again."}
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={handleHideListing}
              disabled={hiding}
            >
              {hiding
                ? profile.is_public
                  ? "Hiding..."
                  : "Showing..."
                : profile.is_public
                  ? "Hide my listing"
                  : "Show my listing"}
            </button>
          </div>

          <div className="danger-block">
            <p className="danger-title">Disconnect GitHub</p>
            <p className="danger-copy">
              Delete your directory entry and sign out. You can register again later with GitHub.
            </p>
            <button
              className="danger-button"
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect GitHub"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
