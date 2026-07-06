# CLAUDE.md

## Mission

Build a lightweight SaaS application for HR document generation and electronic signing.

Always prioritize:

- simplicity
- readability
- maintainability
- security
- GDPR compliance

---

## Golden Rules

- Never over-engineer.
- Never create duplicate logic.
- Keep files small.
- Prefer composition.
- Prefer reusable components.
- Always use strict TypeScript.
- Always use App Router.
- Prefer Server Components.
- Use Client Components only when required.
- Prefer Server Actions over API routes.
- Keep business logic outside UI.
- Every feature should be independently reusable.

---

## Tech Stack

Next.js 15

React

TypeScript

TailwindCSS

shadcn/ui

Supabase

Drizzle ORM

pdf-lib

react-signature-canvas

React Hook Form

Zod

Brevo

Vercel

---

## Coding Style

Never use:

- any
- inline styles
- class components
- Redux
- unnecessary libraries

Always use:

const

arrow functions

strict typing

feature folders

---

## Folder Structure

app/

components/

features/

lib/

hooks/

types/

drizzle/

---

## Components

Reusable first.

Avoid large components.

Target:

100–150 lines.

Split if needed.

---

## Server

Business logic lives in

lib/

Server Actions

services

Never inside UI.

---

## Database

Drizzle ORM

Supabase PostgreSQL

UUID primary keys

Soft delete where appropriate.

---

## Security

No sequential IDs.

UUID everywhere.

Validate every request.

Sanitize all input.

Never trust client data.

---

## Performance

Server Components first.

Lazy loading.

Pagination.

Streaming.

Minimal client state.

---

## UI

Simple.

Professional.

Responsive.

Accessible.

No unnecessary animations.

---

## If uncertain

Choose the simplest solution.
