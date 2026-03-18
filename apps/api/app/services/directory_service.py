from __future__ import annotations

from math import ceil
from typing import Literal

from sqlalchemy import Select, asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.user import OAuthAccount, Profile, User, Verification

SortOption = Literal["nickname_asc", "oldest", "newest"]


def _build_directory_base_query(
    *,
    verified: bool | None,
    q: str | None,
) -> Select:
    stmt = (
        select(
            OAuthAccount.github_username.label("github_nickname"),
            OAuthAccount.github_url.label("github_link"),
            Verification.id.is_not(None).label("verified"),
            Profile.real_name.label("real_name"),
            Profile.major.label("major"),
            Profile.show_name.label("show_name"),
            Profile.show_major.label("show_major"),
            User.created_at.label("created_at"),
        )
        .select_from(User)
        .join(
            OAuthAccount,
            (OAuthAccount.user_id == User.id) & (OAuthAccount.provider == "github"),
        )
        .outerjoin(Profile, Profile.user_id == User.id)
        .outerjoin(
            Verification,
            (Verification.user_id == User.id) & (Verification.status == "verified"),
        )
        .where(User.is_public.is_(True))
    )

    if verified is True:
        stmt = stmt.where(Verification.id.is_not(None))
    elif verified is False:
        stmt = stmt.where(Verification.id.is_(None))

    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                OAuthAccount.github_username.ilike(term),
                Profile.real_name.ilike(term),
                Profile.major.ilike(term),
            )
        )

    return stmt


def _apply_sort(stmt: Select, sort: SortOption) -> Select:
    if sort == "nickname_asc":
        return stmt.order_by(asc(OAuthAccount.github_username))
    if sort == "oldest":
        return stmt.order_by(asc(User.created_at))
    return stmt.order_by(desc(User.created_at))


def list_developers(
    db: Session,
    *,
    sort: SortOption,
    page: int,
    page_size: int,
    verified: bool | None,
    q: str | None,
) -> dict[str, object]:
    base_stmt = _build_directory_base_query(verified=verified, q=q)

    total_stmt = select(func.count()).select_from(base_stmt.subquery())
    total = db.scalar(total_stmt) or 0

    stmt = _apply_sort(base_stmt, sort)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(stmt).mappings().all()
    items = [
        {
            "github_nickname": row["github_nickname"],
            "github_link": row["github_link"],
            "verified": row["verified"],
            "name": row["real_name"] if row["show_name"] and row["real_name"] else None,
            "major": row["major"] if row["show_major"] and row["major"] else None,
        }
        for row in rows
    ]

    total_pages = ceil(total / page_size) if total else 0
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "sort": sort,
    }
