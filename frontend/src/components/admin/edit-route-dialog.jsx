import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { X, Plus, Search, MapPin } from "lucide-react"

export default function EditRouteDialog({
  open,
  onOpenChange,
  route,
  availableTickets,
  onSave,
}) {
  const [editedRoute, setEditedRoute] = useState(route)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (route) {
      setEditedRoute(route)
    }
  }, [route])

  const removeTicket = (ticketId) => {
    setEditedRoute((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((t) => t.id !== ticketId),
    }))
  }

  const addTicket = (ticket) => {
    if (!editedRoute.tickets.find((t) => t.id === ticket.id)) {
      setEditedRoute((prev) => ({
        ...prev,
        tickets: [...prev.tickets, ticket],
      }))
    }
  }

  const handleSave = () => {
    onSave(editedRoute)
    onOpenChange(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  if (!editedRoute) return null

  const filteredAvailableTickets = availableTickets.filter((ticket) => {
    const isAvailable = !editedRoute.tickets.find((t) => t.id === ticket.id)
    if (!isAvailable) return false
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const matchId = String(ticket.ticketNumber || ticket.id || "").toLowerCase().includes(searchLower)
    const matchTitle = String(ticket.asunto || ticket.title || "").toLowerCase().includes(searchLower)
    const matchAddress = String(ticket.dire_completa || ticket.address || "").toLowerCase().includes(searchLower)

    return matchId || matchTitle || matchAddress
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-3xl shadow-premium border-white/40 bg-slate-50/95 backdrop-blur-sm p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-primary/10 bg-white/80">
          <DialogTitle className="text-2xl font-outfit font-extrabold text-slate-800">
            Editor Manual: <span className="text-primary">{route?.name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
            Reorganiza los tickets de esta ruta sugerida. Los cambios se aplicarán localmente para confirmación.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="current" className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-primary/5 rounded-xl border border-primary/10">
            <TabsTrigger value="current" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full">
              <p className="text-black/60">En Ruta ({editedRoute.tickets.length})</p>
            </TabsTrigger>
            <TabsTrigger value="available" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full">
              <p className="text-black/60">Disponibles ({filteredAvailableTickets.length})</p>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {editedRoute.tickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-sm">No hay tickets en esta ruta.</p>
                  <p className="text-xs mt-1">Agrega tickets desde la pestaña "Tickets Disponibles".</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {editedRoute.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 flex items-start justify-between gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm group"
                    >
                      <div className="flex-1 min-w-0 max-w-90">
                        <div className="font-bold text-sm text-slate-800 truncate">
                          <span className="text-primary mr-1">{ticket.ticketNumber || `#${ticket.id}`}</span> {ticket.asunto || ticket.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            <span className="truncate font-medium text-[12px]">{ticket.dire_completa || ticket.address} {ticket.barrio ? `- Barrio ${ticket.barrio}` : ''}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Badge variant="outline" className="text-[12px] h-5 bg-primary/5 border-primary/20 text-black/60 font-bold px-2">
                              {ticket.tipo || ticket.category || 'Tipo'}
                            </Badge>
                            <Badge variant="secondary" className="text-[12px] h-5 bg-slate-100 text-slate-600 px-2 border-0 font-medium">
                              {ticket.subtipo || 'Subtipo'}
                            </Badge>
                            <Badge variant={getPriorityColor(ticket.priority)} className="text-[12px] h-5 px-2 font-bold text-white bg-custom-blue/50">
                              {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 bg-red-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors shrink-0"
                        onClick={() => removeTicket(ticket.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="available" className="flex-1 mt-4 space-y-3 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, título o calle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white/80 border-primary/20 focus-visible:ring-primary/30"
              />
            </div>

            <ScrollArea className="h-[350px] pr-4">
              {filteredAvailableTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-sm">
                    {searchTerm
                      ? "No se encontraron tickets que coincidan con tu búsqueda."
                      : "No hay tickets disponibles para agregar."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 flex items-start justify-between gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm group"
                    >
                      <div className="flex-1 min-w-0 max-w-90">
                        <div className="font-bold text-sm text-slate-800 truncate">
                          <span className="text-primary mr-1">{ticket.ticketNumber || `#${ticket.id}`}</span> {ticket.asunto || ticket.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            <span className="truncate font-medium text-[14px]">{ticket.dire_completa || ticket.address} {ticket.barrio ? `- Barrio ${ticket.barrio}` : ''}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Badge variant="outline" className="text-[12px] h-5 bg-primary/5 border-primary/20 text-black/60 font-bold px-2">
                              {ticket.tipo || ticket.category || 'Tipo'}
                            </Badge>
                            <Badge variant="secondary" className="text-[12px] h-5 bg-slate-100 text-slate-600 px-2 border-0 font-medium">
                              {ticket.subtipo || 'Subtipo'}
                            </Badge>
                            <Badge variant={getPriorityColor(ticket.priority)} className="text-[12px] h-5 px-2 font-bold text-white bg-custom-blue/50">
                              {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-black/60 bg-green-100 hover:bg-green-100 rounded-xl transition-colors shrink-0 shadow-sm"
                        onClick={() => addTicket(ticket)}
                      >
                        <Plus className="h-4 w-4 text-black/60" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 p-5 border-t border-primary/10 mt-auto bg-white/80">
          <Button variant="outline" className="h-10 rounded-xl border-custom-blue/20 bg-custom-blue/5 hover:bg-custom-blue/10 text-slate-600 font-bold" onClick={() => onOpenChange(false)}>
            Descartar
          </Button>
          <Button onClick={handleSave} className="h-10 px-6 rounded-xl bg-white/80 border border-custom-blue/50 hover:bg-white/90 text-black/60 font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">
            Guardar Rutina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
