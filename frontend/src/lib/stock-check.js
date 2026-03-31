import { getSubtypeConfig } from "./subtype-config"
import { mockMaterials } from "./mock-data"

export 

export 

// Verificar stock para un ticket específico
export function checkTicketStock(
  ticket,
  materials: Material[] = mockMaterials
))
      }
    }
  }

  return {
    ticketId: ticket.id,
    hasStockIssue: issues.length > 0,
    issues,
  }
}

// Verificar stock para todos los tickets de una ruta
export function checkRouteStock(
  tickets,
  materials: Material[] = mockMaterials
)<string, TicketStockStatus> {
  const statusMap = new Map<string, TicketStockStatus>()

  // Crear copia de materiales para simular consumo acumulado
  const materialsCopy = materials.map((m) => ({ ...m }))

  for (const ticket of tickets) {
    const config = getSubtypeConfig(ticket.title)
    const issues= []

    for (const materialId of config.suggestedMaterials) {
      const material = materialsCopy.find((m) => m.id === materialId)
      if (material) {
        if (material.quantity < 1) {
          const originalMaterial = materials.find((m) => m.id === materialId)
          issues.push({
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            materialId: material.id,
            materialCode: material.code,
            materialName: material.name,
            required: 1,
            available: originalMaterial?.quantity || 0,
          })
        } else {
          // Descontar del stock simulado para los siguientes tickets
          material.quantity -= 1
        }
      }
    }

    statusMap.set(ticket.id, {
      ticketId: ticket.id,
      hasStockIssue: issues.length > 0,
      issues,
    })
  }

  return statusMap
}

// Obtener resumen de problemas de stock para una ruta
export function getRouteStockSummary(
  tickets,
  materials: Material[] = mockMaterials
): {
  totalIssues: number
  ticketsWithIssues: number
  allIssues: StockIssue[]
} {
  const stockStatus = checkRouteStock(tickets, materials)
  const allIssues= []
  let ticketsWithIssues = 0

  stockStatus.forEach((status) => {
    if (status.hasStockIssue) {
      ticketsWithIssues++
      allIssues.push(...status.issues)
    }
  })

  return {
    totalIssues: allIssues.length,
    ticketsWithIssues,
    allIssues,
  }
}
