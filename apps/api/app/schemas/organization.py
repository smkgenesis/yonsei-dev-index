from __future__ import annotations

from pydantic import BaseModel


class OrganizationItemResponse(BaseModel):
    id: str
    name: str
    kind: str
    github_url: str
    one_liner: str


class OrganizationListResponse(BaseModel):
    items: list[OrganizationItemResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
    sort: str
