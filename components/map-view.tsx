"use client"

import { useEffect, useRef, useState } from "react"
import type { Ticket } from "@/types/ticket"

interface MapViewProps {
  tickets: Ticket[]
  crewLocation?: {
    latitude: number
    longitude: number
    timestamp?: string
  } | null
  crewTrail?: Array<{
    latitude: number
    longitude: number
    timestamp?: string
  }>
}

export function MapView({ tickets, crewLocation = null, crewTrail = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (typeof window === "undefined") return

    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    // Load CSS
    const existingCss = document.querySelector('link[href*="leaflet.css"]')
    if (!existingCss) {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      css.crossOrigin = ""
      document.head.appendChild(css)
    }

    // Load JS
    const existingScript = document.querySelector('script[src*="leaflet.js"]')
    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      script.crossOrigin = ""
      script.onload = () => setLeafletLoaded(true)
      document.head.appendChild(script)
    } else {
      const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true)
          clearInterval(checkLeaflet)
        }
      }, 100)
      return () => clearInterval(checkLeaflet)
    }
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    const L = (window as any).L
    if (!L) return

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Default center (San Nicolas, Argentina)
    const defaultCenter: [number, number] = [-33.3333, -60.2167]

    const validTickets = tickets.filter((t) => t.latitude && t.longitude && (t.status || t.estado) === "open")
    const validCrewTrail = crewTrail.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    const validCrewLocation = crewLocation && Number.isFinite(crewLocation.latitude) && Number.isFinite(crewLocation.longitude)
    const crewPoint = validCrewLocation ? crewLocation : null

    // Calculate center based on crew or tickets
    let center = defaultCenter
    if (crewPoint) {
      center = [crewPoint.latitude, crewPoint.longitude]
    } else if (validCrewTrail.length > 0) {
      const centerLat = validCrewTrail.reduce((sum, point) => sum + point.latitude, 0) / validCrewTrail.length
      const centerLng = validCrewTrail.reduce((sum, point) => sum + point.longitude, 0) / validCrewTrail.length
      center = [centerLat, centerLng]
    } else if (validTickets.length > 0) {
      const centerLat = validTickets.reduce((sum, t) => sum + t.latitude, 0) / validTickets.length
      const centerLng = validTickets.reduce((sum, t) => sum + t.longitude, 0) / validTickets.length
      center = [centerLat, centerLng]
    }

    // Create map
    const map = L.map(mapRef.current).setView(center, 14)
    mapInstanceRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Color markers based on status
    const getMarkerColor = (status: Ticket["status"]) => {
      switch (status) {
        case "completed":
          return "#22c55e"
        case "in-progress":
          return "#3b82f6"
        default:
          return "#eab308"
      }
    }

    // Create custom marker icon
    const createMarkerIcon = (color: string) => {
      return L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    }

    const latLngs: [number, number][] = []

    validTickets.forEach((ticket) => {
      const icon = createMarkerIcon(getMarkerColor(ticket.status))
      const marker = L.marker([ticket.latitude, ticket.longitude], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="padding: 4px;">
          <strong>${ticket.title}</strong><br/>
          <span style="color: #666;">${ticket.address}</span>
        </div>
      `)

      latLngs.push([ticket.latitude, ticket.longitude])
    })

    const createCrewIcon = () => {
      return L.divIcon({
        className: "crew-location-marker",
        html: `<div style="width: 28px; height: 28px; background: #0284c7; border: 3px solid white; border-radius: 9999px; box-shadow: 0 0 0 8px rgba(14,165,233,.18), 0 4px 10px rgba(2,132,199,.35);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
    }

    if (validCrewTrail.length > 0) {
      const crewTrailPoints = validCrewTrail.map((point) => [point.latitude, point.longitude]) as [number, number][]

      L.polyline(crewTrailPoints, {
        color: "#0ea5e9",
        weight: 4,
        opacity: 0.85,
      }).addTo(map)

      const lastPoint = validCrewTrail[validCrewTrail.length - 1]
      L.marker([lastPoint.latitude, lastPoint.longitude], { icon: createCrewIcon() })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 4px;">
            <strong>Cuadrilla en vivo</strong><br/>
            <span style="color: #666;">${lastPoint.timestamp ? new Date(lastPoint.timestamp).toLocaleString("es-AR") : "Ubicación actual"}</span>
          </div>
        `)

      latLngs.push(...crewTrailPoints)
    } else if (crewPoint) {
      L.marker([crewPoint.latitude, crewPoint.longitude], { icon: createCrewIcon() })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 4px;">
            <strong>Cuadrilla en vivo</strong><br/>
            <span style="color: #666;">${crewPoint.timestamp ? new Date(crewPoint.timestamp).toLocaleString("es-AR") : "Ubicación actual"}</span>
          </div>
        `)

      latLngs.push([crewPoint.latitude, crewPoint.longitude])
    }

    // Fit bounds
    if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [20, 20] })
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 15)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, tickets, crewLocation, crewTrail])

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-muted">
      <div ref={mapRef} className="absolute inset-0" />
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  )
}
