# Yonsei Dev Index B2B Product Direction

## 1. Context

`ysdevidx` started as a lightweight public index for Yonsei-affiliated developers.

That baseline remains useful, but the long-term value is not in being a simple people list.
The stronger direction is to become infrastructure for Yonsei development organizations:

- clubs
- academic societies
- student teams
- startups
- selected external groups

The goal is not to replace each group's existing tools.
Most groups already have some combination of:

- GitHub
- Notion
- blogs
- Instagram
- internal chat tools
- existing recruiting materials

Instead, `ysdevidx` should sit above those tools as a public-facing layer.

## 2. Core Thesis

`ysdevidx` should evolve from a directory into a public archive layer for Yonsei development activity.

That means the product should archive and connect:

- people
- organizations
- outputs
- history

The real value is not just "who exists," but:

- who is involved
- what they built
- which organization it came from
- how that work accumulates over time

## 3. Why This Exists Despite GitHub / Notion / Blogs

Existing tools already do useful things well.

### GitHub

GitHub is the raw source of code and public repositories.
It does **not** naturally present a Yonsei-specific view of:

- people
- organizations
- outputs
- public identity

### Notion / Internal Docs

Notion is good for internal operations and documentation.
It is not a strong public-facing discovery surface for:

- recruiting
- credibility
- public archive structure

### Blogs / Instagram / Homepages

These are good for branding and announcements.
They are weaker at:

- linking people to actual GitHub identities
- showing member structure
- presenting outputs in a structured, durable way

### `ysdevidx`

`ysdevidx` should become the place where a first-time visitor can quickly understand:

- who the organization is
- who its members are
- what it actually builds
- what history it has accumulated

In short:

> GitHub is the raw source.
> Notion is the internal workspace.
> `ysdevidx` should be the public development-facing archive and showcase layer.

## 4. Value Proposition for Organizations

The clearest value proposition is:

> an almost zero-maintenance, automatically updating GitHub address book and tech showroom

This breaks down into four concrete benefits.

### 4.1 Public Fixed Link

Each organization should eventually have a durable public-facing URL that can be reused for:

- recruiting posts
- introductions
- external sharing
- internal handoff across generations

### 4.2 Live Member GitHub Address Book

Organizations often end up manually collecting or re-collecting:

- member GitHub accounts
- names
- roles
- public-facing links

`ysdevidx` should reduce this burden through:

- self-service member registration
- organization join requests
- manager approval
- later removal when someone leaves

### 4.3 Output-Focused Showroom

Many organization pages explain who they are, but do a weaker job showing what they have actually built.

`ysdevidx` should help organizations show:

- representative outputs
- projects
- demos
- GitHub repositories
- activity highlights

### 4.4 Long-Lived Archive

The product should help organizations avoid losing history whenever:

- leadership changes
- members graduate
- internal docs become stale

The archive should accumulate:

- members
- outputs
- organization identity
- activity history

## 5. Value Proposition for Organization Leads

The product must also be attractive at the operator level.

Organization leads should be able to see clear benefits:

- lower manual maintenance burden
- less repeated GitHub collection work
- easier public presentation of members and outputs
- a reusable recruiting / introduction link
- continuity beyond one semester or one manager

This is important because organizations do not adopt tools just because the tool is interesting.
They adopt when it clearly lowers burden or increases leverage.

## 6. Product Principle

Do not build a heavy free-form page builder.

That direction increases:

- implementation cost
- maintenance cost
- content burden for organizations
- inconsistency in quality

Instead, follow this rule:

> low input, fixed structure, strong presentation

This means organizations should fill a small number of strong slots, while the platform makes the result look polished.

## 7. Confirmed Product Direction

The future product should revolve around three public surfaces:

- `People`
- `Organizations`
- `Articles` or `Works`

### People

Purpose:

- public developer discovery
- identity, verification, and developer-facing context

### Organizations

Purpose:

- public organization discovery
- organization identity, member structure, and showcase access

### Articles / Works

Purpose:

- outputs
- projects
- demos
- posts that show what people or organizations actually made

## 8. Feature Areas to Build Next

### 8.1 Organization Membership System

Needed behavior:

- users request to join an organization
- organization managers approve or reject
- users can later leave or be removed
- approved members appear in the organization page

Why:

- this is the basis of the "live GitHub address book"

### 8.2 Organization Manager Role

Needed behavior:

- organization-level manager access
- manage membership
- manage showcase items
- manage organization profile data

Why:

- platform admins cannot remain the bottleneck forever

### 8.3 Organization Detail Pages

Needed behavior:

- fixed public URL
- one-line identity
- public GitHub link
- member tab
- showcase tab

Why:

- this becomes the public link organizations can reuse

### 8.4 Internal User Profile Pages

Needed behavior:

- nickname links open internal profile pages
- profile includes GitHub link, verification, optional identity fields, and later summaries/works

Why:

- people need more than a raw GitHub redirect

### 8.5 Development Summary

Needed behavior:

- user-editable development activity summary
- optional GitHub-based draft generation

Why:

- helps a person explain what they build, not just where their GitHub is

### 8.6 Profile Quality Badges

Current direction:

- `Active`
- `Complete`

Why:

- rewards users who maintain useful public profiles

### 8.7 Articles / Works Layer

Needed behavior:

- organization-authored or user-authored public work entries
- lightweight structure rather than open-ended blogging

Why:

- this is the basis of the "tech showroom"

### 8.8 Featured Works on the Homepage

Needed behavior:

- a small number of highlighted works above the main directory

Why:

- makes the product feel alive and output-driven

### 8.9 Archive Orientation

Needed behavior:

- outputs and activity should remain visible over time
- eventually group by semester, season, or year if needed

Why:

- the archive is one of the core long-term differentiators

## 9. Recommended Showcase Model

Do not start with a fully customizable builder.

Start with a small set of strong slots:

- one-line organization identity
- 2 representative outputs
- member list
- key links

Why:

- low content burden
- low implementation burden
- strong public-facing effect

## 10. Go-To-Market Implication

Public update posts alone are unlikely to drive strong adoption.

The practical path is organization-facing adoption.

This means:

- start with a small set of trusted organizations
- improve their public presence
- use those organizations as proof
- later expand by showing that the system helps organizations present people and outputs better

The first meaningful usage moment is likely:

- recruiting season
- public-facing intro links
- organization credibility / legitimacy signaling

## 11. Short Positioning Statement

The current working positioning is:

> `ysdevidx` aims to become a public archive where Yonsei development activity accumulates through people, organizations, outputs, and history.

And for organizations:

> It should provide an almost zero-maintenance GitHub address book, a public showcase for outputs, and a durable link for recruiting and public presentation.

## 12. Non-Goals for the Next Step

Do not immediately turn this into:

- a general community platform
- a full internal operations tool
- a flexible no-code page builder
- a heavy social network

The next step should remain narrow, organization-facing, and output-centered.
