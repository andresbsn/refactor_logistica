
// Resoluciones de ejemplo - solo tickets que fueron resueltos por la cuadrilla
const resolution1= {
  id,
  ticketId,
  completedAt: new Date("2024-01-15T14:30:00"),
  notes,
  images: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId, materialName, quantity: 1, unit: "unidades" },
    { materialId, materialName, quantity: 1, unit: "unidades" },
    { materialId, materialName, quantity: 0.5, unit: "rollos" },
  ],
  tasksPerformed: [
    "Retiro del poste dañado",
    "Instalación de nuevo poste de hormigón",
    "Conexión de cables eléctricos",
    "Instalación de luminaria LED",
    "Pruebas de funcionamiento",
  ],
}

const resolution2= {
  id,
  ticketId,
  completedAt: new Date("2024-01-15T16:45:00"),
  notes,
  images: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId, materialName, quantity: 1, unit: "unidades" },
  ],
  tasksPerformed: [
    "Diagnóstico del problema",
    "Reemplazo de luminaria quemada",
    "Reparación de cableado defectuoso",
    "Pruebas de iluminación",
  ],
}

const resolution3= {
  id,
  ticketId,
  completedAt: new Date("2024-01-16T11:20:00"),
  notes,
  images: [
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=400&h=300&fit=crop",
  ],
  materialsUsed: [
    { materialId, materialName, quantity: 45, unit: "kg" },
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

export const mockAssignedRoutes= [
  {
    id,
    name,
    crewId,
    crewName,
    assignedAt: new Date("2024-01-15T08:00:00"),
    status,
    tickets: [
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3317,
        longitude: -60.2264,
        status, // Cerrado por admin - tiene resolución
        priority,
        agent,
        createdAt: new Date("2024-01-10"),
        resolution: resolution1,
      },
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3342,
        longitude: -60.2298,
        status, // Cerrado por admin - tiene resolución
        priority,
        agent,
        createdAt: new Date("2024-01-11"),
        resolution: resolution2,
      },
    ],
  },
  {
    id,
    name,
    crewId,
    crewName,
    assignedAt: new Date("2024-01-16T07:30:00"),
    status,
    tickets: [
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3385,
        longitude: -60.2345,
        status, // Pendiente de cierre - cuadrilla lo resolvió, tiene resolución
        priority,
        agent,
        createdAt: new Date("2024-01-08"),
        resolution: resolution3,
      },
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3378,
        longitude: -60.2335,
        status, // En proceso - cuadrilla aún no lo resolvió, sin resolución
        priority,
        agent,
        createdAt: new Date("2024-01-17"),
        resolution: undefined,
      },
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3235,
        longitude: -60.2165,
        status, // En proceso - cuadrilla aún no lo resolvió, sin resolución
        priority,
        agent,
        createdAt: new Date("2024-01-19"),
        resolution: undefined,
      },
    ],
  },
  {
    id,
    name,
    crewId,
    crewName,
    assignedAt: new Date("2024-01-17T09:00:00"),
    status,
    tickets: [
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3365,
        longitude: -60.2312,
        status, // En proceso - sin resolución
        priority,
        agent,
        createdAt: new Date("2024-01-15"),
        resolution: undefined,
      },
      {
        id,
        ticketNumber,
        title,
        category,
        subcategory,
        address,
        contact,
        latitude: -33.3262,
        longitude: -60.2188,
        status, // En proceso - sin resolución
        priority,
        agent,
        createdAt: new Date("2024-01-16"),
        resolution: undefined,
      },
    ],
  },
]
