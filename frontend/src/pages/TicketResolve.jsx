import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRoutes } from "../lib/routes-context"
import { useToast } from "../hooks/use-toast"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  X,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  ClipboardList,
  Wrench,
  Package,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Badge } from "../components/ui/badge"
import { catalogService, uploadService, routeService } from "../services/api"
import { externalService } from "../services/external"
import { useAuth } from "../lib/auth-context"
import { cn } from "../lib/utils"


const FALLBACK_TASKS = [
  "Inspección de línea",
  "Cambio de fusible",
  "Reparación de acometida",
  "Poda preventiva",
]


export default function TicketResolve() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTicketById, saveTicketResolution } = useRoutes()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const ticket = getTicketById(id)

  const [selectedTasks, setSelectedTasks] = useState([])
  const [currentTaskId, setCurrentTaskId] = useState("")
  const [taskQuantity, setTaskQuantity] = useState(1)
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [currentMaterialId, setCurrentMaterialId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([])
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState(false)

  const [availableTasks, setAvailableTasks] = useState([])
  const [availableMaterials, setAvailableMaterials] = useState([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)

  useEffect(() => {
    const fetchCatalogs = async () => {
      setLoadingCatalogs(true)
      try {
        const [tasksData, materialsData] = await Promise.all([
          catalogService.getTasks().catch((err) => {
            console.error("Error fetching tasks:", err);
            return { tasks: FALLBACK_TASKS };
          }),
          catalogService.getMaterials().catch((err) => {
            console.error("Error fetching materials:", err);
            return { materials: [] };
          })
        ])
        
        // Robust check for array in both possible formats
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

    fetchCatalogs()
  }, [])


  const handleAddTask = () => {
    if (!currentTaskId) return
    
    // Find the task name from the selected ID (currentTaskId holds ID if it's an object, or name if it's a string)
    const taskObj = availableTasks.find(t => 
      (typeof t === 'string' ? t : (t.id || t.name || t.texto)) === currentTaskId
    );
    
    const taskName = typeof taskObj === 'string' ? taskObj : (taskObj?.name || taskObj?.texto);
    
    if (taskName && !selectedTasks.find(st => st.task === taskName)) {
      setSelectedTasks(prev => [...prev, { task: taskName, quantity: taskQuantity }])
      setCurrentTaskId("")
      setTaskQuantity(1)
    }
  }



  const handleRemoveTask = (taskName) => {
    setSelectedTasks(prev => prev.filter(st => st.task !== taskName))
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

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately for better UX
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === "before") setBeforeImage(reader.result)
      else if (type === "after") setAfterImage(reader.result)
    }
    if (type !== "additional") {
      reader.readAsDataURL(file)
    }

    // Start upload to S3
    try {
      if (type === "before") setUploadingBefore(true)
      else if (type === "after") setUploadingAfter(true)
      else setUploadingAdditional(true)

      const result = await uploadService.uploadImage(file)
      
      const resUrl = result.url;

      if (type === "before") {
        setBeforeImage(resUrl)
        // Registrar evento 2 y poner en proceso
        if (ticket.routeId || ticket.route_id) {
          const rId = ticket.routeId || ticket.route_id;
          await Promise.all([
            routeService.logEvent(rId, ticket.id, 2),
            routeService.updateTicketStatus(rId, ticket.id, { inprocess: true }),
            // External notification after photo
            externalService.sendTicketNote({
              nro_ticket: ticket.id,
              nota: '[ANTES DE TRABAJO]',
              foto: resUrl,
              idusuario: user?.id || 0
            })
          ]).catch(err => console.error("Error logging or notifying before event:", err));
        }
      } else if (type === "after") {
        setAfterImage(resUrl)
        // Registrar evento 3
        if (ticket.routeId || ticket.route_id) {
          const rId = ticket.routeId || ticket.route_id;
          await routeService.logEvent(rId, ticket.id, 3)
            .catch(err => console.error("Error logging after event:", err));
        }
      } else {
        setAdditionalImages((prev) => [...prev, resUrl])
      }

      toast({
        title: "Imagen subida",
        description: "La imagen se guardó correctamente en el servidor.",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error al subir imagen",
        description: "No se pudo guardar la imagen en el servidor. Intente nuevamente.",
        variant: "destructive",
      })
      // Clear preview on failure
      if (type === "before") setBeforeImage(null)
      else if (type === "after") setAfterImage(null)
    } finally {
      if (type === "before") setUploadingBefore(false)
      else if (type === "after") setUploadingAfter(false)
      else setUploadingAdditional(false)
    }
  }

  const handleSubmit = async () => {
    if (selectedTasks.length === 0 || !beforeImage || !afterImage) return
    const routeId = ticket.routeId || ticket.route_id

    // Marcar como cerrado en log_route_ticket
    if (routeId) {
      const rId = routeId;
      await routeService.updateTicketStatus(rId, ticket.id, { 
        is_closed: true, 
        inprocess: false 
      }).catch(err => console.error("Error closing ticket status:", err));
    }

    // External notification for completion
    try {
      const tareasText = selectedTasks
        .map(st => `${st.task} (x${st.quantity})`)
        .join(", ");
      const materialesText = selectedMaterials
        .map(sm => `${sm.material.name || sm.material.texto} (x${sm.quantity})`)
        .join(", ");
      
      const fullNote = `[TRABAJO TERMINADO] Tareas: ${tareasText}. Materiales: ${materialesText}.`;
      
      await externalService.sendTicketNote({
        nro_ticket: ticket.id,
        nota: fullNote,
        foto: afterImage,
        idusuario: user?.id || 0
      });
    } catch (err) {
      console.error("Error sending final external notification:", err);
    }

    saveTicketResolution(routeId, ticket.id, {
      tasksPerformed: selectedTasks.map(st => `${st.task} (x${st.quantity})`),
      materialsUsed: selectedMaterials.map((sm) => ({
        materialId: sm.material.id,
        materialCode: sm.material.code,
        materialName: sm.material.name,
        quantity: sm.quantity,
        unit: sm.material.unit,
      })),
      notes,
      beforeImage,
      afterImage,
      additionalImages,
      completedAt: new Date(),
    })

    toast({
      title: "Ticket resuelto",
      description: `El ticket ${ticket.ticketNumber || `#${ticket.id}`} fue resuelto. Pendiente de cierre.`,
    })

    navigate("/")
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Ticket no encontrado</h2>
        <Button variant="link" onClick={() => navigate("/")} className="mt-2 text-primary font-bold">
          Volver al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="glass border-b border-white/20 sticky top-0 z-50 px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="rounded-full hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Button>
        <div>
          <h1 className="font-extrabold text-slate-900 leading-tight tracking-tight">Resolver Ticket</h1>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest">{ticket.ticketNumber || `#${ticket.id}`}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-8 pb-12">
        {/* Tareas Realizadas */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Tareas Realizadas *</h3>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex flex-col gap-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Tarea</Label>
              <Select value={currentTaskId} onValueChange={setCurrentTaskId} disabled={loadingCatalogs}>
                <SelectTrigger className="rounded-xl min-h-12 h-auto py-2">
                  <SelectValue placeholder={loadingCatalogs ? "Cargando tareas..." : "Seleccionar tarea..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((taskItem) => {
                    const taskName = typeof taskItem === 'string' ? taskItem : (taskItem.name || taskItem.texto);
                    const taskId = typeof taskItem === 'string' ? taskItem : (taskItem.id || taskItem.name);
                    const isSelected = selectedTasks.some(st => st.task === taskName);
                    
                    return (
                      <SelectItem 
                        key={taskId} 
                        value={taskId}
                        disabled={isSelected}
                      >
                        {taskName} {isSelected && "(Agregada)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>


              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad / Horas</Label>
                <Input
                  type="number"
                  min="1"
                  className="rounded-xl h-12"
                  value={taskQuantity}
                  onChange={(e) => setTaskQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddTask} 
                  className="h-12 w-12 rounded-xl bg-slate-900 hover:bg-slate-800" 
                  size="icon"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {selectedTasks.length > 0 && (
              <div className="pt-2 space-y-2">
                {selectedTasks.map((st) => (
                  <div key={st.task} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col min-w-0 flex-1 mr-3">
                      <span className="text-sm font-bold text-slate-900 break-words leading-tight">{st.task}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Cantidad: {st.quantity}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                      onClick={() => handleRemoveTask(st.task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Materiales Utilizados */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Materiales Utilizados</h3>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex flex-col gap-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Material</Label>
              <Select value={currentMaterialId} onValueChange={setCurrentMaterialId} disabled={loadingCatalogs}>
                <SelectTrigger className="rounded-xl min-h-12 h-auto py-2">
                  <SelectValue placeholder={loadingCatalogs ? "Cargando materiales..." : "Buscar material..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableMaterials.map((m) => {
                    const isSelected = selectedMaterials.some(sm => sm.material.id === m.id);
                    return (
                      <SelectItem 
                        key={m.id} 
                        value={m.id}
                        disabled={isSelected}
                      >
                        {m.name || m.texto} ({m.quantity || 0} {m.unit || 'u'} disp.) {isSelected && "(Agregado)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>

              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  className="rounded-xl h-12"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddMaterial} 
                  className="h-12 w-12 rounded-xl bg-slate-900 hover:bg-slate-800" 
                  size="icon"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {selectedMaterials.length > 0 && (
              <div className="pt-2 space-y-2">
                {selectedMaterials.map((sm) => (
                  <div key={sm.material.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col min-w-0 flex-1 mr-3">
                      <span className="text-sm font-bold text-slate-900 break-words leading-tight">{sm.material.name}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Cantidad: {sm.quantity} {sm.material.unit}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                      onClick={() => handleRemoveMaterial(sm.material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Imágenes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Registro Fotográfico *</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Antes</Label>
              <div
                className={cn(
                  "relative aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                  beforeImage ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 bg-white hover:border-primary/50"
                )}
              >
                {uploadingBefore ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subiendo...</span>
                  </div>
                ) : beforeImage ? (
                  <>
                    <img src={beforeImage} alt="Antes" className="absolute inset-0 w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={() => setBeforeImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer p-6 flex flex-col items-center justify-center text-center w-full h-full">
                    <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "before")} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Después</Label>
              <div
                className={cn(
                  "relative aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                  afterImage ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 bg-white hover:border-primary/50"
                )}
              >
                {uploadingAfter ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subiendo...</span>
                  </div>
                ) : afterImage ? (
                  <>
                    <img src={afterImage} alt="Después" className="absolute inset-0 w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={() => setAfterImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer p-6 flex flex-col items-center justify-center text-center w-full h-full">
                    <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "after")} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Notas */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Notas Adicionales</h3>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100">
            <Textarea
              placeholder="Describa los trabajos técnicos realizados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] rounded-2xl border-none focus-visible:ring-0 p-0 text-sm font-medium resize-none"
            />
          </div>
        </section>

        <div className="pt-4 flex flex-col gap-3">
          <Button
            size="lg"
            className="h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
            onClick={handleSubmit}
            disabled={selectedTasks.length === 0 || !beforeImage || !afterImage}
          >
            <CheckCircle2 className="h-6 w-6 mr-2" />
            COMPLETAR RESOLUCIÓN
          </Button>
          <Button
            variant="ghost"
            className="h-12 rounded-2xl text-slate-400 font-bold"
            onClick={() => navigate(-1)}
          >
            CANCELAR
          </Button>
        </div>
      </main>
    </div>
  )
}
