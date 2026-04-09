import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "../lib/auth-context"
import { useRoutes } from "../lib/routes-context"
import { routeService } from "../services/api"
import { 
  LogOut, 
  Calendar, 
  Clock, 
  CheckCircle2, 
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Textarea } from "../components/ui/textarea"
import { TicketCard } from "../components/ticket-card"
import MapView from "../components/map-view"
import { Badge } from "../components/ui/badge"

export default function Home() {
  const { user, logout } = useAuth()
  const { getCrewRoutes, fetchRoutes } = useRoutes()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [closingRoute, setClosingRoute] = useState(false)
  const [routeCloseDialogOpen, setRouteCloseDialogOpen] = useState(false)
  const [routeCloseObservation, setRouteCloseObservation] = useState("")
  const [crewLocation, setCrewLocation] = useState(null)
  const locationWatchIdRef = useRef(null)
  const lastSentLocationRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const crewIdentifier = user?.crewId || user?.crew_id || user?.id
  const crewRoutes = user ? getCrewRoutes(crewIdentifier).filter((route) => route.status !== "completed") : []
  const activeRoute = crewRoutes.find((route) => route.is_active === true || route.is_active === "true" || route.is_active === 1 || route.is_active === "1") || null

  useEffect(() => {
    setCrewLocation(null)
    lastSentLocationRef.current = null

    if (!activeRoute?.id || typeof navigator === "undefined" || !navigator.geolocation) {
      return undefined
    }

    const shouldSendLocation = (latitude, longitude) => {
      const previous = lastSentLocationRef.current
      if (!previous) return true

      const elapsedMs = Date.now() - previous.sentAt
      const deltaLat = Math.abs(previous.latitude - latitude)
      const deltaLng = Math.abs(previous.longitude - longitude)

      return elapsedMs > 15000 || deltaLat > 0.00015 || deltaLng > 0.00015
    }

    const sendLocation = (position) => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const timestamp = new Date(position.timestamp || Date.now()).toISOString()

      setCrewLocation({ latitude, longitude, timestamp })

      if (!shouldSendLocation(latitude, longitude)) {
        return
      }

      lastSentLocationRef.current = { latitude, longitude, sentAt: Date.now() }

      void routeService.sendCrewLocation(activeRoute.id, {
        latitude,
        longitude,
        timestamp,
      }).catch((error) => {
        console.error("Error sending crew location:", error)
      })
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      (error) => {
        console.error("Error getting crew location:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    )

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current)
        locationWatchIdRef.current = null
      }
    }
  }, [activeRoute?.id])

  if (!user) return null

  const visibleTickets = activeRoute?.tickets.filter((ticket) => (ticket.status || ticket.estado) === "open") || []
  const totalTickets = activeRoute?.tickets.length || 0
  const completedTickets = activeRoute ? activeRoute.tickets.filter((ticket) => (ticket.status || ticket.estado) !== "open").length : 0
  const progressPercent = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0

  const handleCloseRouteUnexpected = async () => {
    setRouteCloseObservation("")
    setRouteCloseDialogOpen(true)
  }

  const confirmCloseRouteUnexpected = async () => {
    if (!activeRoute) return

    const observations = routeCloseObservation.trim()
    if (!observations) return

    setClosingRoute(true)
    try {
      await routeService.closeUnexpected(activeRoute.id, observations)
      await fetchRoutes()
      setRouteCloseDialogOpen(false)
      setRouteCloseObservation("")
    } catch (error) {
      console.error("Error closing route unexpectedly:", error)
    } finally {
      setClosingRoute(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl shadow-md p-2 ring-1 ring-black/5">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 leading-tight tracking-tight font-outfit">Logística Smart</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Clock className="h-3 w-3 text-primary" /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Calendar className="h-3 w-3 text-primary" /> {currentTime.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">{user.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 max-w-lg mx-auto w-full">
        {!activeRoute ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 rounded-full p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No tienes rutas activas</h2>
            <p className="text-slate-500 mt-2">Cuando una cuadrilla inicie una ruta, el mapa y el progreso aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Route Status Card - Premium Glass */}
            <div className="glass shadow-premium border-white/60 rounded-3xl p-6 relative overflow-hidden transition-all duration-500 hover:shadow-xl group">
              <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="space-y-1">
                  <Badge className="bg-primary/10 text-primary border-0 font-bold px-3 py-1 rounded-lg">
                    Ruta #{activeRoute?.id?.toString().split('-').pop()}
                  </Badge>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">{activeRoute?.name}</h2>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    {completedTickets} / {totalTickets}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Progreso de Jornada</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden ring-4 ring-white shadow-inner">
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 shadow-lg shadow-primary/30"
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Asignada el {activeRoute?.assignedAt ? new Date(activeRoute.assignedAt).toLocaleDateString() : 'N/A'}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={handleCloseRouteUnexpected}
                    disabled={closingRoute}
                    className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20"
                  >
                    {closingRoute ? "Cerrando..." : "Finalizar ruta por imprevisto"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Map View */}
            <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-hidden">
                <MapView tickets={activeRoute?.tickets || []} crewLocation={crewLocation} />
              </div>

            {/* Ticket List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Tareas Pendientes</h3>
                <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  {visibleTickets.length} tickets
                </span>
              </div>
              
              <div className="space-y-3">
                {visibleTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    routeId={activeRoute.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog
        open={routeCloseDialogOpen}
        onOpenChange={(open) => {
          setRouteCloseDialogOpen(open)
          if (!open) setRouteCloseObservation("")
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Finalizar ruta por imprevisto</DialogTitle>
            <DialogDescription>
              Indicá qué pasó para dejar registrado el motivo en la ruta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={routeCloseObservation}
              onChange={(e) => setRouteCloseObservation(e.target.value)}
              placeholder="Describí el imprevisto..."
              className="min-h-28"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteCloseDialogOpen(false)} disabled={closingRoute}>
              Cancelar
            </Button>
            <Button onClick={confirmCloseRouteUnexpected} disabled={closingRoute || !routeCloseObservation.trim()}>
              {closingRoute ? "Cerrando..." : "Cerrar ruta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
