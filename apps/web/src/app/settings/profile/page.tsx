import Link from "next/link";

import { ProfileOrganizationSubmissions } from "@/components/profile-organization-submissions";
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

export default async function ProfileSettingsPage() {
  const profile = await serverApiFetch<ProfileResponse>("/me/profile");
  const access = await serverApiFetch<{ ok: boolean; is_admin: boolean }>("/me/access");
  const submissions = await serverApiFetch<SubmissionListResponse>("/me/organization-submissions");

  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header compact">
          <h1>My Profile</h1>
          <nav className="settings-nav" aria-label="Settings navigation">
            {access.is_admin ? (
              <Link href="/settings/admin/organizations">Organization Admin</Link>
            ) : null}
            <Link href="/">Back to directory</Link>
          </nav>
        </header>
        <ProfileSettingsForm initialProfile={profile} />
        <ProfileOrganizationSubmissions items={submissions.items} />
      </section>
    </main>
  );
}
