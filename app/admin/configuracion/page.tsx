"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Route,
  Zap,
  Save,
  RotateCcw,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface SystemConfig {
  proximityRadius: number
  maxTicketsPerRoute: number
  minTicketsForRoute: number
  autoGenerateRoutes: boolean
  prioritizeHighPriority: boolean
  groupProximityByCategory: boolean
}

const defaultConfig: SystemConfig = {
  proximityRadius: 2,
  maxTicketsPerRoute: 8,
  minTicketsForRoute: 2,
  autoGenerateRoutes: true,
  prioritizeHighPriority: true,
  groupProximityByCategory: true,
}

export function getSystemConfig(): SystemConfig {
  if (typeof window === "undefined") return defaultConfig
  const saved = localStorage.getItem("systemConfig")
  if (saved) {
    try {
      return { ...defaultConfig, ...JSON.parse(saved) }
    } catch {
      return defaultConfig
    }
  }
  return defaultConfig
}

export function saveSystemConfig(config: SystemConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem("systemConfig", JSON.stringify(config))
  window.dispatchEvent(new CustomEvent("configUpdated", { detail: config }))
}

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  
  const [proximityRadius, setProximityRadius] = useState([2])
  const [maxTicketsPerRoute, setMaxTicketsPerRoute] = useState([8])
  const [minTicketsForRoute, setMinTicketsForRoute] = useState([2])
  const [autoGenerateRoutes, setAutoGenerateRoutes] = useState(true)
  const [prioritizeHighPriority, setPrioritizeHighPriority] = useState(true)
  const [groupProximityByCategory, setGroupProximityByCategory] = useState(true)

  useEffect(() => {
    const config = getSystemConfig()
    setProximityRadius([config.proximityRadius])
    setMaxTicketsPerRoute([config.maxTicketsPerRoute])
    setMinTicketsForRoute([config.minTicketsForRoute])
    setAutoGenerateRoutes(config.autoGenerateRoutes)
    setPrioritizeHighPriority(config.prioritizeHighPriority)
    setGroupProximityByCategory(config.groupProximityByCategory)
  }, [])

  const handleSave = () => {
    const config: SystemConfig = {
      proximityRadius: proximityRadius[0],
      maxTicketsPerRoute: maxTicketsPerRoute[0],
      minTicketsForRoute: minTicketsForRoute[0],
      autoGenerateRoutes,
      prioritizeHighPriority,
      groupProximityByCategory,
    }
    
    saveSystemConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    
    toast({
      title: "Configuracion guardada",
      description: "Los cambios se han aplicado correctamente",
    })
  }

  const handleReset = () => {
    setProximityRadius([defaultConfig.proximityRadius])
    setMaxTicketsPerRoute([defaultConfig.maxTicketsPerRoute])
    setMinTicketsForRoute([defaultConfig.minTicketsForRoute])
    setAutoGenerateRoutes(defaultConfig.autoGenerateRoutes)
    setPrioritizeHighPriority(defaultConfig.prioritizeHighPriority)
    setGroupProximityByCategory(defaultConfig.groupProximityByCategory)
    
    saveSystemConfig(defaultConfig)
    
    toast({
      title: "Configuracion restablecida",
      description: "Se han restaurado los valores por defecto",
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Configuracion de Rutas</h1>
              <p className="text-sm text-muted-foreground">
                Ajustes para la generacion de rutas sugeridas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
              <Button onClick={handleSave} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                {saved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Algoritmos de Rutas
              </CardTitle>
              <CardDescription>
                Configura como se generan las rutas sugeridas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generacion automatica de rutas</Label>
                  <p className="text-sm text-muted-foreground">
                    Generar rutas sugeridas cuando se crean nuevos tickets
                  </p>
                </div>
                <Switch
                  checked={autoGenerateRoutes}
                  onCheckedChange={setAutoGenerateRoutes}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Radio de cercania (km)</Label>
                  <Badge variant="secondary">{proximityRadius[0]} km</Badge>
                </div>
                <Slider
                  value={proximityRadius}
                  onValueChange={setProximityRadius}
                  max={10}
                  min={0.5}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Distancia maxima entre tickets para agruparlos en una ruta por cercania
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Maximo de tickets por ruta</Label>
                  <Badge variant="secondary">{maxTicketsPerRoute[0]} tickets</Badge>
                </div>
                <Slider
                  value={maxTicketsPerRoute}
                  onValueChange={setMaxTicketsPerRoute}
                  max={15}
                  min={3}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Cantidad maxima de tickets que puede contener una ruta sugerida
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Minimo de tickets para crear ruta</Label>
                  <Badge variant="secondary">{minTicketsForRoute[0]} tickets</Badge>
                </div>
                <Slider
                  value={minTicketsForRoute}
                  onValueChange={setMinTicketsForRoute}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Cantidad minima de tickets necesarios para sugerir una ruta
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Agrupar cercania por categoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Las rutas por cercania tambien agruparan tickets del mismo tipo
                  </p>
                </div>
                <Switch
                  checked={groupProximityByCategory}
                  onCheckedChange={setGroupProximityByCategory}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Priorizar tickets urgentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir siempre tickets de alta prioridad en las rutas sugeridas
                  </p>
                </div>
                <Switch
                  checked={prioritizeHighPriority}
                  onCheckedChange={setPrioritizeHighPriority}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                Resumen de Configuracion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{proximityRadius[0]} km</p>
                  <p className="text-sm text-muted-foreground">Radio cercania</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{maxTicketsPerRoute[0]}</p>
                  <p className="text-sm text-muted-foreground">Max tickets/ruta</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{minTicketsForRoute[0]}</p>
                  <p className="text-sm text-muted-foreground">Min tickets/ruta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
