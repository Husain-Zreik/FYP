# Nuzuh — Laravel API Backend

The REST API and single source of truth for the Nuzuh shelter & aid management platform. Pure JSON API (no Blade, no frontend assets) consumed by the React website and the Flutter mobile app.

- **Framework:** Laravel 12 · PHP 8.2+
- **Database:** MySQL — database `fyp` (host `127.0.0.1:3306`)
- **Auth:** Laravel Sanctum v4 — token-based, guard `api`

> For backend coding conventions, routes, controllers and form-request patterns, see [`CLAUDE.md`](CLAUDE.md). This README focuses on **setup** and the **database schema**.

---

## Table of Contents

1. [Setup & Running](#1-setup--running)
2. [Database Schema (Detailed)](#2-database-schema-detailed)
   - [Entity Relationship Overview](#entity-relationship-overview)
   - [Core Tables](#core-tables)
   - [Aid Tables](#aid-tables)
   - [Framework Tables](#framework-tables)
3. [Enum Reference](#3-enum-reference)
4. [Seed Data](#4-seed-data)
5. [Demo Accounts](#5-demo-accounts)
6. [Deployment & Backups](#6-deployment--backups)

---

## 1. Setup & Running

```bash
# 1. Install dependencies
composer install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Create a MySQL database named `fyp`, then set in .env:
#    DB_DATABASE=fyp
#    DB_USERNAME=root
#    DB_PASSWORD=

# 4. Build the schema and load demo data
php artisan migrate:fresh --seed

# 5. Run the API  → http://localhost:8000  (API base: /api)
php artisan serve
```

Common commands:

```bash
php artisan migrate                 # Run pending migrations
php artisan migrate:fresh --seed    # Wipe DB and reseed (dev only)
php artisan db:seed                 # Re-run seeders on existing schema
php artisan tinker                  # REPL
```

> **Note:** `MediaSeeder` uses the PHP **GD extension** to generate shelter cover images and civilian ID-card images. If GD is not enabled, seeding still completes — image generation is skipped with a warning.

---

## 2. Database Schema (Detailed)

The schema is built from **16 migrations** (one table per migration, ordered by dependency). All foreign keys are `unsignedBigInteger` referencing `id`. All tables carry Laravel `created_at` / `updated_at` timestamps unless noted.

### Entity Relationship Overview

```
                         ┌──────────────┐
                         │   shelters   │
                         └──────┬───────┘
                                │ 1
          ┌─────────────────────┼─────────────────────────┐
          │ *                   │ *                        │ *
   ┌──────┴───────┐      ┌──────┴────────┐         ┌───────┴────────┐
   │    users     │      │ aid_requests  │         │ shelter_requests│
   │ (5 roles)    │      └──────┬────────┘         └────────────────┘
   └──┬───┬───┬───┘             │
      │1  │1  │1                │ (may originate)
      │   │   │                 ▼
      │   │   └────────► civilian_profiles
      │   │                     │1
      │   └────────────► family_members (*)
      │                         │1
      └────────────────► civilian_private_housings
                                
   ┌────────────────┐    ┌──────────────┐    ┌────────────────┐
   │ aid_categories │◄───┤  aid_batches │    │  aid_schedules │
   └───────┬────────┘    └──────────────┘    └───────┬────────┘
           │ referenced by                            │ (may originate)
           ▼                                          ▼
   aid_requests · civilian_needs · aid_schedules · aid_dispatches
                                          ▲
   civilian_needs ──────────(may originate)┘
```

**In words:**

- A **shelter** has many users, aid requests, shelter-join requests, civilian needs, schedules and dispatches.
- A **user** (when `role = civilian`) has one civilian profile, optionally one private-housing record, and many family members.
- An **aid category** is referenced by batches, requests, needs, schedules and dispatches.
- An **aid dispatch** is the actual movement of stock; it can optionally link back to the `aid_request`, `civilian_need`, or `aid_schedule` that triggered it.

---

### Core Tables

#### `shelters`
A physical shelter site. Owned/overseen by the government; staffed by shelter users; houses civilians.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `name` | string | no | | Display name |
| `code` | string | yes | | **Unique**. Region prefix, e.g. `BEY-001`, `MTL-001` |
| `governorate` | string | no | | e.g. Beirut, Bekaa, Akkar |
| `district` | string | yes | | |
| `address` | string | no | | |
| `latitude` | decimal(10,7) | yes | | Map pin |
| `longitude` | decimal(10,7) | yes | | Map pin |
| `capacity` | unsigned int | no | | Max civilian occupants |
| `rooms` | unsigned int | yes | | |
| `status` | enum | no | `active` | `active` · `inactive` · `full` · `under_maintenance` |
| `phone` | string | yes | | |
| `email` | string | yes | | |
| `notes` | text | yes | | |
| `image_path` | string | yes | | Cover image (generated by `MediaSeeder`) |

#### `users`
Every actor in the system across all five roles. Authenticated via Sanctum tokens.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `shelter_id` | FK → `shelters` | yes | | `nullOnDelete`. Set for shelter staff and sheltered civilians |
| `name` | string | no | | |
| `email` | string | no | | **Unique** — login identifier |
| `password` | string | no | | Hashed (bcrypt) |
| `phone` | string | yes | | |
| `role` | enum | no | `civilian` | `government_admin` · `government_staff` · `shelter_admin` · `shelter_staff` · `civilian` |
| `is_active` | boolean | no | `true` | Soft enable/disable of login |
| `email_verified_at` | timestamp | yes | | |

> `access_point` is **derived** from `role` (not a column): `government` for the two government roles, `shelter` for the two shelter roles, `civilian` otherwise.

#### `civilian_profiles`
One-to-one extension of a civilian `user` with identity and housing details.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `user_id` | FK → `users` | no | | `cascadeOnDelete` |
| `date_of_birth` | date | yes | | |
| `gender` | enum | yes | | `male` · `female` |
| `current_location` | string | yes | | Free-text current whereabouts |
| `notes` | text | yes | | |
| `id_type` | string | yes | | e.g. `national_id`, `passport` |
| `id_number` | string | yes | | |
| `id_document_path` | string | yes | | ID-card image (generated by `MediaSeeder`) |
| `housing_status` | enum | no | `seeking` | `shelter` · `private` · `seeking` |

#### `civilian_private_housings`
Optional record for a civilian whose `housing_status = private` (renting/owning rather than in a shelter).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `civilian_id` | FK → `users` | no | | `cascadeOnDelete` |
| `property_type` | string | yes | | e.g. apartment, house |
| `address` | string | yes | | |
| `governorate` | string | yes | | |
| `district` | string | yes | | |
| `landlord_name` | string | yes | | |
| `landlord_phone` | string | yes | | |
| `monthly_rent` | decimal(10,2) | yes | | |
| `lease_start_date` | date | yes | | |
| `notes` | text | yes | | |

#### `family_members`
Dependents registered under a civilian `user` (household composition).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `user_id` | FK → `users` | no | | `cascadeOnDelete` |
| `name` | string | no | | |
| `relationship` | enum | no | | `spouse` · `child` · `parent` · `sibling` · `other` |
| `date_of_birth` | date | yes | | |
| `gender` | enum | yes | | `male` · `female` |
| `id_type` | string | yes | | |
| `id_number` | string | yes | | |
| `notes` | text | yes | | |

#### `shelter_requests`
The membership pipeline between a civilian and a shelter — either an **invitation** (shelter → civilian) or a **request** (civilian → shelter).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `civilian_id` | FK → `users` | no | | `cascadeOnDelete` |
| `shelter_id` | FK → `shelters` | no | | `cascadeOnDelete` |
| `type` | enum | no | | `invitation` · `request` |
| `status` | enum | no | `pending` | `pending` · `accepted` · `rejected` |
| `initiated_by` | FK → `users` | no | | Who created it (admin for invitations, the civilian for requests) |
| `responded_at` | timestamp | yes | | |

**Unique constraint:** `(civilian_id, shelter_id, status)` — prevents duplicate requests in the same state.

#### `role_capabilities`
Data-driven permission matrix for the two **staff** roles. Default states are defined in [`config/capabilities.php`](config/capabilities.php) and synced into this table. Admins bypass all capability checks.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `role` | string | no | | `government_staff` or `shelter_staff` |
| `capability` | string | no | | Capability key, e.g. `aid.dispatch` |
| `enabled` | boolean | no | `false` | Toggled from the government dashboard |

**Unique constraint:** `(role, capability)`.

---

### Aid Tables

#### `aid_categories`
The catalogue of aid types (Food Parcels, Medical Kits, Blankets, …).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `name` | string | no | | e.g. "Food Parcels" |
| `unit` | string | no | `units` | Counting unit, e.g. `parcels`, `liters`, `kits`, `USD` |
| `description` | text | yes | | |
| `is_active` | boolean | no | `true` | |

#### `aid_batches`
Government inventory. Stock arrives as batches from a source. Dispatches draw down `available_quantity` **FIFO** (oldest batch first); rejected dispatches refund it.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `aid_category_id` | FK → `aid_categories` | no | | `cascadeOnDelete` |
| `source` | string | no | | e.g. UNHCR, Red Cross, Government Budget |
| `quantity` | unsigned int | no | | Original quantity received |
| `available_quantity` | unsigned int | no | | Remaining after drawdowns |
| `notes` | text | yes | | |
| `received_at` | date | no | | |
| `created_by` | FK → `users` | no | | Government user who logged it |

#### `aid_requests`  *(shelter → government)*
A shelter asks the government for supplies. Reviewed, then dispatched, then confirmed received.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `shelter_id` | FK → `shelters` | no | | `cascadeOnDelete` |
| `aid_category_id` | FK → `aid_categories` | no | | `cascadeOnDelete` |
| `quantity_requested` | unsigned int | no | | |
| `urgency` | enum | no | `medium` | `low` · `medium` · `high` · `critical` |
| `reason` | text | no | | Justification |
| `status` | enum | no | `pending` | `pending` · `approved` · `partially_approved` · `rejected` · `fulfilled` |
| `quantity_approved` | unsigned int | yes | | Set on (partial) approval |
| `government_notes` | text | yes | | Review notes (required on rejection) |
| `reviewed_by` | FK → `users` | yes | | `nullOnDelete` |
| `reviewed_at` | timestamp | yes | | |
| `received_at` | date | yes | | Set when the shelter confirms receipt (→ `fulfilled`) |
| `shelter_received_notes` | text | yes | | |

#### `civilian_needs`  *(civilian → shelter)*
A sheltered civilian requests help. Reviewed by shelter staff and optionally fulfilled via a dispatch.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `civilian_id` | FK → `users` | no | | `cascadeOnDelete` |
| `shelter_id` | FK → `shelters` | no | | `cascadeOnDelete` |
| `category` | enum | no | | `food` · `medical` · `clothing` · `bedding` · `hygiene` · `baby_supplies` · `other` |
| `description` | text | no | | |
| `urgency` | enum | no | `medium` | `low` · `medium` · `high` · `critical` |
| `status` | enum | no | `pending` | `pending` · `in_review` · `fulfilled` · `rejected` |
| `shelter_notes` | text | yes | | |
| `reviewed_by` | FK → `users` | yes | | `nullOnDelete` |
| `reviewed_at` | timestamp | yes | | |

#### `aid_schedules`  *(recurring)*
Recurring distribution rules at either level. Manually triggered to create a dispatch.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `level` | enum | no | | `government_shelter` · `shelter_civilian` |
| `created_by` | FK → `users` | no | | |
| `shelter_id` | FK → `shelters` | no | | `cascadeOnDelete` |
| `civilian_id` | FK → `users` | yes | | `nullOnDelete`. Set only for `shelter_civilian` schedules |
| `aid_category_id` | FK → `aid_categories` | no | | `cascadeOnDelete` |
| `quantity` | unsigned int | no | | Per-occurrence quantity |
| `frequency` | enum | no | | `weekly` · `biweekly` · `monthly` · `quarterly` |
| `notes` | text | yes | | |
| `starts_at` | date | no | | |
| `ends_at` | date | yes | | Open-ended if null |
| `is_active` | boolean | no | `true` | |
| `last_sent_at` | date | yes | | Updated when a dispatch is triggered |

#### `aid_dispatches`
The actual movement of aid at either level. The most connected table — it can reference the request, need, or schedule that originated it.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | bigint PK | — | auto | |
| `level` | enum | no | | `government_shelter` · `shelter_civilian` |
| `dispatched_by` | FK → `users` | no | | |
| `shelter_id` | FK → `shelters` | no | | `cascadeOnDelete` |
| `civilian_id` | FK → `users` | yes | | `nullOnDelete`. Recipient for `shelter_civilian` dispatches |
| `aid_category_id` | FK → `aid_categories` | no | | |
| `aid_request_id` | FK → `aid_requests` | yes | | `nullOnDelete`. Origin request, if any |
| `civilian_need_id` | FK → `civilian_needs` | yes | | `nullOnDelete`. Origin need, if any |
| `aid_schedule_id` | FK → `aid_schedules` | yes | | `nullOnDelete`. Origin schedule, if any |
| `quantity` | unsigned int | no | | |
| `notes` | text | yes | | |
| `status` | enum | no | `pending` | `pending` · `accepted` · `rejected` |
| `dispatched_at` | timestamp | no | now | |
| `expected_arrival_date` | date | yes | | Communicated ETA |
| `responded_at` | timestamp | yes | | When the recipient accepted/rejected |
| `received_at` | date | yes | | Confirmed receipt date |
| `responded_by` | FK → `users` | yes | | `nullOnDelete` |
| `rejection_reason` | text | yes | | Required on rejection |

---

### Framework Tables

Standard Laravel scaffolding, not part of the domain model:

| Table | Purpose |
|-------|---------|
| `password_reset_tokens` | Password-reset tokens (email-keyed) |
| `personal_access_tokens` | Sanctum API tokens |
| `jobs`, `job_batches`, `failed_jobs` | Queue infrastructure |

---

## 3. Enum Reference

A consolidated list of every enum in the schema (handy for client validation):

| Table.Column | Allowed values |
|--------------|----------------|
| `shelters.status` | `active`, `inactive`, `full`, `under_maintenance` |
| `users.role` | `government_admin`, `government_staff`, `shelter_admin`, `shelter_staff`, `civilian` |
| `civilian_profiles.gender` | `male`, `female` |
| `civilian_profiles.housing_status` | `shelter`, `private`, `seeking` |
| `family_members.relationship` | `spouse`, `child`, `parent`, `sibling`, `other` |
| `family_members.gender` | `male`, `female` |
| `shelter_requests.type` | `invitation`, `request` |
| `shelter_requests.status` | `pending`, `accepted`, `rejected` |
| `aid_requests.urgency` | `low`, `medium`, `high`, `critical` |
| `aid_requests.status` | `pending`, `approved`, `partially_approved`, `rejected`, `fulfilled` |
| `civilian_needs.category` | `food`, `medical`, `clothing`, `bedding`, `hygiene`, `baby_supplies`, `other` |
| `civilian_needs.urgency` | `low`, `medium`, `high`, `critical` |
| `civilian_needs.status` | `pending`, `in_review`, `fulfilled`, `rejected` |
| `aid_schedules.level` / `aid_dispatches.level` | `government_shelter`, `shelter_civilian` |
| `aid_schedules.frequency` | `weekly`, `biweekly`, `monthly`, `quarterly` |
| `aid_dispatches.status` | `pending`, `accepted`, `rejected` |

---

## 4. Seed Data

`php artisan migrate:fresh --seed` loads a rich, demo-ready dataset. Seeders run in dependency order (see [`DatabaseSeeder`](database/seeders/DatabaseSeeder.php)):

| Seeder | Produces |
|--------|----------|
| `ShelterSeeder` | **8** Lebanese shelters across 7 governorates, with GPS coordinates |
| `UserSeeder` | All roles with realistic Lebanese names — 1 gov admin, gov staff, 8 shelter admins + 8 shelter staff, and **94 civilians** distributed across shelters (plus unassigned/seeking ones) |
| `CivilianProfileSeeder` | A **complete profile for every civilian** (DOB, gender, ID type/number, housing status) + private-housing records |
| `FamilyMemberSeeder` | Household members for showcase civilians |
| `RoleCapabilitySeeder` | Default capability matrix from `config/capabilities.php` |
| `AidCategorySeeder` | **12** aid categories |
| `AidBatchSeeder` | **8** inventory batches from varied sources, with partial drawdown |
| `AidRequestSeeder` | Shelter→gov requests covering **all 5 statuses** |
| `CivilianNeedSeeder` | Civilian→shelter needs covering **all 4 statuses** and every category |
| `AidScheduleSeeder` | Recurring schedules at both levels (active + inactive) |
| `AidDispatchSeeder` | Dispatches at both levels covering **all 3 statuses** |
| `ShelterRequestSeeder` | Pending invitations & join requests, plus accepted/rejected history |
| `MediaSeeder` | GD-generated shelter cover images + civilian ID-card images |

**Demo coverage is intentionally exhaustive** — the primary showcase shelter (`BEY-001`) and primary showcase civilian (`civilian@nuzuh.com`) each have records in **every** status so a demo can walk through the full lifecycle from any angle.

---

## 5. Demo Accounts

Every seeded account uses the password **`password`**.

### Primary showcase accounts

| Role | Email | Notes |
|------|-------|-------|
| Government Admin | `admin@nuzuh.com` | Full system access |
| Government Staff | `govstaff@nuzuh.com` | Capability-gated |
| Shelter Admin | `shelter@nuzuh.com` | Maarad Exhibition Center (`BEY-001`) |
| Shelter Staff | `shelterstaff@nuzuh.com` | Same shelter, capability-gated |
| Civilian — sheltered | `civilian@nuzuh.com` | Housed at `BEY-001`, full profile + family |
| Civilian — private housing | `civilian2@nuzuh.com` | Renting in Hamra |
| Civilian — seeking | `civilian3@nuzuh.com` | Not yet assigned to a shelter |

### Additional accounts

- One **shelter admin** and **staff** per remaining shelter (e.g. `georges.sfeir@nuzuh.lb`, `maya.rahhal@nuzuh.lb`).
- ~90 additional **civilians** distributed across all shelters (e.g. `fatima.hassan@gmail.com`).

All use the password `password`.

---

## 6. Deployment & Backups

Server deployment (`deploy/deploy.sh`) and the scheduled database backup command (`php artisan backup:database`) are documented in [`deploy/README.md`](deploy/README.md), including cron setup for the scheduler and restore instructions.
