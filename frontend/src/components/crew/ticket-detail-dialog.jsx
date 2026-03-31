import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Card } from "../ui/card"
import { 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  ClipboardList,
  Wrench,
  Calendar,
  X,
  FileText,
  Loader2
} from "lucide-react"
import { ticketService } from "../../services/api"

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

export default function TicketDetailDialog({ open, onOpenChange, ticket, onResolve }) {
  console.log('ticket', ticket)
  const isResolved = ticket?.estado === "pending" || ticket?.estado === "closed" || ticket?.estado === "solved"
  const [s3Images, setS3Images] = useState({ before: [], after: [] })
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    const fetchS3Images = async () => {
      if (isResolved && ticket.id) {
        setLoadingImages(true)
        try {
          const images = await ticketService.getImages(ticket.id)
          setS3Images(images)
        } catch (error) {
          console.error("Error fetching S3 images:", error)
        } finally {
          setLoadingImages(false)
        }
      }
    }
    fetchS3Images()
  }, [isResolved, ticket?.id])

  const hasS3Images = s3Images.before?.length > 0 || s3Images.after?.length > 0

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-none bg-slate-50/50 backdrop-blur-xl rounded-[2rem]">
        <div className="relative text-sm">
          {/* Header */}
          <div className="glass shadow-premium border-b border-white/20 px-6 py-4 sticky top-0 z-50 rounded-t-[2rem] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Detalle de Ticket</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">#{ticket.id}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-slate-100/50 h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Main Info Card */}
            <Card className="glass shadow-premium border-white/60 rounded-[1.5rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-primary/5 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-custom-blue/10 text-custom-blue border-0 font-bold px-3 py-1 uppercase tracking-wider text-[10px] rounded-lg">
                    {ticket.tipo}
                  </Badge>
                  <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                    {ticket.asunto}
                  </h3>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Badge className={`${priorityColors[ticket.prioridad]} border font-black px-3 py-1 rounded-lg text-[10px]`}>
                    {priorityLabels[ticket.prioridad]}
                  </Badge>
                  <Badge className={`${statusColors[ticket.estado]} border font-black px-3 py-1 rounded-lg text-[10px]`}>
                    {statusLabels[ticket.estado]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-3 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación Completa</p>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{ticket.dire_completa}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-primary/10 p-1 rounded-lg text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 ml-1">{ticket.contacto_nombre || "No especificado"}</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-primary/10 p-1 rounded-lg text-primary">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 ml-1">{ticket.contacto_celular || ticket.contacto_telefono || "N/A"}</p>
                  </div>
                </div>

                {ticket.descripcion && (
                  <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 p-1 rounded-lg text-primary">
                        <ClipboardList className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</p>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold ml-1">{ticket.descripcion}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline Info */}
            {/* <div className="space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 px-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Información Temporal
              </h4>
              <Card className="glass shadow-premium border-white/60 rounded-[1rem] p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs">Creado el</span>
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {ticket.creado ? new Date(ticket.creado).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </div>
                {ticket.assignedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold text-xs">Asignada el</span>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {new Date(ticket.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </Card>
            </div> */}

            {/* Resolution Info - Show when estado is pending or closed */}
            {isResolved && ticket.tasksPerformed && (
              <div className="space-y-3 pt-2">
                <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 px-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Resolución de Tarea
                </h4>
                <Card className="glass border-emerald-100 shadow-xl shadow-emerald-500/5 rounded-[1.5rem] p-6 space-y-6">
                  <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                    <div className="bg-emerald-500 text-white p-2 rounded-lg">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 opacity-70">Tarea Completada</p>
                      <p className="font-black text-sm">El {ticket.completedAt ? new Date(ticket.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {ticket.tasksPerformed && ticket.tasksPerformed.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Tareas Realizadas</p>
                        <div className="flex flex-wrap gap-2">
                          {ticket.tasksPerformed.map((task, i) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black tracking-tight border border-slate-800">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {ticket.materialsUsed && ticket.materialsUsed.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Materiales Utilizados</p>
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
                          {ticket.materialsUsed.map((m, i) => (
                            <div key={i} className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-600">{m.materialName}</span>
                              <Badge className="bg-primary/10 text-primary border-0 font-black text-[10px]">
                                {m.quantity} {m.unit}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ticket.notes && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Notas del Operador</p>
                        <div className="bg-white/50 p-4 rounded-xl border border-white/60 text-xs text-slate-700 italic font-bold leading-relaxed shadow-sm">
                          "{ticket.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* S3 Images from S3 - Show for pending or closed tickets */}
            {isResolved && (
              <div className="space-y-3 pt-2">
                <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 px-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Evidencia Visual
                </h4>
                {loadingImages ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-slate-500 text-xs">Cargando imágenes...</span>
                  </div>
                ) : hasS3Images ? (
                  <Card className="glass shadow-premium border-white/60 rounded-[1.5rem] p-5">
                    {/* Registro Anterior y Posterior en la misma fila */}
                    <div className="grid grid-cols-2 gap-6">
                      {s3Images.before && s3Images.before.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Registro Anterior</p>
                          <div className="grid grid-cols-2 gap-2">
                            {s3Images.before.map((img, i) => (
                              <div key={`before-${i}`} className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 shadow-premium group cursor-zoom-in">
                                <img src={img.url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {s3Images.after && s3Images.after.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Registro Posterior</p>
                          <div className="grid grid-cols-2 gap-2">
                            {s3Images.after.map((img, i) => (
                              <div key={`after-${i}`} className="aspect-square rounded-xl overflow-hidden border-2 border-emerald-100 ring-2 ring-emerald-500/5 shadow-premium group cursor-zoom-in">
                                <img src={img.url} alt={`Después ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Imágenes extras en fila por debajo */}
                    {s3Images.all && s3Images.all.length > s3Images.before.length + s3Images.after.length && (
                      <div className="mt-5 pt-5 border-t border-slate-200/50 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Imágenes Adicionales</p>
                        <div className="grid grid-cols-4 gap-2">
                          {s3Images.all
                            .filter(img => !s3Images.before?.includes(img) && !s3Images.after?.includes(img))
                            .map((img, i) => (
                              <div key={`extra-${i}`} className="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-premium group cursor-zoom-in">
                                <img src={img.url} alt={`Extra ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-500">No hay imágenes registradas para este ticket</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Footer - Only show for open tickets */}
            {ticket.estado === "open" && (
              <div className="pt-3 sticky bottom-0 z-50">
                <Button 
                  className="w-full h-12 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-custom-blue font-black text-base shadow-2xl shadow-primary/30 transition-all gap-2"
                  onClick={() => {
                    onOpenChange(false)
                    if (onResolve) onResolve({ ...ticket, routeId: ticket.routeId || ticket.route_id })
                  }}
                >
                  <Wrench className="h-5 w-5" />
                  RESOLVER AHORA
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
