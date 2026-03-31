import React, { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Activity, MapPin, Route as RouteIcon, AlertTriangle } from "lucide-react"
import { routeService } from "../../services/api"

const parseCoordinates = (coordinates) => {
  if (!coordinates) return null

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const latitude = Number(coordinates[0])
    const longitude = Number(coordinates[1])
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null
  }

  if (typeof coordinates === "string") {
    const hex = coordinates.trim()
    if (/^[0-9a-f]+$/i.test(hex) && hex.length >= 18) {
      try {
        const bytes = new Uint8Array(hex.match(/.{1,2}/g).map((pair) => Number.parseInt(pair, 16)))
        const view = new DataView(bytes.buffer)
        const littleEndian = view.getUint8(0) === 1
        const typeWord = view.getUint32(1, littleEndian)
        const hasSrid = (typeWord & 0x20000000) !== 0
        const geometryType = typeWord & 0xff

        if (geometryType === 1) {
          let offset = 5
          if (hasSrid) offset += 4
          const longitude = view.getFloat64(offset, littleEndian)
          const latitude = view.getFloat64(offset + 8, littleEndian)
          return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null
        }
      } catch {
        // fall through to text parsing
      }
    }

    const wktMatch = coordinates.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i)
    if (wktMatch) {
      const longitude = Number(wktMatch[1])
      const latitude = Number(wktMatch[2])
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null
    }

    const raw = coordinates
      .replaceAll("{", " ")
      .replaceAll("}", " ")
      .replaceAll("(", " ")
      .replaceAll(")", " ")
      .replaceAll("[", " ")
      .replaceAll("]", " ")
      .split(/[,\s]+/)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))

    return raw.length >= 2 ? [raw[0], raw[1]] : null
  }

  if (typeof coordinates === "object") {
    const latitude = Number(coordinates.latitude ?? coordinates.lat ?? coordinates.y)
    const longitude = Number(coordinates.longitude ?? coordinates.lng ?? coordinates.lon ?? coordinates.x)
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null
  }

  return null
}

export default function RoutePathDialog({ open, onOpenChange, route }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [points, setPoints] = useState([])

  useEffect(() => {
    if (!open) return

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
      document.head.appendChild(script)
    } else {
      setLeafletLoaded(true)
    }
  }, [open])

  useEffect(() => {
    if (!open || !route?.id) return

    let cancelled = false

    const loadRouteLocations = async () => {
      setIsLoading(true)
      setError(null)
      setPoints([])

      try {
        const rows = await routeService.getRouteLocations(route.id, 5)
        if (cancelled) return

        const orderedPoints = (Array.isArray(rows) ? rows : [])
          .map((row) => {
            const coordinates = parseCoordinates(row.coordinates) || parseCoordinates({
              latitude: row.latitude,
              longitude: row.longitude,
            })
            return coordinates ? { ...row, coordinates } : null
          })
          .filter(Boolean)

        setPoints(orderedPoints)

        if (orderedPoints.length === 0) {
          setError("No hay puntos válidos para mostrar en el recorrido")
        }
      } catch (err) {
        console.error("Error loading route locations:", err)
        if (!cancelled) setError("No se pudo cargar el recorrido de la ruta")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadRouteLocations()

    return () => {
      cancelled = true
    }
  }, [open, route?.id])

  useEffect(() => {
    if (!open || !leafletLoaded || !mapRef.current || points.length === 0) return

    const L = window.L
    if (!L) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      const latLngs = points.map((point) => point.coordinates)
      const bounds = L.latLngBounds(latLngs)
      const center = bounds.getCenter()
      const map = L.map(mapRef.current).setView(center, 14)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      points.forEach((point, index) => {
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="width:26px;height:26px;border-radius:9999px;background:#0f766e;color:white;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;box-shadow:0 2px 6px rgba(15,118,110,.35)">${index + 1}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        L.marker(point.coordinates, { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: inherit; font-size: 13px;">
              <div style="font-weight: 700; margin-bottom: 2px;">Punto ${index + 1}</div>
              <div style="color: #666; font-size: 11px;">${new Date(point.timestamp).toLocaleString("es-AR")}</div>
            </div>
          `)
      })

      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: "#0f766e",
          weight: 4,
          opacity: 0.8,
        }).addTo(map)
        map.fitBounds(bounds, { padding: [30, 30] })
      } else {
        map.setView(latLngs[0], 15)
      }
    } catch (err) {
      console.error("Leaflet init error:", err)
      setError("Error al inicializar el mapa")
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [open, leafletLoaded, points])

  if (!route) return null

  const routeLabel = route.name || `Ruta ${route.id}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[680px] flex flex-col p-0 overflow-hidden rounded-3xl shadow-premium border-white/40 bg-white">
        <DialogHeader className="p-5 border-b border-primary/10 bg-white/80 backdrop-blur-md z-10 relative">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-3 text-xl font-outfit font-extrabold text-slate-800">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <RouteIcon className="h-5 w-5" />
                </div>
                Recorrido de {routeLabel}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 pl-12 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 font-bold px-3 py-1">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  {points.length} puntos
                </Badge>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  Eventos 5
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative bg-slate-100">
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {(isLoading || !leafletLoaded) && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20 backdrop-blur-[1px]">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm font-medium">Cargando recorrido...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg text-center max-w-sm">
                <div className="flex items-center justify-center gap-2 font-semibold mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Sin recorrido</span>
                </div>
                <p className="text-sm">{error}</p>
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
