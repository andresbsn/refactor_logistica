import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, MapPin, User, Clock, CheckCircle2, Phone } from "lucide-react"
import TicketResolveDialog from "./crew/ticket-resolve-dialog"
import { useRoutes } from "../lib/routes-context"
import { routeService } from "../services/api"
import { useToast } from "../hooks/use-toast"

const statusLabels = {
  open: "Abierto",
  pending: "Pendiente",
  closed: "Cerrado",
}

const statusColors = {
  open: "bg-blue-500/10 text-blue-600 border-blue-200",
  pending: "bg-orange-500/10 text-orange-600 border-orange-200",
  closed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
}

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

const priorityColors = {
  high: "bg-red-500/10 text-red-600 border-red-200",
  medium: "bg-orange-500/10 text-orange-600 border-orange-200",
  low: "bg-slate-500/10 text-slate-600 border-slate-200",
}

export function TicketCard({ ticket, routeId, onResolve }) {
  const [showResolve, setShowResolve] = useState(false)
  const { saveTicketResolution } = useRoutes()
  const { toast } = useToast()
  const ticketStatus = ticket.status || ticket.estado || "open"

  const handleCompleteResolution = async (resolutionData) => {
    const activeRouteId = routeId || ticket.routeId
    
    if (!activeRouteId) {
      console.error("No routeId found for ticket", ticket.id)
      toast({
        title: "Error",
        description: "No se encontró el ID de la ruta.",
        variant: "destructive"
      })
      return
    }

    try {
      await routeService.updateTicketStatus(activeRouteId, ticket.id, { is_closed: true })
    } catch (err) {
      console.error("Error updating ticket status on backend:", err)
    }

    saveTicketResolution(activeRouteId, ticket.id, {
      ...resolutionData,
      completedAt: new Date(),
      is_closed: true
    })
    setShowResolve(false)
    toast({
      title: "Ticket Resuelto",
      description: "La resolución ha sido guardada correctamente.",
    })
    if (onResolve) onResolve(ticket)
  }

  return (
    <>
      <Card className="glass shadow-premium border-white/60 rounded-xl p-2 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y--0.5 group">
        <div className="absolute top-0 right-0 p-4 -mr-6 -mt-6 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-0.5 flex-1 mr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {ticket.tipo && (
                <Badge variant="secondary" className="bg-custom-blue/10 text-custom-blue border-0 font-bold text-[10px] px-2 py-0 uppercase tracking-wider">
                  {ticket.tipo}
                </Badge>
              )}
              {ticket.id && (
                <span className="text-[10px] font-bold text-custom-blue/70 bg-custom-blue/5 px-1.5 py-0.5 rounded">
                  #{ticket.id}
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 px-0.5 py-0.5 leading-tight">
              {ticket.asunto}
            </h3>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Badge className={`${priorityColors[ticket.prioridad]} border-none font-bold text-[9px] px-2 py-0.5 shadow-none`}>
              {priorityLabels[ticket.prioridad]}
            </Badge>
            <Badge className={`${statusColors[ticketStatus]} border-none font-bold text-[9px] px-2 py-0.5 shadow-none`}>
              {statusLabels[ticketStatus]}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5 relative z-10 mt-1">
          <div className="flex items-start gap-1.5 text-slate-600 px-0.5">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary/70" />
            <p className="text-[14px] font-semibold leading-tight">{ticket.dire_completa}</p>
          </div>
          
          <div className="flex items-center gap-1.5 text-slate-500 px-0.5">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="text-[11px] font-bold truncate leading-none">Contacto: <span className="text-slate-700 font-bold">{ticket.contacto_nombre || "N/A"}</span></span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-end relative z-10 gap-2">
          {(ticket.contacto_celular || ticket.contacto_telefono) && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700"
              asChild
            >
              <a href={`tel:${ticket.contacto_celular || ticket.contacto_telefono}`} title={`Llamar a ${ticket.contacto_celular || ticket.contacto_telefono}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {ticketStatus === "open" && (
            <Button
              variant="default"
              className="h-9 px-6 rounded-lg font-bold bg-custom-blue text-white hover:bg-custom-blue/90 shadow-lg shadow-custom-blue/20 transition-all gap-2 border-0 text-[12px] flex-1"
              onClick={() => setShowResolve(true)}
            >
              <Wrench className="h-4 w-4" />
              Resolver
            </Button>
          )}
          {ticketStatus === "pending" && (
            <div className="flex items-center justify-center flex-1 gap-1 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 text-[10px] font-bold uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Validando
            </div>
          )}
          {ticketStatus === "closed" && (
            <div className="flex items-center justify-center flex-1 gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3" />
              Finalizado
            </div>
          )}
        </div>
      </Card>

      <TicketResolveDialog
        open={showResolve}
        onOpenChange={setShowResolve}
        ticket={{ ...ticket, routeId }}
        onComplete={handleCompleteResolution}
      />
    </>
  )
}
