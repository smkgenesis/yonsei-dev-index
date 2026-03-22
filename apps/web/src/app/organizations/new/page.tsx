import Link from "next/link";

import { OrganizationSubmissionForm } from "@/components/organizations-submission-form";
import { serverApiFetch } from "@/lib/server-api";

export default async function NewOrganizationPage() {
  await serverApiFetch<{ ok: boolean; is_admin: boolean }>("/me/access");

  return (
    <main className="page">
      <section className="shell settings-shell">
        <header className="settings-header compact">
          <h1>Add Organization</h1>
          <nav className="settings-nav" aria-label="Organization navigation">
            <Link href="/organizations">Back to organizations</Link>
          </nav>
        </header>
        <OrganizationSubmissionForm />
      </section>
    </main>
  );
}
