import React, { useState, useMemo } from "react"
import { useRoutes } from "../../lib/routes-context"
import { mockCrews } from "../../lib/mock-data"
import TicketDetailDialog from "../crew/ticket-detail-dialog"
import RoutePathDialog from "./route-path-dialog"
import AddTicketsToRouteModal from "./add-tickets-to-route-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { routeService, ticketService } from "../../services/api"
import { 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Route as RouteIcon,
  Search,
  CheckSquare,
  Eye,
  Info,
  AlertTriangle,
  Trash2,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

export function CrewsView() {
  const { assignedRoutes, closeTicket, fetchRoutes } = useRoutes()
  const [selectedCrew, setSelectedCrew] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [routePathDialogOpen, setRoutePathDialogOpen] = useState(false)
  const [closingTicket, setClosingTicket] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, ticket: null })
  const [routeActionDialog, setRouteActionDialog] = useState({ open: false, route: null, action: null })
  const [routeActionLoading, setRouteActionLoading] = useState(false)
  const [routeActionObservation, setRouteActionObservation] = useState("")
  const [addTicketsModalOpen, setAddTicketsModalOpen] = useState(false)

  const handleCloseTicket = (ticket) => {
    setConfirmDialog({ open: true, ticket })
  }

  const confirmCloseTicket = async () => {
    const ticket = confirmDialog.ticket
    if (!ticket) return

    setConfirmDialog({ open: false, ticket: null })
    setClosingTicket(ticket.id)
    try {
      await ticketService.changeStatus(ticket.id, "solved")
      closeTicket(selectedRoute.id, ticket.id)
      setSelectedRoute((prev) => {
        if (!prev) return null
        const updatedTickets = prev.tickets.map(t => 
          t.id === ticket.id ? { ...t, estado: "solved" } : t
        )
        const closedCount = updatedTickets.filter(t => t.estado === "closed" || t.estado === "solved" || t.is_closed === true).length
        const allClosed = closedCount === updatedTickets.length
        return {
          ...prev,
          tickets: updatedTickets,
          status: allClosed ? "completed" : prev.status
        }
      })
    } catch (error) {
      console.error("Error closing ticket:", error)
    } finally {
      setClosingTicket(null)
    }
  }

  const filteredRoutes = useMemo(() => {
    const search = (searchQuery || "").toLowerCase()

    return assignedRoutes.filter((route) => {
      // Solo mostrar rutas que NO estén planeadas (confirmadas)
      if (route.planed === true || route.planed === "true" || route.status === "planned" || route.estado === "planeado") return false

      const matchesCrew = selectedCrew === "all" || String(route.crewId) === String(selectedCrew) || String(route.crew_id) === String(selectedCrew)
      const matchesStatus = selectedStatus === "all" || route.status === selectedStatus

      const matchesSearch =
        (route.name ?? "").toLowerCase().includes(search) ||
        (route.crewName ?? "").toLowerCase().includes(search)

      return matchesCrew && matchesStatus && matchesSearch
    })
  }, [assignedRoutes, selectedCrew, selectedStatus, searchQuery]) 

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket)
    setTicketDialogOpen(true)
  }

  const getStatusConfig = (status) => {
    const config = {
      active: {
        label: "En Curso",
        color: "bg-blue-500",
        lightColor: "bg-blue-50 text-blue-700 border-blue-100",
        icon: Clock,
      },
      completed: {
        label: "Completada",
        color: "bg-emerald-500",
        lightColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: CheckCircle,
      },
      partial: {
        label: "Parcial",
        color: "bg-amber-500",
        lightColor: "bg-amber-50 text-amber-700 border-amber-100",
        icon: AlertCircle,
      },
    }
    return config[status] || config.active
  }

  const getTicketStatusBadge = (ticket) => {
    const estado = ticket.estado
    
    // if (isClosed || estado === "closed") {
    //   return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Resuelto</Badge>
    // }
    
    switch (estado) {
      case "open":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Abierto</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendiente de Cierre</Badge>
      case 'solved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Resuelto</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const formatTimestamp = (ts, includeTime = false) => {
    if (!ts) return "N/A"
    let d
    if (typeof ts === "string" && /^\d+$/.test(ts)) {
      d = new Date(parseInt(ts, 10))
    } else if (typeof ts === "number") {
      d = new Date(ts)
    } else {
      d = new Date(ts)
    }
    
    if (isNaN(d.getTime())) return "N/A"

    if (includeTime) {
      return d.toLocaleString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    }
    return d.toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    })
  }

  const getTicketFlowState = (ticket) => {
    const status = String(ticket?.status || ticket?.estado || "").toLowerCase()
    if (status === "solved" || status === "pending" || status === "closed") return status
    if (ticket?.is_closed === true || ticket?.resolution?.is_closed === true) return "closed"
    return "open"
  }

  const isRouteReadyForPath = (route) => {
    if (!route?.tickets?.length) return false
    return route.tickets.every((ticket) => {
      const state = getTicketFlowState(ticket)
      return state === "solved" || state === "pending" || state === "closed"
    })
  }

  const getRouteResolvedCount = (route) => {
    if (!route?.tickets?.length) return 0
    return route.tickets.filter((ticket) => {
      const state = getTicketFlowState(ticket)
      return state === "solved" || state === "pending" || state === "closed"
    }).length
  }

  const getRouteClosedCount = (route) => {
    if (!route?.tickets?.length) return 0
    return route.tickets.filter((ticket) => {
      const state = getTicketFlowState(ticket)
      return state === "solved" || state === "closed"
    }).length
  }

  const openRouteActionDialog = (action) => {
    if (!selectedRoute) return
    setRouteActionObservation("")
    setRouteActionDialog({ open: true, route: selectedRoute, action })
  }

  const confirmRouteAction = async () => {
    const actionRoute = routeActionDialog.route
    if (!actionRoute) return

    if (routeActionDialog.action !== "delete" && !routeActionObservation.trim()) {
      return
    }

    setRouteActionLoading(true)
    try {
      if (routeActionDialog.action === "delete") {
        await routeService.deleteRoute(actionRoute.id)
      } else {
        await routeService.closeUnexpected(actionRoute.id, routeActionObservation.trim())
      }

      await fetchRoutes()
      setSelectedRoute(null)
      setRoutePathDialogOpen(false)
    } catch (error) {
      console.error("Error processing route action:", error)
    } finally {
      setRouteActionLoading(false)
      setRouteActionDialog({ open: false, route: null, action: null })
      setRouteActionObservation("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white/40 p-5 rounded-3xl border border-white/60 glass shadow-sm">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em] px-2">Buscar Rutas</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
            <Input 
              placeholder="Nombre de ruta o cuadrilla..." 
              className="pl-11 h-12 bg-white/80 border-primary/10 focus:border-primary/30 focus:bg-white transition-all rounded-2xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-[220px] space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em] px-2">Por Cuadrilla</label>
          <Select value={selectedCrew} onValueChange={setSelectedCrew}>
            <SelectTrigger className="h-12 bg-white/80 border-primary/10 rounded-2xl shadow-sm">
              <SelectValue placeholder="Todas las cuadrillas" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-primary/10">
              <SelectItem value="all">Todas las cuadrillas</SelectItem>
              {mockCrews.map(crew => (
                <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[180px] space-y-2">
          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em] px-2">Estado</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-12 bg-white/80 border-primary/10 rounded-2xl shadow-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-primary/10">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">En Curso</SelectItem>
              <SelectItem value="partial">Parciales</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List Section */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <RouteIcon className="h-3.5 w-3.5" />
            Rutas Filtradas ({filteredRoutes.length})
          </h3>
          <ScrollArea className="h-[calc(100vh-320px)] pr-4">
            <div className="space-y-3">
              {filteredRoutes.length === 0 ? (
                <Card className="border-dashed py-12 text-center">
                  <p className="text-muted-foreground">No se encontraron rutas con estos filtros</p>
                </Card>
              ) : (
                filteredRoutes.map((route) => {
                  const status = getStatusConfig(route.status)
                  const isSelected = selectedRoute?.id === route.id
                  const resolvedCount = getRouteResolvedCount(route)
                  const progress = route.tickets.length > 0 ? Math.round((resolvedCount / route.tickets.length) * 100) : 0

                  return (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={cn(
                        "w-full text-left transition-all duration-300 rounded-2xl border p-5 group relative overflow-hidden",
                        isSelected 
                          ? "bg-custom-blue/10 shadow-xl shadow-custom-blue/20 border-custom-blue scale-[1.03] text-primary" 
                          : "bg-white hover:bg-custom-blue/5 border-custom-blue/20 shadow-sm hover:shadow-md hover:border-custom-blue/40"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 p-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("font-bold truncate text-lg", isSelected ? "text-primary" : "text-slate-900")}>
                            Ruta {route.id}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className={cn("h-3.5 w-3.5", isSelected ? "text-primary/70" : "text-slate-400")} />
                            <span className={cn("text-xs font-medium", isSelected ? "text-primary/80" : "text-slate-500")}>
                              {route.crewName}
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                          isSelected ? "bg-primary/10 text-primary border border-primary/20" : status.color + " text-white"
                        )}>
                          {status.label}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                          <span>Progreso</span>
                            <span>{resolvedCount}/{route.tickets.length}</span>
                        </div>
                        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isSelected ? "bg-primary/20" : "bg-slate-100")}>
                          <div 
                            className={cn("h-full transition-all duration-500", isSelected ? "bg-primary" : "bg-emerald-500")} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className={cn("h-3 w-3", isSelected ? "text-primary/70" : "text-slate-400")} />
                            <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-primary/60" : "text-slate-400")}>
                              Creada: {formatTimestamp(route.created_at || route.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className={cn("h-3 w-3", isSelected ? "text-primary/70" : "text-slate-400")} />
                            <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-primary/60" : "text-slate-400")}>
                              Asignada: {formatTimestamp(route.assigned_at || route.assignedAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1 mt-auto mb-1", isSelected ? "text-primary" : "text-slate-300")} />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail Section */}
        <div className="lg:col-span-8">
          {selectedRoute ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="glass shadow-premium border-white/40 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white/40 border-b border-white/60 p-6">
                      <div className="flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="bg-primary/5 text-custom-blue border-primary/20 px-2 py-0 text-[12px] uppercase font-bold tracking-wider">#{selectedRoute.id}</Badge>
                        <span className="text-[12px] font-black text-custom-blue uppercase tracking-[0.2em]">
                          Ruta Asignada
                        </span>
                      </div>
                      <CardTitle className="text-3xl font-outfit font-black text-primary tracking-tight">{selectedRoute.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-bold text-slate-700">{selectedRoute.crewName}</span>
                        </div>
                        <p className="text-xs text-slate-500">Creada el {formatTimestamp(selectedRoute.created_at || selectedRoute.createdAt, true)}</p>
                        <p className="text-xs text-slate-500">Asignada el {formatTimestamp(selectedRoute.assigned_at || selectedRoute.assignedAt, true)}</p>
                      </div>
                      {selectedRoute.status !== "completed" && getRouteClosedCount(selectedRoute) > 0 && (
                        <Button
                          onClick={() => openRouteActionDialog("close")}
                          className="h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Cerrar por imprevisto
                        </Button>
                      )}
                      {selectedRoute.status !== "completed" && getRouteClosedCount(selectedRoute) === 0 && (
                        <Button
                          onClick={() => openRouteActionDialog("delete")}
                          className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar ruta
                        </Button>
                      )}
                      {isRouteReadyForPath(selectedRoute) && (
                        <Button
                          onClick={() => setRoutePathDialogOpen(true)}
                          className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-500/20"
                        >
                          <RouteIcon className="h-4 w-4 mr-2" />
                          Ver recorrido
                        </Button>
                      )}
                      {selectedRoute.status === "active" && (
                        <Button
                          onClick={() => setAddTicketsModalOpen(true)}
                          className="h-11 rounded-xl bg-custom-blue hover:bg-custom-blue/90 text-white font-bold shadow-lg shadow-primary/20"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Tickets
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado General</span>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusConfig(selectedRoute.status).color)} />
                        <span className="font-bold text-slate-700">{getStatusConfig(selectedRoute.status).label}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tickets</span>
                      <p className="font-bold text-slate-700">{selectedRoute.tickets.length} Incidencias</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación Promedio</span>
                      <p className="font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        Zona Operativa
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-emerald-500" />
                      Tickets de la Ruta
                    </h4>
                    
                    <div className="space-y-3">
                      {selectedRoute.tickets.map((ticket) => (
                        <div 
                          key={ticket.id}
                          className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/80 border border-custom-blue/20 rounded-2xl hover:border-custom-blue hover:bg-custom-blue/5 hover:shadow-xl hover:shadow-custom-blue/10 transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[14px] font-mono font-bold text-black/40 tracking-wider">
                                {ticket.ticketNumber || `#${ticket.id}`}
                              </span>
                              {getTicketStatusBadge(ticket)}
                              {ticket.prioridad === "high" && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-[10px] uppercase font-black tracking-tighter shadow-sm border-0">
                                  Urgente
                                </Badge>
                              )}
                              {ticket.creado && (
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 ml-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                  <Clock className="h-3 w-3" />
                                  {new Date(ticket.creado).toLocaleDateString("es-AR")}
                                </span>
                              )}
                            </div>
                            <h5 className="text-base font-bold text-primary group-hover:text-primary/80 transition-colors">
                              {ticket.asunto}
                            </h5>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <p className="text-xs text-primary/70 font-medium flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                <span className="truncate max-w-[200px]">{ticket.dire_completa}</span>
                              </p>
                              
                              <div className="flex items-center gap-1.5">
                                {ticket.tipo && (
                                  <span className="text-[10px] font-bold text-custom-blue uppercase tracking-widest bg-custom-blue/10 border border-custom-blue/20 px-2 py-1 rounded-md">
                                    {ticket.tipo}
                                  </span>
                                )}
                                {ticket.subtipo && (
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                                    {ticket.subtipo}
                                  </span>
                                )}
                              </div>

                              {(ticket.contacto_nombre || ticket.agente) && (
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                                  <Users className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="truncate max-w-[150px]">{ticket.contacto_nombre || ticket.agente}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex gap-2">
                            {ticket.estado === "pending" && (
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-9"
                                onClick={() => handleCloseTicket(ticket)}
                                disabled={closingTicket === ticket.id}
                              >
                                {closingTicket === ticket.id ? (
                                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                )}
                                Cerrar
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 rounded-xl border-custom-blue/20 hover:bg-custom-blue/50 bg-custom-blue/5 hover:text-primary transition-all font-bold text-slate-700"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Summary if all are closed */}
              {selectedRoute.status === "completed" && (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">Ruta Completada Exitosamente</h4>
                    <p className="text-sm text-emerald-700">Todos los tickets han sido resueltos y verificados por el sistema.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="relative mb-6">
                <div className="absolute inset-0 scale-150 blur-2xl bg-primary/10 rounded-full" />
                <div className="relative h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
                  <Info className="h-10 w-10 text-slate-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Selección de Ruta</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Elige una ruta del panel izquierdo para visualizar su progreso, tickets asignados y gestionar su resolución.
              </p>
            </div>
          )}
        </div>
      </div>

      <TicketDetailDialog 
        open={ticketDialogOpen} 
        onOpenChange={setTicketDialogOpen} 
        ticket={selectedTicket} 
      />

      <RoutePathDialog
        open={routePathDialogOpen}
        onOpenChange={setRoutePathDialogOpen}
        route={selectedRoute}
      />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, ticket: confirmDialog.ticket })}>
        <DialogContent className="max-w-sm rounded-3xl border-amber-200 bg-amber-50/95 backdrop-blur-sm p-0 shadow-xl">
          <DialogHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-amber-800">
                Advertencia
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="px-6 pb-6">
            <p className="text-sm text-amber-700 leading-relaxed">
              ¿Está seguro que desea pasar el ticket al estado resuelto?
            </p>
          </div>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button 
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, ticket: null })}
              className="h-10 px-6 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmCloseTicket}
              className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={routeActionDialog.open}
        onOpenChange={(open) => {
          setRouteActionDialog({ ...routeActionDialog, open })
          if (!open) setRouteActionObservation("")
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-slate-200 bg-white/95 backdrop-blur-sm p-0 shadow-xl">
          <DialogHeader className="pb-2 pt-6 px-6">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {routeActionDialog.action === "delete" ? "Eliminar ruta" : "Cerrar ruta por imprevisto"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              {routeActionDialog.action === "delete"
                ? "La ruta no tiene tickets resueltos. Se desactivará y quedará inutilizable."
                : "Los tickets pendientes quedarán marcados como no cerrables y se guardará el recorrido real con el histórico de YPF."}
            </p>
            {routeActionDialog.action !== "delete" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Imprevisto</label>
                <Textarea
                  value={routeActionObservation}
                  onChange={(e) => setRouteActionObservation(e.target.value)}
                  placeholder="Describí el imprevisto..."
                  className="min-h-28 rounded-2xl"
                />
              </div>
            )}
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Ruta #{routeActionDialog.route?.id}
            </p>
          </div>
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setRouteActionDialog({ open: false, route: null, action: null })}
              className="h-10 px-6 rounded-xl border-slate-200 text-slate-700 font-bold"
              disabled={routeActionLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRouteAction}
              className={cn(
                "h-10 px-6 rounded-xl text-white font-bold shadow-lg",
                routeActionDialog.action === "delete"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
              disabled={routeActionLoading || (routeActionDialog.action !== "delete" && !routeActionObservation.trim())}
            >
              {routeActionLoading ? "Procesando..." : routeActionDialog.action === "delete" ? "Eliminar" : "Cerrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddTicketsToRouteModal
        open={addTicketsModalOpen}
        onOpenChange={setAddTicketsModalOpen}
        route={selectedRoute}
        onTicketsAdded={() => {
          fetchRoutes()
        }}
      />

    </div>
  )
}
