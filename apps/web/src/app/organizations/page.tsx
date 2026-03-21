import Link from "next/link";
import { cookies } from "next/headers";

type OrganizationSortOption = "name_asc" | "name_desc" | "oldest" | "newest";

type OrganizationItem = {
  id: string;
  name: string;
  kind: string;
  github_url: string;
  one_liner: string;
};

type OrganizationListResponse = {
  items: OrganizationItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  sort: OrganizationSortOption;
};

type AuthMeResponse = {
  authenticated: boolean;
};

type SearchParams = {
  sort?: string;
  page?: string;
  q?: string;
};

const sortLabels: Record<OrganizationSortOption, string> = {
  name_asc: "Name A-Z",
  name_desc: "Name Z-A",
  newest: "Newest First",
  oldest: "Oldest First",
};

const kindLabels: Record<string, string> = {
  student_team: "Student Team",
  campus_org: "Campus Org",
  startup: "Startup",
  external: "External",
};

function normalizeSort(sort?: string): OrganizationSortOption {
  if (sort === "name_desc" || sort === "oldest" || sort === "newest") {
    return sort;
  }
  return "name_asc";
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildQueryString(
  params: Partial<{
    sort: OrganizationSortOption;
    page: number;
    q: string;
  }>,
): string {
  const query = new URLSearchParams();

  if (params.sort && params.sort !== "name_asc") {
    query.set("sort", params.sort);
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.q) {
    query.set("q", params.q);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function getOrganizations({
  sort,
  page,
  q,
}: {
  sort: OrganizationSortOption;
  page: number;
  q: string;
}): Promise<OrganizationListResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const params = new URLSearchParams({
    sort,
    page: String(page),
    page_size: "25",
  });

  if (q) {
    params.set("q", q);
  }

  const response = await fetch(`${apiBaseUrl}/organizations?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load organizations.");
  }

  return response.json();
}

async function getAuthState(): Promise<AuthMeResponse | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sort = normalizeSort(searchParams?.sort);
  const page = normalizePage(searchParams?.page);
  const q = searchParams?.q?.trim() ?? "";
  const loginHref = `${
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
  }/auth/github/start`;
  const authState = await getAuthState();

  let data: OrganizationListResponse | null = null;
  let loadError = false;

  try {
    data = await getOrganizations({ sort, page, q });
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(data?.total_pages ?? 0, 1);

  return (
    <main className="page">
      <section className="shell">
        <header className="masthead">
          <div className="masthead-copy">
            <p className="eyebrow">ysdevidx.com</p>
            <h1>Organizations</h1>
            <p className="lede">
              Yonsei development-related organizations and their public GitHub pages.
            </p>
          </div>
          <div className="masthead-actions">
            <Link className="secondary-button" href="/">
              People
            </Link>
            {authState?.authenticated ? (
              <Link className="login-button" href="/settings/profile">
                My Profile
              </Link>
            ) : (
              <a className="login-button" href={loginHref}>
                Register with GitHub
              </a>
            )}
          </div>
        </header>

        <section className="panel controls-panel">
          <form className="controls organizations-controls" action="/organizations" method="get">
            <label className="control">
              <span>Sort</span>
              <select name="sort" defaultValue={sort}>
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="control search-control">
              <span>Search</span>
              <input
                type="search"
                name="q"
                placeholder="Organization, GitHub link, or one-line"
                defaultValue={q}
              />
            </label>

            <button className="apply-button" type="submit">
              Apply
            </button>
          </form>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <p className="panel-title">Organizations</p>
            <p className="panel-meta">
              {loadError
                ? "Organizations unavailable"
                : `${data?.total ?? 0} organizations - ${sortLabels[sort]} - page ${page}`}
            </p>
          </div>

          {loadError ? (
            <div className="empty-state">
              <p>The organization list could not be loaded.</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="organization-list">
                {data.items.map((organization) => (
                  <article key={organization.id} className="organization-block">
                    <div className="organization-topline">
                      <div className="organization-heading">
                        <h2>{organization.name}</h2>
                        <span className="organization-kind">
                          {kindLabels[organization.kind] ?? organization.kind}
                        </span>
                      </div>
                      <a href={organization.github_url} target="_blank" rel="noreferrer">
                        {organization.github_url.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                    <p className="organization-oneliner">{organization.one_liner}</p>
                  </article>
                ))}
              </div>

              <nav className="pagination" aria-label="Pagination">
                <Link
                  className={`page-link ${page <= 1 ? "disabled" : ""}`}
                  href={buildQueryString({ sort, page: Math.max(1, page - 1), q })}
                  aria-disabled={page <= 1}
                >
                  Previous
                </Link>
                <span className="page-status">
                  Page {data.page} / {totalPages}
                </span>
                <Link
                  className={`page-link ${data.page >= totalPages ? "disabled" : ""}`}
                  href={buildQueryString({ sort, page: Math.min(totalPages, page + 1), q })}
                  aria-disabled={data.page >= totalPages}
                >
                  Next
                </Link>
              </nav>
            </>
          ) : (
            <div className="empty-state">
              <p>No organizations matched the current view.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
