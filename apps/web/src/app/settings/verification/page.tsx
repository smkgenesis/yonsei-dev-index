import Link from "next/link";

import { VerificationSettingsForm } from "@/components/settings/verification-settings-form";
import { serverApiFetch } from "@/lib/server-api";

type VerificationStatus = {
  verified: boolean;
  email: string | null;
  verified_at: string | null;
  verification_notice: string;
};

export default async function VerificationSettingsPage() {
  const verification = await serverApiFetch<VerificationStatus>("/me/verification");

  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header compact">
          <h1>Verification</h1>
          <nav className="settings-nav" aria-label="Settings navigation">
            <Link href="/">Back to directory</Link>
            <Link href="/settings/profile">Profile</Link>
          </nav>
        </header>
        <VerificationSettingsForm initialStatus={verification} />
      </section>
    </main>
  );
}
