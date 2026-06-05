# Nuzuh — React Website Frontend

The web client for the Nuzuh shelter & aid management platform. A single-page application that serves **two role-based dashboards** — Government and Shelter — entirely from the Laravel API. It holds no data of its own: it carries a Sanctum token and calls the API for everything.

- **Stack:** React 19 · Vite 8 · React Router v7 · Zustand · Axios · Tailwind CSS v4 · MapLibre GL · Framer Motion
- **Talks to:** the Laravel API at `VITE_API_URL` (default `http://localhost:8000/api`)

> For component-level conventions and styling rules, see [`CLAUDE.md`](CLAUDE.md). This README explains **how the app is structured and how data flows through it**.

---

## Table of Contents

1. [Setup & Running](#1-setup--running)
2. [How the Structure Works](#2-how-the-structure-works)
   - [The Big Picture](#the-big-picture)
   - [Boot & Authentication Flow](#boot--authentication-flow)
   - [Routing & Access Control](#routing--access-control)
   - [The API Layer](#the-api-layer)
   - [State Management](#state-management)
   - [Layouts & UI Library](#layouts--ui-library)
   - [Styling System](#styling-system)
3. [Folder Reference](#3-folder-reference)
4. [Walkthrough: A Feature End-to-End](#4-walkthrough-a-feature-end-to-end)

---

## 1. Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Point the app at the API — create .env.local:
#    VITE_API_URL=http://localhost:8000/api

# 3. Start the dev server → http://localhost:5173
npm run dev
```

Other commands:

```bash
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run lint     # ESLint
```

The backend must be running and its CORS config must allow `http://localhost:5173` (it does by default).

---

## 2. How the Structure Works

### The Big Picture

The app is organized into **five horizontal layers**. Data flows down on request and up on response; each layer only knows about the one directly beneath it.

```
  ┌─────────────────────────────────────────────────────────┐
  │  pages/  +  components/        ← what the user sees       │
  │  (read state, render UI, trigger actions)                 │
  ├─────────────────────────────────────────────────────────┤
  │  store/   (Zustand)            ← shared client state      │
  │  authStore · dataStore · uiStore                          │
  ├─────────────────────────────────────────────────────────┤
  │  api/     (typed functions)    ← one module per domain    │
  │  shelters.js · users.js · aidRequests.js · …              │
  ├─────────────────────────────────────────────────────────┤
  │  api/client.js  (Axios)        ← auth header + unwrapping  │
  ├─────────────────────────────────────────────────────────┤
  │  Laravel API  (HTTP/JSON)                                 │
  └─────────────────────────────────────────────────────────┘
```

**The golden rule:** a page never talks to Axios directly. It calls a typed function in `api/`, which calls the shared `client`. This keeps every endpoint defined in exactly one place.

---

### Boot & Authentication Flow

The whole app hinges on one piece of state: **is the user authenticated, and what is their `access_point`?**

1. [`main.jsx`](src/main.jsx) mounts `<App />`.
2. [`App.jsx`](src/App.jsx) runs `initialize()` from `authStore` once on mount, then renders the `RouterProvider`.
3. [`authStore.initialize()`](src/store/authStore.js):
   - If there's no token in `localStorage`, it just marks `initialized = true`.
   - If there is a token, it calls `GET /auth/me`. On success it stores the `user`; on failure it clears the token.
4. Until `initialized` is `true`, `ProtectedRoute` renders nothing — this prevents a "flash" of the wrong screen before we know who the user is.

**Login** (`authStore.login`) posts credentials, stores the returned token in `localStorage`, and sets the user. **Logout** revokes the token server-side, clears `localStorage`, and invalidates the cached data stores.

The token lives in `localStorage` and is read back by the Axios request interceptor on every call — so auth state survives a page refresh without any extra wiring.

---

### Routing & Access Control

Routing is defined in [`router/index.jsx`](src/router/index.jsx) with `createBrowserRouter`. There are **two protected groups**, each guarded by a `<ProtectedRoute accessPoint="…" />`:

| Group | `accessPoint` | Example paths |
|-------|---------------|---------------|
| Public | — | `/`, `/login` |
| Government | `government` | `/dashboard`, `/shelters`, `/aid/inventory`, `/aid/send`, `/role-capabilities` |
| Shelter | `shelter` | `/shelter`, `/shelter/civilians`, `/shelter/incoming-aid`, `/shelter/civilian-needs` |

[`ProtectedRoute`](src/router/ProtectedRoute.jsx) is the single gate every protected page passes through. Its logic, in order:

1. **Not initialized yet?** → render `null` (avoid flicker).
2. **Not authenticated?** → redirect to `/login`.
3. **Shelter user with no `shelter_id`?** → show `NoShelterPage` (they can log in but have nothing to manage yet).
4. **Wrong access point for this group?** → redirect them to *their* dashboard (`/dashboard` or `/shelter`).
5. Otherwise → render the matched page via `<Outlet />`.

The user's `access_point` (`government` / `shelter` / `civilian`) is derived by the backend from their role, so the frontend never hardcodes role-to-area mapping.

---

### The API Layer

Two files types make up the network layer:

**[`api/client.js`](src/api/client.js)** — one shared Axios instance with two interceptors:
- **Request:** reads the token from `localStorage` and adds `Authorization: Bearer {token}`.
- **Response:** unwraps `response.data`, so callers receive the `{ data, message }` envelope directly; on error it rejects with `error.response.data` (`{ message, errors? }`), giving every catch block the same predictable shape.

**`api/*.js`** — one module per domain, each a thin set of named functions:

```js
// api/shelters.js
import client from './client'
export const getShelters   = ()         => client.get('/shelters')
export const createShelter = (data)     => client.post('/shelters', data)
export const updateShelter = (id, data) => client.patch(`/shelters/${id}`, data)
export const deleteShelter = (id)       => client.delete(`/shelters/${id}`)
```

Because the response interceptor already unwrapped the envelope, a page can write `const { data } = await getShelters()` and immediately have the array.

---

### State Management

Three small Zustand stores, each with a clear job:

**[`authStore`](src/store/authStore.js)** — the source of truth for the session: `{ user, token, isAuthenticated, initialized }` plus `initialize / login / logout`. The token is mirrored to `localStorage` so it persists across refreshes.

**[`dataStore`](src/store/dataStore.js)** — cached entity lists built from a small factory, `createEntityStore(fetchFn)`. Each store (`useSheltersStore`, `useAllUsersStore`) exposes:
- `load(force?)` — fetches only if the data is older than **5 minutes** (or `force = true`); no-ops if a request is already in flight.
- `append / update / remove` — **optimistic** local mutations so the UI updates instantly after a create/edit/delete without a full refetch.
- `invalidate()` — marks the cache stale; called on logout.

**[`uiStore`](src/store/uiStore.js)** — sidebar badge counts (pending join requests, pending needs, incoming aid, pending gov aid). Pages push counts here as they load their data, and the layouts read them to render badges.

---

### Layouts & UI Library

- [`layouts/DashboardLayout.jsx`](src/components/layouts/DashboardLayout.jsx) and [`layouts/ShelterLayout.jsx`](src/components/layouts/ShelterLayout.jsx) wrap each route group with the appropriate sidebar + header. The sidebar groups and badge counts differ per dashboard.
- [`components/ui/`](src/components/ui/) is a shared, presentational component library — `Button`, `Input`, `Select` (a fully custom dropdown), `Table` (paginated), `Modal`, `SlidePanel`, `FilterBar`, `StatCard`, `Badge`, `Toggle`, and more — all re-exported from [`ui/index.js`](src/components/ui/index.js) so pages import from one place.
- Domain panels like [`shelters/ShelterPanel.jsx`](src/components/shelters/ShelterPanel.jsx) and [`users/UserPanel.jsx`](src/components/users/UserPanel.jsx) hold the create/edit forms.

---

### Styling System

- **Tailwind CSS v4** configured entirely through the `@theme` block in [`src/index.css`](src/index.css) — there is **no `tailwind.config.js`**. Design tokens (colors, fonts, radii) live in that one block.
- **React Compiler** is enabled, so memoization is automatic — you generally don't write `useMemo` / `useCallback`.
- Dates are always formatted through [`utils/format.js`](src/utils/format.js) (`fmt(date)` → `"18 May 2026"`); never define local date formatters.

---

## 3. Folder Reference

```
src/
  main.jsx              # Mounts <App />
  App.jsx               # Runs initialize() once, renders RouterProvider
  index.css             # Tailwind import + @theme design tokens

  router/
    index.jsx           # All routes — public + government group + shelter group
    ProtectedRoute.jsx  # The auth/access-point gate (see above)

  store/
    authStore.js        # Session: user, token, initialize/login/logout
    dataStore.js        # Cached entity lists (5-min stale) + optimistic updates
    uiStore.js          # Sidebar badge counts

  api/
    client.js           # Shared Axios instance (auth header + envelope unwrap)
    auth.js stats.js shelters.js users.js capabilities.js
    shelterRequests.js aidCategories.js aidBatches.js
    aidRequests.js civilianNeeds.js aidDispatches.js aidSchedules.js

  pages/                # Government dashboard pages (flat)
    pages/shelter/      # Shelter dashboard pages

  components/
    layouts/            # DashboardLayout (gov) + ShelterLayout
    ui/                 # Shared presentational component library (barrel export)
    shelters/ users/ civilians/   # Domain-specific panels & content

  utils/
    format.js           # fmt() — shared date formatter
```

| Folder | Responsibility |
|--------|----------------|
| `pages/` | One file per screen. Reads stores, renders UI, triggers API calls. Government pages are flat; shelter pages live under `pages/shelter/`. |
| `components/ui/` | Reusable, app-agnostic building blocks. No business logic. |
| `components/layouts/` | The chrome (sidebar/header) around each dashboard. |
| `api/` | The only place endpoints are defined. |
| `store/` | Client-side shared state and caching. |
| `router/` | Route table and access control. |

---

## 4. Walkthrough: A Feature End-to-End

To make the layering concrete, here's what happens on the **Shelters** page (government):

1. **Render** — `SheltersPage` reads `items`, `loading` from `useSheltersStore` and calls `load()` on mount.
2. **Fetch** — `load()` sees the cache is stale, calls `getShelters()` from `api/shelters.js`.
3. **HTTP** — that calls `client.get('/shelters')`; the request interceptor attaches the Bearer token, the response interceptor unwraps the envelope.
4. **Store** — the returned array is saved in the store with a fresh `lastFetched` timestamp; the component re-renders with the data.
5. **Create** — the user opens `ShelterPanel`, submits → `createShelter(data)` → on success the page calls `useSheltersStore.append(newShelter)` for an instant optimistic update (no refetch).
6. **Navigate away and back within 5 minutes** — `load()` is a no-op because the cache is still fresh.

Every page follows this same shape: **read from a store → call an `api/` function → mutate the store optimistically**. That consistency is the point of the structure.
