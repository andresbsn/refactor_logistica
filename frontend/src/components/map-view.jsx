import { useCallback, useEffect, useRef, useState } from "react"
import { ticketService } from "@/services/api"
import { X } from "lucide-react"

export default function MapView({ tickets = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketImage, setTicketImage] = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)

  const fetchTicketImage = useCallback(async (ticketId) => {
    setLoadingImage(true)
    try {
      const images = await ticketService.getImages(ticketId)
      if (images.all && images.all.length > 0) {
        setTicketImage(images.all[0].url)
      } else {
        setTicketImage(null)
      }
    } catch (error) {
      console.error("Error fetching ticket image:", error)
      setTicketImage(null)
    } finally {
      setLoadingImage(false)
    }
  }, [])

  const handleMarkerClick = useCallback((ticket) => {
    setSelectedTicket(ticket)
    setTicketImage(null)
    fetchTicketImage(ticket.id)
  }, [fetchTicketImage])

  const closePanel = () => {
    setSelectedTicket(null)
    setTicketImage(null)
  }

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => setLeafletLoaded(true)
      document.head.appendChild(script)
    } else {
      setLeafletLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    const L = window.L
    if (!L) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const defaultCenter = [-33.3333, -60.2167] // San Nicolás
    const map = L.map(mapRef.current).setView(defaultCenter, 13)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (tickets.length === 0) return

    const validTickets = tickets.filter((t) => t.latitude && t.longitude && (t.status || t.estado) === "open")
    if (validTickets.length === 0) return

    // Color markers based on status
    const getMarkerColor = (status) => {
      switch (status) {
        case "completed":
        case "closed":
          return "#22c55e"
        case "pending":
          return "#f97316"
        case "open":
          return "#3b82f6"
        default:
          return "#eab308"
      }
    }

    // Create custom marker icon
    const createMarkerIcon = (color) => {
      return L.divIcon({
        className: "custom-div-icon",
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

    const latLngs = []

    validTickets.forEach((ticket) => {
      const icon = createMarkerIcon(getMarkerColor(ticket.status || ticket.estado))
      const marker = L.marker([ticket.latitude, ticket.longitude], { icon }).addTo(map)

      marker.on('click', () => handleMarkerClick(ticket))

      latLngs.push([ticket.latitude, ticket.longitude])
    })

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
  }, [leafletLoaded, tickets, handleMarkerClick])

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
      
      {selectedTicket && (
        <div className="absolute top-2 right-2 z-[1000] w-72 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 text-sm">Ticket #{selectedTicket.id}</h3>
            <button 
              onClick={closePanel}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          
          <div className="p-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Asunto</p>
              <p className="text-sm text-slate-900 font-medium mt-1">{selectedTicket.asunto}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dirección</p>
              <p className="text-sm text-slate-700 mt-1">{selectedTicket.dire_completa}</p>
            </div>
            
            {ticketImage && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Imagen</p>
                {loadingImage ? (
                  <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    <img 
                      src={ticketImage} 
                      alt="Ticket" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
