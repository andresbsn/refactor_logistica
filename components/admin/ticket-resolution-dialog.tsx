"use client"

import type { AssignedTicket } from "@/types/ticket"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  Wrench,
  ImageIcon,
  FileText,
} from "lucide-react"

interface TicketResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: AssignedTicket | null
}

export function TicketResolutionDialog({
  open,
  onOpenChange,
  ticket,
}: TicketResolutionDialogProps) {
  if (!ticket) return null

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    open: { label: "Abierto", color: "bg-blue-500", icon: Clock },
    pending: { label: "Pendiente Cierre", color: "bg-orange-500", icon: Clock },
    closed: { label: "Cerrado", color: "bg-green-500", icon: CheckCircle },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: "Alta", color: "bg-red-500" },
    medium: { label: "Media", color: "bg-yellow-500" },
    low: { label: "Baja", color: "bg-green-500" },
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium
  const StatusIcon = status.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.ticketNumber} - {ticket.category}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${priority.color} text-white`}>
                {priority.label}
              </Badge>
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Info del Ticket */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">{ticket.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contacto</p>
                  <p className="text-sm text-muted-foreground">{ticket.contact}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de creación</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.createdAt?.toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>
              {ticket.agent && (
                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Agente</p>
                    <p className="text-sm text-muted-foreground">{ticket.agent}</p>
                  </div>
                </div>
              )}
            </div>

            {ticket.resolution ? (
              <>
                <Separator />

                {/* Fecha de resolución */}
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Resuelto el</p>
                    <p className="text-sm">
                      {ticket.resolution.completedAt.toLocaleDateString("es-AR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Notas del Operador</h4>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {ticket.resolution.notes}
                  </p>
                </div>

                {/* Tareas realizadas */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Tareas Realizadas</h4>
                  </div>
                  <ul className="space-y-2">
                    {ticket.resolution.tasksPerformed.map((task, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Materiales utilizados */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Materiales Utilizados</h4>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-2">Material</th>
                          <th className="pb-2 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.resolution.materialsUsed.map((material, index) => (
                          <tr key={index} className="border-t border-border/50">
                            <td className="py-2">{material.materialName}</td>
                            <td className="py-2 text-right">
                              {material.quantity} {material.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Imágenes */}
                {ticket.resolution.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">
                        Imágenes ({ticket.resolution.images.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {ticket.resolution.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Imagen ${index + 1} de la resolución`}
                            className="object-cover w-full h-full hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Ticket sin resolución</p>
                <p className="text-sm">
                  Este ticket aún no ha sido completado por la cuadrilla
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
