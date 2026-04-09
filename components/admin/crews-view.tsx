"use client"

import { useState, useMemo } from "react"
import { useRoutes } from "@/lib/routes-context"
import { mockCrews } from "@/lib/mock-data"
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
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AssignedRoute, AssignedTicket } from "@/types/ticket"
import { TicketResolutionDialog } from "@/components/admin/ticket-resolution-dialog"

export function CrewsView() {
  const { assignedRoutes, closeTicket } = useRoutes()
  const [selectedCrew, setSelectedCrew] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<AssignedRoute | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<AssignedTicket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)

  const filteredRoutes = useMemo(() => {
    return assignedRoutes.filter((route: AssignedRoute) => {
      const matchesCrew = selectedCrew === "all" || route.crewId === selectedCrew
      const matchesStatus = selectedStatus === "all" || route.status === selectedStatus
      const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           route.crewName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCrew && matchesStatus && matchesSearch
    })
  }, [assignedRoutes, selectedCrew, selectedStatus, searchQuery])

  const getStatusConfig = (status: AssignedRoute["status"]) => {
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
    return config[status]
  }

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Abierto</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendiente</Badge>
      case "closed":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Cerrado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewTicketDetails = (ticket: AssignedTicket) => {
    setSelectedTicket(ticket)
    setShowTicketDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Buscar Rutas</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Nombre de ruta o cuadrilla..." 
              className="pl-10 h-11 bg-white/50 border-white/40 focus:bg-white transition-all rounded-xl"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-[220px] space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Por Cuadrilla</label>
          <Select value={selectedCrew} onValueChange={setSelectedCrew}>
            <SelectTrigger className="h-11 bg-white/50 border-white/40 rounded-xl">
              <SelectValue placeholder="Todas las cuadrillas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuadrillas</SelectItem>
              {mockCrews.map(crew => (
                <SelectItem key={crew.id} value={crew.id}>{crew.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[180px] space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Estado</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-11 bg-white/50 border-white/40 rounded-xl">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">En Curso</SelectItem>
              <SelectItem value="partial">Parciales</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List of Routes */}
        <div className="lg:col-span-1">
           {/* Space holder for future left nav if needed, but the user asked for detail on selection */}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <RouteIcon className="h-4 w-4" />
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
                  const closedCount = route.tickets.filter(t => t.status === "closed").length
                  const progress = Math.round((closedCount / route.tickets.length) * 100)

                  return (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={cn(
                        "w-full text-left transition-all duration-300 rounded-2xl border p-4 group",
                        isSelected 
                          ? "bg-primary shadow-lg shadow-primary/20 border-primary scale-[1.02] text-white" 
                          : "bg-white hover:bg-slate-50 border-white/60 shadow-sm"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("font-bold truncate", isSelected ? "text-white" : "text-slate-900")}>
                            {route.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className={cn("h-3 w-3", isSelected ? "text-white/70" : "text-slate-400")} />
                            <span className={cn("text-xs font-medium", isSelected ? "text-white/80" : "text-slate-500")}>
                              {route.crewName}
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                          isSelected ? "bg-white text-primary" : status.color + " text-white"
                        )}>
                          {status.label}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                          <span>Progreso</span>
                          <span>{closedCount}/{route.tickets.length}</span>
                        </div>
                        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isSelected ? "bg-white/20" : "bg-slate-100")}>
                          <div 
                            className={cn("h-full transition-all duration-500", isSelected ? "bg-white" : "bg-emerald-500")} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={cn("h-3 w-3", isSelected ? "text-white/70" : "text-slate-400")} />
                          <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-white/60" : "text-slate-400")}>
                            {new Date(route.assignedAt).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", isSelected ? "text-white" : "text-slate-300")} />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-7">
          {selectedRoute ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="glass shadow-premium border-white/40 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white/40 border-b border-white/60 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">#{selectedRoute.id}</Badge>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Ruta Asignada
                        </span>
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900">{selectedRoute.name}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-bold text-slate-700">{selectedRoute.crewName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Asignada el {new Date(selectedRoute.assignedAt).toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
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
                        Zona Centro
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-emerald-500" />
                      Tickets de la Ruta
                    </h4>
                    
                    <div className="space-y-3">
                      {selectedRoute.tickets.map((ticket: AssignedTicket) => (
                        <div 
                          key={ticket.id}
                          className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.ticketNumber || `#${ticket.id}`}</span>
                              {getTicketStatusBadge(ticket.status)}
                              {ticket.priority === "high" && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-[10px] uppercase font-black tracking-tighter">Urgente</Badge>
                              )}
                            </div>
                            <h5 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{ticket.title}</h5>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ticket.address}
                              </p>
                              {ticket.category && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                  {ticket.category}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex gap-2">
                            {ticket.status === "pending" && (
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-9"
                                onClick={() => closeTicket(selectedRoute.id, ticket.id)}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Cerrar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-slate-200 h-9 font-bold text-slate-600"
                              onClick={() => handleViewTicketDetails(ticket)}
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

      <TicketResolutionDialog
        open={showTicketDialog}
        onOpenChange={setShowTicketDialog}
        ticket={selectedTicket}
      />
    </div>
  )
}
