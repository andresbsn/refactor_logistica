
// Mapeo de tareas a materiales relacionados
export const taskMaterialsMap, string[]> = {
  // Alumbrado
  "Evaluación de daños estructurales": [],
  "Corte de energía eléctrica": [],
  "Retiro de poste dañado": [],
  "Instalación de nuevo poste": ["m2"], // Poste de hormigón
  "Reconexión de cables": ["m3"], // Cable eléctrico
  "Prueba de funcionamiento": [],
  "Retiro de luminaria dañada": [],
  "Instalación de nueva luminaria": ["m1"], // Luminaria LED
  "Prueba de encendido": [],
  "Aseguramiento del área": [],
  "Aislamiento y protección": ["m3"], // Cable eléctrico
  "Prueba de continuidad": [],
  "Evaluación de falla": [],
  "Reparación de sistema electrónico": ["m3"], // Cable eléctrico
  "Reemplazo de lámparas": ["m1"], // Luminaria LED
  "Prueba de secuencia": [],
  "Diagnóstico de falla": [],
  "Revisión de conexiones": [],
  "Reemplazo de balastro/driver": ["m1"], // Luminaria LED
  "Reparación de cableado": ["m3"], // Cable eléctrico
  "Instalación de protección": ["m3"], // Cable eléctrico
  "Prueba de seguridad": [],
  "Corte de energía": [],
  "Reemplazo de luminaria LED": ["m1"], // Luminaria LED
  "Relevamiento de puntos de luz": [],
  "Instalación de nuevas luminarias": ["m1", "m2"], // Luminaria + Poste
  "Tendido de cableado": ["m3"], // Cable eléctrico
  "Prueba general": [],
  
  // Calles
  "Limpieza del área afectada": [],
  "Preparación de base": ["m5"], // Cemento
  "Aplicación de asfalto": ["m4"], // Asfalto
  "Compactación": [],
  "Señalización temporal": ["m6"], // Señales
  "Demolición de sección dañada": [],
  "Colocación de encofrado": [],
  "Vaciado de cemento": ["m5"], // Cemento
  "Alisado y terminación": [],
  "Señalización de peligro": ["m6"], // Señales
  "Limpieza de marco": [],
  "Instalación de nueva tapa": ["m9"], // Tapas alcantarilla
  "Verificación de ajuste": [],
  
  // Agua
  "Corte de suministro": [],
  "Excavación y acceso": [],
  "Reparación de cañería": ["m7", "m8"], // Caños + Válvulas
  "Prueba de presión": [],
  "Relleno y terminación": [],
  "Destape con varilla": [],
  "Limpieza con hidrojet": [],
  "Inspección con cámara": [],
  "Reparación si es necesario": ["m7"], // Caños
  
  // Señalización
  "Retiro de cartel dañado": [],
  "Instalación de nuevo cartel": ["m6"], // Señales
  "Verificación de visibilidad": [],
  
  // Espacios Verdes
  "Señalización del área": [],
  "Corte y troceado": [],
  "Retiro de escombros": [],
  "Limpieza general": [],
  "Evaluación de daños": [],
  "Retiro de elementos peligrosos": [],
  "Reparación de estructura": ["m10", "m11"], // Materiales de plaza
  "Pintura y terminación": ["m11"], // Pintura
  "Poda de rama": [],
  "Limpieza": [],
  
  // Gas
  "Evacuación del área": [],
  "Detección de fuga": [],
  "Reparación": [],
  "Prueba de hermeticidad": [],
  
  // Residuos
  "Retiro de contenedor dañado": [],
  "Instalación de nuevo contenedor": ["m12"], // Contenedor
}

// Función para obtener materiales de las tareas seleccionadas
export function getMaterialsForTasks(tasks: string[]): string[] {
  const materialIds = new Set<string>()
  tasks.forEach((task) => {
    const materials = taskMaterialsMap[task] || []
    materials.forEach((id) => materialIds.add(id))
  })
  return Array.from(materialIds)
}

