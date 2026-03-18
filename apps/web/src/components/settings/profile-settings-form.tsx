"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

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
  is_public: boolean;
  real_name: string;
  major: string;
  show_name: boolean;
  show_major: boolean;
};

const initialForm: ProfileFormState = {
  is_public: true,
  real_name: "",
  major: "",
  show_name: false,
  show_major: false,
};

export function ProfileSettingsForm() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await apiFetch<ProfileResponse>("/me/profile");
        if (cancelled) {
          return;
        }
        setProfile(data);
        setForm({
          is_public: data.is_public,
          real_name: data.real_name ?? "",
          major: data.major ?? "",
          show_name: data.show_name,
          show_major: data.show_major,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<ProfileResponse>("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          is_public: form.is_public,
          real_name: form.real_name,
          major: form.major,
          show_name: form.show_name,
          show_major: form.show_major,
        }),
      });
      setProfile(data);
      setForm({
        is_public: data.is_public,
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

  if (loading) {
    return <div className="settings-state">Loading profile settings...</div>;
  }

  if (!profile) {
    return <div className="settings-state error">{error ?? "Profile unavailable."}</div>;
  }

  return (
    <div className="settings-stack">
      <section className="panel settings-panel">
        <div className="panel-header">
          <p className="panel-title">Profile</p>
          <p className="panel-meta">{profile.github_nickname ?? "-"}</p>
        </div>
        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="readonly-grid">
            <div className="readonly-item">
              <span>GitHubNickname</span>
              <strong>{profile.github_nickname ?? "-"}</strong>
            </div>
            <div className="readonly-item">
              <span>GitHubLink</span>
              {profile.github_link ? (
                <a href={profile.github_link} target="_blank" rel="noreferrer">
                  {profile.github_link.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <strong>-</strong>
              )}
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) => setForm((prev) => ({ ...prev, is_public: event.target.checked }))}
            />
            <span>Publicly list my profile in the directory</span>
          </label>

          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={form.real_name}
              onChange={(event) => setForm((prev) => ({ ...prev, real_name: event.target.value }))}
              placeholder="Optional self-reported name"
            />
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
              value={form.major}
              onChange={(event) => setForm((prev) => ({ ...prev, major: event.target.value }))}
              placeholder="Optional self-reported major"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.show_major}
              onChange={(event) => setForm((prev) => ({ ...prev, show_major: event.target.checked }))}
            />
            <span>Show my major in the public directory</span>
          </label>

          <div className="notice-block">
            <p>{profile.self_reported_notice}</p>
            <p>{profile.verification_notice}</p>
          </div>

          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}

          <button className="apply-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile settings"}
          </button>
        </form>
      </section>
    </div>
  );
}
