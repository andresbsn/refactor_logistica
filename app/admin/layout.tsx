"use client"

import { useState, useMemo, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Route,
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
import { StockInventoryDialog } from "@/components/admin/stock-inventory-dialog"
import { mockMaterials, mockTickets } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { useRoutes } from "@/lib/routes-context"

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const { assignedRoutes } = useRoutes()

  // Calcular tickets pendientes excluyendo los ya asignados a rutas
  const pendingTicketsCount = useMemo(() => {
    const assignedTicketIds = new Set<string>()
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
      router.push("/login")
    }
  }, [user, isLoading, router])

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
      description: "Panel operativo 147",
    },
    {
      title: "Backlog",
      href: "/admin/backlog",
      icon: Ticket,
      description: "Tickets pendientes",
      badge: pendingTicketsCount,
    },
    {
      title: "Rutas Sugeridas",
      href: "/admin",
      icon: Route,
      description: "Gestión de rutas inteligentes",
    },
    {
      title: "Cuadrillas",
      href: "/admin/cuadrillas",
      icon: Users,
      description: "Ver asignaciones y resoluciones",
    },
    {
      title: "Configuración",
      href: "/admin/configuracion",
      icon: Settings,
      description: "Ajustes del sistema",
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
          "fixed top-0 left-0 z-40 h-screen bg-card border-r transition-transform duration-300",
          "w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <img 
                  src="/src/assets/sn-logos/insignia.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">Logística</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Smart Nodes</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className={cn(
                              "text-xs px-1.5 py-0",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
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
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => setShowStockDialog(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Stock de Materiales
            </Button>
          </div>

          {/* User */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.username}@sistema.com</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground"
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
          "transition-all duration-300",
          "lg:ml-64",
          "pt-16 lg:pt-0"
        )}
      >
        {children}
      </main>

      <StockInventoryDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        materials={mockMaterials}
      />
    </div>
  )
}
