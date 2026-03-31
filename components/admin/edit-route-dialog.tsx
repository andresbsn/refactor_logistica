"use client"

import { useState, useEffect } from "react"
import type { SuggestedRoute, Ticket } from "@/types/ticket"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Search, MapPin } from "lucide-react"

interface EditRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: SuggestedRoute
  availableTickets: Ticket[]
  onSave: (updatedRoute: SuggestedRoute) => void
}

export function EditRouteDialog({ open, onOpenChange, route, availableTickets, onSave }: EditRouteDialogProps) {
  const [editedRoute, setEditedRoute] = useState<SuggestedRoute>(route)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setEditedRoute(route)
  }, [route])

  const removeTicket = (ticketId: string) => {
    setEditedRoute({
      ...editedRoute,
      tickets: editedRoute.tickets.filter((t) => t.id !== ticketId),
    })
  }

  const addTicket = (ticket: Ticket) => {
    if (!editedRoute.tickets.find((t) => t.id === ticket.id)) {
      setEditedRoute({
        ...editedRoute,
        tickets: [...editedRoute.tickets, ticket],
      })
    }
  }

  const handleSave = () => {
    onSave(editedRoute)
    onOpenChange(false)
  }

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
    }
  }

  const filteredAvailableTickets = availableTickets.filter(
    (ticket) =>
      !editedRoute.tickets.find((t) => t.id === ticket.id) &&
      (ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.address.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Ruta: {route.name}</DialogTitle>
          <DialogDescription>
            Agrega o quita tickets de esta ruta sugerida. Los cambios se aplicarán al confirmar.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="current" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Tickets en Ruta ({editedRoute.tickets.length})</TabsTrigger>
            <TabsTrigger value="available">Tickets Disponibles ({filteredAvailableTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {editedRoute.tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay tickets en esta ruta. Agrega tickets desde la pestaña "Tickets Disponibles".
                </div>
              ) : (
                <div className="space-y-2">
                  {editedRoute.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-secondary/30 rounded-lg border flex items-start justify-between gap-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {ticket.ticketNumber} - {ticket.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ticket.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {ticket.category && (
                            <Badge variant="outline" className="text-xs">
                              {ticket.category}
                            </Badge>
                          )}
                          <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                            {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

          <TabsContent value="available" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[350px] pr-4">
              {filteredAvailableTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchTerm
                    ? "No se encontraron tickets que coincidan con tu búsqueda."
                    : "No hay tickets disponibles para agregar."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-background rounded-lg border flex items-start justify-between gap-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {ticket.ticketNumber} - {ticket.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ticket.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {ticket.category && (
                            <Badge variant="outline" className="text-xs">
                              {ticket.category}
                            </Badge>
                          )}
                          <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                            {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => addTicket(ticket)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
