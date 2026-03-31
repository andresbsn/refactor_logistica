import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./lib/auth-context"
import { RoutesProvider } from "./lib/routes-context"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Admin from "./pages/Admin"
import TicketDetail from "./pages/TicketDetail"
import TicketResolve from "./pages/TicketResolve"
import { Toaster } from "./components/ui/toaster"
import Backlog from "./pages/Backlog"

function App() {
  return (
    <Router>
      <AuthProvider>
        <RoutesProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/ticket/:id/resolve" element={<TicketResolve />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </RoutesProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
