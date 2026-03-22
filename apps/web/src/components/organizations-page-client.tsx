"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { DirectoryLoadingState } from "@/components/directory-loading-state";

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
  is_admin?: boolean;
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

export function OrganizationsPageClient({
  initialSort,
  initialPage,
  initialQuery,
}: {
  initialSort: OrganizationSortOption;
  initialPage: number;
  initialQuery: string;
}) {
  const [authState, setAuthState] = useState<AuthMeResponse | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListResponse | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);

  const loginHref = `${apiBaseUrl}/auth/github/start`;

  useEffect(() => {
    let cancelled = false;

    const loadAuthState = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) {
            setAuthState(null);
          }
          return;
        }

        const data = (await response.json()) as AuthMeResponse;
        if (!cancelled) {
          setAuthState(data);
        }
      } catch {
        if (!cancelled) {
          setAuthState(null);
        }
      }
    };

    void loadAuthState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      setIsLoadingOrganizations(true);
      setOrganizations(null);

      const params = new URLSearchParams({
        sort: initialSort,
        page: String(initialPage),
        page_size: "25",
      });

      if (initialQuery) {
        params.set("q", initialQuery);
      }

      try {
        const response = await fetch(`${apiBaseUrl}/organizations?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load organizations.");
        }

        const data = (await response.json()) as OrganizationListResponse;
        if (!cancelled) {
          setOrganizations(data);
          setIsLoadingOrganizations(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoadingOrganizations(true);
        }
      }
    };

    void loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [initialPage, initialQuery, initialSort]);

  const totalPages = Math.max(organizations?.total_pages ?? 0, 1);

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
              <Link className="secondary-button" href="/organizations/new">
                Add Organization
              </Link>
            ) : null}
            {authState?.is_admin ? (
              <Link className="secondary-button" href="/settings/admin/organizations">
                Review Requests
              </Link>
            ) : null}
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
              <select name="sort" defaultValue={initialSort}>
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
                defaultValue={initialQuery}
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
              {isLoadingOrganizations
                ? "Loading organizations"
                : `${organizations?.total ?? 0} organizations - ${sortLabels[initialSort]} - page ${initialPage}`}
            </p>
          </div>

          {isLoadingOrganizations ? (
            <DirectoryLoadingState label="The organization list" />
          ) : organizations && organizations.items.length > 0 ? (
            <>
              <div className="organization-list">
                {organizations.items.map((organization) => (
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
                  className={`page-link ${initialPage <= 1 ? "disabled" : ""}`}
                  href={buildQueryString({
                    sort: initialSort,
                    page: Math.max(1, initialPage - 1),
                    q: initialQuery,
                  })}
                  aria-disabled={initialPage <= 1}
                >
                  Previous
                </Link>
                <span className="page-status">
                  Page {organizations.page} / {totalPages}
                </span>
                <Link
                  className={`page-link ${organizations.page >= totalPages ? "disabled" : ""}`}
                  href={buildQueryString({
                    sort: initialSort,
                    page: Math.min(totalPages, initialPage + 1),
                    q: initialQuery,
                  })}
                  aria-disabled={organizations.page >= totalPages}
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
