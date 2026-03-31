"use client"

import { useState } from "react"
import type { Crew, SuggestedRoute } from "@/types/ticket"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle2 } from "lucide-react"

interface AssignCrewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: SuggestedRoute | null
  crews: Crew[]
  onAssign: (crewId: string) => void
}

export function AssignCrewDialog({ open, onOpenChange, route, crews, onAssign }: AssignCrewDialogProps) {
  const [selectedCrew, setSelectedCrew] = useState<string>("")

  const handleAssign = () => {
    if (selectedCrew) {
      onAssign(selectedCrew)
      setSelectedCrew("")
      onOpenChange(false)
    }
  }

  if (!route) return null

  const availableCrews = crews.filter((c) => c.available)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Cuadrilla
          </DialogTitle>
          <DialogDescription>Selecciona una cuadrilla para asignar la ruta {route.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ruta:</span>
              <span className="font-medium">{route.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total tickets:</span>
              <Badge>{route.tickets.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant="outline">
                {route.type === "proximity" ? "Por cercanía" : route.type === "category" ? "Por tipo" : "Por prioridad"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crew">Cuadrilla</Label>
            <Select value={selectedCrew} onValueChange={setSelectedCrew}>
              <SelectTrigger id="crew">
                <SelectValue placeholder="Selecciona una cuadrilla" />
              </SelectTrigger>
              <SelectContent>
                {availableCrews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {crew.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableCrews.length === 0 && <p className="text-sm text-destructive">No hay cuadrillas disponibles</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedCrew}>
            Asignar Ruta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
