"use client"

import { useEffect, useRef, useState } from "react"
import type { SuggestedRoute, Ticket } from "@/types/ticket"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "lucide-react"

interface RouteMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: SuggestedRoute | null
}

declare global {
  interface Window {
    L: any
  }
}

export function RouteMapDialog({ open, onOpenChange, route }: RouteMapDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !route) {
      setIsLoading(true)
      setError(null)
      return
    }

    let isMounted = true
    let initTimer: number | null = null

    const initMap = async () => {
      try {
        // Load Leaflet CSS if not already loaded
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Load Leaflet JS if not already loaded
        if (!window.L) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Error al cargar Leaflet"))
            document.head.appendChild(script)
          })
        }

        // Wait for DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!isMounted) return

        const L = window.L
        if (!L) {
          setError("No se pudo cargar la libreria de mapas")
          setIsLoading(false)
          return
        }

        // Remove existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        if (!mapRef.current) {
          setError("No se pudo preparar el contenedor del mapa")
          setIsLoading(false)
          return
        }

        const validTickets = route.tickets
          .map((t) => ({
            ...t,
            latitude: Number(t.latitude ?? t.lat),
            longitude: Number(t.longitude ?? t.lng ?? t.lon),
          }))
          .filter((t) => Number.isFinite(t.latitude) && Number.isFinite(t.longitude))
        if (validTickets.length === 0) {
          setError("No hay tickets con coordenadas validas")
          setIsLoading(false)
          return
        }

        // Calculate center
        const centerLat = validTickets.reduce((sum, t) => sum + t.latitude, 0) / validTickets.length
        const centerLng = validTickets.reduce((sum, t) => sum + t.longitude, 0) / validTickets.length

        // Create map
        const map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: 14,
        })
        mapInstanceRef.current = map

        // Add tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        // Marker colors by priority
        const getColor = (priority: Ticket["priority"]) => {
          switch (priority) {
            case "high": return "#ef4444"
            case "medium": return "#f59e0b"
            case "low": return "#22c55e"
            default: return "#3b82f6"
          }
        }

        // Create markers
        const latLngs: [number, number][] = []

        validTickets.forEach((ticket, index) => {
          const color = getColor(ticket.priority)
          
          const icon = L.divIcon({
            className: "custom-marker",
            html: `<div style="
              width: 30px;
              height: 30px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })

          const marker = L.marker([ticket.latitude, ticket.longitude], { icon }).addTo(map)

          const prioLabel = ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"
          
          marker.bindPopup(`
            <div style="min-width: 180px;">
              <div style="font-weight: bold; color: #0369a1; margin-bottom: 4px;">${ticket.ticketNumber}</div>
              <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">${ticket.title}</div>
              <div style="font-size: 11px; color: #666; margin-bottom: 6px;">${ticket.address}</div>
              <div style="font-size: 11px;"><strong>Prioridad:</strong> ${prioLabel}</div>
              ${ticket.category ? `<div style="font-size: 11px;"><strong>Categoria:</strong> ${ticket.category}</div>` : ""}
            </div>
          `)

          latLngs.push([ticket.latitude, ticket.longitude])
        })

        // Draw route line connecting markers
        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color: "#3b82f6",
            weight: 4,
            opacity: 0.7,
            dashArray: "8, 12",
          }).addTo(map)
        }

        window.setTimeout(() => {
          if (isMounted) {
            map.invalidateSize()
          }
        }, 0)

        if (latLngs.length > 0) {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] })
        }

        setIsLoading(false)
        setError(null)
      } catch (err) {
        if (isMounted) {
          setError("Error al inicializar el mapa")
          setIsLoading(false)
        }
      }
    }

    initTimer = window.setTimeout(() => {
      void initMap()
    }, 0)

    return () => {
      isMounted = false
      if (initTimer !== null) {
        window.clearTimeout(initTimer)
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [open, route])

  if (!route) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            {route.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            {route.description}
            <Badge variant="secondary">{route.tickets.length} tickets</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative min-h-0">
          <div ref={mapRef} className="absolute inset-0" />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
              <div className="text-center space-y-3">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">Cargando mapa...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
              <div className="text-center space-y-2 p-6">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-muted/30 shrink-0">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground font-medium">Prioridad:</span>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500" />
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500" />
              <span>Media</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500" />
              <span>Baja</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
