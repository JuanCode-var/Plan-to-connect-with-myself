import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Brujula } from './pages/Brujula'
import { Dashboard } from './pages/Dashboard'
import { Habits } from './pages/Habits'
import { Journal } from './pages/Journal'
import { DosisDelDia } from './pages/DosisDelDia'
import { Library } from './pages/Library'
import { LibraryReader } from './pages/LibraryReader'
import { LibrarySchoolChallenge } from './pages/LibrarySchoolChallenge'
import { Metas } from './pages/Metas'
import { MicroActions } from './pages/MicroActions'
import { NeuralMap } from './pages/NeuralMap'
import { Patrones } from './pages/Patrones'
import { ForgotPassword } from './pages/ForgotPassword'
import { IdentityPillarsJourney } from './pages/IdentityPillarsJourney'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Tracker } from './pages/Tracker'
import { Welcome } from './pages/Welcome'
import { Word } from './pages/Word'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<RequireAuth />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/identidad/nucleo" element={<IdentityPillarsJourney />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/tracker" replace />} />
          <Route path="/palabra" element={<Word />} />
          <Route path="/identidad" element={<Brujula />} />
          <Route path="/microacciones" element={<MicroActions />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/mi-mapa-neuronal" element={<NeuralMap />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patrones" element={<Patrones />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/dosis/:id" element={<DosisDelDia />} />
          <Route path="/library/leer/:id" element={<LibraryReader />} />
          <Route path="/library/escuela/:id" element={<LibrarySchoolChallenge />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
