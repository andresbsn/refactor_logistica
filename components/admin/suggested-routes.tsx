"use client"

import { useState, useMemo } from "react"
import type { SuggestedRoute, Ticket, Material } from "@/types/ticket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  MapPin,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  AlertTriangle,
  Package,
  Trash2,
} from "lucide-react"
import { EditRouteDialog } from "./edit-route-dialog"
import { checkRouteStock, type TicketStockStatus } from "@/lib/stock-check"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SuggestedRoutesProps {
  routes: SuggestedRoute[]
  availableTickets: Ticket[]
  materials: Material[]
  onSelectRoute: (route: SuggestedRoute) => void
  onConfirmRoute: (route: SuggestedRoute) => void
  onUpdateRoute: (route: SuggestedRoute) => void
}

export function SuggestedRoutes({
  routes,
  availableTickets,
  materials,
  onSelectRoute,
  onConfirmRoute,
  onUpdateRoute,
}: SuggestedRoutesProps) {
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())
  const [editingRoute, setEditingRoute] = useState<SuggestedRoute | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [routeToConfirm, setRouteToConfirm] = useState<SuggestedRoute | null>(null)
  const [stockStatusMap, setStockStatusMap] = useState<Map<string, Map<string, TicketStockStatus>>>(new Map())

  // Calcular estado de stock para cada ruta
  useMemo(() => {
    const newMap = new Map<string, Map<string, TicketStockStatus>>()
    routes.forEach((route) => {
      const routeStockStatus = checkRouteStock(route.tickets, materials)
      newMap.set(route.id, routeStockStatus)
    })
    setStockStatusMap(newMap)
  }, [routes, materials])

  const toggleExpand = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId)
    } else {
      newExpanded.add(routeId)
    }
    setExpandedRoutes(newExpanded)
  }

  const getRouteStockIssues = (routeId: string) => {
    const routeStatus = stockStatusMap.get(routeId)
    if (!routeStatus) return { count: 0, tickets: [] as string[] }

    let count = 0
    const tickets: string[] = []
    routeStatus.forEach((status, ticketId) => {
      if (status.hasStockIssue) {
        count++
        tickets.push(ticketId)
      }
    })
    return { count, tickets }
  }

  const getTicketStockStatus = (routeId: string, ticketId: string): TicketStockStatus | undefined => {
    return stockStatusMap.get(routeId)?.get(ticketId)
  }

  const handleConfirmClick = (route: SuggestedRoute) => {
    const issues = getRouteStockIssues(route.id)
    if (issues.count > 0) {
      setRouteToConfirm(route)
      setConfirmDialogOpen(true)
    } else {
      onConfirmRoute(route)
    }
  }

  const handleRemoveTicketFromRoute = (route: SuggestedRoute, ticketId: string) => {
    const updatedTickets = route.tickets.filter((t) => t.id !== ticketId)
    if (updatedTickets.length > 0) {
      onUpdateRoute({
        ...route,
        tickets: updatedTickets,
        description: `${updatedTickets.length} tickets en la ruta`,
      })
    }
  }

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
    }
  }

  if (routes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No hay rutas sugeridas disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {routes.map((route) => {
          const isExpanded = expandedRoutes.has(route.id)
          const stockIssues = getRouteStockIssues(route.id)

          return (
            <Card
              key={route.id}
              className={`border-2 transition-all hover:shadow-md ${
                stockIssues.count > 0 ? "border-red-300 bg-red-50/30" : "border-border"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {route.name}
                        <Badge variant="outline" className="font-normal">
                          {route.tickets.length} tickets
                        </Badge>
                        {stockIssues.count > 0 && (
                          <Badge variant="destructive" className="font-normal">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {stockIssues.count} sin stock
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">{route.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleExpand(route.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {route.tickets.map((ticket) => {
                      const stockStatus = getTicketStockStatus(route.id, ticket.id)
                      const hasIssue = stockStatus?.hasStockIssue || false

                      return (
                        <div
                          key={ticket.id}
                          className={`p-3 rounded-lg border text-sm space-y-2 ${
                            hasIssue ? "bg-red-50 border-red-300" : "bg-background"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {hasIssue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {ticket.ticketNumber || `#${ticket.id}`} - {ticket.title}
                              </div>
                              <div className="text-muted-foreground text-xs mt-1">{ticket.address}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                                {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                              </Badge>
                              {hasIssue && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                                      onClick={() => handleRemoveTicketFromRoute(route, ticket.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Quitar de la ruta</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>

                          {/* Mostrar problemas de stock */}
                          {hasIssue && stockStatus?.issues && (
                            <div className="bg-red-100 rounded-md p-2 mt-2">
                              <div className="flex items-center gap-1 text-red-700 font-medium text-xs mb-1">
                                <Package className="h-3 w-3" />
                                Falta stock para:
                              </div>
                              <ul className="text-xs text-red-600 space-y-0.5">
                                {stockStatus.issues.map((issue) => (
                                  <li key={issue.materialId} className="flex items-center gap-1">
                                    <span className="font-mono">{issue.materialCode}</span> -{" "}
                                    <span>{issue.materialName}</span>
                                    <span className="text-red-500 font-medium ml-1">
                                      (Disponible: {issue.available})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {ticket.category && !hasIssue && (
                            <Badge variant="outline" className="text-xs">
                              {ticket.category}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => onSelectRoute(route)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Ver en Mapa
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingRoute(route)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleConfirmClick(route)}
                      variant={stockIssues.count > 0 ? "destructive" : "default"}
                    >
                      {stockIssues.count > 0 ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Confirmar con alertas
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {editingRoute && (
        <EditRouteDialog
          open={!!editingRoute}
          onOpenChange={(open) => !open && setEditingRoute(null)}
          route={editingRoute}
          availableTickets={availableTickets}
          onSave={onUpdateRoute}
        />
      )}

      {/* Diálogo de confirmación con alertas de stock */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Advertencia de Stock
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  La ruta <strong>{routeToConfirm?.name}</strong> contiene{" "}
                  <strong>{routeToConfirm ? getRouteStockIssues(routeToConfirm.id).count : 0} tickets</strong> con
                  problemas de stock.
                </p>

                {routeToConfirm && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="font-medium text-red-700 text-sm mb-2">Materiales faltantes:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {Array.from(stockStatusMap.get(routeToConfirm.id)?.values() || [])
                        .filter((s) => s.hasStockIssue)
                        .flatMap((s) => s.issues)
                        .map((issue, idx) => (
                          <li key={`${issue.ticketId}-${issue.materialId}-${idx}`}>
                            <span className="font-mono">{issue.materialCode}</span> - {issue.materialName}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm">
                  Puede confirmar la ruta de todas formas o volver a editar los tickets antes de asignar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver y Editar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (routeToConfirm) {
                  onConfirmRoute(routeToConfirm)
                }
                setConfirmDialogOpen(false)
                setRouteToConfirm(null)
              }}
            >
              Confirmar de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
