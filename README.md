# Nuzuh — Shelter & Aid Management Platform

> A full-stack platform for coordinating emergency shelters and humanitarian aid distribution in Lebanon — connecting government, shelters, and displaced civilians on a single source of truth.

---

## Table of Contents

1. [What Is Nuzuh?](#1-what-is-nuzuh)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [User Types & Roles](#4-user-types--roles)
5. [Core System Flows](#5-core-system-flows)
6. [How the System Is Used](#6-how-the-system-is-used)
7. [Getting Started (Step by Step)](#7-getting-started-step-by-step)
8. [Demo Accounts](#8-demo-accounts)
9. [Repository Layout](#9-repository-layout)
10. [API Reference Summary](#10-api-reference-summary)

---

## 1. What Is Nuzuh?

**Nuzuh** is a shelter management and humanitarian aid coordination platform built for crisis response in Lebanon. When people are displaced by conflict or disaster, three groups need to work together quickly and transparently:

- **Government bodies** that own the national stock of aid and oversee all shelters.
- **Shelters** that house displaced civilians and request the supplies they need.
- **Civilians** who need a safe place to stay and essential aid (food, water, medical supplies, etc.).

Nuzuh gives each of these groups a dedicated interface, while keeping all data in one authoritative backend. It tracks:

- Shelters (location, capacity, occupancy, status).
- People (government staff, shelter staff, and displaced civilians).
- Aid inventory (categorized stock, organized into batches by source).
- The full lifecycle of aid — from a shelter's request, to government approval, to dispatch, to confirmed receipt.
- Civilian needs and the shelter's response to them.
- Civilian membership in shelters (join requests and invitations).

The result is an auditable chain of custody for every unit of aid and a clear, role-appropriate view for every actor in the system.

---

## 2. System Architecture

Nuzuh is composed of **three independent applications** that communicate strictly over HTTP/JSON. There is no shared code between them — the backend is the single source of truth, and the two clients are stateless consumers of its API.

```
┌────────────────────┐         ┌────────────────────┐
│   Website (React)  │         │  Mobile (Flutter)  │
│  Government + Shelter        │   Civilian-facing  │
│      dashboards    │         │       app          │
└─────────┬──────────┘         └─────────┬──────────┘
          │  HTTP / JSON                 │  HTTP / JSON
          │  (Bearer token)              │  (Bearer token)
          └──────────────┬───────────────┘
                         ▼
              ┌────────────────────┐
              │  Backend (Laravel) │
              │   REST API + Auth  │
              └─────────┬──────────┘
                        │ SQL
                        ▼
              ┌────────────────────┐
              │   MySQL  (db: fyp) │
              └────────────────────┘
```

**Key principles:**

- The **backend** holds all data, authentication, roles, and business rules.
- The **website** and **mobile app** are stateless clients — they hold only a Sanctum API token and call the API.
- All responses are JSON wrapped in a consistent `{ data, message }` envelope.
- Each app owns its own dependencies and is deployed independently.

---

## 3. Technology Stack

| Layer | Application | Technologies |
|-------|-------------|--------------|
| **API / Backend** | `/backend` | Laravel 12 · PHP 8.2+ · MySQL · Laravel Sanctum (token auth) |
| **Web Frontend** | `/website` | React 19 · Vite 8 · Tailwind CSS v4 · Zustand · React Router v7 · Axios · MapLibre GL · Framer Motion |
| **Mobile App** | `/application` | Flutter 3.44.0 · Dart 3.12.0 · Android (primary), iOS (future) |

**Notable choices:**

- **Sanctum token auth** — every client request carries `Authorization: Bearer {token}`.
- **Tenant isolation** — shelter-scoped users only ever see data belonging to their own shelter (enforced in the backend, never trusted from the client).
- **Configurable capabilities** — staff permissions are data-driven (stored in the database, defined in `config/capabilities.php`), not hardcoded.
- **MapLibre GL** — free, key-less maps for shelter locations on both the landing page and the shelter editor.

---

## 4. User Types & Roles

The system defines **five roles** (a simple enum on the `users` table). Each role maps to an **access point** that determines which interface the user can log into.

| Role | Access Point | Interface | Scope |
|------|--------------|-----------|-------|
| `government_admin` | `government` | Website | Full, unrestricted access across the entire system |
| `government_staff` | `government` | Website | Government access, gated by configurable capabilities |
| `shelter_admin` | `shelter` | Website | Full access **within their own shelter only** |
| `shelter_staff` | `shelter` | Website | Shelter access, gated by configurable capabilities, within their own shelter |
| `civilian` | `civilian` | Mobile app | Their own profile, needs, and aid — no web dashboard |

### Role Responsibilities

**Government Admin** — The top-level operator. Manages all shelters, all staff, the national aid inventory, reviews shelter aid requests, dispatches aid to shelters, and configures what government/shelter staff are allowed to do.

**Government Staff** — Performs government-side operations (managing shelters, reviewing aid requests, dispatching aid, etc.) but only for the specific capabilities an admin has enabled for the `government_staff` role.

**Shelter Admin** — Runs a single shelter. Manages their shelter's profile, their civilians and staff, handles civilian join requests, requests aid from the government, confirms aid receipt, dispatches aid to their civilians, and reviews civilian needs. Everything is scoped to their own shelter.

**Shelter Staff** — Assists in running a shelter with the subset of capabilities the system has enabled for the `shelter_staff` role, also scoped to their own shelter.

**Civilian** — A displaced person using the mobile app. They can find and request to join a shelter, submit needs (food, water, medical, etc.), view aid dispatched to them, and confirm or decline receipt of that aid.

### Capability Gating

Admins (`government_admin`, `shelter_admin`) bypass all capability checks. The two **staff** roles are gated by a configurable capability matrix:

- `government_staff` — 15 capabilities (Shelters, People, Requests, Aid Inventory, Aid Dispatching, Aid Requests, Reports).
- `shelter_staff` — 13 capabilities (Civilians, Requests, Aid, Civilian Needs, Reports).

Capabilities are stored in the `role_capabilities` table, defined in `backend/config/capabilities.php`, and toggled from the government dashboard's **Permissions** page.

---

## 5. Core System Flows

### 5.1 Authentication Flow

1. A user submits credentials to `POST /auth/login`.
2. The backend validates and returns a **Sanctum token** plus the user object (including their `access_point`).
3. The client stores the token and sends it as `Authorization: Bearer {token}` on every subsequent request.
4. On app load, the client calls `GET /auth/me` to validate the token and hydrate the user.
5. Clients redirect based on `access_point`:
   - `government` → Government dashboard (`/dashboard`)
   - `shelter` → Shelter dashboard (`/shelter`)
   - `civilian` → Mobile app home (the web portal rejects civilian logins)
6. `POST /auth/logout` revokes the token and clears client state.

### 5.2 Civilian Onboarding (Joining a Shelter)

There are two paths into a shelter, both managed through the `shelter_requests` table:

**Path A — Civilian requests to join (from the mobile app):**
1. Civilian browses available shelters (`GET /shelters`).
2. Civilian submits a join request (`POST /shelter-requests`, `type: request`).
3. The shelter admin sees the pending request and **accepts** or **rejects** it.
4. On acceptance, the civilian's `shelter_id` is set — they are now a member.

**Path B — Shelter invites a civilian:**
1. Shelter admin searches for an unassigned civilian (`GET /civilians/available`).
2. Shelter admin sends an invitation (`POST /shelter-requests/invite`, `type: invitation`).
3. The civilian sees the invitation in the mobile app and **accepts** or **rejects** it.
4. On acceptance, membership is established.

Either party can cancel/reject pending requests before they are resolved.

### 5.3 Aid Flow: Government → Shelter

This is the supply chain from the national stockpile down to a shelter.

```
Shelter requests aid  →  Government reviews  →  Government dispatches  →  Shelter confirms receipt
   (AidRequest)            (approve/reject)       (AidDispatch)            (fulfilled)
```

1. A shelter submits an **Aid Request** (`AidRequest`, status `pending`) specifying a category, quantity, urgency, and reason.
2. The government **reviews** it — outcome is `approved`, `partially_approved`, or `rejected` (rejections require a note).
3. The government **dispatches** the aid (`AidDispatch`, level `government_shelter`, status `pending`):
   - Stock is deducted **FIFO** from `aid_batches.available_quantity` at dispatch time.
   - If the dispatch is later rejected, stock is **refunded** to the batches.
   - Dispatches can carry an expected arrival date.
4. The shelter **confirms receipt** — the `AidRequest` becomes `fulfilled` and the `AidDispatch` becomes `accepted`, both with a recorded `received_at` date.

### 5.4 Aid Flow: Shelter → Civilian

```
Civilian submits need  →  Shelter reviews  →  Shelter dispatches  →  Civilian confirms receipt
   (CivilianNeed)           (review/fulfill)     (AidDispatch)          (accepted/rejected)
```

1. A civilian submits a **need** (`CivilianNeed`) — category is one of `food`, `water`, `medical`, `shelter`, `clothing`, `hygiene`, `other`. (Requires shelter membership.)
2. The shelter **reviews** it (`in_review`, `fulfilled`, or `rejected`).
3. The shelter **dispatches** aid to the civilian (`AidDispatch`, level `shelter_civilian`).
4. The civilian **confirms or declines** receipt in the mobile app (`accept` / `reject`, with an optional rejection reason).

### 5.5 Recurring Aid Schedules

For predictable, repeated distributions, both levels support **schedules** (`AidSchedule`):

- A schedule stores recurring parameters: category, quantity, frequency, start/end dates.
- A schedule is **manually triggered** (`POST /aid-schedules/{id}/dispatch`), which creates a new `AidDispatch`.
- The same FIFO stock checks apply for `government_shelter`-level schedules.

### 5.6 Stock & Inventory Management

- Aid arrives as **batches** (`AidBatch`) — each tied to a category and a source, with a quantity and an available quantity.
- Dispatches deduct from the **oldest available batch first (FIFO)**.
- Rejected dispatches refund their quantity back to stock.
- The government dashboard surfaces stock levels per category and a full batch log.

---

## 6. How the System Is Used

### As a Government Admin / Staff (Website)

1. Log in at the website — you land on the **Government Dashboard** with operational and aid overview statistics.
2. **Manage shelters** — create/edit shelters (with a map-based location picker), view occupancy and status.
3. **Manage people** — oversee all civilians across shelters and manage government staff accounts.
4. **Handle join requests** — review civilian requests to join shelters.
5. **Run the aid pipeline**:
   - **Inventory** — log incoming aid batches and watch stock by category.
   - **Aid Requests** — review and approve/partially-approve/reject shelter requests.
   - **Send Aid** — dispatch aid directly to shelters or set up recurring schedules.
6. **Configure permissions** — toggle which capabilities `government_staff` and `shelter_staff` have.

### As a Shelter Admin / Staff (Website)

1. Log in — you land on the **Shelter Dashboard** (scoped entirely to your shelter).
2. **Shelter Info** — view and edit your shelter's profile and capacity.
3. **Civilians & Staff** — manage the people housed in and working at your shelter.
4. **Join Requests** — accept/reject civilians who want to join, or invite civilians directly.
5. **Incoming Aid** — accept or decline aid the government dispatches to you.
6. **Aid Requests** — request supplies from the government and confirm receipt when they arrive.
7. **Send to Civilians** — dispatch aid to your civilians or schedule recurring distributions.
8. **Civilian Needs** — review and act on needs your civilians submit.

### As a Civilian (Mobile App)

1. Log in to the mobile app (civilian role only).
2. **Find a shelter** — browse shelters on the map and request to join, or accept an invitation.
3. **View your profile** — your details, ID documents, and housing status.
4. **Submit needs** — request food, water, medical supplies, etc. (once you've joined a shelter).
5. **Track aid** — see what's been dispatched to you and confirm or decline receipt.

---

## 7. Getting Started (Step by Step)

### Prerequisites

- **PHP 8.2+** and **Composer**
- **MySQL** (running locally, accessible at `127.0.0.1:3306`)
- **Node.js** (LTS) and **npm**
- **Flutter 3.44.0+** with the Android SDK (only needed for the mobile app)

---

### Step 1 — Backend API (Laravel)

```bash
cd backend

# 1. Install PHP dependencies
composer install

# 2. Create your environment file and generate an app key
cp .env.example .env
php artisan key:generate

# 3. Create a MySQL database named `fyp`, then configure .env:
#    DB_DATABASE=fyp
#    DB_USERNAME=root
#    DB_PASSWORD=...

# 4. Run migrations and seed demo data (8 shelters, users, aid, etc.)
php artisan migrate:fresh --seed

# 5. Start the API server  → http://localhost:8000
php artisan serve
```

The API is now available at **`http://localhost:8000/api`**.

---

### Step 2 — Website (React)

```bash
cd website

# 1. Install dependencies
npm install

# 2. Point the frontend at your API.
#    Create .env.local with:
#    VITE_API_URL=http://localhost:8000/api

# 3. Start the dev server  → http://localhost:5173
npm run dev
```

Open **`http://localhost:5173`** and log in with one of the [demo accounts](#8-demo-accounts).

---

### Step 3 — Mobile App (Flutter)

```bash
cd application

# 1. Fetch packages
flutter pub get

# 2. Configure the API base URL (in your env / constants file):
#    Android emulator → http://10.0.2.2:8000/api
#    Chrome / desktop → http://localhost:8000/api

# 3. Run on a connected device or emulator
flutter run

#    …or run in Chrome for quick testing:
flutter run -d chrome
```

Log in with a **civilian** demo account (e.g. `civilian@nuzuh.com`).

---

### Quick Start (TL;DR)

```bash
# Terminal 1 — API
cd backend && php artisan migrate:fresh --seed && php artisan serve

# Terminal 2 — Website
cd website && npm install && npm run dev

# Terminal 3 — Mobile (optional)
cd application && flutter pub get && flutter run
```

---

## 8. Demo Accounts

After seeding, these easy-to-remember showcase accounts are available. **The password for every account is `password`.**

| Role | Email | Interface | Notes |
|------|-------|-----------|-------|
| Government Admin | `admin@nuzuh.com` | Website | Full system access |
| Government Staff | `govstaff@nuzuh.com` | Website | Capability-gated |
| Shelter Admin | `shelter@nuzuh.com` | Website | Maarad Exhibition Center (BEY-001) |
| Shelter Staff | `shelterstaff@nuzuh.com` | Website | Same shelter, capability-gated |
| Civilian (housed) | `civilian@nuzuh.com` | Mobile | Housed at shelter 1, full profile |
| Civilian (private housing) | `civilian2@nuzuh.com` | Mobile | Living in private housing |
| Civilian (seeking) | `civilian3@nuzuh.com` | Mobile | Not yet assigned to a shelter |

Additional realistic accounts exist for the other 7 shelters (e.g. `georges.sfeir@nuzuh.lb`) and ~80 seeded civilians (e.g. `fatima.hassan@gmail.com`), all with the password `password`.

---

## 9. Repository Layout

```
/
├── backend/            # Laravel 12 REST API — single source of truth
│   ├── app/
│   │   ├── Http/Controllers/   # Auth, Users, Shelters, Aid* controllers
│   │   ├── Http/Requests/      # Form-request validation, grouped by domain
│   │   ├── Http/Resources/     # JSON response transformers
│   │   └── Models/             # Eloquent models
│   ├── config/capabilities.php # Source of truth for staff capabilities
│   ├── database/
│   │   ├── migrations/         # One table per migration
│   │   └── seeders/            # 8 shelters, users, aid batches, dispatches…
│   ├── routes/api.php          # All API routes
│   └── CLAUDE.md               # Backend conventions & detailed docs
│
├── website/            # React 19 SPA — Government + Shelter dashboards
│   ├── src/
│   │   ├── pages/              # Government + shelter/ page groups
│   │   ├── components/         # Layouts + shared UI library
│   │   ├── router/             # Routes + ProtectedRoute access control
│   │   ├── store/              # Zustand: auth, data caches, UI badges
│   │   └── api/                # Typed API client modules
│   └── CLAUDE.md               # Frontend conventions & component docs
│
├── application/        # Flutter mobile app — civilian-facing
│   ├── lib/
│   │   ├── screens/  widgets/  services/  models/  utils/
│   └── CLAUDE.md               # Mobile conventions & API integration
│
└── CLAUDE.md           # Monorepo overview
```

---

## 10. API Reference Summary

All routes are prefixed with `/api`. Authenticated routes require `Authorization: Bearer {token}` and `Accept: application/json`.

| Domain | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login` · `POST /auth/register` · `POST /auth/logout` · `GET /auth/me` |
| **Stats** | `GET /stats/government` · `GET /stats/shelter` |
| **Shelters** | `GET/POST /shelters` · `GET/PATCH/DELETE /shelters/{id}` · `POST /shelters/{id}/upload-image` |
| **Users** | `GET/POST /users` · `GET/PATCH/DELETE /users/{id}` · `POST /users/{id}/upload-id` |
| **Join Requests** | `GET/POST /shelter-requests` · `POST /shelter-requests/invite` · `PATCH /shelter-requests/{id}/accept\|reject\|cancel` · `GET /civilians/{user}/requests` · `GET /civilians/available` |
| **Capabilities** | `GET/PATCH /role-capabilities` |
| **Aid Categories** | `GET/POST /aid-categories` · `GET/PATCH/DELETE /aid-categories/{id}` |
| **Aid Batches** | `GET/POST /aid-batches` · `GET/DELETE /aid-batches/{id}` |
| **Aid Requests** | `GET/POST /aid-requests` · `GET/PATCH /aid-requests/{id}` · `PATCH /aid-requests/{id}/fulfill` |
| **Civilian Needs** | `GET/POST /civilian-needs` · `GET/PATCH /civilian-needs/{id}` |
| **Aid Dispatches** | `GET/POST /aid-dispatches` · `PATCH /aid-dispatches/{id}/accept\|reject` |
| **Aid Schedules** | `GET/POST /aid-schedules` · `GET/PATCH/DELETE /aid-schedules/{id}` · `POST /aid-schedules/{id}/dispatch` |

**Standard response envelopes:**

```json
{ "data": { ... }, "message": "OK" }                          // single resource
{ "data": [ ... ], "message": "OK" }                          // collection
{ "message": "Field is required.", "errors": { "field": [] } } // 422 validation
{ "message": "Unauthenticated." }                              // 401
```

---

<div align="center">

**Nuzuh** — coordinating shelter and aid when it matters most.

For app-specific conventions, see the `CLAUDE.md` file inside each application directory.

</div>
