import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Checkbox } from "../ui/checkbox"
import { routeService } from "../../services/api"
import { Search, MapPin, X, Plus, Clock, User, AlertCircle, Loader2, CheckSquare } from "lucide-react"
import { cn } from "../../lib/utils"

export default function AddTicketsToRouteModal({
  open,
  onOpenChange,
  route,
  onTicketsAdded,
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [availableTickets, setAvailableTickets] = useState([])
  const [selectedTickets, setSelectedTickets] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const loadAvailableTickets = useMemo(() => async () => {
    if (!route?.id) return

    setLoading(true)
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (typeFilter !== "all") params.type = typeFilter
      if (priorityFilter !== "all") params.priority = priorityFilter

      const tickets = await routeService.getBacklogTickets(route.id, params)
      setAvailableTickets(tickets || [])
    } catch (error) {
      console.error("Error loading available tickets:", error)
      setAvailableTickets([])
    } finally {
      setLoading(false)
    }
  }, [route?.id, searchQuery, typeFilter, priorityFilter])

  useEffect(() => {
    if (open && route) {
      loadAvailableTickets()
    }
  }, [open, route, loadAvailableTickets])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setTypeFilter("all")
      setPriorityFilter("all")
      setSelectedTickets(new Set())
      setAvailableTickets([])
    }
  }, [open])

  const loadAvailableTicketsForSearch = async () => {
    if (!route?.id) return

    setLoading(true)
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (typeFilter !== "all") params.type = typeFilter
      if (priorityFilter !== "all") params.priority = priorityFilter

      const tickets = await routeService.getBacklogTickets(route.id, params)
      setAvailableTickets(tickets || [])
    } catch (error) {
      console.error("Error loading available tickets:", error)
      setAvailableTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadAvailableTicketsForSearch()
  }

  const toggleTicket = (ticketId) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId)
      } else {
        newSet.add(ticketId)
      }
      return newSet
    })
  }

  const handleAddTickets = async () => {
    if (selectedTickets.size === 0) return

    setSaving(true)
    try {
      const ticketIds = Array.from(selectedTickets)
      const result = await routeService.addTicketsToRoute(route.id, ticketIds)

      if (result.added > 0) {
        onTicketsAdded?.(result)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error adding tickets:", error)
    } finally {
      setSaving(false)
    }
  }

  const filteredTickets = useMemo(() => availableTickets, [availableTickets])

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-premium border-white/40 bg-slate-50/95 backdrop-blur-sm p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-primary/10 bg-white/80">
          <DialogTitle className="text-2xl font-outfit font-extrabold text-slate-800">
            Agregar Tickets a Ruta
          </DialogTitle>
          <div className="text-sm font-medium text-slate-500 mt-1">
            Selecciona tickets disponibles para agregar a la ruta #{route?.id} - {route?.name}
          </div>
        </DialogHeader>

        <div className="p-4 border-b border-primary/10 bg-white/50 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input
                placeholder="Buscar por ID, dirección o asunto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-10 rounded-xl bg-white border-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest self-center">
              Filtros:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 rounded-lg border border-primary/20 bg-white text-sm"
            >
              <option value="all">Todos los tipos</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2 rounded-lg border border-primary/20 bg-white text-sm"
            >
              <option value="all">Todas las prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
              <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? "No se encontraron tickets con esos filtros"
                  : "No hay tickets disponibles en el backlog"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Los tickets deben tener coordenadas y estar relacionados a tu usuario
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer",
                    selectedTickets.has(ticket.id)
                      ? "bg-custom-blue/10 border-custom-blue shadow-md"
                      : "bg-white border-primary/10 hover:border-primary/30 hover:bg-slate-50"
                  )}
                  onClick={() => toggleTicket(ticket.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTickets.has(ticket.id)}
                      onCheckedChange={() => toggleTicket(ticket.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-black/40">
                          {ticket.ticketNumber || `#${ticket.id}`}
                        </span>
                        {ticket.prioridad === "high" && (
                          <Badge className="bg-red-500 text-[10px] font-bold">Urgente</Badge>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.creado)}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm">
                        {ticket.asunto}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <MapPin className="h-3 w-3 text-primary" />
                          {ticket.dire_completa || ticket.barrio || "Sin dirección"}
                        </span>
                        {ticket.tipo_nombre && (
                          <span className="text-[10px] font-bold text-custom-blue uppercase bg-custom-blue/10 px-2 py-0.5 rounded">
                            {ticket.tipo_nombre}
                          </span>
                        )}
                        {ticket.contacto_nombre && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.contacto_nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center p-4 border-t border-primary/10 bg-white/80">
          <div className="text-sm text-slate-500">
            {selectedTickets.size > 0 ? (
              <span className="font-bold text-primary">
                {selectedTickets.size} ticket{selectedTickets.size !== 1 ? "s" : ""} seleccionado
                {selectedTickets.size !== 1 ? "s" : ""}
              </span>
            ) : (
              "Selecciona tickets para agregar"
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl border-primary/20 text-slate-600 font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTickets}
              disabled={selectedTickets.size === 0 || saving}
              className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Agregar {selectedTickets.size > 0 && `(${selectedTickets.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}