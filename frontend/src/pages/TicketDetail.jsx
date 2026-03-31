import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRoutes } from "../lib/routes-context"
import { ticketService } from "../services/api"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { 
  ChevronLeft, 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  AlertCircle, 
  ClipboardList,
  Wrench,
  Calendar,
  CheckCircle2,
  Loader2
} from "lucide-react"

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

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTicketById } = useRoutes()
  const [s3Images, setS3Images] = useState({ before: [], after: [] })
  const [loadingImages, setLoadingImages] = useState(false)
  
  const ticket = getTicketById(id)

  useEffect(() => {
    const fetchS3Images = async () => {
      const isPendingOrResolved = ticket?.estado === "pending" || ticket?.estado === "closed" || ticket?.status === "pending" || ticket?.status === "closed"
      if (isPendingOrResolved && id) {
        setLoadingImages(true)
        try {
          const images = await ticketService.getImages(id)
          setS3Images(images)
        } catch (error) {
          console.error("Error fetching S3 images:", error)
        } finally {
          setLoadingImages(false)
        }
      }
    }
    fetchS3Images()
  }, [id, ticket?.estado, ticket?.status])

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Ticket no encontrado</h2>
        <Button variant="link" onClick={() => navigate("/")} className="mt-2 text-primary font-bold">
          Volver al inicio
        </Button>
      </div>
    )
  }

  const isPendingOrResolved = ticket.estado === "pending" || ticket.estado === "closed" || ticket.status === "pending" || ticket.status === "closed"
  const hasS3Images = s3Images.before.length > 0 || s3Images.after.length > 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="glass border-b border-white/20 sticky top-0 z-50 px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="rounded-full hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Button>
        <div>
          <h1 className="font-extrabold text-slate-900 leading-tight tracking-tight">Detalle de Ticket</h1>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest">#{ticket.id}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
        {/* Main Info Card */}
        <Card className="glass shadow-premium border-white/60 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-custom-blue/10 text-custom-blue border-0 font-bold px-3 py-1 uppercase tracking-wider">
                {ticket.tipo}
              </Badge>
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {ticket.asunto}
              </h2>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={`${priorityColors[ticket.prioridad]} border font-bold px-3 py-1`}>
                {priorityLabels[ticket.prioridad]}
              </Badge>
              <Badge className={`${statusColors[ticket.estado]} border font-bold px-3 py-1`}>
                {statusLabels[ticket.estado]}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-2xl border border-white/60">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ubicación</p>
                <p className="text-sm font-bold text-slate-900 leading-snug">{ticket.dire_completa}</p>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{ticket.contacto_nombre || "No especificado"}</p>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teléfono</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{ticket.contacto_celular || ticket.contacto_telefono || "N/A"}</p>
              </div>
            </div>

            {ticket.descripcion && (
              <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{ticket.descripcion}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Timeline/Meta info */}
        {/* <div className="space-y-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
            <Clock className="h-4 w-4 text-primary" /> Información Temporal
          </h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Creado el</span>
              <span className="font-bold text-slate-900">
                {ticket.creado ? new Date(ticket.creado).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            {ticket.assignedAt && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Asignada el</span>
                <span className="font-bold text-slate-900">{new Date(ticket.assignedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Última actualización</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div> */}

        {/* S3 Images for pending/resolved tickets */}
        {isPendingOrResolved && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-primary" /> Evidencia Fotográfica
            </h3>
            {loadingImages ? (
              <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-100">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-slate-500">Cargando imágenes...</span>
              </div>
            ) : hasS3Images ? (
              <div className="space-y-4">
                {s3Images.before.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Antes</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {s3Images.before.map((img, i) => (
                        <div key={`before-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-slate-200">
                          <img src={img.url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s3Images.after.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.15em] px-1">Después / Extras</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {s3Images.after.map((img, i) => (
                        <div key={`after-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-emerald-200 ring-2 ring-emerald-500/10">
                          <img src={img.url} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500">No hay imágenes registradas para este ticket</p>
              </div>
            )}
          </div>
        )}

        {/* Resolution Info */}
        {ticket.resolution && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Resolución de Tarea
            </h3>
            <Card className="glass border-emerald-100 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-500 opacity-70">Tarea Completada</p>
                  <p className="font-bold text-sm">El {new Date(ticket.resolution.completedAt).toLocaleDateString()} a las {new Date(ticket.resolution.completedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tareas Realizadas</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.resolution.tasksPerformed.map((task, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>

                {ticket.resolution.materialsUsed && ticket.resolution.materialsUsed.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Materiales Utilizados</p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                      {ticket.resolution.materialsUsed.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-700">{m.materialName}</span>
                          <span className="font-bold text-primary">{m.quantity} {m.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.resolution.notes && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notas del Operador</p>
                    <div className="bg-white/50 p-4 rounded-2xl border border-white/60 text-sm text-slate-700 italic font-medium leading-relaxed">
                      "{ticket.resolution.notes}"
                    </div>
                  </div>
                )}

                {/* Images */}
                <div className="grid grid-cols-2 gap-3">
                  {ticket.resolution.beforeImage && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Antes</p>
                      <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200">
                        <img src={ticket.resolution.beforeImage} alt="Antes" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {ticket.resolution.afterImage && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Después</p>
                      <div className="aspect-square rounded-2xl overflow-hidden border border-emerald-200 ring-2 ring-emerald-500/10">
                        <img src={ticket.resolution.afterImage} alt="Después" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Button */}
        {ticket.estado === "open" && (
          <Button 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all gap-2"
            onClick={() => navigate(`/ticket/${ticket.id}/resolve`)}
          >
            <Wrench className="h-5 w-5" />
            RESOLVER TICKET
          </Button>
        )}
      </main>
    </div>
  )
}
