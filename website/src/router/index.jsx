import { createBrowserRouter } from 'react-router-dom'
import LandingPage    from '../pages/LandingPage'
import LoginPage      from '../pages/LoginPage'
import DashboardPage  from '../pages/DashboardPage'
import SheltersPage   from '../pages/SheltersPage'
import UsersPage      from '../pages/UsersPage'
import CiviliansPage  from '../pages/CiviliansPage'
import ReportsPage    from '../pages/ReportsPage'
import ProtectedRoute from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/',      element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage />  },
      { path: '/shelters',  element: <SheltersPage />   },
      { path: '/users',     element: <UsersPage />      },
      { path: '/civilians', element: <CiviliansPage />  },
      { path: '/reports',   element: <ReportsPage />    },
    ],
  },
])
