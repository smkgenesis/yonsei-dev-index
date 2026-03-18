import Link from "next/link";
import { cookies } from "next/headers";

type SortOption = "newest" | "oldest" | "nickname_asc";

type DirectoryItem = {
  github_nickname: string;
  github_link: string;
  verified: boolean;
  name: string | null;
  major: string | null;
};

type DirectoryResponse = {
  items: DirectoryItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  sort: SortOption;
};

type AuthMeResponse = {
  authenticated: boolean;
};

type SearchParams = {
  sort?: string;
  page?: string;
  verified?: string;
  q?: string;
};

const sortLabels: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  nickname_asc: "GitHub Nickname A-Z",
};

function normalizeSort(sort?: string): SortOption {
  if (sort === "oldest" || sort === "nickname_asc") {
    return sort;
  }
  return "newest";
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeVerified(value?: string): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function buildQueryString(
  params: Partial<{
    sort: SortOption;
    page: number;
    verified: boolean | undefined;
    q: string;
  }>,
): string {
  const query = new URLSearchParams();

  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.verified === true) {
    query.set("verified", "true");
  }
  if (params.q) {
    query.set("q", params.q);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function getDirectoryData({
  sort,
  page,
  verified,
  q,
}: {
  sort: SortOption;
  page: number;
  verified: boolean | undefined;
  q: string;
}): Promise<DirectoryResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const params = new URLSearchParams({
    sort,
    page: String(page),
    page_size: "50",
  });

  if (verified === true) {
    params.set("verified", "true");
  }
  if (q) {
    params.set("q", q);
  }

  const response = await fetch(`${apiBaseUrl}/developers?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load directory.");
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

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sort = normalizeSort(searchParams?.sort);
  const page = normalizePage(searchParams?.page);
  const verified = normalizeVerified(searchParams?.verified);
  const q = searchParams?.q?.trim() ?? "";
  const loginHref = `${
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
  }/auth/github/start`;
  const authState = await getAuthState();
  const profileHref = "/settings/profile";

  let data: DirectoryResponse | null = null;
  let loadError = false;

  try {
    data = await getDirectoryData({ sort, page, verified, q });
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
            <h1>Yonsei Dev Index</h1>
            <p className="lede">
              Register with GitHub, optionally verify your Yonsei email, and browse other Yonsei
              developers through their GitHub profiles.
            </p>
            <p className="note">
              Verified means the user confirmed control of a @yonsei.ac.kr email address. Name and
              Major are optional self-reported fields.
            </p>
          </div>
          {authState?.authenticated ? (
            <Link className="login-button" href={profileHref}>
              My Profile
            </Link>
          ) : (
            <a className="login-button" href={loginHref}>
              Register with GitHub
            </a>
          )}
        </header>

        <section className="panel controls-panel">
          <form className="controls" action="/" method="get">
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
                placeholder="GitHub nickname, name, or major"
                defaultValue={q}
              />
            </label>

            <label className="checkbox-control">
              <input type="checkbox" name="verified" value="true" defaultChecked={verified === true} />
              <span>Verified only</span>
            </label>

            <button className="apply-button" type="submit">
              Apply
            </button>
          </form>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <p className="panel-title">Directory</p>
            <p className="panel-meta">
              {loadError
                ? "Directory unavailable"
                : `${data?.total ?? 0} developers - ${sortLabels[sort]} - page ${page}`}
            </p>
          </div>

          {loadError ? (
            <div className="empty-state">
              <p>The directory could not be loaded from the API.</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="table-wrap">
                <table className="directory-table">
                  <thead>
                    <tr>
                      <th>GitHub Nickname</th>
                      <th>GitHub Link</th>
                      <th>Verified</th>
                      <th>Name</th>
                      <th>Major</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.github_nickname}>
                        <td>
                          <a href={item.github_link} target="_blank" rel="noreferrer">
                            {item.github_nickname}
                          </a>
                        </td>
                        <td>
                          <a href={item.github_link} target="_blank" rel="noreferrer">
                            {item.github_link.replace(/^https?:\/\//, "")}
                          </a>
                        </td>
                        <td>{item.verified ? "Verified" : "-"}</td>
                        <td>{item.name ?? "-"}</td>
                        <td>{item.major ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="pagination" aria-label="Pagination">
                <Link
                  className={`page-link ${page <= 1 ? "disabled" : ""}`}
                  href={buildQueryString({ sort, page: Math.max(1, page - 1), verified, q })}
                  aria-disabled={page <= 1}
                >
                  Previous
                </Link>
                <span className="page-status">
                  Page {data.page} / {totalPages}
                </span>
                <Link
                  className={`page-link ${data.page >= totalPages ? "disabled" : ""}`}
                  href={buildQueryString({
                    sort,
                    page: Math.min(totalPages, page + 1),
                    verified,
                    q,
                  })}
                  aria-disabled={data.page >= totalPages}
                >
                  Next
                </Link>
              </nav>
            </>
          ) : (
            <div className="empty-state">
              <p>No public developers matched the current view.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
