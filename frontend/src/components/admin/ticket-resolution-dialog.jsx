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
  X
} from "lucide-react"

export function TicketResolutionDialog({
  open,
  onOpenChange,
  ticket,
}) {
  if (!ticket) return null

  const statusConfig = {
    open: { label: "Abierto", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Clock },
    pending: { label: "Pendiente Cierre", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
    closed: { label: "Cerrado", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle },
  }

  const priorityConfig = {
    high: { label: "Alta", color: "bg-red-500/20 text-red-300 border-red-500/30" },
    medium: { label: "Media", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    low: { label: "Baja", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium
  const StatusIcon = status.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-[#0A0F1C]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl overflow-hidden [&>button]:!hidden p-0 rounded-2xl flex flex-col">
        {/* Header con gradiente premium */}
        <DialogHeader className="px-6 py-5 bg-gradient-to-br from-white/5 to-transparent border-b border-white/10 relative overflow-hidden backdrop-blur-sm pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 w-full pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 backdrop-blur-md">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white/90">
                  {ticket.title}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium ml-12">
                <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/5">{ticket.ticketNumber}</span>
                <span>•</span>
                <span>{ticket.category}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Badge variant="outline" className={`${priority.color} backdrop-blur-md font-medium border`}>
                  Prioridad {priority.label}
                </Badge>
                <Badge variant="outline" className={`${status.color} backdrop-blur-md font-medium border flex items-center gap-1.5`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/20 z-20 group"
          >
            <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-6 custom-scrollbar">
          <div className="space-y-6 max-w-3xl mx-auto">
            
            {/* Tarjetas de Información Rápida (Estilo Glassmorphism Premium) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white-[0.07] transition-colors group">
                <MapPin className="h-5 w-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-400 font-medium mb-1">Dirección</p>
                <p className="text-sm text-white/90 font-medium truncate" title={ticket.address}>{ticket.address}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white-[0.07] transition-colors group">
                <Phone className="h-5 w-5 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-400 font-medium mb-1">Contacto</p>
                <p className="text-sm text-white/90 font-medium truncate" title={ticket.contact}>{ticket.contact}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white-[0.07] transition-colors group">
                <Calendar className="h-5 w-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-400 font-medium mb-1">Fecha Creación</p>
                <p className="text-sm text-white/90 font-medium">
                  {ticket.createdAt?.toLocaleDateString("es-AR")}
                </p>
              </div>
              {ticket.agent && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white-[0.07] transition-colors group">
                  <Wrench className="h-5 w-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-gray-400 font-medium mb-1">Agente Asignado</p>
                  <p className="text-sm text-white/90 font-medium truncate" title={ticket.agent}>{ticket.agent}</p>
                </div>
              )}
            </div>

            {ticket.resolution ? (
              <div className="space-y-6 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                {/* Header Resolucion */}
                <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-300">Ticket Resuelto</h3>
                    <p className="text-sm text-emerald-400/80">
                      Completado el {ticket.resolution.completedAt.toLocaleDateString("es-AR", {
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
                
                {/* Imágenes */}
                {ticket.resolution.images && ticket.resolution.images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <ImageIcon className="h-4 w-4 text-pink-400" />
                      <h4 className="font-semibold">
                        Registro Fotográfico <span className="text-gray-500 text-sm font-normal">({ticket.resolution.images.length})</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {ticket.resolution.images.map((image, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10"
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Imagen ${index + 1} de resolución`}
                            className="object-cover w-full h-full group-hover:scale-110 group-hover:opacity-75 transition-all cursor-pointer duration-300"
                          />
                          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <h4 className="font-semibold">Notas del Operador</h4>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed min-h-[100px]">
                      {ticket.resolution.notes}
                    </div>
                  </div>

                  {/* Tareas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <Wrench className="h-4 w-4 text-orange-400" />
                      <h4 className="font-semibold">Tareas Realizadas</h4>
                    </div>
                    <ul className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5 min-h-[100px]">
                      {ticket.resolution.tasksPerformed.map((task, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Materiales */}
                {ticket.resolution.materialsUsed && ticket.resolution.materialsUsed.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <Package className="h-4 w-4 text-purple-400" />
                      <h4 className="font-semibold">Materiales Utilizados</h4>
                    </div>
                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 border-b border-white/5">
                          <tr className="text-left text-gray-400">
                            <th className="py-3 px-4 font-medium">Material</th>
                            <th className="py-3 px-4 font-medium text-right">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {ticket.resolution.materialsUsed.map((material, index) => (
                            <tr key={index} className="text-gray-300 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">{material.materialName}</td>
                              <td className="py-3 px-4 text-right">
                                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30 font-medium">
                                  {material.quantity} {material.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                  <Clock className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white/90 mb-1">Ticket en Proceso</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Este ticket aún no ha sido completado por la cuadrilla asignada. La información de resolución aparecerá aquí.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
