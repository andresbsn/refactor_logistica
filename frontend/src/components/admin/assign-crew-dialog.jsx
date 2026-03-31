import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Users, Truck } from "lucide-react"
import { Badge } from "../ui/badge"
export default function AssignCrewDialog({
  open,
  onOpenChange,
  route,
  onAssign,
  crews = []
}) {
  const [selectedCrewId, setSelectedCrewId] = useState("")

  const handleAssign = () => {
    if (!selectedCrewId) return
    const crew = crews.find((c) => c.id === selectedCrewId)
    if (crew) {
      onAssign(crew.id)
      onOpenChange(false)
      setSelectedCrewId("")
    }
  }

  if (!route) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl shadow-premium border-white/40 bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-outfit font-extrabold text-slate-800">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Users className="h-5 w-5" />
            </div>
            Asignar Cuadrilla
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
            Selecciona una cuadrilla para asignar la ruta <strong className="text-primary">{route.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Ruta</span>
              <span className="font-bold text-slate-800">{route.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Total tickets</span>
              <Badge variant="secondary" className="bg-primary/10 text-black border-0 font-bold px-3 py-0.5">{route.tickets.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Tipo de Optimización</span>
              <Badge variant="outline" className="border-primary/20 bg-white text-black font-bold">
                {route.type === "proximity" ? "Por Cercanía" : route.type === "priority" ? "Por Prioridad" : "Manual"}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Seleccionar Equipo</label>
            <Select value={selectedCrewId} onValueChange={setSelectedCrewId}>
              <SelectTrigger className="w-full h-12 rounded-xl bg-white border-primary/20 shadow-sm focus:ring-primary/30">
                <SelectValue placeholder="Elige una cuadrilla disponible" />
              </SelectTrigger>
              <SelectContent>
                {crews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>{crew.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" className="h-10 rounded-xl border-custom-blue/20 bg-custom-blue/5 hover:bg-custom-blue/10 text-slate-600 font-bold m-1" onClick={() => onOpenChange(false)}>
            <p className="text-black/60">Cancelar</p>
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedCrewId}
            className="h-10 px-6 rounded-xl bg-custom-blue/50 hover:bg-custom-blue/60 text-white font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            Confirmar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
