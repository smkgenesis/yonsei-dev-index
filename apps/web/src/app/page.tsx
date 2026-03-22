import { DirectoryPageClient } from "@/components/directory-page-client";

type SortOption = "newest" | "oldest" | "nickname_asc" | "nickname_desc";

type SearchParams = {
  sort?: string;
  page?: string;
  verified?: string;
  q?: string;
};

function normalizeSort(sort?: string): SortOption {
  if (sort === "oldest" || sort === "nickname_asc" || sort === "nickname_desc") {
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

export default function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  return (
    <DirectoryPageClient
      initialPage={normalizePage(searchParams?.page)}
      initialQuery={searchParams?.q?.trim() ?? ""}
      initialSort={normalizeSort(searchParams?.sort)}
      initialVerified={normalizeVerified(searchParams?.verified)}
    />
  );
}
