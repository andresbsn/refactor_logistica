import React, { useState, useEffect } from "react"
import { useAuth } from "../lib/auth-context"
import { useRoutes } from "../lib/routes-context"
import { 
  LogOut, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
} from "lucide-react"
import { Button } from "../components/ui/button"
import { TicketCard } from "../components/ticket-card"
import MapView from "../components/map-view"
import { Badge } from "../components/ui/badge"

export default function Home() {
  const { user, logout } = useAuth()
  const { getCrewRoutes } = useRoutes()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const crewIdentifier = user?.crewId || user?.crew_id || user?.id
  const crewRoutes = user ? getCrewRoutes(crewIdentifier).filter((route) => route.status !== "completed") : []

  if (!user) return null

  const activeRoute = crewRoutes[0] || null
  const visibleTickets = activeRoute?.tickets.filter((ticket) => (ticket.status || ticket.estado) === "open") || []
  const totalTickets = activeRoute?.tickets.length || 0
  const completedTickets = activeRoute ? activeRoute.tickets.filter((ticket) => (ticket.status || ticket.estado) !== "open").length : 0
  const progressPercent = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0
  
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
        {crewRoutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 rounded-full p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No tienes rutas asignadas</h2>
            <p className="text-slate-500 mt-2">Cuando un administrador te asigne una ruta, aparecerá aquí.</p>
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
              </div>
            </div>

            {/* Map View */}
            <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-hidden">
                <MapView tickets={visibleTickets} />
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

    </div>
  )
}
