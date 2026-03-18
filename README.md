# yonsei-dev-index
Yonsei Dev Index — A lightweight index of Yonsei University developers based on GitHub.
# Yonsei Dev Index (YDI)

A lightweight index of Yonsei University developers based on GitHub.

---

## Overview

Yonsei Dev Index is a simple tool to make developers within Yonsei University **discoverable**.

There are many developers building interesting projects, but it is often hard to know:

* who is building what
* who shares similar interests
* who you could collaborate with

This project aims to solve that by providing a minimal, GitHub-based index.

---

## Features

* GitHub OAuth login
* Automatic profile creation from GitHub
* View developers and their repositories
* Basic search (name / GitHub ID / stack)
* Lightweight and minimal UI

---

## Optional Verification

Users can optionally verify their Yonsei identity.

Verified users can:

* Display real name
* Display major
* Get a **Yonsei Verified** badge

---

## Philosophy

This is **not** a social network or a full platform.

It is intentionally:

* simple
* fast
* minimal

> The goal is not to build a community,
> but to make a community *possible* by making developers visible.

---

## Tech Stack

* Backend: FastAPI
* Frontend: (e.g. Next.js / React)
* Database: (e.g. PostgreSQL)
* Auth: GitHub OAuth

---

## Getting Started

```bash
# clone repository
git clone https://github.com/your-username/yonsei-dev-index.git

cd yonsei-dev-index

# install dependencies
pip install -r requirements.txt

# run server
uvicorn app.main:app --reload
```

---

## Roadmap

* [ ] Basic developer index
* [ ] Search & filtering
* [ ] Yonsei verification (email-based)
* [ ] Improved UI

---

## License

MIT License
