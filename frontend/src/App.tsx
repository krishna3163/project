import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DsaTrackerPage from './pages/DsaTrackerPage'
import MockTestsPage from './pages/MockTestsPage'
import MockTestDetailPage from './pages/MockTestDetailPage'
import NotesPage from './pages/NotesPage'
import ResumePage from './pages/ResumePage'
import ContestsPage from './pages/ContestsPage'
import RoadmapsPage from './pages/RoadmapsPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'

function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dsa" element={<DsaTrackerPage />} />
        <Route path="mock-tests" element={<MockTestsPage />} />
        <Route path="mock-tests/:id" element={<MockTestDetailPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="contests" element={<ContestsPage />} />
        <Route path="roadmaps" element={<RoadmapsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
