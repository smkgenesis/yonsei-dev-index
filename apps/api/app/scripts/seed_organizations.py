from __future__ import annotations

from app.db.session import SessionLocal
from app.models.user import Organization

SAMPLE_ORGANIZATIONS = [
    {
        "name": "YCC",
        "kind": "campus_org",
        "github_url": "https://github.com/YCC-GitHub",
        "one_liner": "연세대 중앙 컴퓨터 동아리",
    },
    {
        "name": "YBIGTA",
        "kind": "campus_org",
        "github_url": "https://github.com/YBIGTA",
        "one_liner": "연세대 빅데이터 학회",
    },
    {
        "name": "Molgorithm",
        "kind": "campus_org",
        "github_url": "https://github.com/yonsei-molgorithm",
        "one_liner": "연세대학교 알고리즘 동아리",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        for item in SAMPLE_ORGANIZATIONS:
            exists = (
                db.query(Organization)
                .filter(
                    (Organization.name == item["name"])
                    | (Organization.github_url == item["github_url"])
                )
                .first()
            )
            if exists is not None:
                continue

            db.add(
                Organization(
                    name=item["name"],
                    kind=item["kind"],
                    github_url=item["github_url"],
                    one_liner=item["one_liner"],
                    is_public=True,
                )
            )

        db.commit()
        print("Seeded sample organizations.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
