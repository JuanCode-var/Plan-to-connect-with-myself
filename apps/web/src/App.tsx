import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Dashboard } from './pages/Dashboard'
import { Habits } from './pages/Habits'
import { Journal } from './pages/Journal'
import { Library } from './pages/Library'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Tracker } from './pages/Tracker'
import { Welcome } from './pages/Welcome'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/tracker" replace />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
