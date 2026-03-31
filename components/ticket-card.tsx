"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Copy, Eye, Wrench } from "lucide-react"
import type { Ticket } from "@/types/ticket"

interface TicketCardProps {
  ticket: Ticket
  onView?: (ticket: Ticket) => void
  onResolve?: (ticket: Ticket) => void
}

const statusLabels: Record<string, string> = {
  open: "Abierto",
  pending: "Pendiente Cierre",
  closed: "Cerrado",
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  pending: "bg-orange-500",
  closed: "bg-green-500",
}

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-gray-500",
}

export function TicketCard({ ticket, onView, onResolve }: TicketCardProps) {
  return (
    <Card className="p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {ticket.category && (
              <span className="text-xs font-medium text-primary">{ticket.category}</span>
            )}
            {ticket.ticketNumber && (
              <Badge variant="outline" className="text-xs font-mono">
                {ticket.ticketNumber}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg">{ticket.title}</h3>
        </div>
        <div className="flex gap-2">
          <Badge className={`${priorityColors[ticket.priority]} text-white`}>
            {priorityLabels[ticket.priority]}
          </Badge>
          <Badge className={`${statusColors[ticket.status]} text-white`}>
            {statusLabels[ticket.status]}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{ticket.address}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm">Contacto: {ticket.contactoNombre || ticket.contact}</span>
        <div className="flex gap-2">
          {(ticket.contactoCelular || ticket.contactoTelefono) && (
            <Button
              size="icon"
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              asChild
            >
              <a href={`tel:${ticket.contactoCelular || ticket.contactoTelefono}`} title={`Llamar a ${ticket.contactoCelular || ticket.contactoTelefono}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {onView && (
            <Button
              size="icon"
              variant="outline"
              onClick={() => onView(ticket)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onResolve && ticket.status === "open" && (
            <Button
              size="icon"
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => onResolve(ticket)}
              title="Resolver tarea"
            >
              <Wrench className="h-4 w-4" />
            </Button>
          )}
          {ticket.status === "pending" && (
            <span className="text-xs text-orange-600 font-medium">
              Esperando cierre
            </span>
          )}
          {ticket.status === "closed" && (
            <span className="text-xs text-green-600 font-medium">
              Cerrado
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
