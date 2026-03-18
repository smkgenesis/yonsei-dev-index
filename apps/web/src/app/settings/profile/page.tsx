import Link from "next/link";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default function ProfileSettingsPage() {
  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Profile Settings</h1>
            <p className="lede">
              Control directory visibility and optional self-reported fields for your public row.
            </p>
          </div>
          <nav className="settings-nav" aria-label="Settings navigation">
            <Link href="/">Back to directory</Link>
            <Link href="/settings/verification">Verification</Link>
          </nav>
        </header>
        <ProfileSettingsForm />
      </section>
    </main>
  );
}
