"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Camera,
  Plus,
  Trash2,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  ClipboardList,
  ImagePlus,
  X,
} from "lucide-react"
import type { Ticket, Material, MaterialUsed } from "@/types/ticket"
import { getSubtypeConfig, getMaterialsForTasks } from "@/lib/subtype-config"
import { mockMaterials } from "@/lib/mock-data"
import { ticketService } from "@/services/api"

interface TicketResolveDialogProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolve: (resolution: ResolutionData) => void
}

export interface ResolutionData {
  ticketId: string
  tasksPerformed: string[]
  materialsUsed: MaterialUsed[]
  notes: string
  beforeImage: string
  afterImage: string
  additionalImages: string[]
}

interface SelectedMaterial {
  material: Material
  quantity: number
}

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-gray-500",
}

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

export function TicketResolveDialog({
  ticket,
  open,
  onOpenChange,
  onResolve,
}: TicketResolveDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([])
  const [notes, setNotes] = useState("")
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [currentMaterialId, setCurrentMaterialId] = useState<string>("")

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)
  const additionalInputRef = useRef<HTMLInputElement>(null)

  // Resetear formulario cuando cambia el ticket o se abre/cierra el dialog
  useEffect(() => {
    if (open) {
      setSelectedTasks([])
      setSelectedMaterials([])
      setNotes("")
      setBeforeImage(null)
      setAfterImage(null)
      setAdditionalImages([])
      setCurrentMaterialId("")
    }
  }, [open, ticket?.id])

  if (!ticket) return null

  const config = getSubtypeConfig(ticket.title)
  
  // Obtener materiales según las tareas seleccionadas
  const taskMaterialIds = getMaterialsForTasks(selectedTasks)
  const filteredMaterials = selectedTasks.length > 0 
    ? mockMaterials.filter((m) => taskMaterialIds.includes(m.id))
    : []
  
  // Materiales sugeridos del subtipo (mostrar solo si no hay tareas seleccionadas)
  const suggestedMaterials = selectedTasks.length === 0
    ? mockMaterials.filter((m) => config.suggestedMaterials.includes(m.id))
    : filteredMaterials
  
  const allMaterials = mockMaterials

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after" | "additional"
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === "before") {
          setBeforeImage(result)
        } else if (type === "after") {
          setAfterImage(result)
        } else {
          setAdditionalImages((prev) => [...prev, result])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTaskToggle = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    )
  }

  const getSelectedTaskPayload = () => {
    return selectedTasks
      .map((taskName) => {
        const taskItem = availableTasks.find((task) => {
          const value = typeof task === 'string' ? task : (task.id || task.name || task.texto)
          const label = typeof task === 'string' ? task : (task.name || task.texto)
          return value === taskName || label === taskName
        })

        if (typeof taskItem === 'string') {
          return { taskId: taskItem, taskName: taskItem }
        }

        return {
          taskId: taskItem?.id || taskItem?.name || taskItem?.texto || null,
          taskName: taskItem?.name || taskItem?.texto || taskName,
        }
      })
      .filter((task) => task.taskId || task.taskName)
  }

  const handleAddMaterial = () => {
    if (!currentMaterialId) return
    const material = allMaterials.find((m) => m.id === currentMaterialId)
    if (material && !selectedMaterials.find((sm) => sm.material.id === material.id)) {
      setSelectedMaterials((prev) => [...prev, { material, quantity: 1 }])
      setCurrentMaterialId("")
    }
  }

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.filter((sm) => sm.material.id !== materialId)
    )
  }

  const handleMaterialQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials((prev) =>
      prev.map((sm) =>
        sm.material.id === materialId ? { ...sm, quantity: Math.max(1, quantity) } : sm
      )
    )
  }

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit = beforeImage && afterImage && selectedTasks.length > 0

  const handleSubmit = async () => {
    if (!canSubmit || !ticket) return

    const tasksPayload = getSelectedTaskPayload()
    if (tasksPayload.length > 0) {
      try {
        await ticketService.registerClosingActivities(ticket.id, {
          taskIds: tasksPayload.map((task) => task.taskId),
          taskNames: tasksPayload.map((task) => task.taskName),
        })
      } catch (error) {
        console.error("Error registering ticket activities:", error)
      }
    }

    const resolution: ResolutionData = {
      ticketId: ticket.id,
      tasksPerformed: selectedTasks,
      materialsUsed: selectedMaterials.map((sm) => ({
        materialId: sm.material.id,
        materialCode: sm.material.code,
        materialName: sm.material.name,
        quantity: sm.quantity,
        unit: sm.material.unit,
      })),
      notes,
      beforeImage: beforeImage!,
      afterImage: afterImage!,
      additionalImages,
    }

    onResolve(resolution)
    
    // Reset form
    setSelectedTasks([])
    setSelectedMaterials([])
    setNotes("")
    setBeforeImage(null)
    setAfterImage(null)
    setAdditionalImages([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Resolver Ticket {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Ticket Info */}
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{ticket.title}</h3>
              <Badge variant="outline" className="mt-1">
                {ticket.category}
              </Badge>
            </div>
            <Badge className={`${priorityColors[ticket.priority]} text-white`}>
              {priorityLabels[ticket.priority]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <MapPin className="h-4 w-4" />
            {ticket.address}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="h-4 w-4" />
            {ticket.contact}
          </div>
        </Card>

        {/* Tareas Sugeridas */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tareas a Realizar
          </Label>
          <div className="grid gap-2">
            {config.suggestedTasks.map((task) => (
              <div
                key={task}
                className="flex items-center space-x-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                onClick={() => handleTaskToggle(task)}
              >
                <Checkbox
                  checked={selectedTasks.includes(task)}
                  onCheckedChange={(e) => e.stopPropagation?.()}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materiales */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiales Utilizados
          </Label>

          {/* Materiales según tareas seleccionadas */}
          {selectedTasks.length === 0 ? (
            <div className="p-3 bg-muted/50 rounded-md border">
              <p className="text-xs text-muted-foreground text-center">
                Selecciona las tareas a realizar para ver los materiales necesarios
              </p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Materiales necesarios para las tareas seleccionadas:
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredMaterials.map((material) => (
                  <Badge
                    key={material.id}
                    variant="outline"
                    className={`cursor-pointer border-blue-300 ${
                      selectedMaterials.find((sm) => sm.material.id === material.id)
                        ? "bg-blue-200"
                        : "hover:bg-blue-100"
                    }`}
                    onClick={() => {
                      if (!selectedMaterials.find((sm) => sm.material.id === material.id)) {
                        setSelectedMaterials((prev) => [...prev, { material, quantity: 1 }])
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {material.code} - {material.name}
                    <span className="ml-1 text-xs opacity-70">
                      (Stock: {material.quantity})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-green-700 text-center">
                Las tareas seleccionadas no requieren materiales
              </p>
            </div>
          )}

          {/* Selector de materiales */}
          <div className="flex gap-2">
            <Select value={currentMaterialId} onValueChange={setCurrentMaterialId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar material..." />
              </SelectTrigger>
              <SelectContent>
                {allMaterials.map((material) => (
                  <SelectItem
                    key={material.id}
                    value={material.id}
                    disabled={selectedMaterials.some((sm) => sm.material.id === material.id)}
                  >
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {material.code}
                    </span>
                    {material.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Stock: {material.quantity} {material.unit})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMaterial} disabled={!currentMaterialId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de materiales seleccionados */}
          {selectedMaterials.length > 0 && (
            <div className="space-y-2">
              {selectedMaterials.map((sm) => (
                <div
                  key={sm.material.id}
                  className="flex items-center gap-3 p-3 border rounded-md bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {sm.material.code}
                      </span>
                      <span className="font-medium text-sm">{sm.material.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Stock disponible: {sm.material.quantity} {sm.material.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Cantidad:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={sm.material.quantity}
                      value={sm.quantity}
                      onChange={(e) =>
                        handleMaterialQuantityChange(sm.material.id, parseInt(e.target.value) || 1)
                      }
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">{sm.material.unit}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveMaterial(sm.material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Imágenes */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Documentación Fotográfica
          </Label>

          <div className="grid grid-cols-2 gap-4">
            {/* Imagen Antes */}
            <div className="space-y-2">
              <Label className="text-sm">
                Foto ANTES <span className="text-red-500">*</span>
              </Label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={beforeInputRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, "before")}
              />
              {beforeImage ? (
                <div className="relative aspect-video rounded-md overflow-hidden border">
                  <img
                    src={beforeImage || "/placeholder.svg"}
                    alt="Antes"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setBeforeImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => beforeInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Tomar foto</span>
                </div>
              )}
            </div>

            {/* Imagen Después */}
            <div className="space-y-2">
              <Label className="text-sm">
                Foto DESPUÉS <span className="text-red-500">*</span>
              </Label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={afterInputRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, "after")}
              />
              {afterImage ? (
                <div className="relative aspect-video rounded-md overflow-hidden border">
                  <img
                    src={afterImage || "/placeholder.svg"}
                    alt="Después"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setAfterImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => afterInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Tomar foto</span>
                </div>
              )}
            </div>
          </div>

          {/* Fotos Adicionales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Fotos Adicionales (opcional)</Label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={additionalInputRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, "additional")}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => additionalInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Agregar foto
              </Button>
            </div>
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {additionalImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border"
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Adicional ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => handleRemoveAdditionalImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <Label>Observaciones</Label>
          <Textarea
            placeholder="Agregar notas o comentarios sobre el trabajo realizado..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalizar Tarea
          </Button>
        </div>

        {!canSubmit && (
          <p className="text-xs text-muted-foreground text-center">
            * Debes seleccionar al menos una tarea y cargar las fotos de antes y después para finalizar
          </p>
        )}
        <p className="text-xs text-blue-600 text-center">
          Al finalizar, el ticket quedará pendiente de cierre por el administrador
        </p>
      </DialogContent>
    </Dialog>
  )
}
