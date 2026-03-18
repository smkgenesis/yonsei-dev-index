"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { apiFetch } from "../../lib/api";

type VerificationStatus = {
  verified: boolean;
  email: string | null;
  verified_at: string | null;
  verification_notice: string;
};

export function VerificationSettingsForm() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const data = await apiFetch<VerificationStatus>("/me/verification");
        if (cancelled) {
          return;
        }
        setStatus(data);
        if (data.email) {
          setEmail(data.email);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load verification.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshStatus() {
    const data = await apiFetch<VerificationStatus>("/me/verification");
    setStatus(data);
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequesting(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch<{ ok: boolean }>("/me/verification/email/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("Verification code sent.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send code.");
    } finally {
      setRequesting(false);
    }
  }

  async function handleConfirmCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirming(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch<{ verified: boolean }>("/me/verification/email/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      setCode("");
      setMessage("Yonsei email verified.");
      await refreshStatus();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Failed to confirm code.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <div className="settings-state">Loading verification settings...</div>;
  }

  if (!status) {
    return <div className="settings-state error">{error ?? "Verification unavailable."}</div>;
  }

  return (
    <div className="settings-stack">
      <section className="panel settings-panel">
        <div className="panel-header">
          <p className="panel-title">Verification</p>
          <p className="panel-meta">{status.verified ? "Verified" : "Not verified"}</p>
        </div>

        <div className="verification-status">
          <p className={`status-badge ${status.verified ? "verified" : ""}`}>
            {status.verified ? "Yonsei Email Verified" : "Unverified"}
          </p>
          <p className="note">{status.verification_notice}</p>
          {status.verified && status.email ? (
            <p className="note">
              Verified email: <strong>{status.email}</strong>
            </p>
          ) : null}
        </div>

        <form className="settings-form compact" onSubmit={handleRequestCode}>
          <label className="field">
            <span>Yonsei Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@yonsei.ac.kr"
            />
          </label>
          <button className="apply-button" type="submit" disabled={requesting}>
            {requesting ? "Sending..." : "Request verification code"}
          </button>
        </form>

        <form className="settings-form compact" onSubmit={handleConfirmCode}>
          <label className="field">
            <span>Verification Code</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
            />
          </label>
          <button className="apply-button" type="submit" disabled={confirming}>
            {confirming ? "Confirming..." : "Confirm code"}
          </button>
        </form>

        {error ? <p className="form-message error">{error}</p> : null}
        {message ? <p className="form-message success">{message}</p> : null}
      </section>
    </div>
  );
}
