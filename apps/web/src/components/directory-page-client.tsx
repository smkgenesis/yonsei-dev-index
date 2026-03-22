"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { DirectoryLoadingState } from "@/components/directory-loading-state";

type SortOption = "newest" | "oldest" | "nickname_asc" | "nickname_desc";

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

const sortLabels: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  nickname_asc: "GitHub Nickname A-Z",
  nickname_desc: "GitHub Nickname Z-A",
};

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

export function DirectoryPageClient({
  initialSort,
  initialPage,
  initialVerified,
  initialQuery,
}: {
  initialSort: SortOption;
  initialPage: number;
  initialVerified: boolean | undefined;
  initialQuery: string;
}) {
  const [authState, setAuthState] = useState<AuthMeResponse | null>(null);
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);

  const loginHref = `${apiBaseUrl}/auth/github/start`;
  const profileHref = "/settings/profile";

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

    const loadDirectory = async () => {
      setIsLoadingDirectory(true);
      setDirectory(null);

      const params = new URLSearchParams({
        sort: initialSort,
        page: String(initialPage),
        page_size: "50",
      });

      if (initialVerified === true) {
        params.set("verified", "true");
      }
      if (initialQuery) {
        params.set("q", initialQuery);
      }

      try {
        const response = await fetch(`${apiBaseUrl}/developers?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load directory.");
        }

        const data = (await response.json()) as DirectoryResponse;
        if (!cancelled) {
          setDirectory(data);
          setIsLoadingDirectory(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoadingDirectory(true);
        }
      }
    };

    void loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [initialPage, initialQuery, initialSort, initialVerified]);

  const totalPages = Math.max(directory?.total_pages ?? 0, 1);

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
          <div className="masthead-actions">
            <Link className="secondary-button" href="/organizations">
              Organization
            </Link>
            {authState?.authenticated ? (
              <Link className="login-button" href={profileHref}>
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
          <form className="controls" action="/" method="get">
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
                placeholder="GitHub nickname, name, or major"
                defaultValue={initialQuery}
              />
            </label>

            <label className="checkbox-control">
              <input
                type="checkbox"
                name="verified"
                value="true"
                defaultChecked={initialVerified === true}
              />
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
              {isLoadingDirectory
                ? "Loading directory"
                : `${directory?.total ?? 0} developers - ${sortLabels[initialSort]} - page ${initialPage}`}
            </p>
          </div>

          {isLoadingDirectory ? (
            <DirectoryLoadingState label="The directory" />
          ) : directory && directory.items.length > 0 ? (
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
                    {directory.items.map((item) => (
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
                  className={`page-link ${initialPage <= 1 ? "disabled" : ""}`}
                  href={buildQueryString({
                    sort: initialSort,
                    page: Math.max(1, initialPage - 1),
                    verified: initialVerified,
                    q: initialQuery,
                  })}
                  aria-disabled={initialPage <= 1}
                >
                  Previous
                </Link>
                <span className="page-status">
                  Page {directory.page} / {totalPages}
                </span>
                <Link
                  className={`page-link ${directory.page >= totalPages ? "disabled" : ""}`}
                  href={buildQueryString({
                    sort: initialSort,
                    page: Math.min(totalPages, initialPage + 1),
                    verified: initialVerified,
                    q: initialQuery,
                  })}
                  aria-disabled={directory.page >= totalPages}
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
