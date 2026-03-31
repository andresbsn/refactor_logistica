import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Package, MapPin, AlertTriangle } from "lucide-react"

export function StockInventoryDialog({ open, onOpenChange, materials }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStockStatus = (material) => {
    const percentage = (material.quantity / material.minStock) * 100
    if (percentage <= 100) return { label: "Crítico", variant: "destructive" }
    if (percentage <= 150) return { label: "Bajo", variant: "default" }
    return { label: "Normal", variant: "secondary" }
  }

  const getCategoryColor = (category) => {
    const colors = {
      Alumbrado: "bg-amber-500 text-white hover:bg-amber-600",
      Calles: "bg-blue-500 text-white hover:bg-blue-600",
      Señalización: "bg-red-500 text-white hover:bg-red-600",
      Agua: "bg-cyan-500 text-white hover:bg-cyan-600",
      Residuos: "bg-green-500 text-white hover:bg-green-600",
    }
    return colors[category] || "bg-muted text-muted-foreground"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6" />
            Inventario de Materiales
          </DialogTitle>
          <DialogDescription>Consulta el stock disponible para planificar la asignación de tareas</DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por material o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron materiales</p>
            </div>
          ) : (
            filteredMaterials.map((material) => {
              const stockStatus = getStockStatus(material)
              const isLowStock = material.quantity <= material.minStock

              return (
                <Card key={material.id} className={isLowStock ? "border-destructive/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {material.name}
                              {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {material.location}
                            </div>
                          </div>
                          <Badge className={getCategoryColor(material.category)}>{material.category}</Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Stock Actual</p>
                            <p className="text-2xl font-bold">
                              {material.quantity}{" "}
                              <span className="text-sm font-normal text-muted-foreground">{material.unit}</span>
                            </p>
                          </div>

                          <div className="h-8 w-px bg-border" />

                          <div>
                            <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                            <p className="text-lg font-semibold text-muted-foreground">
                              {material.minStock} {material.unit}
                            </p>
                          </div>

                          <div className="ml-auto">
                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
