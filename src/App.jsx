import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RankPredictor from './pages/RankPredictor'
import MockTests from './pages/MockTests'
import MockTestInterface from './pages/MockTestInterface'
import QuestionPapers from './pages/QuestionPapers'
import PaperTest from './pages/PaperTest'
import CollegePredictor from './pages/CollegePredictor'
import PersonalizedGuide from './pages/PersonalizedGuide'
import ExpertCounselling from './pages/ExpertCounselling'
import AdminDashboard from './pages/admin/AdminDashboard'
import Profile from './pages/Profile'
import AdmissionCounselling from './pages/AdmissionCounselling'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>
  if (!user) return <Navigate to="/" replace />
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  
  const isProfileIncomplete = !user.ugOrPg || !user.bestRank || !user.phone || !user.address;
  const hasPrompted = sessionStorage.getItem('profilePrompted');

  if (isProfileIncomplete && !hasPrompted && location.pathname !== '/dashboard/profile') {
    sessionStorage.setItem('profilePrompted', 'true');
    return <Navigate to="/dashboard/profile" replace state={{ message: 'Please complete your profile to access all features.' }} />
  }

  return children
}

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'white'}}>Loading...</div>

  return (
    <Routes>
      {/* Public / Auth Route */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Public App Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="rank-predictor" element={<RankPredictor />} />
        <Route path="mock-tests" element={<MockTests />} />
        <Route path="mock-test/:id" element={<MockTestInterface />} />
        <Route path="question-papers" element={<QuestionPapers />} />
        <Route path="paper-test/:slug" element={<PaperTest />} />
        <Route path="college-predictor" element={<CollegePredictor />} />
        <Route path="personalized-guide" element={<PersonalizedGuide />} />
        <Route path="admission-counselling" element={<AdmissionCounselling />} />
        <Route path="expert-counselling" element={<ExpertCounselling />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Admin only route */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
