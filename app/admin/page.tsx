"use client"

import { useState, useEffect, useMemo } from "react"
import type { SuggestedRoute, Ticket } from "@/types/ticket"
import { type RouteConfig, generateHybridRoutes } from "@/lib/route-algorithms"
import { getSystemConfig } from "./configuracion/page"
import { mockTickets, mockCrews, mockMaterials } from "@/lib/mock-data"
import { SuggestedRoutes } from "@/components/admin/suggested-routes"
import { AssignCrewDialog } from "@/components/admin/assign-crew-dialog"
import { RouteMapDialog } from "@/components/admin/route-map-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Sparkles, RefreshCw, MapPin, AlertTriangle, Settings2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRoutes } from "@/lib/routes-context"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<SuggestedRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<SuggestedRoute | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const { toast } = useToast()
  const { assignRoute, assignedRoutes } = useRoutes()

  // Pesos para el algoritmo híbrido
  const [proximityWeight, setProximityWeight] = useState(50)
  const [priorityWeight, setPriorityWeight] = useState(50)

  // Obtener IDs de tickets que ya están asignados a rutas en curso
  const assignedTicketIds = useMemo(() => {
    const ids = new Set<string>()
    assignedRoutes.forEach((route) => {
      route.tickets.forEach((ticket) => {
        ids.add(ticket.id)
      })
    })
    return ids
  }, [assignedRoutes])

  // Filtrar tickets disponibles (abiertos y no asignados)
  const availableTickets = useMemo(() => {
    return mockTickets.filter(
      (t) => t.status === "open" && !assignedTicketIds.has(t.id)
    )
  }, [assignedTicketIds])

  // Configuración de rutas
  const [config, setConfig] = useState<RouteConfig>({
    maxTicketsPerRoute: 8,
    proximityRadius: 2,
    minTicketsForRoute: 2,
    groupProximityByCategory: true,
    proximityWeight: 50,
    priorityWeight: 50,
  })

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedConfig = getSystemConfig()
    setConfig({
      maxTicketsPerRoute: savedConfig.maxTicketsPerRoute,
      proximityRadius: savedConfig.proximityRadius,
      minTicketsForRoute: savedConfig.minTicketsForRoute,
      groupProximityByCategory: savedConfig.groupProximityByCategory,
      proximityWeight: 50,
      priorityWeight: 50,
    })
  }, [])

  // Actualizar pesos cuando cambian los sliders
  const handleProximityChange = (value: number[]) => {
    const newProximity = value[0]
    setProximityWeight(newProximity)
    setPriorityWeight(100 - newProximity)
  }

  // Generar rutas cuando cambian los parámetros
  useEffect(() => {
    generateRoutes()
  }, [config, availableTickets, proximityWeight, priorityWeight])

  const generateRoutes = () => {
    const hybridConfig = {
      ...config,
      proximityWeight,
      priorityWeight,
    }

    const generatedRoutes = generateHybridRoutes(availableTickets, hybridConfig)
    setRoutes(generatedRoutes)

    if (generatedRoutes.length > 0) {
      toast({
        title: "Rutas generadas",
        description: `${generatedRoutes.length} rutas con balance: ${proximityWeight}% cercanía, ${priorityWeight}% prioridad`,
      })
    }
  }

  const handleSelectRoute = (route: SuggestedRoute) => {
    setSelectedRoute(route)
    setShowMapDialog(true)
  }

  const handleConfirmRoute = (route: SuggestedRoute) => {
    setSelectedRoute(route)
    setShowAssignDialog(true)
  }

  const handleUpdateRoute = (updatedRoute: SuggestedRoute) => {
    setRoutes((routes) =>
      routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r))
    )

    toast({
      title: "Ruta actualizada",
      description: `${updatedRoute.name} se ha editado correctamente`,
    })
  }

  const handleAssignCrew = (crewId: string) => {
    const crew = mockCrews.find((c) => c.id === crewId)
    if (crew && selectedRoute) {
      assignRoute(selectedRoute, crewId, crew.name)
      setRoutes((routes) => routes.filter((r) => r.id !== selectedRoute.id))

      toast({
        title: "Ruta asignada",
        description: `${selectedRoute.name} asignada a ${crew.name}`,
      })

      setSelectedRoute(null)
    }
  }

  const totalPendingTickets = availableTickets.length

  // Determinar el modo actual basado en los pesos
  const getBalanceMode = () => {
    if (proximityWeight >= 70) return { label: "Priorizando Cercanía", color: "bg-blue-500" }
    if (priorityWeight >= 70) return { label: "Priorizando Urgencia", color: "bg-red-500" }
    return { label: "Balanceado", color: "bg-green-500" }
  }

  const balanceMode = getBalanceMode()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Rutas Sugeridas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Optimización inteligente de logística basada en proximidad y urgencia.
              </p>
            </div>
            <div className="flex items-center gap-3 font-sans">
              <Badge variant="secondary" className="text-sm px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20">
                {totalPendingTickets} tickets pendientes
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Balance de algoritmo */}
        <Card className="glass border-white/40 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 opacity-50" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl shadow-sm">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Balance de Optimización</CardTitle>
                  <CardDescription className="text-sm">
                    Desliza para equilibrar la eficiencia geográfica frente a la prioridad de atención.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`px-3 py-1 rounded-full border-none font-semibold ${balanceMode.color.replace('bg-', 'bg-opacity-20 text-').replace('500', '700')} ${balanceMode.color.replace('opacity-20', 'opacity-10')}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${balanceMode.color} animate-pulse`} />
                {balanceMode.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            {/* Slider principal de balance */}
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">Cercanìa</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Logística</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5 font-mono text-xs bg-muted/50">
                    {proximityWeight}% / {priorityWeight}%
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">Prioridad</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Urgencia</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="relative px-2">
                <div className="absolute inset-x-2 h-2.5 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 opacity-10" />
                <Slider
                  value={[proximityWeight]}
                  onValueChange={handleProximityChange}
                  max={100}
                  min={0}
                  step={5}
                  className="relative py-4"
                />
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground font-medium px-1 italic">
                <span>Agrupa tickets por zonas para ahorrar combustible</span>
                <span>Atiende primero los reclamos más críticos</span>
              </div>
            </div>

            {/* Configuración adicional colapsable */}
            <Collapsible open={showConfig} onOpenChange={setShowConfig} className="bg-muted/30 rounded-2xl border border-border/40 overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between px-4 h-12 hover:bg-muted/50 rounded-none transition-all">
                  <div className="flex items-center">
                    <Settings2 className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold text-sm">Parámetros Avanzados</span>
                  </div>
                  <div className={`transition-transform duration-300 ${showConfig ? 'rotate-180' : ''}`}>
                    <RefreshCw className="h-3 w-3 opacity-50" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tickets / Ruta</Label>
                      <Badge variant="secondary" className="rounded-md font-mono">{config.maxTicketsPerRoute}</Badge>
                    </div>
                    <Slider
                      value={[config.maxTicketsPerRoute]}
                      onValueChange={([value]) => setConfig({ ...config, maxTicketsPerRoute: value })}
                      max={15}
                      min={3}
                      step={1}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Radio Máximo</Label>
                      <Badge variant="secondary" className="rounded-md font-mono">{config.proximityRadius} km</Badge>
                    </div>
                    <Slider
                      value={[config.proximityRadius]}
                      onValueChange={([value]) => setConfig({ ...config, proximityRadius: value })}
                      max={10}
                      min={0.5}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mínimo / Ruta</Label>
                      <Badge variant="secondary" className="rounded-md font-mono">{config.minTicketsForRoute}</Badge>
                    </div>
                    <Slider
                      value={[config.minTicketsForRoute]}
                      onValueChange={([value]) => setConfig({ ...config, minTicketsForRoute: value })}
                      max={5}
                      min={1}
                      step={1}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Botón regenerar */}
            <div className="flex justify-end pt-2">
              <Button onClick={generateRoutes} className="rounded-xl shadow-premium px-8 h-11 transition-all active:scale-[0.98]">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar Recomendaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass border-blue-200/50 bg-blue-50/30 overflow-hidden relative group transition-all hover:shadow-premium">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-blue-900">{proximityWeight}%</p>
                  <p className="text-xs font-bold text-blue-600/80 uppercase tracking-widest">Peso Cercanía</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 bg-primary/5 overflow-hidden relative group transition-all hover:shadow-premium">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-primary-900">{routes.length}</p>
                  <p className="text-xs font-bold text-primary/80 uppercase tracking-widest">Recomendaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-red-200/50 bg-red-50/30 overflow-hidden relative group transition-all hover:shadow-premium">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-red-900">{priorityWeight}%</p>
                  <p className="text-xs font-bold text-red-600/80 uppercase tracking-widest">Peso Urgencia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de rutas generadas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Rutas Sugeridas ({routes.length})
          </h2>
          <SuggestedRoutes
            routes={routes}
            availableTickets={availableTickets}
            materials={mockMaterials}
            onSelectRoute={handleSelectRoute}
            onConfirmRoute={handleConfirmRoute}
            onUpdateRoute={handleUpdateRoute}
          />
        </div>
      </div>

      {/* Dialog para asignar cuadrilla */}
      <AssignCrewDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        route={selectedRoute}
        crews={mockCrews}
        onAssign={handleAssignCrew}
      />

      {/* Dialog para ver mapa de la ruta */}
      <RouteMapDialog
        open={showMapDialog}
        onOpenChange={setShowMapDialog}
        route={selectedRoute}
      />
    </div>
  )
}
