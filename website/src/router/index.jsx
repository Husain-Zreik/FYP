import { createBrowserRouter } from 'react-router-dom'
import LandingPage            from '../pages/LandingPage'
import LoginPage              from '../pages/LoginPage'
import ErrorPage              from '../pages/ErrorPage'
import ProtectedRoute         from './ProtectedRoute'

// Government dashboard pages
import GovDashboardPage       from '../pages/DashboardPage'
import SheltersPage           from '../pages/SheltersPage'
import UsersPage              from '../pages/UsersPage'
import CiviliansPage          from '../pages/CiviliansPage'
import ReportsPage            from '../pages/ReportsPage'

// Shelter dashboard pages
import ShelterDashboardPage   from '../pages/shelter/DashboardPage'
import ShelterCiviliansPage   from '../pages/shelter/CiviliansPage'
import ShelterStaffPage       from '../pages/shelter/StaffPage'
import ShelterReportsPage     from '../pages/shelter/ReportsPage'

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,  // catches all unhandled router errors
    children: [
      { path: '/',      element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },

      // ── Government dashboard ───────────────────────────────────────────
      {
        element: <ProtectedRoute accessPoint="government" />,
        children: [
          { path: '/dashboard', element: <GovDashboardPage />   },
          { path: '/shelters',  element: <SheltersPage />       },
          { path: '/users',     element: <UsersPage />          },
          { path: '/civilians', element: <CiviliansPage />      },
          { path: '/reports',   element: <ReportsPage />        },
        ],
      },

      // ── Shelter dashboard ──────────────────────────────────────────────
      {
        element: <ProtectedRoute accessPoint="shelter" />,
        children: [
          { path: '/shelter',           element: <ShelterDashboardPage /> },
          { path: '/shelter/civilians', element: <ShelterCiviliansPage /> },
          { path: '/shelter/staff',     element: <ShelterStaffPage />     },
          { path: '/shelter/reports',   element: <ShelterReportsPage />   },
        ],
      },

      // ── Catch-all 404 ──────────────────────────────────────────────────
      { path: '*', element: <ErrorPage code={404} /> },
    ],
  },
])