// Configuración de tareas y materiales sugeridos por tipo de ticket
export const subtypeConfigs, SubtypeConfig> = {
  // Alumbrado
  "Poste caído/torcido": {
    suggestedTasks: [
      "Evaluación de daños estructurales",
      "Corte de energía eléctrica",
      "Retiro de poste dañado",
      "Instalación de nuevo poste",
      "Reconexión de cables",
      "Prueba de funcionamiento",
    ],
    suggestedMaterials: ["m2", "m3", "m1"],
  },
  "Luminaria quemada": {
    suggestedTasks: [
      "Corte de energía eléctrica",
      "Retiro de luminaria dañada",
      "Instalación de nueva luminaria",
      "Prueba de encendido",
    ],
    suggestedMaterials: ["m1"],
  },
  "Cable suelto": {
    suggestedTasks: [
      "Corte de energía eléctrica",
      "Aseguramiento del área",
      "Reconexión de cable",
      "Aislamiento y protección",
      "Prueba de continuidad",
    ],
    suggestedMaterials: ["m3"],
  },
  "Semáforo averiado": {
    suggestedTasks: [
      "Evaluación de falla",
      "Reparación de sistema electrónico",
      "Reemplazo de lámparas",
      "Prueba de secuencia",
    ],
    suggestedMaterials: ["m1", "m3"],
  },
  "Luminaria intermitente": {
    suggestedTasks: [
      "Diagnóstico de falla",
      "Revisión de conexiones",
      "Reemplazo de balastro/driver",
      "Prueba de funcionamiento",
    ],
    suggestedMaterials: ["m1"],
  },
  "Poste con cables expuestos": {
    suggestedTasks: [
      "Corte de energía eléctrica",
      "Aseguramiento del área",
      "Reparación de cableado",
      "Instalación de protección",
      "Prueba de seguridad",
    ],
    suggestedMaterials: ["m3"],
  },
  "Luminaria fundida": {
    suggestedTasks: [
      "Corte de energía",
      "Reemplazo de luminaria LED",
      "Prueba de encendido",
    ],
    suggestedMaterials: ["m1"],
  },
  "Falta de iluminación en cuadra": {
    suggestedTasks: [
      "Relevamiento de puntos de luz",
      "Instalación de nuevas luminarias",
      "Tendido de cableado",
      "Prueba general",
    ],
    suggestedMaterials: ["m1", "m2", "m3"],
  },

  // Calles
  "Bache profundo": {
    suggestedTasks: [
      "Limpieza del área afectada",
      "Preparación de base",
      "Aplicación de asfalto",
      "Compactación",
      "Señalización temporal",
    ],
    suggestedMaterials: ["m4", "m5"],
  },
  "Vereda rota": {
    suggestedTasks: [
      "Demolición de sección dañada",
      "Preparación de base",
      "Colocación de encofrado",
      "Vaciado de cemento",
      "Alisado y terminación",
    ],
    suggestedMaterials: ["m5"],
  },
  "Alcantarilla sin tapa": {
    suggestedTasks: [
      "Señalización de peligro",
      "Limpieza de marco",
      "Instalación de nueva tapa",
      "Verificación de ajuste",
    ],
    suggestedMaterials: ["m9"],
  },

  // Agua
  "Pérdida de agua": {
    suggestedTasks: [
      "Corte de suministro",
      "Excavación y acceso",
      "Reparación de cañería",
      "Prueba de presión",
      "Relleno y terminación",
    ],
    suggestedMaterials: ["m7", "m8"],
  },
  "Cloaca tapada": {
    suggestedTasks: [
      "Destape con varilla",
      "Limpieza con hidrojet",
      "Inspección con cámara",
      "Reparación si es necesario",
    ],
    suggestedMaterials: ["m7"],
  },

  // Señalización
  "Cartel de tránsito caído": {
    suggestedTasks: [
      "Retiro de cartel dañado",
      "Preparación de base",
      "Instalación de nuevo cartel",
      "Verificación de visibilidad",
    ],
    suggestedMaterials: ["m6", "m5"],
  },

  // Espacios Verdes
  "Árbol caído": {
    suggestedTasks: [
      "Señalización del área",
      "Corte y troceado",
      "Retiro de escombros",
      "Limpieza general",
    ],
    suggestedMaterials: [],
  },
  "Plaza con juegos dañados": {
    suggestedTasks: [
      "Evaluación de daños",
      "Retiro de elementos peligrosos",
      "Reparación de estructura",
      "Pintura y terminación",
    ],
    suggestedMaterials: ["m10", "m11"],
  },
  "Rama colgante sobre calle": {
    suggestedTasks: [
      "Señalización del área",
      "Poda de rama",
      "Retiro de escombros",
      "Limpieza",
    ],
    suggestedMaterials: [],
  },

  // Gas
  "Fuga de gas reportada": {
    suggestedTasks: [
      "Evacuación del área",
      "Corte de suministro",
      "Detección de fuga",
      "Reparación",
      "Prueba de hermeticidad",
    ],
    suggestedMaterials: [],
  },

  // Residuos
  "Contenedor de basura dañado": {
    suggestedTasks: [
      "Retiro de contenedor dañado",
      "Limpieza del área",
      "Instalación de nuevo contenedor",
    ],
    suggestedMaterials: ["m12"],
  },
}

// Función para obtener configuración por título de ticket
export function getSubtypeConfig(ticketTitle: string)
}
