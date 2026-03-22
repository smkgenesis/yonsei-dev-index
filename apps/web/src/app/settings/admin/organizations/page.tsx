import Link from "next/link";
import { redirect } from "next/navigation";

import { OrganizationSubmissionsAdmin } from "@/components/organization-submissions-admin";
import { serverApiFetch } from "@/lib/server-api";

type SubmissionItem = {
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

type SubmissionListResponse = {
  items: SubmissionItem[];
};

export default async function AdminOrganizationsPage() {
  const access = await serverApiFetch<{ ok: boolean; is_admin: boolean }>("/me/access");
  if (!access.is_admin) {
    redirect("/");
  }

  const submissions = await serverApiFetch<SubmissionListResponse>("/admin/organization-submissions");

  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header compact">
          <h1>Organization Admin</h1>
          <nav className="settings-nav" aria-label="Admin navigation">
            <Link href="/organizations">Back to organizations</Link>
          </nav>
        </header>
        <OrganizationSubmissionsAdmin initialItems={submissions.items} />
      </section>
    </main>
  );
}
