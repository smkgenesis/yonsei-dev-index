import Link from "next/link";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { serverApiFetch } from "@/lib/server-api";

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

export default async function ProfileSettingsPage() {
  const profile = await serverApiFetch<ProfileResponse>("/me/profile");

  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>My Profile</h1>
            <p className="lede">
              Manage your directory entry, optional self-reported fields, and visibility.
            </p>
          </div>
          <nav className="settings-nav" aria-label="Settings navigation">
            <Link href="/">Back to directory</Link>
            <Link href="/settings/verification">Verification</Link>
          </nav>
        </header>
        <ProfileSettingsForm initialProfile={profile} />
      </section>
    </main>
  );
}
