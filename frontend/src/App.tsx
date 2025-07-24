import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { TasksPage } from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import ProfilePage from './pages/ProfilePage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { TenantProvider } from './contexts/TenantContext'

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar isOpen={false} onToggle={() => {}} />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header onMenuToggle={() => {}} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </TenantProvider>
      </AuthProvider>
  )
}

export default App 