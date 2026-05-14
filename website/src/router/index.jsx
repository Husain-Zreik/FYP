import { createBrowserRouter } from 'react-router-dom'
import LandingPage    from '../pages/LandingPage'
import LoginPage      from '../pages/LoginPage'
import DashboardPage  from '../pages/DashboardPage'
import ProtectedRoute from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/',         element: <LandingPage /> },
  { path: '/login',    element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
])
