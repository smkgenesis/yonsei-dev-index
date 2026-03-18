import Link from "next/link";

import { VerificationSettingsForm } from "@/components/settings/verification-settings-form";

export default function VerificationSettingsPage() {
  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Verification</h1>
            <p className="lede">
              Verify control of a yonsei.ac.kr email address. This is the only trust marker in the
              product.
            </p>
          </div>
          <nav className="settings-nav" aria-label="Settings navigation">
            <Link href="/">Back to directory</Link>
            <Link href="/settings/profile">Profile</Link>
          </nav>
        </header>
        <VerificationSettingsForm />
      </section>
    </main>
  );
}
