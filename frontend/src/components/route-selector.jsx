
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



export function RouteSelector({ routes, selectedRoute, onRouteChange }) {
  if (routes.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">No hay rutas asignadas</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Selecciona una ruta</label>
      <Select value={selectedRoute || undefined} onValueChange={onRouteChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona una ruta..." />
        </SelectTrigger>
        <SelectContent>
          {routes.map((route) => (
            <SelectItem key={route.id} value={route.id}>
              {route.name} ({route.tickets.length} tareas)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
