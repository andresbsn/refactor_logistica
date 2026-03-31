import type { AssignedRoute, TicketResolution } from "@/types/ticket"

// Resoluciones de ejemplo - solo tickets que fueron resueltos por la cuadrilla
const resolution1: TicketResolution = {
  id: "res-1",
  ticketId: "235712",
  completedAt: new Date("2024-01-15T14:30:00"),
  notes: "Se reemplazó el poste dañado por uno nuevo. Se verificó la conexión eléctrica y se realizaron pruebas de iluminación.",
  images: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId: "m2", materialName: "Postes de hormigón 8m", quantity: 1, unit: "unidades" },
    { materialId: "m1", materialName: "Luminarias LED 50W", quantity: 1, unit: "unidades" },
    { materialId: "m3", materialName: "Cable eléctrico (rollo 100m)", quantity: 0.5, unit: "rollos" },
  ],
  tasksPerformed: [
    "Retiro del poste dañado",
    "Instalación de nuevo poste de hormigón",
    "Conexión de cables eléctricos",
    "Instalación de luminaria LED",
    "Pruebas de funcionamiento",
  ],
}

const resolution2: TicketResolution = {
  id: "res-2",
  ticketId: "235699",
  completedAt: new Date("2024-01-15T16:45:00"),
  notes: "Luminaria reemplazada. Se detectó también un problema en el cableado que fue reparado.",
  images: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId: "m1", materialName: "Luminarias LED 50W", quantity: 1, unit: "unidades" },
  ],
  tasksPerformed: [
    "Diagnóstico del problema",
    "Reemplazo de luminaria quemada",
    "Reparación de cableado defectuoso",
    "Pruebas de iluminación",
  ],
}

const resolution3: TicketResolution = {
  id: "res-3",
  ticketId: "235670",
  completedAt: new Date("2024-01-16T11:20:00"),
  notes: "Bache reparado con asfalto en frío. Se niveló correctamente con la calzada existente.",
  images: [
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId: "m4", materialName: "Asfalto en frío", quantity: 45, unit: "kg" },
  ],
  tasksPerformed: [
    "Limpieza del área afectada",
    "Aplicación de asfalto en frío",
    "Compactación del material",
    "Nivelación con la calzada",
  ],
}

// Estados de tickets:
// - open: abierto, asignado a cuadrilla pero sin resolver (sin resolución)
// - pending: cuadrilla finalizó la tarea, pendiente de cierre por admin (tiene resolución)
// - closed: admin cerró el ticket (tiene resolución)

export const mockAssignedRoutes: AssignedRoute[] = [
  {
    id: "ar-1",
    name: "Ruta Centro - Alumbrado",
    crewId: "c1",
    crewName: "Cuadrilla A - Zona Centro",
    assignedAt: new Date("2024-01-15T08:00:00"),
    status: "completed",
    tickets: [
      {
        id: "235712",
        ticketNumber: "#235712",
        title: "Poste caído/torcido",
        category: "Alumbrado",
        subcategory: "Postes",
        address: "NACION 156 Barrio CENTRO",
        contact: "23443345",
        latitude: -33.3317,
        longitude: -60.2264,
        status: "closed", // Cerrado por admin - tiene resolución
        priority: "high",
        agent: "alumbrado",
        createdAt: new Date("2024-01-10"),
        resolution: resolution1,
      },
      {
        id: "235699",
        ticketNumber: "#235699",
        title: "Luminaria quemada",
        category: "Alumbrado",
        subcategory: "Luminarias",
        address: "OLLEROS 364 Barrio 14 DE ABRIL",
        contact: "23445567",
        latitude: -33.3342,
        longitude: -60.2298,
        status: "closed", // Cerrado por admin - tiene resolución
        priority: "medium",
        agent: "alumbrado",
        createdAt: new Date("2024-01-11"),
        resolution: resolution2,
      },
    ],
  },
  {
    id: "ar-2",
    name: "Ruta Norte - Vialidad",
    crewId: "c2",
    crewName: "Cuadrilla B - Zona Norte",
    assignedAt: new Date("2024-01-16T07:30:00"),
    status: "partial",
    tickets: [
      {
        id: "235670",
        ticketNumber: "#235670",
        title: "Bache profundo",
        category: "Calles",
        subcategory: "Bacheo",
        address: "CORDOBA 890 Barrio ALBERDI",
        contact: "23445501",
        latitude: -33.3385,
        longitude: -60.2345,
        status: "pending", // Pendiente de cierre - cuadrilla lo resolvió, tiene resolución
        priority: "high",
        agent: "vialidad",
        createdAt: new Date("2024-01-08"),
        resolution: resolution3,
      },
      {
        id: "235680",
        ticketNumber: "#235680",
        title: "Vereda rota",
        category: "Calles",
        subcategory: "Veredas",
        address: "LA RIOJA 345 Barrio ALBERDI",
        contact: "23445511",
        latitude: -33.3378,
        longitude: -60.2335,
        status: "open", // En proceso - cuadrilla aún no lo resolvió, sin resolución
        priority: "medium",
        agent: "vialidad",
        createdAt: new Date("2024-01-17"),
        resolution: undefined,
      },
      {
        id: "235683",
        ticketNumber: "#235683",
        title: "Alcantarilla sin tapa",
        category: "Calles",
        subcategory: "Alcantarillas",
        address: "JUJUY 789 Barrio GENERAL PAZ",
        contact: "23445514",
        latitude: -33.3235,
        longitude: -60.2165,
        status: "open", // En proceso - cuadrilla aún no lo resolvió, sin resolución
        priority: "high",
        agent: "vialidad",
        createdAt: new Date("2024-01-19"),
        resolution: undefined,
      },
    ],
  },
  {
    id: "ar-3",
    name: "Ruta Emergencias - Prioridad Alta",
    crewId: "c1",
    crewName: "Cuadrilla A - Zona Centro",
    assignedAt: new Date("2024-01-17T09:00:00"),
    status: "active",
    tickets: [
      {
        id: "235675",
        ticketNumber: "#235675",
        title: "Fuga de gas reportada",
        category: "Gas",
        subcategory: "Fugas",
        address: "HUMBERTO PRIMO 234 Barrio SAN VICENTE",
        contact: "23445506",
        latitude: -33.3365,
        longitude: -60.2312,
        status: "open", // En proceso - sin resolución
        priority: "high",
        agent: "gas",
        createdAt: new Date("2024-01-15"),
        resolution: undefined,
      },
      {
        id: "235678",
        ticketNumber: "#235678",
        title: "Cloaca tapada",
        category: "Agua",
        subcategory: "Cloacas",
        address: "CASEROS 123 Barrio GUEMES",
        contact: "23445509",
        latitude: -33.3262,
        longitude: -60.2188,
        status: "open", // En proceso - sin resolución
        priority: "high",
        agent: "obras sanitarias",
        createdAt: new Date("2024-01-16"),
        resolution: undefined,
      },
    ],
  },
]
