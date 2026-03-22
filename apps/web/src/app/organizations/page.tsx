import { cookies } from "next/headers";

import { OrganizationsPageClient } from "@/components/organizations-page-client";

type OrganizationSortOption = "name_asc" | "name_desc" | "oldest" | "newest";

type SearchParams = {
  sort?: string;
  page?: string;
  q?: string;
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

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const cookieStore = await cookies();

  return (
    <OrganizationsPageClient
      initialAuthenticated={cookieStore.has("ysdi_session")}
      initialPage={normalizePage(searchParams?.page)}
      initialQuery={searchParams?.q?.trim() ?? ""}
      initialSort={normalizeSort(searchParams?.sort)}
    />
  );
}
