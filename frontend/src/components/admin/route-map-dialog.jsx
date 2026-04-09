import React, { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Info, Navigation, Map as MapIcon } from "lucide-react"
import { Badge } from "../ui/badge"

const isValidCoordinate = (value) => Number.isFinite(Number(value))

const normalizePoint = (point) => {
  if (!point) return null

  const latitude = Number(point.latitude ?? point.lat)
  const longitude = Number(point.longitude ?? point.lng ?? point.lon)

  return isValidCoordinate(latitude) && isValidCoordinate(longitude)
    ? { latitude, longitude }
    : null
}

const normalizeTicketPoint = (ticket) => {
  if (!ticket) return null

  return normalizePoint({
    latitude: ticket.latitude ?? ticket.lat ?? ticket.y,
    longitude: ticket.longitude ?? ticket.lng ?? ticket.lon ?? ticket.x,
  })
}

export default function RouteMapDialog({
  open,
  onOpenChange,
  route,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [leafletLoaded, setLeafletLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.L))

  useEffect(() => {
    let loadedFallbackTimer = null

    if (open) {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (!window.L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => setLeafletLoaded(true)
        script.onerror = () => setError("No se pudo cargar la librería de mapas")
        document.head.appendChild(script)
      } else {
        loadedFallbackTimer = window.setTimeout(() => setLeafletLoaded(true), 0)
      }
    }

    return () => {
      if (loadedFallbackTimer) {
        window.clearTimeout(loadedFallbackTimer)
      }
    }
  }, [open])

  useEffect(() => {
    if (!open || !leafletLoaded || !route) return undefined

    const L = window.L
    if (!L) return undefined

    let cancelled = false
    let initTimer = null

    const getPriorityColor = (priority) => {
      switch (priority) {
        case "high":
          return "#ef4444"
        case "medium":
          return "#f59e0b"
        case "low":
          return "#22c55e"
        default:
          return "#3b82f6"
      }
    }

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        const validTickets = route.tickets
          .map((ticket) => ({ ...ticket, coordinates: normalizeTicketPoint(ticket) }))
          .filter((ticket) => ticket.coordinates)

        if (cancelled) return

        if (!mapRef.current) {
          setError("No se pudo preparar el contenedor del mapa")
          setIsLoading(false)
          return
        }

        if (validTickets.length === 0) {
          setError("No hay coordenadas disponibles para mostrar en el mapa")
          setIsLoading(false)
          return
        }

        const ticketLatLngs = validTickets.map((ticket) => [ticket.coordinates.latitude, ticket.coordinates.longitude])
        const boundsLatLngs = [...ticketLatLngs]

        const bounds = L.latLngBounds(boundsLatLngs)
        const center = bounds.getCenter()

        const map = L.map(mapRef.current).setView(center, 13)
        mapInstanceRef.current = map
        markersLayerRef.current = L.layerGroup().addTo(map)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        validTickets.forEach((ticket, idx) => {
          const color = getPriorityColor(ticket.priority)

          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="
              width: 24px;
              height: 24px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${idx + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          L.marker([ticket.coordinates.latitude, ticket.coordinates.longitude], { icon })
            .addTo(markersLayerRef.current)
            .bindPopup(`
              <div style="font-family: inherit; font-size: 13px;">
                <div style="font-weight: bold; margin-bottom: 2px;">${ticket.ticketNumber || `#${ticket.id}`}</div>
                <div style="font-weight: 500;">${ticket.asunto || ticket.title}</div>
                <div style="color: #666; font-size: 11px; margin-top: 4px;">
                  ${ticket.dire_completa || ticket.address} ${ticket.barrio ? `<br/><b>Brio:</b> ${ticket.barrio}` : ""}
                </div>
                <div style="font-size: 10px; margin-top: 4px; color: #3b82f6; font-weight: bold;">
                  ${ticket.tipo || ""} ${ticket.subtipo ? `| ${ticket.subtipo}` : ""}
                </div>
              </div>
            `)
        })

        if (ticketLatLngs.length > 1) {
          map.fitBounds(bounds, { padding: [30, 30] })
        } else {
          map.setView(boundsLatLngs[0], 15)
        }

        if (ticketLatLngs.length > 1) {
          L.polyline(ticketLatLngs, {
            color: "#3b82f6",
            weight: 3,
            opacity: 0.6,
            dashArray: "5, 10",
          }).addTo(map)
        }

        window.setTimeout(() => {
          if (!cancelled) {
            map.invalidateSize()
          }
        }, 0)

        setIsLoading(false)
      } catch (err) {
        console.error("Leaflet init error:", err)
        setError("Error al inicializar el mapa")
        setIsLoading(false)
      }
    }

    initTimer = window.setTimeout(() => {
      void initMap()
    }, 0)

    return () => {
      cancelled = true
      if (initTimer) {
        window.clearTimeout(initTimer)
      }
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers()
        markersLayerRef.current = null
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [open, leafletLoaded, route])

  if (!route) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden rounded-3xl shadow-premium border-white/40 bg-white">
        <DialogHeader className="p-5 border-b border-primary/10 bg-white/80 backdrop-blur-md z-10 relative">
          <div className="flex items-center justify-between pr-6">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-3 text-xl font-outfit font-extrabold text-slate-800">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <MapIcon className="h-5 w-5" />
                </div>
                Vista de Mapa: {route.name}
              </DialogTitle>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest pl-12">
                <span className="flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-blue-500" /> {route.tickets.length} Paradas</span>
                <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-primary/60" /> Secuencia Optimizada</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-bold px-3 py-1">
                {route.type === "proximity" ? "Enfoque: Cercanía" : "Enfoque: Prioridad"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative bg-slate-100">
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {(isLoading || !leafletLoaded) && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20 backdrop-blur-[1px]">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm font-medium">Cargando mapa interactivo...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg text-center max-w-sm">
                <p className="font-semibold mb-1">¡Ups!</p>
                <p className="text-sm">{error}</p>
                <Button variant="outline" size="sm" className="mt-4 border-destructive/30 hover:bg-destructive/10" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-primary/10 bg-white/90 backdrop-blur-sm z-10 relative">
          <Button variant="outline" className="h-10 rounded-xl border-custom-blue/20 bg-custom-blue/5 hover:bg-custom-blue/10 text-slate-600 font-bold" onClick={() => onOpenChange(false)}>
            Cerrar Vista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
