"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  MapPin,
  Users,
  AlertTriangle,
  Clock,
  Radio,
  Eye,
  UserPlus,
  Route,
  ChevronRight,
  Signal,
  SignalZero,
  Pause,
  CircleDot,
  X,
  Upload,
  CheckSquare,
} from "lucide-react"
import { useRoutes } from "@/lib/routes-context"
import { mockTickets, mockCrews } from "@/lib/mock-data"
import type { Ticket, AssignedTicket } from "@/types/ticket"

type DashboardTicket = (Ticket | AssignedTicket) & {
  _routeId?: string
  _routeName?: string
  _crewName?: string
  _crewId?: string
}

const zones = ["Centro", "Alberdi", "General Paz", "Nueva Cordoba", "Alta Cordoba", "San Vicente", "Guemes", "14 de Abril"]

function getZoneFromAddress(address: string): string {
  const match = address.match(/Barrio\s+([A-ZÁÉÍÓÚÑ\s\d]+)/i)
  return match ? match[1].trim() : "Otro"
}

function timeAgo(date: Date | undefined): string {
  if (!date) return ""
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) return `hace ${diffDays}d`
  if (diffHours > 0) return `hace ${diffHours}h`
  return "hace minutos"
}

const priorityConfig: Record<string, { label: string; class: string }> = {
  high: { label: "Alta", class: "bg-red-500/10 text-red-700 border-red-500/20" },
  medium: { label: "Media", class: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  low: { label: "Baja", class: "bg-green-500/10 text-green-700 border-green-500/20" },
}

// Crew status mock
const crewStatusMock: Record<string, { status: string; label: string; class: string; lastGps: string }> = {
  c1: { status: "en_ruta", label: "En ruta", class: "bg-blue-500/10 text-blue-700", lastGps: "hace 2 min" },
  c2: { status: "disponible", label: "Disponible", class: "bg-green-500/10 text-green-700", lastGps: "hace 5 min" },
  c3: { status: "sin_senal", label: "Sin senal", class: "bg-red-500/10 text-red-700", lastGps: "hace 18 min" },
  c4: { status: "pausada", label: "Pausada", class: "bg-orange-500/10 text-orange-700", lastGps: "hace 1 min" },
}

const crewStatusIcon: Record<string, React.ReactNode> = {
  en_ruta: <Route className="h-3.5 w-3.5" />,
  disponible: <CircleDot className="h-3.5 w-3.5" />,
  sin_senal: <SignalZero className="h-3.5 w-3.5" />,
  pausada: <Pause className="h-3.5 w-3.5" />,
}

const normalizeId = (value: unknown) => (value === undefined || value === null ? "" : String(value))

const routeMatchesCrew = (route: { crewId?: unknown; crew_id?: unknown }, crewId: string) => {
  const targetCrewId = normalizeId(crewId)
  return normalizeId(route.crewId) === targetCrewId || normalizeId(route.crew_id) === targetCrewId
}

export default function DashboardPage() {
  const { assignedRoutes, closeTicket } = useRoutes()
  const [searchTerm, setSearchTerm] = useState("")
  const [ticketTab, setTicketTab] = useState<string>("open")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedTicket, setSelectedTicket] = useState<DashboardTicket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [ticketNotes, setTicketNotes] = useState("")
  const [mapToggle, setMapToggle] = useState({ tickets: true, crews: true, routes: true })

  useEffect(() => {
    if (!drawerOpen) {
      setSelectedTicket(null)
      setTicketNotes("")
    }
  }, [drawerOpen])

  // Merge all tickets: backlog (open) + assigned route tickets
  const allTickets = useMemo<DashboardTicket[]>(() => {
    const routeTickets = assignedRoutes.flatMap((r) =>
      r.tickets.map((t) => ({
        ...t,
        _routeId: r.id,
        _routeName: r.name,
        _crewName: r.crewName,
        _crewId: r.crewId,
      }))
    )

    // Backlog tickets not in any route
    const assignedIds = new Set(routeTickets.map((t) => t.id))
    const backlogTickets = mockTickets
      .filter((t) => !assignedIds.has(t.id))
      .map((t) => ({
        ...t,
        _routeId: undefined as string | undefined,
        _routeName: undefined as string | undefined,
        _crewName: undefined as string | undefined,
        _crewId: undefined as string | undefined,
      }))

    return [...backlogTickets, ...routeTickets]
  }, [assignedRoutes])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = [...allTickets]

    // Tab filter
    if (ticketTab === "open") {
      result = result.filter((t) => t.status === "open")
    } else if (ticketTab === "pending") {
      result = result.filter((t) => t.status === "pending")
    } else if (ticketTab === "closed") {
      result = result.filter((t) => t.status === "closed")
    }

    // Zone
    if (zoneFilter !== "all") {
      result = result.filter((t) => getZoneFromAddress(t.address).toUpperCase().includes(zoneFilter.toUpperCase()))
    }

    // Priority
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (t) =>
          t.ticketNumber?.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          getZoneFromAddress(t.address).toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    } else if (sortBy === "priority") {
      const pOrder = { high: 0, medium: 1, low: 2 }
      result.sort((a, b) => pOrder[a.priority] - pOrder[b.priority])
    }

    return result
  }, [allTickets, ticketTab, zoneFilter, priorityFilter, searchTerm, sortBy])

  // Alerts
  const alerts = useMemo(() => {
    const items: { id: string; text: string; type: "danger" | "warning" | "info" }[] = []

    // Crew sin senal
    mockCrews.forEach((c) => {
      const st = crewStatusMock[c.id]
      if (st?.status === "sin_senal") {
        items.push({
          id: `crew-${c.id}`,
          text: `${c.name.split(" - ")[0]} sin senal ${st.lastGps}`,
          type: "danger",
        })
      }
    })

    // Routes open without close
    assignedRoutes
      .filter((r) => r.status === "active")
      .forEach((r) => {
        const hoursSinceAssign = (Date.now() - new Date(r.assignedAt).getTime()) / (1000 * 60 * 60)
        if (hoursSinceAssign > 8) {
          items.push({
            id: `route-${r.id}`,
            text: `Ruta ${r.name} abierta sin cierre`,
            type: "warning",
          })
        }
      })

    // High priority unassigned
    const assignedIds = new Set(assignedRoutes.flatMap((r) => r.tickets.map((t) => t.id)))
    const unassignedHigh = mockTickets.filter(
      (t) => t.priority === "high" && t.status === "open" && !assignedIds.has(t.id)
    )
    unassignedHigh.forEach((t) => {
      items.push({
        id: `ticket-${t.id}`,
        text: `Ticket ${t.ticketNumber} prioritario sin asignar`,
        type: "warning",
      })
    })

    // Pending close tickets
    const pendingCount = assignedRoutes
      .flatMap((r) => r.tickets)
      .filter((t) => t.status === "pending").length
    if (pendingCount > 0) {
      items.push({
        id: "pending-close",
        text: `${pendingCount} ticket(s) pendiente(s) de cierre por admin`,
        type: "info",
      })
    }

    return items
  }, [assignedRoutes])

  const openTicketDrawer = (ticket: Ticket | AssignedTicket) => {
    setSelectedTicket(ticket)
    setTicketNotes("")
    setDrawerOpen(true)
  }

  // Find which route a ticket belongs to
  const getTicketRoute = (ticketId: string) => {
    return assignedRoutes.find((r) => r.tickets.some((t) => t.id === ticketId))
  }

  const handleCloseTicket = () => {
    if (!selectedTicket) return
    const route = getTicketRoute(selectedTicket.id)
    if (route && selectedTicket.status === "pending") {
      closeTicket(route.id, selectedTicket.id)
      setSelectedTicket({ ...selectedTicket, status: "closed" })
    }
  }

  // Count tabs
  const openCount = allTickets.filter((t) => t.status === "open").length
  const pendingCount = allTickets.filter((t) => t.status === "pending").length
  const closedCount = allTickets.filter((t) => t.status === "closed").length

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-card/50 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl shadow-premium animate-in zoom-in-50 duration-500">
              <Radio className="h-5 w-5 text-primary-foreground animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">Panel Operativo 147</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-primary uppercase font-bold tracking-[0.1em] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Sincronización en vivo
              </div>
            </div>
          </div>
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar por ticket, dirección o barrio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 rounded-2xl focus:bg-background focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* 3-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] overflow-hidden">
        {/* LEFT: Tickets */}
        <div className="border-r flex flex-col overflow-hidden">
          <div className="p-3 space-y-3 border-b">
            <Tabs value={ticketTab} onValueChange={setTicketTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="open" className="text-xs">
                  Abiertos
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{openCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  Pendientes
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{pendingCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">
                  Cerrados
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{closedCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs w-[110px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs w-[110px]">
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recientes</SelectItem>
                  <SelectItem value="priority">Prioridad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {filteredTickets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No se encontraron tickets</p>
              )}
              {filteredTickets.map((ticket) => {
                const zone = getZoneFromAddress(ticket.address)
                const prio = priorityConfig[ticket.priority]
                return (
                  <Card
                    key={`${ticket.id}-${ticket._routeId || "backlog"}`}
                    className="cursor-pointer hover:bg-white dark:hover:bg-muted/30 transition-all hover:shadow-premium border-transparent hover:border-primary/10 group rounded-xl bg-transparent"
                    onClick={() => openTicketDrawer(ticket)}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/5 rounded shrink-0">
                            #{ticket.ticketNumber}
                          </span>
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0 shrink-0 border-none ${prio.class.replace('bg-', 'bg-opacity-20 bg-')}`}>
                            {prio.label}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {timeAgo(ticket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">{ticket.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-3 bg-muted/30 p-1.5 rounded-lg border border-border/20">
                        <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                        <span className="truncate">{ticket.address}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                           <Badge variant="secondary" className="text-[9px] px-2 py-0 bg-secondary/50 text-secondary-foreground font-bold">{zone}</Badge>
                        </div>
                        {ticket._crewName ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                            <Users className="h-3 w-3" />
                            <span className="text-[10px] font-bold">{ticket._crewName.split(" - ")[0]}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                             <Clock className="h-3 w-3" />
                             <span className="text-[10px] font-bold uppercase tracking-tight">Pendientes</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* CENTER: Mapa Operativo */}
        <div className="flex flex-col overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Mapa Operativo</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Signal className="h-3 w-3 text-green-500" />
                GPS Activo
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={mapToggle.tickets ? "default" : "outline"}
                className={`h-7 text-[11px] px-2.5 ${!mapToggle.tickets ? "bg-transparent" : ""}`}
                onClick={() => setMapToggle((p) => ({ ...p, tickets: !p.tickets }))}
              >
                Tickets
              </Button>
              <Button
                size="sm"
                variant={mapToggle.crews ? "default" : "outline"}
                className={`h-7 text-[11px] px-2.5 ${!mapToggle.crews ? "bg-transparent" : ""}`}
                onClick={() => setMapToggle((p) => ({ ...p, crews: !p.crews }))}
              >
                Cuadrillas
              </Button>
              <Button
                size="sm"
                variant={mapToggle.routes ? "default" : "outline"}
                className={`h-7 text-[11px] px-2.5 ${!mapToggle.routes ? "bg-transparent" : ""}`}
                onClick={() => setMapToggle((p) => ({ ...p, routes: !p.routes }))}
              >
                Rutas
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted/30 flex flex-col items-center justify-center gap-3 p-6 relative">
            <div className="w-full h-full rounded-lg bg-muted/50 border border-dashed flex flex-col items-center justify-center gap-4">
              <MapPin className="h-16 w-16 text-muted-foreground/30" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Mapa interactivo</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {assignedRoutes.filter((r) => r.status !== "completed").length} rutas activas &middot;{" "}
                  {mockCrews.filter((c) => c.available).length} cuadrillas en campo
                </p>
              </div>
              <div className="flex gap-5 text-xs text-muted-foreground">
                {mapToggle.tickets && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Alta prioridad
                  </span>
                )}
                {mapToggle.crews && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Cuadrillas
                  </span>
                )}
                {mapToggle.routes && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 h-[3px] w-5" />
                    Rutas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Alerts */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold">Cola de Alertas</h3>
              {alerts.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{alerts.length}</Badge>
              )}
            </div>
            <ScrollArea className="max-h-[120px]">
              <div className="space-y-1.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-2 text-xs p-2 rounded-md ${
                      alert.type === "danger"
                        ? "bg-red-500/10 text-red-700"
                        : alert.type === "warning"
                          ? "bg-orange-500/10 text-orange-700"
                          : "bg-blue-500/10 text-blue-700"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{alert.text}</span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin alertas operativas</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT: Cuadrillas */}
        <div className="border-l flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cuadrillas
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {mockCrews.map((crew) => {
                const st = crewStatusMock[crew.id]
                const crewRoutes = assignedRoutes.filter(
                  (r) => routeMatchesCrew(r, crew.id) && r.status !== "completed"
                )
                const activeRoute = crewRoutes[0]

                return (
                  <Card key={crew.id}>
                    <CardContent className="p-3 space-y-2.5">
                      {/* Crew header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{crew.name.split(" - ")[0]}</p>
                          <p className="text-[11px] text-muted-foreground">{crew.name.split(" - ")[1]}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 ${st.class}`}>
                          {crewStatusIcon[st.status]}
                          {st.label}
                        </Badge>
                      </div>

                      {/* Active route */}
                      {activeRoute ? (
                        <div className="p-2 rounded-md bg-muted/50 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate">{activeRoute.name}</p>
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              {(() => {
                                const total = activeRoute.tickets.length
                                const closed = activeRoute.tickets.filter((t) => t.status === "closed").length
                                const pending = activeRoute.tickets.filter((t) => t.status === "pending").length
                                if (total === 0) {
                                  return <div className="h-full w-full bg-muted" />
                                }
                                return (
                                  <div className="flex h-full">
                                    <div className="bg-green-500 h-full" style={{ width: `${(closed / total) * 100}%` }} />
                                    <div className="bg-orange-500 h-full" style={{ width: `${(pending / total) * 100}%` }} />
                                  </div>
                                )
                              })()}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {activeRoute.tickets.filter((t) => t.status !== "open").length}/{activeRoute.tickets.length}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">Sin ruta activa</p>
                      )}

                      {/* GPS time */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Signal className="h-3 w-3" />
                        Ultima posicion GPS: {st.lastGps}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 bg-transparent" disabled title="Disponible desde Rutas Sugeridas">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Asignar
                        </Button>
                        {activeRoute && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 bg-transparent" disabled title="Vista informativa">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver ruta
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Ticket Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto z-[1000]">
          {selectedTicket && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-lg">
                    {selectedTicket.ticketNumber}
                  </SheetTitle>
                  <Badge variant="outline" className={priorityConfig[selectedTicket.priority].class}>
                    {priorityConfig[selectedTicket.priority].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedTicket.status === "open"
                        ? "bg-blue-500/10 text-blue-700"
                        : selectedTicket.status === "pending"
                          ? "bg-orange-500/10 text-orange-700"
                          : "bg-green-500/10 text-green-700"
                    }
                  >
                    {selectedTicket.status === "open" ? "Abierto" : selectedTicket.status === "pending" ? "Pendiente Cierre" : "Cerrado"}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Informacion del Ticket</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm font-medium">{selectedTicket.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <p className="text-sm font-medium">{selectedTicket.category || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Direccion</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedTicket.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Zona</p>
                      <p className="text-sm font-medium">{getZoneFromAddress(selectedTicket.address)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reportado</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedTicket.createdAt
                          ? new Date(selectedTicket.createdAt).toLocaleDateString("es-AR")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contacto</p>
                      <p className="text-sm font-medium">{selectedTicket.contact}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Assignment */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Asignacion</h4>
                  {selectedTicket._crewName ? (
                    <div className="p-3 rounded-md bg-muted/50 border">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-600" />
                        {selectedTicket._crewName}
                      </p>
                      {selectedTicket._routeName && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {selectedTicket._routeName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cuadrilla..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCrews.filter((c) => c.available).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button className="w-full" size="sm" variant="outline" disabled title="La asignación se realiza desde Rutas Sugeridas">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar cuadrilla
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Resolution info if pending/closed */}
                {"resolution" in selectedTicket && (selectedTicket as AssignedTicket).resolution && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Resolucion de Cuadrilla</h4>
                      <div className="p-3 rounded-md bg-green-50 border border-green-200 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Tareas realizadas</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(selectedTicket as AssignedTicket).resolution?.tasksCompleted?.map((task, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{task}</Badge>
                            )) || (
                              (selectedTicket as AssignedTicket).resolution?.tasksPerformed?.map((task, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">{task}</Badge>
                              ))
                            )}
                          </div>
                        </div>
                        {(selectedTicket as AssignedTicket).resolution?.observations && (
                          <div>
                            <p className="text-xs text-muted-foreground">Observaciones</p>
                            <p className="text-sm">{(selectedTicket as AssignedTicket).resolution?.observations || (selectedTicket as AssignedTicket).resolution?.notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Completado</p>
                          <p className="text-sm">
                            {(selectedTicket as AssignedTicket).resolution?.completedAt
                              ? new Date((selectedTicket as AssignedTicket).resolution!.completedAt).toLocaleString("es-AR")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Status workflow */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Acciones</h4>
                  <div className="flex gap-2">
                    {selectedTicket.status === "pending" && (
                      <Button onClick={handleCloseTicket} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Cerrar Ticket
                      </Button>
                    )}
                    {selectedTicket.status === "open" && (
                      <Button variant="outline" className="flex-1 bg-transparent" disabled>
                        Esperando resolucion de cuadrilla
                      </Button>
                    )}
                    {selectedTicket.status === "closed" && (
                      <Button variant="outline" className="flex-1 bg-transparent" disabled>
                        Ticket cerrado
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Notas internas</h4>
                  <Textarea
                    placeholder="Agregar nota sobre este ticket..."
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" variant="outline" className="bg-transparent" disabled={!ticketNotes.trim()}>
                    Guardar nota
                  </Button>
                </div>

                <Separator />

                {/* Attachments */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Adjuntos</h4>
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Arrastra archivos o haz click para subir</p>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Seleccionar archivos
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
