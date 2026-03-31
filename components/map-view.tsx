"use client"

import { useEffect, useRef, useState } from "react"
import type { Ticket } from "@/types/ticket"

interface MapViewProps {
  tickets: Ticket[]
}

export function MapView({ tickets }: MapViewProps) {
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

    // Calculate center based on tickets
    let center = defaultCenter
    if (tickets.length > 0) {
      const validTickets = tickets.filter((t) => t.latitude && t.longitude)
      if (validTickets.length > 0) {
        const centerLat = validTickets.reduce((sum, t) => sum + t.latitude, 0) / validTickets.length
        const centerLng = validTickets.reduce((sum, t) => sum + t.longitude, 0) / validTickets.length
        center = [centerLat, centerLng]
      }
    }

    // Create map
    const map = L.map(mapRef.current).setView(center, 14)
    mapInstanceRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (tickets.length === 0) return

    const validTickets = tickets.filter((t) => t.latitude && t.longitude)
    if (validTickets.length === 0) return

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

    // Fit bounds
    if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [20, 20] })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, tickets])

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
