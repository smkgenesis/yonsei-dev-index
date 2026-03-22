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

const kindLabels: Record<string, string> = {
  student_team: "Student Team",
  campus_org: "Campus Org",
  startup: "Startup",
  external: "External",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

export function ProfileOrganizationSubmissions({
  items,
}: {
  items: SubmissionItem[];
}) {
  return (
    <section className="panel settings-panel">
      <div className="panel-header">
        <p className="panel-title">My Organization Requests</p>
        <p className="panel-meta">{items.length} requests</p>
      </div>
      <div className="settings-form">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>You have not submitted any organization requests yet.</p>
          </div>
        ) : (
          <div className="submission-list">
            {items.map((item) => (
              <article key={item.id} className="submission-block">
                <div className="submission-header">
                  <div>
                    <h2>{item.name}</h2>
                    <p className="submission-meta">
                      {kindLabels[item.kind] ?? item.kind} /{" "}
                      {statusLabels[item.status] ?? item.status}
                    </p>
                  </div>
                  <a href={item.github_url} target="_blank" rel="noreferrer">
                    {item.github_url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
                <p className="organization-oneliner">{item.one_liner}</p>
                {item.additional_context ? (
                  <p className="submission-context">Submitted note: {item.additional_context}</p>
                ) : null}
                {item.status === "rejected" && item.review_note ? (
                  <p className="submission-context">Declined with note: {item.review_note}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
