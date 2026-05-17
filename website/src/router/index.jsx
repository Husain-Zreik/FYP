import { createBrowserRouter } from 'react-router-dom'
import LandingPage              from '../pages/LandingPage'
import LoginPage                from '../pages/LoginPage'
import ErrorPage                from '../pages/ErrorPage'
import ProtectedRoute           from './ProtectedRoute'

// Government dashboard pages
import GovDashboardPage         from '../pages/DashboardPage'
import SheltersPage             from '../pages/SheltersPage'
import ShelterDetailPage        from '../pages/ShelterDetailPage'
import UsersPage                from '../pages/UsersPage'
import CiviliansPage            from '../pages/CiviliansPage'
import GovCivilianDetailPage    from '../pages/CivilianDetailPage'
import GovRequestsPage          from '../pages/GovRequestsPage'
import RoleCapabilitiesPage     from '../pages/RoleCapabilitiesPage'

// Shelter dashboard pages
import ShelterDashboardPage     from '../pages/shelter/DashboardPage'
import ShelterInfoPage          from '../pages/shelter/ShelterInfoPage'
import ShelterCiviliansPage     from '../pages/shelter/CiviliansPage'
import ShelterCivilianDetail    from '../pages/shelter/CivilianDetailPage'
import ShelterStaffPage         from '../pages/shelter/StaffPage'
import ShelterRequestsPage      from '../pages/shelter/RequestsPage'
import ShelterAidRequestsPage   from '../pages/shelter/AidRequestsPage'
import CivilianNeedsPage        from '../pages/shelter/CivilianNeedsPage'

// Government aid pages
import AidInventoryPage         from '../pages/AidInventoryPage'
import GovAidRequestsPage       from '../pages/GovAidRequestsPage'

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      { path: '/',      element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },

      // ── Government dashboard ───────────────────────────────────────────
      {
        element: <ProtectedRoute accessPoint="government" />,
        children: [
          { path: '/dashboard',    element: <GovDashboardPage />       },
          { path: '/shelters',     element: <SheltersPage />           },
          { path: '/shelters/:id', element: <ShelterDetailPage />      },
          { path: '/users',        element: <UsersPage />              },
          { path: '/civilians',    element: <CiviliansPage />          },
          { path: '/civilians/:id',element: <GovCivilianDetailPage />  },
          { path: '/requests',          element: <GovRequestsPage />        },
          { path: '/role-capabilities', element: <RoleCapabilitiesPage />   },
          { path: '/aid/inventory',     element: <AidInventoryPage />       },
          { path: '/aid/requests',      element: <GovAidRequestsPage />     },
        ],
      },

      // ── Shelter dashboard ──────────────────────────────────────────────
      {
        element: <ProtectedRoute accessPoint="shelter" />,
        children: [
          { path: '/shelter',              element: <ShelterDashboardPage />  },
          { path: '/shelter/info',         element: <ShelterInfoPage />       },
          { path: '/shelter/civilians',    element: <ShelterCiviliansPage />  },
          { path: '/shelter/civilians/:id',element: <ShelterCivilianDetail /> },
          { path: '/shelter/staff',        element: <ShelterStaffPage />         },
          { path: '/shelter/requests',     element: <ShelterRequestsPage />    },
          { path: '/shelter/aid-requests', element: <ShelterAidRequestsPage /> },
          { path: '/shelter/civilian-needs',element: <CivilianNeedsPage />     },
        ],
      },

      // ── Catch-all 404 ──────────────────────────────────────────────────
      { path: '*', element: <ErrorPage code={404} /> },
    ],
  },
])
