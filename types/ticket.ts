// Estados de ticket:
// - open: Abierto, disponible para asignar a rutas o asignado a cuadrilla sin resolver
// - pending: Pendiente de cierre, la cuadrilla resolvió pero falta que admin cierre
// - closed: Cerrado por el admin
export type TicketStatus = "open" | "pending" | "closed"

export interface Ticket {
  id: string
  ticketNumber?: string
  title: string
  category?: string
  subcategory?: string
  address: string
  contact: string
  contactoNombre?: string
  contactoTelefono?: string
  contactoCelular?: string
  latitude: number
  longitude: number
  status: TicketStatus
  priority: "high" | "medium" | "low"
  agent?: string
  createdAt?: Date
}

export interface Route {
  id: string
  name: string
  tickets: Ticket[]
  totalAccepted: number
}

export interface SuggestedRoute {
  id: string
  name: string
  type: "proximity" | "category" | "priority"
  tickets: Ticket[]
  score: number
  description: string
}

export interface Crew {
  id: string
  name: string
  available: boolean
  zone?: string
}

export interface Material {
  id: string
  code: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  location: string
}

export interface TicketResolution {
  id: string
  ticketId: string
  completedAt: Date
  notes: string
  beforeImage: string
  afterImage: string
  additionalImages: string[]
  materialsUsed: MaterialUsed[]
  tasksPerformed: string[]
}

export interface MaterialUsed {
  materialId: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
}

export interface AssignedRoute {
  id: string
  name: string
  crewId: string
  crewName: string
  tickets: AssignedTicket[]
  assignedAt: Date
  status: "active" | "completed" | "partial"
}

export interface AssignedTicket extends Ticket {
  resolution?: TicketResolution
}

export interface SubtypeConfig {
  suggestedTasks: string[]
  suggestedMaterials: string[] // Material IDs
}
