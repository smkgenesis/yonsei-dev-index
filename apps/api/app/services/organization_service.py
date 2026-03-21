from __future__ import annotations

from math import ceil
from typing import Literal

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.user import Organization

OrganizationSortOption = Literal["name_asc", "name_desc", "oldest", "newest"]


def list_organizations(
    db: Session,
    *,
    sort: OrganizationSortOption,
    page: int,
    page_size: int,
    q: str | None,
) -> dict[str, object]:
    stmt = select(Organization).where(Organization.is_public.is_(True))

    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Organization.name.ilike(term),
                Organization.kind.ilike(term),
                Organization.github_url.ilike(term),
                Organization.one_liner.ilike(term),
            )
        )

    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(total_stmt) or 0

    if sort == "name_asc":
        stmt = stmt.order_by(asc(Organization.name))
    elif sort == "name_desc":
        stmt = stmt.order_by(desc(Organization.name))
    elif sort == "oldest":
        stmt = stmt.order_by(asc(Organization.created_at))
    else:
        stmt = stmt.order_by(desc(Organization.created_at))

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = db.scalars(stmt).all()
    total_pages = ceil(total / page_size) if total else 0

    return {
        "items": [
            {
                "id": str(row.id),
                "name": row.name,
                "kind": row.kind,
                "github_url": row.github_url,
                "one_liner": row.one_liner,
            }
            for row in rows
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "sort": sort,
    }
