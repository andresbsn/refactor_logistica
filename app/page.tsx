"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, LogOut, Loader2 } from "lucide-react"
import { MapView } from "@/components/map-view"
import { RouteSelector } from "@/components/route-selector"
import { TicketCard } from "@/components/ticket-card"
import { TicketResolveDialog, type ResolutionData } from "@/components/crew/ticket-resolve-dialog"
import { mockMaterials } from "@/lib/mock-data"
import type { Ticket, Material } from "@/types/ticket"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useRoutes } from "@/lib/routes-context"
import { routeService } from "@/services/api"

export default function TicketSystemPage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const { getCrewRoutes, saveTicketResolution } = useRoutes()
  const [materials, setMaterials] = useState<Material[]>(mockMaterials)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [crewLocation, setCrewLocation] = useState<{ latitude: number; longitude: number; timestamp?: string } | null>(null)
  const [crewTrail, setCrewTrail] = useState<Array<{ latitude: number; longitude: number; timestamp?: string }>>([])
  const [trackingStatus, setTrackingStatus] = useState<"idle" | "tracking" | "error">("idle")
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const { toast } = useToast()

  const crewIdentifier = user?.crewId ?? user?.crew_id ?? user?.id ?? ""

  // Filtrar rutas asignadas a esta cuadrilla que no estén completadas
  const crewRoutes = getCrewRoutes(crewIdentifier).filter((r) => r.status !== "completed")

  // Verificar autenticación
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    // Si es admin, redirigir al panel admin
    if (!isLoading && user && user.role === "admin") {
      router.push("/admin")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (crewRoutes.length > 0 && (!selectedRouteId || !crewRoutes.some((route) => route.id === selectedRouteId))) {
      setSelectedRouteId(crewRoutes[0].id)
    }
  }, [crewRoutes, selectedRouteId])

  const selectedRoute = crewRoutes.find((r) => r.id === selectedRouteId)
  const activeRoute = crewRoutes.find((route) => route.is_active === true || route.is_active === "true" || route.is_active === 1 || route.is_active === "1") || null
  const liveTrackingRoute = activeRoute && selectedRoute?.id === activeRoute.id ? activeRoute : null

  useEffect(() => {
    if (!activeRoute) {
      setCrewLocation(null)
      setCrewTrail([])
      setTrackingStatus("idle")
      setTrackingError(null)
      return
    }

    let cancelled = false
    let watchId: number | null = null

    const applyLocation = (point: { latitude: number; longitude: number; timestamp?: string }) => {
      setCrewLocation(point)
      setCrewTrail((prev) => {
        const nextTrail = [...prev, point]
        return nextTrail.slice(-200)
      })
    }

    const hydrateTrail = async () => {
      try {
        const rows = await routeService.getRouteLocations(activeRoute.id, 6)
        if (cancelled) return

        const history = (Array.isArray(rows) ? rows : [])
          .map((row) => {
            const latitude = Number(row.latitude)
            const longitude = Number(row.longitude)
            return Number.isFinite(latitude) && Number.isFinite(longitude)
              ? { latitude, longitude, timestamp: row.timestamp }
              : null
          })
          .filter((point): point is { latitude: number; longitude: number; timestamp?: string } => Boolean(point))

        setCrewTrail(history)
        setCrewLocation(history.length > 0 ? history[history.length - 1] : null)
      } catch (error) {
        console.error("Error loading crew location history:", error)
      }
    }

    const startTracking = () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setTrackingStatus("error")
        setTrackingError("Este dispositivo no soporta geolocalización")
        return
      }

      setTrackingStatus("tracking")
      setTrackingError(null)

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (cancelled) return

          const point = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(position.timestamp).toISOString(),
          }

          applyLocation(point)
          void routeService.sendCrewLocation(activeRoute.id, point).catch((error) => {
            console.error("Error saving crew location:", error)
          })
        },
        (error) => {
          if (cancelled) return
          setTrackingStatus("error")
          setTrackingError(error.message || "No se pudo obtener la ubicación")
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      )
    }

    void hydrateTrail().finally(startTracking)

    return () => {
      cancelled = true
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [activeRoute?.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role === "admin") {
    return null
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsResolveDialogOpen(true)
  }

  const handleResolveTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsResolveDialogOpen(true)
  }

  const handleResolutionComplete = (resolution: ResolutionData) => {
    // Guardar la resolución completa del ticket (estado pasa a "pending")
    if (selectedRoute) {
      saveTicketResolution(selectedRoute.id, resolution.ticketId, {
        tasksCompleted: resolution.tasksCompleted,
        materialsUsed: resolution.materialsUsed,
        photoBefore: resolution.photoBefore,
        photoAfter: resolution.photoAfter,
        additionalPhotos: resolution.additionalPhotos,
        observations: resolution.observations,
        completedAt: new Date(),
      })
    }

    // Descontar materiales del inventario
    setMaterials((prevMaterials) =>
      prevMaterials.map((material) => {
        const usedMaterial = resolution.materialsUsed.find(
          (um) => um.materialId === material.id
        )
        if (usedMaterial) {
          return {
            ...material,
            quantity: Math.max(0, material.quantity - usedMaterial.quantity),
          }
        }
        return material
      })
    )

    toast({
      title: "Ticket resuelto",
      description: `El ticket ${selectedTicket?.ticketNumber} fue resuelto. Pendiente de cierre por administrador.`,
    })

    setSelectedTicket(null)
    setIsResolveDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-semibold text-lg">Sistema de Tickets</h1>
            <p className="text-xs text-muted-foreground">{user.name}</p>
          </div>
        </div>
        <time className="text-sm text-muted-foreground">
          {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </time>
      </header>

      {/* Map Section */}
      <div className="relative">
        {liveTrackingRoute && (
          <div className="mx-4 mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            {trackingStatus === "tracking"
              ? "Ubicación en vivo activa"
              : trackingStatus === "error"
                ? trackingError || "No se pudo activar la ubicación"
                : "Esperando ubicación del dispositivo..."}
          </div>
        )}
        <MapView
          tickets={selectedRoute?.tickets || []}
          crewLocation={liveTrackingRoute ? crewLocation : null}
          crewTrail={liveTrackingRoute ? crewTrail : []}
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Route Selector */}
        <RouteSelector routes={crewRoutes} selectedRoute={selectedRouteId} onRouteChange={setSelectedRouteId} />

        {/* Task Counter */}
        {selectedRoute && (
          <div className="text-center py-2">
            <p className="text-sm font-mono">
              Total tareas: {selectedRoute.tickets.length} | 
              Abiertas: {selectedRoute.tickets.filter((t) => t.status === "open").length} |
              Resueltas: {selectedRoute.tickets.filter((t) => t.status === "pending" || t.status === "closed").length}
            </p>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-3">
          {selectedRoute ? (
            selectedRoute.tickets.length > 0 ? (
              selectedRoute.tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onView={handleViewTicket}
                  onResolve={handleResolveTicket}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No hay tareas en esta ruta</div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {crewRoutes.length > 0 ? "Selecciona una ruta para ver las tareas" : "No tienes rutas asignadas"}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="border-t bg-card px-4 py-3 flex justify-around items-center">
        <button type="button" className="flex flex-col items-center gap-1 text-primary">
          <MapPin className="h-6 w-6" />
          <span className="text-xs font-medium">Mapa</span>
        </button>
        <button 
          type="button"
          onClick={logout}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs">Salir</span>
        </button>
      </nav>

      {/* Resolve Dialog */}
      <TicketResolveDialog
        ticket={selectedTicket}
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        onResolve={handleResolutionComplete}
      />
    </div>
  )
}
