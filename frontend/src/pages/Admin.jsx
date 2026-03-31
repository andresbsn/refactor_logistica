import React, { useState, useMemo, useEffect } from "react"
import { Link, useLocation, useNavigate, Routes, Route } from "react-router-dom"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import {
  Users,
  Settings,
  Package,
  Menu,
  X,
  MapPin,
  LogOut,
  Ticket,
  Loader2,
  LayoutDashboard,
} from "lucide-react"
import { StockInventoryDialog } from "../components/admin/stock-inventory-dialog"
import { mockMaterials, mockTickets } from "../lib/mock-data"
import { useAuth } from "../lib/auth-context"
import { useRoutes } from "../lib/routes-context"
import AdminRoutesPage from "./AdminRoutesPage"
import Backlog from "./Backlog"
import CuadrillasPage from "./CuadrillasPage"

export default function Admin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const { assignedRoutes } = useRoutes()

  // Calcular tickets pendientes excluyendo los ya asignados a rutas
  const pendingTicketsCount = useMemo(() => {
    const assignedTicketIds = new Set()
    assignedRoutes.forEach((route) => {
      route.tickets.forEach((ticket) => {
        assignedTicketIds.add(ticket.id)
      })
    })
    return mockTickets.filter(
      (t) => t.status === "open" && !assignedTicketIds.has(t.id)
    ).length
  }, [assignedRoutes])

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/login")
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Vista general",
    },
    {
      title: "Rutas Sugeridas",
      href: "/admin",
      icon: MapPin,
      description: "Planificador de rutas",
      badge: pendingTicketsCount,
    },
    {
      title: "Tickets / Backlog",
      href: "/admin/backlog",
      icon: Ticket,
      description: "Gestión de tickets",
    },
    {
      title: "Cuadrillas",
      href: "/admin/cuadrillas",
      icon: Users,
      description: "Personal técnico",
    },
    {
      title: "Configuración",
      href: "/admin/configuracion",
      icon: Settings,
      description: "Parámetros del sistema",
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold">Panel Admin</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-primary text-primary-foreground border-r border-primary/20 transition-transform duration-300",
          "w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 border-b border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex flex-col items-center text-center gap-4 relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/10 ring-1 ring-black/5 transform -rotate-3 group-hover:rotate-0 transition-all duration-500">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
                  Logística
                </h1>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white opacity-80 mt-0.5">
                  Smart 
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href === "/admin" && location.pathname === "/admin/")
              const Icon = item.icon
              return (
                <Link key={item.href} to={item.href}>
                  <div
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "bg-white/10 text-white shadow-lg shadow-black/5"
                        : "hover:bg-white/5 text-primary-foreground/70 hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-white" : "group-hover:text-white"
                    )} />
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[14px] tracking-tight">{item.title}</p>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge
                            className={cn(
                              "text-[10px] h-5 px-1.5 py-0 min-w-[1.25rem] flex justify-center border-0 font-bold",
                              isActive
                                ? "bg-white text-primary"
                                : "bg-white/20 text-white group-hover:bg-white/30"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-[12px] font-medium transition-opacity duration-300",
                          isActive ? "text-white/70" : "text-primary-foreground/50 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Stock Button */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowStockDialog(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Stock de Materiales
            </Button>
          </div>

          {/* User */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-white">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-primary-foreground/70 truncate">{user.username}@sistema.com</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground/70 hover:text-white hover:bg-white/10 shrink-0"
                onClick={logout}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          "lg:ml-64",
          "pt-16 lg:pt-0"
        )}
      >
        <div className="p-4 lg:p-8">
          <Routes>
            <Route index element={<AdminRoutesPage />} />
            <Route path="dashboard" element={<div className="p-12 text-center text-muted-foreground">Dashboard Placeholder</div>} />
            <Route path="backlog" element={<Backlog />} />
            <Route path="cuadrillas" element={<CuadrillasPage />} />
            <Route path="configuracion" element={<div className="p-12 text-center text-muted-foreground">Configuración Placeholder</div>} />
          </Routes>
        </div>
      </main>

      <StockInventoryDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        materials={mockMaterials}
      />
    </div>
  )
}
