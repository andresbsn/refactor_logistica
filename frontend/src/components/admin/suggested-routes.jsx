import React, { useState, useMemo } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Trash2,
  Edit,
  Sparkles,
  Package,
  AlertCircle,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import EditRouteDialog from "./edit-route-dialog"
import { cn } from "@/lib/utils"

export default function SuggestedRoutes({
  routes,
  setRoutes,
  onSelectRoute,
  onConfirmRoute,
  availableTickets,
  allMaterials,
  onUpdateRoute,
}) {
  const [expandedRoutes, setExpandedRoutes] = useState(new Set())
  const [editingRoute, setEditingRoute] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [routeToConfirm, setRouteToConfirm] = useState(null)

  const stockStatusMap = useMemo(() => {
    const map = new Map()

    routes.forEach((route) => {
      const routeStockMap = new Map()

      route.tickets.forEach((ticket) => {
        const issues = []
        let hasStockIssue = false

        if (ticket.materialsRequired) {
          ticket.materialsRequired.forEach((req) => {
            const material = allMaterials.find((m) => m.id === req.materialId)
            if (!material || material.quantity < req.quantity) {
              hasStockIssue = true
              issues.push({
                materialId: req.materialId,
                materialName: req.name || "Material desconocido",
                materialCode: req.code || "N/A",
                required: req.quantity,
                available: material ? material.quantity : 0,
                ticketId: ticket.id,
              })
            }
          })
        }

        routeStockMap.set(ticket.id, { hasStockIssue, issues })
      })

      map.set(route.id, routeStockMap)
    })

    return map
  }, [routes, allMaterials])

  const getRouteStockIssues = (routeId) => {
    const routeMap = stockStatusMap.get(routeId)
    if (!routeMap) return { count: 0, tickets: [] }

    const ticketIssues = []
    routeMap.forEach((status, ticketId) => {
      if (status.hasStockIssue) {
        ticketIssues.push(ticketId)
      }
    })

    return {
      count: ticketIssues.length,
      tickets: ticketIssues,
    }
  }

  const getTicketStockStatus = (routeId, ticketId) => {
    return stockStatusMap.get(routeId)?.get(ticketId)
  }

  const toggleExpand = (routeId) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId)
    } else {
      newExpanded.add(routeId)
    }
    setExpandedRoutes(newExpanded)
  }

  const handleConfirmClick = (route) => {
    const issues = getRouteStockIssues(route.id)
    if (issues.count > 0) {
      setRouteToConfirm(route)
      setConfirmDialogOpen(true)
    } else {
      onConfirmRoute(route)
    }
  }

  const handleRemoveTicketFromRoute = (route, ticketId) => {
    const updatedTickets = route.tickets.filter((t) => t.id !== ticketId)
    if (updatedTickets.length > 0) {
      onUpdateRoute({
        ...route,
        tickets: updatedTickets,
        description: `${updatedTickets.length} tickets en la ruta`,
      })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
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
            <Card key={route.id} className={cn(
              "overflow-hidden transition-all duration-200",
              isExpanded ? "ring-2 ring-primary/20 shadow-md" : "hover:shadow-sm"
            )}>
              <CardHeader className="p-4 cursor-pointer" onClick={() => toggleExpand(route.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1 p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-outfit font-bold flex items-center gap-2 flex-wrap text-primary">
                        {route.name}
                        <Badge variant="outline" className="text-black/70 text-[14px] font-bold border-primary/20 bg-primary/5 px-3">
                          {route.tickets.length} tickets
                        </Badge>
                        {stockIssues.count > 0 && (
                          <Badge variant="destructive" className="font-bold shadow-sm">
                            <AlertTriangle className="h-3 w-3 mr-1.5" />
                            {stockIssues.count} con avisos
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-primary/60 font-medium">{route.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-custom-blue hover:bg-blue-100 text-primary transition-all">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 p-4 space-y-4">
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {route.tickets.map((ticket) => {
                      const stockStatus = getTicketStockStatus(route.id, ticket.id)
                      const hasIssue = stockStatus?.hasStockIssue || false

                      return (
                        <div
                          key={ticket.id}
                          className={cn(
                            "p-3 rounded-lg border text-sm space-y-2 transition-colors",
                            hasIssue ? "bg-red-50/50 border-red-200" : "bg-card hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2 text-lg">
                                {hasIssue && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                                <span className="truncate">{ticket.ticketNumber || `#${ticket.id}`} - {ticket.asunto || ticket.title}</span>
                              </div>
                              <div className="text-primary/70 text-lg mt-1.5 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                                  <span className="truncate italic">{ticket.dire_completa || ticket.address} {ticket.barrio ? `- Barrio ${ticket.barrio}` : ''}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge variant="outline" className="text-[12px] text-black/50 bg-primary/5 border-custom-blue px-2 py-0 h-5 font-bold">{ticket.tipo || 'Tipo'}</Badge>
                                  <Badge variant="secondary" className="text-[12px] px-2 py-0 h-5 bg-primary/10 text-black/50 border-custom-blue/10 font-medium">{ticket.subtipo || 'Subtipo'}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={getPriorityColor(ticket.priority)} className="text-[10px] uppercase font-bold px-1.5 py-0 bg-custom-blue">
                                {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                              </Badge>
                              {hasIssue && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTicketFromRoute(route, ticket.id);
                                      }}
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
                            <div className="bg-white/60 border border-red-100 rounded-md p-2 mt-2">
                              <div className="flex items-center gap-1 text-red-700 font-semibold text-[10px] mb-1 uppercase tracking-wider">
                                <Package className="h-3 w-3" />
                                Falta stock para:
                              </div>
                              <ul className="text-xs text-red-600 space-y-0.5 ml-4 list-disc">
                                {stockStatus.issues.map((issue, idx) => (
                                  <li key={`${issue.materialId}-${idx}`} className="leading-tight">
                                    <span className="font-medium">{issue.materialName}</span>
                                    <span className="text-red-500 ml-1">
                                      (Disp: {issue.available})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 pt-5 border-t border-primary/10 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-custom-blue/20 hover:bg-custom-blue/50 bg-custom-blue/5 hover:text-primary transition-all font-bold"
                      onClick={() => onSelectRoute(route)}
                    >
                      <MapPin className="h-4 w-4 mr-2 text-black/70" />
                      <p className="text-black/70">Detalle</p>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-10 rounded-xl border-custom-blue/20 hover:bg-custom-blue/50 bg-custom-blue/5 hover:text-primary transition-all font-bold px-4" 
                      onClick={() => setEditingRoute(route)}
                    >
                      <Edit className="h-4 w-4 mr-2 text-black/70" />
                     <p className="text-black/70">Editar</p>
                    </Button>
                    <Button
                      size="sm"
                      className={cn(
                        "h-10 rounded-xl font-bold px-6 shadow-md transition-all active:scale-95",
                        stockIssues.count > 0 
                          ? "bg-destructive hover:bg-destructive/90 text-white" 
                          : "bg-primary hover:bg-custom-blue/60 text-white"
                      )}
                      onClick={() => handleConfirmClick(route)}
                    >
                      {stockIssues.count > 0 ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2 text-black/70" />
                          <p className="text-black/70">Confirmar con Alertas</p>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2 text-black/70" />
                          <p className="text-black/70">Confirmar Ruta</p>
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
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Advertencia de Stock
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-foreground">
                  La ruta <strong>{routeToConfirm?.name}</strong> contiene{" "}
                  <strong>{routeToConfirm ? getRouteStockIssues(routeToConfirm.id).count : 0} tickets</strong> con
                  problemas de stock detectados.
                </p>

                {routeToConfirm && (
                  <div className="bg-muted rounded-lg p-3 border border-border">
                    <p className="font-semibold text-xs mb-2 uppercase tracking-wide opacity-70 text-foreground">Materiales faltantes en ruta:</p>
                    <ul className="text-sm space-y-1 ml-4 list-disc max-h-40 overflow-y-auto">
                      {Array.from(stockStatusMap.get(routeToConfirm.id)?.values() || [])
                        .filter((s) => s.hasStockIssue)
                        .flatMap((s) => s.issues)
                        .map((issue, idx) => (
                          <li key={`${issue.ticketId}-${issue.materialId}-${idx}`} className="text-foreground/80">
                            <span className="font-mono text-xs bg-muted-foreground/10 px-1 rounded">{issue.materialCode}</span> - {issue.materialName}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  ¿Desea confirmar la ruta de todas formas o prefiere realizar ajustes?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Volver y Editar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
