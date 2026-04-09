import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  X,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  ClipboardList,
  Wrench,
  Package,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User
} from "lucide-react"
import { Badge } from "../ui/badge"
import { catalogService, uploadService, routeService, ticketService } from "../../services/api"
import { externalService } from "../../services/external"
import { useAuth } from "../../lib/auth-context"
import { cn } from "../../lib/utils"

const FALLBACK_TASKS = [
  "Inspección de línea",
  "Cambio de fusible",
  "Reparación de acometida",
  "Poda preventiva",
]

const S3_BASE_URL = "https://staticcontent.sannicolasciudad.gob.ar/images";

export default function TicketResolveDialog({
  open,
  onOpenChange,
  ticket,
  onComplete,
}) {
  const { user } = useAuth()
  const [selectedTasks, setSelectedTasks] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [currentTask, setCurrentTask] = useState("")
  const [currentMaterialId, setCurrentMaterialId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([])
  const [beforeImageUrl, setBeforeImageUrl] = useState(null)
  const [afterImageUrl, setAfterImageUrl] = useState(null)
  const [additionalImagesUrl, setAdditionalImagesUrl] = useState([])
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState(false)
  const [extraImages, setExtraImages] = useState([null, null, null])
  const [extraImagesUrl, setExtraImagesUrl] = useState([null, null, null])
  const [uploadingExtras, setUploadingExtras] = useState(false)
  
  const [availableTasks, setAvailableTasks] = useState([])
  const [availableMaterials, setAvailableMaterials] = useState([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [loadingExistingBefore, setLoadingExistingBefore] = useState(false)

  useEffect(() => {
    if (!open) return

    setBeforeImage(null)
    setAfterImage(null)
    setBeforeImageUrl(null)
    setAfterImageUrl(null)
    setSelectedTasks([])
    setSelectedMaterials([])
    setNotes("")
    setAdditionalImages([])
    setAdditionalImagesUrl([])
    setExtraImages([null, null, null])
    setExtraImagesUrl([null, null, null])

    const loadExistingBeforeImage = async () => {
      const routeId = ticket.routeId || ticket.route_id;
      const ticketId = ticket.id;
      console.log("=== loadExistingBeforeImage START ===");
      console.log("routeId:", routeId, "ticketId:", ticketId);
      
      if (!ticketId) {
        console.log("Missing ticketId, skipping");
        return;
      }
      
      try {
        setLoadingExistingBefore(true);
        
        let shouldLoadImage = false;
        
        if (routeId) {
          const status = await routeService.getTicketStatus(routeId, ticketId);
          console.log("getTicketStatus response:", JSON.stringify(status));
          shouldLoadImage = status && status.inprocess === true;
        } else {
          console.log("No routeId, checking S3 directly");
          shouldLoadImage = true;
        }
        
        if (shouldLoadImage) {
          const prefix = `reclamos/test/${ticketId}/`;
          console.log("Checking S3 for prefix:", prefix);
          
          const result = await uploadService.checkImageExists(prefix);
          console.log("S3 check result:", JSON.stringify(result));
          
          if (result.exists) {
            setBeforeImage(result.url);
            setBeforeImageUrl(result.url);
            console.log("Set beforeImage to:", result.url);
          } else {
            console.log("No image found in S3 for prefix:", prefix);
          }
        }
      } catch (err) {
        console.error("Error checking existing image:", err);
      } finally {
        setLoadingExistingBefore(false);
        console.log("=== loadExistingBeforeImage END ===");
      }
    }

    const fetchCatalogs = async () => {
      setLoadingCatalogs(true)
      try {
        const [tasksData, materialsData] = await Promise.all([
          catalogService.getTasks().catch((err) => {
            console.error("Error fetching tasks:", err);
            return { tasks: [] };
          }),
          catalogService.getMaterials().catch((err) => {
            console.error("Error fetching materials:", err);
            return { materials: [] };
          })
        ])
        
        const tasks = Array.isArray(tasksData.tasks) ? tasksData.tasks : (Array.isArray(tasksData) ? tasksData : []);
        const materials = Array.isArray(materialsData.materials) ? materialsData.materials : (Array.isArray(materialsData) ? materialsData : []);
        
        setAvailableTasks(tasks)
        setAvailableMaterials(materials)

      } catch (error) {
        console.error("Error fetching catalogs:", error)
        setAvailableTasks(FALLBACK_TASKS)
      } finally {
        setLoadingCatalogs(false)
      }
    }

    loadExistingBeforeImage()
    fetchCatalogs()
  }, [open])

  const handleAddTask = () => {
    if (!currentTask) return
    
    // Find the task name from the selected ID (currentTask holds ID if it's an object, or name if it's a string)
    const taskObj = availableTasks.find(t => 
      (typeof t === 'string' ? t : (t.id || t.name || t.texto)) === currentTask
    );
    
    const taskName = typeof taskObj === 'string' ? taskObj : (taskObj?.name || taskObj?.texto);
    
    if (taskName && !selectedTasks.includes(taskName)) {
      setSelectedTasks((prev) => [...prev, taskName])
      setCurrentTask("")
    }
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


  const handleRemoveTask = (task) => {
    setSelectedTasks((prev) => prev.filter((t) => t !== task))
  }

  const handleAddMaterial = () => {
    if (!currentMaterialId) return
    const material = availableMaterials.find((m) => m.id === currentMaterialId)
    if (material && !selectedMaterials.find((sm) => sm.material.id === material.id)) {
      setSelectedMaterials((prev) => [...prev, { material, quantity }])
      setCurrentMaterialId("")
      setQuantity(1)
    }
  }

  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials((prev) =>
      prev.filter((sm) => sm.material.id !== materialId)
    )
  }

  const handleImageUpload = async (e, type, extraIndex = null) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === "before") {
      const reader = new FileReader()
      reader.onloadend = () => setBeforeImage(reader.result)
      reader.readAsDataURL(file)
      
      try {
        setUploadingBefore(true)
        const ext = file.name.split('.').pop() || 'jpg';
        const result = await uploadService.uploadImage(file, `reclamos/test/${ticket.id}/antes.${ext}`)
        const resUrl = result.url;
        setBeforeImageUrl(resUrl)
        
        if (ticket.routeId || ticket.route_id) {
          const rId = ticket.routeId || ticket.route_id;
          try {
            await Promise.all([
              routeService.logEvent(rId, ticket.id, 2),
              routeService.updateTicketStatus(rId, ticket.id, { inprocess: true })
            ])
          } catch (err) {
            console.error("Error logging before event:", err);
          }
        }
      } catch (error) {
        console.error("Error uploading before image:", error)
        setBeforeImage(null)
        setBeforeImageUrl(null)
      } finally {
        setUploadingBefore(false)
      }
    } else if (type === "after") {
      const reader = new FileReader()
      reader.onloadend = () => setAfterImage(reader.result)
      reader.readAsDataURL(file)
      setAfterImageUrl(file.name)
    } else if (type === "extra" && extraIndex !== null) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setExtraImages(prev => {
          const newImages = [...prev]
          newImages[extraIndex] = reader.result
          return newImages
        })
      }
      reader.readAsDataURL(file)
      setExtraImagesUrl(prev => {
        const newUrls = [...prev]
        newUrls[extraIndex] = file.name
        return newUrls
      })
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAdditionalImages(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
      
      try {
        setUploadingAdditional(true)
        const result = await uploadService.uploadImage(file, null)
        setAdditionalImagesUrl(prev => [...prev, result.url])
      } catch (error) {
        console.error("Error uploading additional image:", error)
      } finally {
        setUploadingAdditional(false)
      }
    }
  }

  const handleSubmit = async () => {
    if (selectedTasks.length === 0 || !beforeImageUrl || !afterImage) return

    try {
      setUploadingAfter(true)
      setUploadingExtras(true)

      const tasksPayload = getSelectedTaskPayload()
      if (tasksPayload.length > 0) {
        await ticketService.registerClosingActivities(ticket.id, {
          taskIds: tasksPayload.map((task) => task.taskId),
          taskNames: tasksPayload.map((task) => task.taskName),
        })
      }

      const afterFile = await fetch(afterImage).then(r => r.blob())
      const afterExt = afterFile.type.split('/').pop() || 'jpg'
      const afterResult = await uploadService.uploadImage(afterFile, `reclamos/test/${ticket.id}/despues.${afterExt}`)
      const finalAfterUrl = afterResult.url

      const uploadedExtras = []
      for (let i = 0; i < 3; i++) {
        if (extraImages[i]) {
          const extraFile = await fetch(extraImages[i]).then(r => r.blob())
          const extraExt = extraFile.type.split('/').pop() || 'jpg'
          const extraResult = await uploadService.uploadImage(extraFile, `reclamos/test/${ticket.id}/extra-${i + 1}.${extraExt}`)
          uploadedExtras.push(extraResult.url)
        } else {
          uploadedExtras.push(null)
        }
      }

      setAfterImageUrl(finalAfterUrl)
      setExtraImagesUrl(uploadedExtras)

      if (ticket.routeId || ticket.route_id) {
        const rId = ticket.routeId || ticket.route_id;
        await routeService.logEvent(rId, ticket.id, 3).catch(err => console.error("Error logging after event:", err));
      }

      await externalService.sendTicketNote({
        nro_ticket: ticket.id,
        nota: '[ANTES DE TRABAJO]',
        foto: beforeImageUrl,
        idusuario: user?.id || 0
      });

      await externalService.sendTicketNote({
        nro_ticket: ticket.id,
        nota: `[TRABAJO TERMINADO] Tareas: ${selectedTasks.join(", ")}. Materiales: ${selectedMaterials.map(sm => `${sm.material.name || sm.material.texto} (x${sm.quantity})`).join(", ")}.`,
        foto: finalAfterUrl,
        idusuario: user?.id || 0
      });

      if (ticket.routeId || ticket.route_id) {
        const rId = ticket.routeId || ticket.route_id;
        await routeService.updateTicketStatus(rId, ticket.id, { 
          is_closed: true, 
          inprocess: false 
        }).catch(err => console.error("Error closing ticket status:", err));
      }

      onComplete({
        ticketId: ticket.id,
        tasksPerformed: selectedTasks,
        materialsUsed: selectedMaterials.map((sm) => ({
          materialId: sm.material.id,
          materialCode: sm.material.code || sm.material.codigo || '',
          materialName: sm.material.name || sm.material.texto || '',
          quantity: sm.quantity,
          unit: sm.material.unit || sm.material.unidad || 'u',
        })),
        notes,
        beforeImage: beforeImageUrl,
        afterImage: finalAfterUrl,
        additionalImages: additionalImagesUrl,
        extraImages: uploadedExtras,
      })
    } catch (err) {
      console.error("Error uploading after/extra images:", err)
    } finally {
      setUploadingAfter(false)
      setUploadingExtras(false)
    }
  }

  if (!ticket) return null

  const isComplete = selectedTasks.length > 0 && beforeImageUrl && afterImage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none bg-white rounded-2xl shadow-2xl">
        <div className="relative flex flex-col max-h-[90vh] w-full min-h-0">
          {/* Main Header with Detail */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-none bg-white z-50">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-custom-blue/10 text-custom-blue border-0 font-bold px-2 py-0.5 uppercase tracking-wider text-[10px] rounded-md">
                    {ticket.tipo}
                  </Badge>
                  <span className="text-[12px] font-bold text-slate-400">#{ticket.id}</span>
                </div>
                <h2 className="text-md font-black-60 text-slate-800 leading-tight tracking-tight p-1 mt-2">
                  {ticket.asunto}
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="rounded-full hover:bg-slate-100 h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            </div>

            {/* Ticket Quick Details */}
            <div className="grid  gap-3">
              <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin className="h-4 w-4 text-custom-blue shrink-0 mt-0.5" />
                <div>
                  <p >Ubicación</p>
                  <p className="text-xs font-bold text-slate-600 leading-snug truncate">{ticket.dire_completa}</p>
                </div>
              </div>
            </div>
            
            {ticket.descripcion && (
              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Descripción</p>
                <p className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">{ticket.descripcion}</p>
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
            
            {/* Imágenes Grid */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-custom-blue uppercase tracking-tight flex items-center gap-2 px-1">
                <div className="w-1 h-1 rounded-full bg-custom-blue" />
                Registro Fotográfico <span className="text-red-400 ml-1 font-bold">*</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Image Before */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Antes</p>
                  <label className={cn(
                    "relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer group",
                    beforeImage 
                      ? "border-emerald-200 bg-emerald-50/10" 
                      : "border-slate-200 bg-slate-50 hover:border-custom-blue/50 hover:bg-white"
                  )}>
                    {loadingExistingBefore ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="h-6 w-6 border-2 border-custom-blue border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
                      </div>
                    ) : uploadingBefore ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="h-6 w-6 border-2 border-custom-blue border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subiendo...</span>
                      </div>
                    ) : beforeImage ? (
                      <>
                        <img src={beforeImage} alt="Antes" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-9 w-9 rounded-full"
                            onClick={(e) => {
                              e.preventDefault()
                              setBeforeImage(null)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-slate-300 mb-1 group-hover:text-custom-blue/50 transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subir Foto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "before")} />
                      </>
                    )}
                  </label>
                </div>

                {/* Image After */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Después</p>
                  <label className={cn(
                    "relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer group",
                    afterImage 
                      ? "border-emerald-200 bg-emerald-50/10" 
                      : "border-slate-200 bg-slate-50 hover:border-custom-blue/50 hover:bg-white"
                  )}>
                    {uploadingAfter ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="h-6 w-6 border-2 border-custom-blue border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subiendo...</span>
                      </div>
                    ) : afterImage ? (
                      <>
                        <img src={afterImage} alt="Después" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-9 w-9 rounded-full"
                            onClick={(e) => {
                              e.preventDefault()
                              setAfterImage(null)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-slate-300 mb-1 group-hover:text-custom-blue/50 transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subir Foto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "after")} />
                      </>
                    )}
                  </label>
                </div>
              </div>
                            <Button
                type="button"
                variant="outline"
                className="w-full mt-3 h-10 rounded-xl border-dashed border-2 border-slate-200 text-white hover:border-custom-blue hover:text-custom-blue font-bold text-xs gap-2"
                onClick={() => document.getElementById('extra-image-input-0').click()}
              >
                <ImageIcon className="h-4 w-4" />
                Subir más imágenes (3 extras)
              </Button>

              {[0, 1, 2].map((idx) => (
                <input
                  key={idx}
                  id={`extra-image-input-${idx}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "extra", idx)}
                />
              ))}

              {extraImages.some(img => img) && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {extraImages.map((img, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Extra {idx + 1}</p>
                      <label className={cn(
                        "relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer group",
                        img ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 bg-slate-50"
                      )}>
                        {img ? (
                          <>
                            <img src={img} alt={`Extra ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-9 w-9 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault()
                                  const newImages = [...extraImages]
                                  newImages[idx] = null
                                  setExtraImages(newImages)
                                  const newUrls = [...extraImagesUrl]
                                  newUrls[idx] = null
                                  setExtraImagesUrl(newUrls)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 text-slate-300" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Imagen</span>
                          </>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Tareas Realizadas Section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-custom-blue uppercase tracking-tight flex items-center gap-2 px-1">
                <div className="w-1 h-1 rounded-full bg-custom-blue" />
                Tareas Realizadas <span className="text-red-400 ml-1 font-bold">*</span>
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={currentTask} onValueChange={setCurrentTask}>
                      <SelectTrigger className="min-h-9 h-auto py-2 bg-slate-50 border-slate-200 rounded-lg font-bold text-slate-600 text-xs text-left px-3">
                        <SelectValue placeholder={loadingCatalogs ? "Cargando..." : "Seleccionar tarea"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {availableTasks.map((taskItem) => {
                          const taskName = typeof taskItem === 'string' ? taskItem : (taskItem.name || taskItem.texto);
                          const taskId = typeof taskItem === 'string' ? taskItem : (taskItem.id || taskItem.name);
                          const isSelected = selectedTasks.includes(taskName);
                          
                          return (
                            <SelectItem 
                              key={taskId} 
                              value={taskId} 
                              disabled={isSelected}
                              className="font-bold py-2 text-xs"
                            >
                              {taskName} {isSelected && "(Agregada)"}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>

                    </Select>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddTask} 
                    className="h-9 w-9 rounded-lg bg-custom-blue hover:bg-custom-blue/90 shrink-0"
                    disabled={!currentTask || selectedTasks.includes(currentTask)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedTasks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedTasks.map((task) => (
                      <Badge 
                        key={task}
                        className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors font-bold px-2 py-1 gap-1.5 rounded-lg text-[10px] whitespace-normal text-left break-words max-w-full inline-flex"
                      >
                        <CheckCircle2 className="h-3 w-3 text-custom-blue" />
                        {task}
                        <button 
                          onClick={() => handleRemoveTask(task)}
                          className="hover:text-red-500 transition-colors ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Materiales Section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-custom-blue uppercase tracking-tight flex items-center gap-2 px-1">
                <div className="w-1 h-1 rounded-full bg-custom-blue" />
                Materiales Utilizados
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={currentMaterialId} onValueChange={setCurrentMaterialId}>
                      <SelectTrigger className="min-h-9 h-auto py-2 bg-slate-50 border-slate-200 rounded-lg font-bold text-slate-600 text-xs">
                        <SelectValue placeholder={loadingCatalogs ? "Cargando..." : "Seleccionar material"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200">
                        {availableMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="font-bold py-2 text-xs">
                            {m.name || m.texto} ({m.quantity || 0} {m.unit || 'u'} disp.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="h-9 bg-slate-50 border-slate-200 rounded-lg font-bold text-center text-slate-600 text-xs"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddMaterial} 
                    className="h-9 w-9 rounded-lg bg-custom-blue hover:bg-custom-blue/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedMaterials.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {selectedMaterials.map((sm) => (
                      <div 
                        key={sm.material.id} 
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-xs font-bold text-slate-700 break-words leading-tight">{sm.material.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sm.material.code}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-custom-blue/10 text-custom-blue border-0 font-bold px-2 py-0.5 rounded text-[10px]">
                            {sm.quantity} {sm.material.unit}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-white rounded-md shrink-0"
                            onClick={() => handleRemoveMaterial(sm.material.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>



            {/* Notas */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-custom-blue uppercase tracking-tight flex items-center gap-2 px-1">
                <div className="w-1 h-1 rounded-full bg-custom-blue" />
                Notas del Operador
              </h4>
              <Textarea
                placeholder="Describa brevemente los trabajos realizados..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px] bg-slate-50 border-slate-200 rounded-xl p-3 font-bold text-slate-600 text-[11px] placeholder:text-slate-400 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex-none bg-white">
            <Button 
              className={cn(
                "w-full h-12 rounded-xl font-black text-sm shadow-lg transition-all gap-2 hover:translate-y--0.5",
                isComplete 
                  ? "bg-custom-blue hover:bg-custom-blue/90 text-white shadow-custom-blue/20" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border-none"
              )}
              onClick={handleSubmit}
              disabled={!isComplete}
            >
              <CheckCircle2 className="h-5 w-5" />
              FINALIZAR REPARACIÓN
            </Button>
            {!isComplete && (
              <p className="text-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                Complete tareas y fotos para finalizar
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
