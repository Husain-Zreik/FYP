# Nuzuh — Flutter Mobile App

The **civilian-facing** mobile client for the Nuzuh shelter & aid management platform. The `civilian` role has no web dashboard — this app is their only interface. It consumes the same Laravel API as the website.

- **Stack:** Flutter 3.44 · Dart 3.12 · `go_router` (routing) · `provider` (state) · `dio` (HTTP) · `shared_preferences` (token storage)
- **Maps:** `flutter_map` + `latlong2` + `geolocator` (find nearby shelters, no API key needed)
- **Target:** Android (primary), iOS (future), and Chrome for quick testing

> For coding conventions, see [`CLAUDE.md`](CLAUDE.md). This README explains **how the app is structured and how data flows through it**.

---

## Table of Contents

1. [Setup & Running](#1-setup--running)
2. [How the Structure Works](#2-how-the-structure-works)
   - [The Big Picture](#the-big-picture)
   - [App Bootstrap](#app-bootstrap)
   - [Authentication & the AuthProvider](#authentication--the-authprovider)
   - [Routing & Navigation Shell](#routing--navigation-shell)
   - [The Networking Layer](#the-networking-layer)
   - [Services & Models](#services--models)
   - [Theme & Responsive Sizing](#theme--responsive-sizing)
3. [Folder Reference](#3-folder-reference)
4. [Walkthrough: A Feature End-to-End](#4-walkthrough-a-feature-end-to-end)

---

## 1. Setup & Running

```bash
# 1. Fetch packages
flutter pub get

# 2. Run on an emulator / device
flutter run

# …or on Chrome for quick testing:
flutter run -d chrome
```

**API base URL** is resolved automatically in [`core/constants.dart`](lib/core/constants.dart):

| Target | URL used |
|--------|----------|
| Android emulator | `http://10.0.2.2:8000/api` (the emulator's alias for the host's localhost) |
| Web / desktop | `http://localhost:8000/api` |

To point at a different backend (e.g. a LAN IP for a physical device), override at launch:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.50:8000/api
```

Other commands:

```bash
flutter analyze              # Static analysis
flutter test                 # Tests
flutter build apk --release  # Release APK
```

**Login** with a civilian demo account, e.g. `civilian@nuzuh.com` / `password`. Non-civilian accounts are rejected — they belong on the web portal.

---

## 2. How the Structure Works

### The Big Picture

The app is layered much like the website, so the two stay conceptually aligned:

```
  ┌─────────────────────────────────────────────────────────┐
  │  screens/  +  widgets/         ← what the user sees       │
  │  (watch AuthProvider, call services, render UI)           │
  ├─────────────────────────────────────────────────────────┤
  │  providers/  (ChangeNotifier)  ← shared state             │
  │  AuthProvider                                             │
  ├─────────────────────────────────────────────────────────┤
  │  services/   (static classes)  ← one per domain           │
  │  AuthService · AidService · ShelterService · …            │
  ├─────────────────────────────────────────────────────────┤
  │  services/api_client.dart (Dio) ← auth header + unwrap     │
  ├─────────────────────────────────────────────────────────┤
  │  Laravel API  (HTTP/JSON)                                 │
  └─────────────────────────────────────────────────────────┘
```

`models/` cut across this — every service returns **typed model objects** (built with `fromJson`), never raw maps, so screens work with real Dart types.

---

### App Bootstrap

[`main.dart`](lib/main.dart) is tiny — it ensures the Flutter binding is ready and runs `App()`. All the wiring lives in [`app.dart`](lib/app.dart):

1. In `initState`, `App` creates a single `AuthProvider` and a `GoRouter`.
2. It calls `_authProvider.initialize()` to restore any saved session.
3. It renders a `MaterialApp.router` wrapped in `ChangeNotifierProvider.value(value: _authProvider)`, so every screen can read auth state.
4. A `ListenableBuilder` shows a full-screen spinner **until `AuthProvider.initialized` is true** — the same "don't flash the wrong screen" guard the website uses.

---

### Authentication & the AuthProvider

[`providers/auth_provider.dart`](lib/providers/auth_provider.dart) is a `ChangeNotifier` that deliberately mirrors the website's `authStore`. It holds `user`, `token`, `initialized`, and exposes `initialize / login / register / logout / refreshUser`.

- **Token storage:** the Sanctum token is persisted in `SharedPreferences` under the key `auth_token`.
- **`initialize()`** — reads the stored token, calls `GET /auth/me`, and hydrates the user. If the call fails *or the account is not a civilian*, it clears the token.
- **`login()` / `register()`** — authenticate, **reject non-civilian accounts** with a clear message, persist the token, then call `refreshUser()` to pull the full object (profile, family members, private housing).
- **`isAuthenticated`** is simply `token != null && user != null`.

Because `AuthProvider` is a `ChangeNotifier`, calling `notifyListeners()` after login/logout makes both the router (see below) and any watching widget react automatically.

---

### Routing & Navigation Shell

Routing uses **`go_router`** ([`app.dart`](lib/app.dart)) with two important pieces:

**1. A redirect guard** wired to the provider via `refreshListenable: _authProvider`. Every time auth state changes, the router re-evaluates:

- While `!initialized` → don't redirect (the spinner is showing anyway).
- Not authenticated and not on `/login` or `/register` → redirect to `/login`.
- Authenticated but sitting on a public route → redirect to `/home`.

**2. A `StatefulShellRoute.indexedStack`** that gives the app its **bottom navigation bar** with four branches, each keeping its own navigation state:

| Branch | Root route | Tab |
|--------|-----------|-----|
| 1 | `/home` | Home |
| 2 | `/shelter` (→ `find`, `requests`, `private-housing`) | Shelter |
| 3 | `/aid` (→ `submit-need`) | **Aid** *or* **Requests** |
| 4 | `/profile` (→ `complete`) | Profile |

[`widgets/main_layout.dart`](lib/widgets/main_layout.dart) renders that shell and the `NavigationBar`. The **third tab adapts to the user's situation**: a housed civilian sees an **Aid** tab (favourite icon); an un-housed one sees a **Requests** tab (mail icon).

That adaptiveness continues in [`screens/aid/aid_gate_screen.dart`](lib/screens/aid/aid_gate_screen.dart), which branches on housing status:

- `hasShelter` → the real **AidScreen** (incoming dispatches, submit needs).
- `housing_status == 'private'` → an informational screen explaining how private-housing residents receive aid.
- otherwise → **ShelterRequestsScreen** (prompting them to join a shelter first).

This "gate" pattern keeps routing simple while still showing each civilian only what's relevant to them.

---

### The Networking Layer

[`services/api_client.dart`](lib/services/api_client.dart) is a static wrapper around a single **Dio** instance. It is the Flutter counterpart of the website's `client.js`:

- **Base URL** comes from `AppConstants.apiBaseUrl`; 30-second connect/receive timeouts.
- **Auth header** — every request reads the token from `SharedPreferences` and adds `Authorization: Bearer {token}`.
- **Envelope unwrapping** — if the response body is a map containing `data`, it returns the inner `data`; callers never deal with the wrapper.
- **Uniform errors** — any failure is converted to a typed `ApiException(message, errors?, statusCode?)`, with friendly messages for timeouts/connection errors. Screens catch one exception type and can show `e.message` directly.
- `get / post / patch / delete` cover JSON calls; `upload()` handles multipart `FormData` (used with `image_picker` for ID documents).

---

### Services & Models

**Services** (`lib/services/`) are static classes, one per domain — `AuthService`, `AidService`, `ShelterService`, `CivilianService`, `FamilyMemberService`. Each method calls `ApiClient` and maps the result into models:

```dart
// services/aid_service.dart
static Future<List<AidDispatch>> getDispatches() async {
  final data = await ApiClient.get('/aid-dispatches');
  return (data as List)
      .whereType<Map<String, dynamic>>()
      .map(AidDispatch.fromJson)
      .toList();
}
```

**Models** (`lib/models/`) mirror the backend's API resources with `fromJson` factories — `User`, `Shelter`, `CivilianProfile`, `PrivateHousing`, `FamilyMember`, `CivilianNeed`, `AidCategory`, `AidDispatch`, `ShelterRequest`. The `User` model also carries computed getters that drive UI decisions:

- `hasShelter` — has a `shelter_id`.
- `isHoused` — in a shelter **or** registered in private housing.
- `isProfileComplete` — civilian profile has its required fields.

These getters are why the navigation shell and the aid gate can branch on a single `context.watch<AuthProvider>().user`.

---

### Theme & Responsive Sizing

`lib/core/` holds the cross-cutting design system:

- [`theme/app_colors.dart`](lib/core/theme/app_colors.dart) + [`theme/app_theme.dart`](lib/core/theme/app_theme.dart) — the color palette and the `ThemeData` (Poppins font family, bundled in `assets/fonts/`).
- [`app_sizes.dart`](lib/core/app_sizes.dart) — a **fluid responsive sizing system** that mirrors the website's rem + breakpoint scale. `AppSizes.of(context)` derives a scale factor from screen width (clamped 0.85–1.15) and exposes consistent spacing (`pagePadding`, `sectionGap`) and type sizes (`heading1`, `bodyMd`, …). `MainLayout` also clamps the system text scale so large accessibility font settings don't break layouts.

---

## 3. Folder Reference

```
lib/
  main.dart             # Entry — runApp(App())
  app.dart              # AuthProvider + GoRouter + MaterialApp.router wiring

  core/
    constants.dart      # App name + resolved API base URL (+ --dart-define override)
    app_sizes.dart      # Fluid responsive spacing & typography
    theme/              # app_colors.dart, app_theme.dart (Poppins)

  providers/
    auth_provider.dart  # ChangeNotifier — session state (mirrors website authStore)

  services/
    api_client.dart     # Dio wrapper — auth header, envelope unwrap, ApiException
    auth_service.dart aid_service.dart shelter_service.dart
    civilian_service.dart family_member_service.dart

  models/               # fromJson data classes mirroring API resources
    user.dart shelter.dart civilian_profile.dart private_housing.dart
    family_member.dart civilian_need.dart aid_category.dart
    aid_dispatch.dart shelter_request.dart

  screens/              # One file per screen, grouped by domain
    login_screen.dart register_screen.dart home_screen.dart not_found_screen.dart
    shelter/            # find, detail, requests, private-housing
    aid/                # aid_gate, aid, submit_need
    profile/            # profile, complete_profile

  widgets/              # Reusable UI: main_layout (bottom nav), app_button,
                        # app_text_field, app_scaffold, app_logo, error_banner
```

| Folder | Responsibility |
|--------|----------------|
| `screens/` | Full pages. Watch `AuthProvider`, call services, render UI. |
| `widgets/` | Reusable, presentational components (incl. the nav shell). |
| `providers/` | Shared state via `ChangeNotifier`. |
| `services/` | The only place API endpoints are called; returns typed models. |
| `models/` | Typed data classes with `fromJson`. |
| `core/` | App constants, theme, and responsive sizing. |

---

## 4. Walkthrough: A Feature End-to-End

Here's what happens when a housed civilian opens the **Aid** tab and confirms receipt of a dispatch:

1. **Navigate** — tapping the third tab routes to `/aid`; `AidGateScreen` sees `user.hasShelter == true` and renders `AidScreen`.
2. **Fetch** — `AidScreen` calls `AidService.getDispatches()`.
3. **HTTP** — that calls `ApiClient.get('/aid-dispatches')`; Dio attaches the Bearer token from `SharedPreferences`, and the client unwraps the `{ data }` envelope.
4. **Map** — the raw list is mapped through `AidDispatch.fromJson` into typed models the screen renders.
5. **Act** — the user taps "Confirm receipt" → `AidService.acceptDispatch(id, receivedAt)` → `PATCH /aid-dispatches/{id}/accept`.
6. **Refresh** — the screen re-fetches (or updates locally); an `ApiException` from any step is caught and shown via `error_banner`.

Every feature follows the same shape: **screen → service → `ApiClient` → API → `fromJson` model**, with `AuthProvider` supplying the current user wherever the UI needs to branch.
