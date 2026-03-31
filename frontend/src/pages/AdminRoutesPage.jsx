import { useState, useEffect, useMemo } from "react"
import { cn } from "../lib/utils"
import { mockCrews, mockMaterials } from "../lib/mock-data"
import SuggestedRoutes from "../components/admin/suggested-routes"
import AssignCrewDialog from "../components/admin/assign-crew-dialog"
import RouteMapDialog from "../components/admin/route-map-dialog"
import { Button } from "../components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Slider } from "../components/ui/slider"
import { Label } from "../components/ui/label"
import { useToast } from "../hooks/use-toast"
import { useRoutes } from "../lib/routes-context"
import { routeService, ticketService, userService } from "../services/api"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { RefreshCw, Sparkles, AlertTriangle, MapPin, Settings2, AlertCircle } from "lucide-react"

// Helper para configuración por defecto
const DEFAULT_CONFIG = {
  maxTicketsPerRoute: 8,
  proximityRadius: 3,
  minTicketsForRoute: 2,
  groupProximityByCategory: true,
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [crews, setCrews] = useState([])
  
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" })
  
  const { toast } = useToast()
  const { assignRoute, assignedRoutes } = useRoutes()

  // Pesos para el algoritmo híbrido
  const [proximityWeight, setProximityWeight] = useState(50)
  const [priorityWeight, setPriorityWeight] = useState(50)

  const [allOpenTickets, setAllOpenTickets] = useState([])

  // Obtener IDs de tickets que ya están asignados a rutas en curso
  const assignedTicketIds = useMemo(() => {
    const ids = new Set()
    assignedRoutes.forEach((route) => {
      route.tickets.forEach((ticket) => {
        ids.add(ticket.id)
      })
    })
    return ids
  }, [assignedRoutes])

  // Filtrar tickets disponibles de forma reactiva
  const availableTickets = useMemo(() => {
    return allOpenTickets.filter((t) => !assignedTicketIds.has(t.id))
  }, [allOpenTickets, assignedTicketIds])

  const fetchAvailableTickets = async () => {
    try {
      // traer los tickets abiertos de alumbrado con coordenadas
      const data = await ticketService.getAll({ 
        status: "open", 
        hasCoordinates: "true",
        limit: 1000 
      })
      
      // Normalizar tickets para que coincidan con lo que esperan SuggestedRoutes y otros componentes
      const normalized = data.map(t => ({
        ...t,
        ticketNumber: t.nro_ticket || `#${t.id}`,
        title: t.asunto || "Sin asunto",
        asunto: t.asunto || "Sin asunto",
        address: t.dire_completa || (t.calle ? `${t.calle} ${t.n_calle || ''}`.trim() : t.direccion) || "Sin dirección",
        dire_completa: t.dire_completa || (t.calle ? `${t.calle} ${t.n_calle || ''}`.trim() : t.direccion) || "Sin dirección",
        category: t.tipo_nombre || t.tipo || "General",
        priority: (t.prioridad || t.priority || "low").toLowerCase(),
        tipo: t.tipo_nombre || t.tipo,
        subtipo: t.subtipo_nombre || t.subtipo,
        // Mantener campos originales por si acaso
        lat: t.latitude,
        lng: t.longitude,
        latitude: t.latitude,
        longitude: t.longitude,
      }))
      
      setAllOpenTickets(normalized)
    } catch (err) {
      console.error("Error fetching tickets:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los tickets abiertos",
      })
    }
  }

  // Configuración de rutas
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  // Actualizar pesos cuando cambian los sliders
  const handleProximityChange = (value) => {
    const newProximity = value[0]
    setProximityWeight(newProximity)
    setPriorityWeight(100 - newProximity)
  }

  const fetchCrews = async () => {
    try {
      const data = await userService.getCrewLeaders()
      // Normalizar datos de secr (agente) a lo que espera el diálogo
      const normalizedCrews = data.map(c => ({
        id: c.unica,
        name: c.usuario || `Agente ${c.unica}`,
        id_agente: c.unica
      }))
      setCrews(normalizedCrews)
    } catch (err) {
      console.error("Error fetching crews:", err)
    }
  }

  const fetchRoutes = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await routeService.getAdminRoutes({ planed: true })
      // Normalizar rutas del backend al formato usado por SugerredRoutes
      // response.data es un array de rutas segun routeController
      const normalized = response.data.map(r => ({
        id: r.id,
        created_at: r.created_at,
        assigned_at: r.assigned_at,
        name: `Ruta ${r.id}`,
        status: r.planed ? "planned" : (r.is_active ? "in progress" : (r.started_at ? "completed" : "assigned")),
        tickets: (r.tickets || []).map(t => ({
          ...t,
          ticketNumber: t.ticketNumber || t.nro_ticket || `#${t.id}`,
          title: t.asunto || t.title || "Sin asunto",
          asunto: t.asunto || t.title || "Sin asunto",
          address: t.dire_completa || t.address || "Sin dirección",
          dire_completa: t.dire_completa || t.address || "Sin dirección",
          priority: (t.prioridad || t.priority || "low").toLowerCase(),
          tipo: t.tipo || t.tipo_nombre || "General",
          subtipo: t.subtipo || t.subtipo_nombre || ""
        })),
        crew: r.crew_id ? "Asignada" : null,
      }))
      setRoutes(normalized)
      setError(null)
    } catch (err) {
      setError(err.message || 'Error cargando rutas')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las rutas admin",
      })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Cargar datos al montar
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchRoutes(), fetchAvailableTickets(), fetchCrews()])
      setLoading(false)
    }
    init()
  }, [])

  // Generación automática con debounce
  useEffect(() => {
    // No generar en el primer render si ya cargamos o si estamos cargando inicialmente
    if (loading) return;

    const timer = setTimeout(() => {
      generateAIRoutes();
    }, 600); // Reducido de 1200ms a 600ms para mayor reactividad

    return () => clearTimeout(timer);
  }, [proximityWeight, priorityWeight, config]);


  const generateAIRoutes = async () => {
    setIsGenerating(true)
    try {
      const params = {
        proximityWeight,
        priorityWeight,
        maxPerRoute: config.maxTicketsPerRoute,
        radius: config.proximityRadius,
        minTickets: config.minTicketsForRoute
      };
      // routeService.generateRoutes points to the new /routes/admin/generate endpoint
      const response = await routeService.generateRoutes(params)
      toast({
        title: "Éxito",
        description: `Se generaron ${response.data.routesCreated} rutas automáticas basadas en la configuración.`,
      })
      await fetchRoutes(true) // Recargar de forma silenciosa para mostrar las nuevas
      await fetchAvailableTickets()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron generar rutas inteligentes",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectRoute = (route) => {
    setSelectedRoute(route)
    setShowMapDialog(true)
  }

  const handleConfirmRoute = (route) => {
    setSelectedRoute(route)
    setShowAssignDialog(true)
  }

  const handleUpdateRoute = (updatedRoute) => {
    setRoutes((routes) =>
      routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r))
    )

    toast({
      title: "Ruta actualizada",
      description: `${updatedRoute.name} se ha editado correctamente`,
    })
  }

  const handleAssignCrew = async (crewId) => {
    const crew = crews.find((c) => c.id === crewId)
    if (crew && selectedRoute) {
      try {
        setLoading(true)
        await routeService.confirm(selectedRoute.id, {
          crew_id: crewId,
          vehicle_id: null
        })
        
        assignRoute(selectedRoute, crewId, crew.name)
        setRoutes((routes) => routes.filter((r) => r.id !== selectedRoute.id))
        
        toast({
          title: "Ruta asignada y confirmada",
          description: `${selectedRoute.name} asignada a ${crew.name}`,
        })
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "No se pudo confirmar la ruta en el servidor"
        setErrorDialog({ open: true, message: errorMessage })
      } finally {
        setLoading(false)
        setSelectedRoute(null)
        setShowAssignDialog(false)
      }
    }
  }

  // Determinar el modo actual basado en los pesos
  const getBalanceMode = () => {
    if (proximityWeight >= 70) return { label: "Enfoque: Geográfico", color: "bg-blue-500" }
    if (priorityWeight >= 70) return { label: "Enfoque: Prioridad", color: "bg-red-500" }
    return { label: "Enfoque: Balanceado", color: "bg-green-500" }
  }

  const balanceMode = getBalanceMode()

  if (loading) {
    return <div className="p-8 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="mt-4">Cargando rutas...</p></div>
  }
  
  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto" />
        <p className="mt-4">{error}</p>
        <Button onClick={fetchRoutes} className="mt-4" variant="outline">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl opacity-30" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl ring-1 ring-white/20 transition-transform hover:scale-105">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">
                  Asignación de Rutas
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">En Vivo</span>
                </div>
              </div>
              <p className="mt-1 text-slate-400 font-medium text-white/80">
                Optimización logística basada en IA y cercanía geográfica
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Tickets Pendientes</span>
              <span className="text-2xl font-black text-white">{availableTickets.length}</span>
            </div>
            <Button 
              onClick={generateAIRoutes} 
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-3 text-yellow-400 group-hover:rotate-12 transition-transform" />
              )}
              <span className="text-black/50">Generar Optimización</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Glass Optimization Panel */}
      <Card className="glass shadow-premium border-white/40 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/20 bg-white/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">Parámetros de IA</h3>
          </div>
          <div className={cn(
            "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
            balanceMode.color
          )}>
            {balanceMode.label}
          </div>
        </div>
        
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">Balance de Algoritmo</span>
                  <span className="text-sm font-semibold mt-1 text-slate-700">Ajuste manual de prioridad</span>
                </div>
                <div className="flex items-center gap-4 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-black text-blue-600 font-mono">{proximityWeight}%</span>
                  </div>
                  <div className="w-[1px] h-4 bg-primary/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-600 font-mono">{priorityWeight}%</span>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </div>
              
              <div className="px-2 pt-2">
                <Slider
                  value={[proximityWeight]}
                  onValueChange={handleProximityChange}
                  max={100}
                  min={0}
                  step={5}
                  className="py-4"
                />
              </div>
            </div>

            <div className="bg-white/40 rounded-3xl p-6 border border-white/60 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Criterio Seleccionado</span>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              {proximityWeight > 50 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  El sistema está priorizando la <span className="font-bold text-blue-600 underline decoration-blue-200 underline-offset-4">optimización geográfica</span>. 
                  Las rutas se agruparán por cercanía para minimizar desplazamientos.
                </p>
              ) : priorityWeight > 50 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  El sistema está priorizando la <span className="font-bold text-red-600 underline decoration-red-200 underline-offset-4">severidad de los tickets</span>. 
                  Las rutas se formarán atendiendo primero los casos críticos sin importar la distancia.
                </p>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  El sistema busca un <span className="font-bold text-emerald-600 underline decoration-emerald-200 underline-offset-4">equilibrio perfecto</span>. 
                  Agrupa tickets cercanos pero da una ventaja significativa a los urgentes.
                </p>
              )}
            </div>
          </div>

          <Collapsible open={showConfig} onOpenChange={setShowConfig}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full h-10 rounded-xl hover:bg-primary/5 text-xs font-bold uppercase tracking-widest text-primary/70">
                {showConfig ? "Contraer Ajustes de Precisión" : "Expandir Ajustes de Precisión"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { label: "Capacidad Máxima", value: config.maxTicketsPerRoute, unit: "tickets", key: 'maxTicketsPerRoute', max: 15, min: 3 },
                  { label: "Radio de Acción", value: config.proximityRadius, unit: "km", key: 'proximityRadius', max: 10, min: 0.5, step: 0.5 },
                  { label: "Ocupación Mínima", value: config.minTicketsForRoute, unit: "tickets", key: 'minTicketsForRoute', max: 5, min: 1 }
                ].map((item) => (
                  <div key={item.key} className="p-5 bg-white/50 rounded-2xl border border-white/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-500">{item.label}</Label>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold">{item.value} {item.unit}</Badge>
                    </div>
                    <Slider
                      value={[item.value]}
                      onValueChange={([val]) => setConfig({ ...config, [item.key]: val })}
                      max={item.max}
                      min={item.min}
                      step={item.step || 1}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Suggested Routes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-outfit font-extrabold tracking-tight flex items-center gap-3 text-slate-800">
            Rutas Sugeridas
            <Badge variant="outline" className="text-primary font-bold border-primary/20 bg-primary/5 px-3 py-1">
              {routes.length}
            </Badge>
          </h2>
          <Button variant="outline" size="sm" onClick={fetchRoutes} className="text-xs h-8 bg-primary/10">
            <RefreshCw className="h-3 w-3 mr-2 text-black/70" />
            <span className="text-black/70">Actualizar</span>
          </Button>
        </div>

        {isGenerating ? (
          <Card className="border-dashed border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Generando rutas inteligentes...</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Estamos recalculando las mejores rutas basadas en tus actuales criterios de cercanía y prioridad.
              </p>
            </CardContent>
          </Card>
        ) : (
          <SuggestedRoutes
            routes={routes}
            setRoutes={setRoutes}
            onSelectRoute={handleSelectRoute}
            onConfirmRoute={handleConfirmRoute}
            availableTickets={availableTickets}
            allMaterials={mockMaterials}
            onUpdateRoute={handleUpdateRoute}
          />
        )}
      </div>

      {showAssignDialog && selectedRoute && (
        <AssignCrewDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          route={selectedRoute}
          onAssign={handleAssignCrew}
          crews={crews}
        />
      )}

      {showMapDialog && selectedRoute && (
        <RouteMapDialog
          open={showMapDialog}
          onOpenChange={setShowMapDialog}
          route={selectedRoute}
        />
      )}

      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="max-w-sm rounded-3xl border-amber-200 bg-amber-50/95 backdrop-blur-sm p-0 shadow-xl">
          <DialogHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-amber-800">
                Advertencia
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="px-6 pb-6">
            <p className="text-sm text-amber-700 leading-relaxed">
              {errorDialog.message}
            </p>
          </div>
          <div className="flex justify-end px-6 pb-6">
            <Button 
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
              className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
