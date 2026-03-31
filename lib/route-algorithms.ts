import type { Ticket, SuggestedRoute } from "@/types/ticket"

export interface RouteConfig {
  maxTicketsPerRoute: number
  proximityRadius: number
  minTicketsForRoute: number
  groupProximityByCategory: boolean
  proximityWeight?: number // 0-100 porcentaje de peso para cercanía
  priorityWeight?: number // 0-100 porcentaje de peso para prioridad
}

const defaultConfig: RouteConfig = {
  maxTicketsPerRoute: 8,
  proximityRadius: 2,
  minTicketsForRoute: 2,
  groupProximityByCategory: true,
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function generateProximityRoutes(tickets: Ticket[], config: RouteConfig = defaultConfig): SuggestedRoute[] {
  const pendingTickets = tickets.filter((t) => t.status === "open")
  if (pendingTickets.length === 0) return []

  const routes: SuggestedRoute[] = []
  const used = new Set<string>()
  let routeId = 1

  // Ordenar por fecha de creacion (mas antiguos primero)
  const sortedTickets = [...pendingTickets].sort((a, b) => {
    const dateA = a.createdAt?.getTime() || 0
    const dateB = b.createdAt?.getTime() || 0
    return dateA - dateB
  })

  // Si agrupamos por categoria, primero separar por categoria
  if (config.groupProximityByCategory) {
    const categoriesMap = new Map<string, Ticket[]>()
    
    for (const ticket of sortedTickets) {
      const category = ticket.category || "Sin categoria"
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, [])
      }
      categoriesMap.get(category)!.push(ticket)
    }

    // Para cada categoria, generar rutas por cercania
    categoriesMap.forEach((categoryTickets, category) => {
      const categoryUsed = new Set<string>()
      
      for (const ticket of categoryTickets) {
        if (categoryUsed.has(ticket.id)) continue

        const nearbyTickets: Ticket[] = [ticket]
        categoryUsed.add(ticket.id)
        used.add(ticket.id)

        // Buscar tickets cercanos de la misma categoria
        for (const other of categoryTickets) {
          if (categoryUsed.has(other.id)) continue
          if (nearbyTickets.length >= config.maxTicketsPerRoute) break

          const distance = calculateDistance(ticket.latitude, ticket.longitude, other.latitude, other.longitude)
          if (distance <= config.proximityRadius) {
            nearbyTickets.push(other)
            categoryUsed.add(other.id)
            used.add(other.id)
          }
        }

        // Solo crear ruta si tiene el minimo de tickets
        if (nearbyTickets.length >= config.minTicketsForRoute) {
          routes.push({
            id: `prox-${routeId}`,
            name: `Ruta ${category} - Zona ${routeId}`,
            type: "proximity",
            tickets: nearbyTickets,
            score: nearbyTickets.length * 10,
            description: `${nearbyTickets.length} tickets de ${category} en radio de ${config.proximityRadius}km`,
          })
          routeId++
        }
      }
    })
  } else {
    // Comportamiento original: solo cercania sin importar categoria
    for (const ticket of sortedTickets) {
      if (used.has(ticket.id)) continue

      const nearbyTickets: Ticket[] = [ticket]
      used.add(ticket.id)

      // Buscar tickets cercanos
      for (const other of sortedTickets) {
        if (used.has(other.id)) continue
        if (nearbyTickets.length >= config.maxTicketsPerRoute) break

        const distance = calculateDistance(ticket.latitude, ticket.longitude, other.latitude, other.longitude)
        if (distance <= config.proximityRadius) {
          nearbyTickets.push(other)
          used.add(other.id)
        }
      }

      // Solo crear ruta si tiene el minimo de tickets
      if (nearbyTickets.length >= config.minTicketsForRoute) {
        routes.push({
          id: `prox-${routeId}`,
          name: `Ruta Cercania ${routeId}`,
          type: "proximity",
          tickets: nearbyTickets,
          score: nearbyTickets.length * 10,
          description: `${nearbyTickets.length} tickets en un radio de ${config.proximityRadius}km`,
        })
        routeId++
      }
    }
  }

  return routes.sort((a, b) => b.score - a.score)
}

export function generateCategoryRoutes(tickets: Ticket[], config: RouteConfig = defaultConfig): SuggestedRoute[] {
  const pendingTickets = tickets.filter((t) => t.status === "open")
  const categories = new Map<string, Ticket[]>()

  pendingTickets.forEach((ticket) => {
    const category = ticket.category || "Sin categoria"
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(ticket)
  })

  const routes: SuggestedRoute[] = []
  let routeId = 1

  categories.forEach((categoryTickets, category) => {
    // Ordenar por fecha
    const sortedCategoryTickets = [...categoryTickets].sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateA - dateB
    })

    // Crear multiples rutas si hay mas tickets que el maximo
    let remaining = [...sortedCategoryTickets]
    let subRouteId = 1

    while (remaining.length >= config.minTicketsForRoute) {
      const routeTickets = remaining.slice(0, config.maxTicketsPerRoute)
      remaining = remaining.slice(config.maxTicketsPerRoute)

      const routeName = subRouteId === 1 
        ? `Ruta ${category}` 
        : `Ruta ${category} (${subRouteId})`

      routes.push({
        id: `cat-${routeId}`,
        name: routeName,
        type: "category",
        tickets: routeTickets,
        score: routeTickets.length * 8,
        description: `${routeTickets.length} tickets de categoria ${category}`,
      })
      routeId++
      subRouteId++
    }
  })

  return routes.sort((a, b) => b.score - a.score)
}

// Algoritmo híbrido que combina cercanía y prioridad según los pesos configurados
export function generateHybridRoutes(tickets: Ticket[], config: RouteConfig = defaultConfig): SuggestedRoute[] {
  const pendingTickets = tickets.filter((t) => t.status === "open")
  if (pendingTickets.length === 0) return []

  const proximityWeight = config.proximityWeight ?? 50
  const priorityWeight = config.priorityWeight ?? 50

  const priorityScores: Record<string, number> = {
    high: 10,
    medium: 5,
    low: 2,
  }

  // Calcular score híbrido para cada ticket
  // El centro de referencia es el promedio de todas las coordenadas
  const centerLat = pendingTickets.reduce((sum, t) => sum + t.latitude, 0) / pendingTickets.length
  const centerLng = pendingTickets.reduce((sum, t) => sum + t.longitude, 0) / pendingTickets.length

  const ticketsWithScore = pendingTickets.map((ticket) => {
    const distance = calculateDistance(centerLat, centerLng, ticket.latitude, ticket.longitude)
    const maxDistance = config.proximityRadius * 2 || 5
    
    // Score de cercanía (inverso de la distancia, normalizado 0-10)
    const proximityScore = Math.max(0, 10 - (distance / maxDistance) * 10)
    
    // Score de prioridad
    const priorityScore = priorityScores[ticket.priority] || 5
    
    // Score híbrido ponderado
    const hybridScore = (proximityScore * proximityWeight / 100) + (priorityScore * priorityWeight / 100)
    
    return { ticket, hybridScore, proximityScore, priorityScore, distance }
  })

  // Ordenar por score híbrido (mayor primero)
  ticketsWithScore.sort((a, b) => b.hybridScore - a.hybridScore)

  const routes: SuggestedRoute[] = []
  const used = new Set<string>()
  let routeId = 1

  // Crear rutas agrupando tickets con scores similares y cercanía geográfica
  for (const { ticket } of ticketsWithScore) {
    if (used.has(ticket.id)) continue

    const routeTickets: Ticket[] = [ticket]
    used.add(ticket.id)

    // Buscar tickets cercanos y con prioridad similar
    for (const { ticket: other, distance } of ticketsWithScore) {
      if (used.has(other.id)) continue
      if (routeTickets.length >= config.maxTicketsPerRoute) break

      // Calcular distancia desde el primer ticket de la ruta
      const distFromFirst = calculateDistance(
        ticket.latitude, ticket.longitude,
        other.latitude, other.longitude
      )

      // Incluir si está dentro del radio o si la prioridad es alta y estamos priorizando por prioridad
      const includeByProximity = distFromFirst <= config.proximityRadius
      const includeByPriority = priorityWeight >= 60 && other.priority === "high"
      
      if (includeByProximity || includeByPriority) {
        routeTickets.push(other)
        used.add(other.id)
      }
    }

    // Solo crear ruta si tiene el mínimo de tickets
    if (routeTickets.length >= config.minTicketsForRoute) {
      // Determinar el nombre de la ruta según el balance
      let routeName: string
      let description: string

      if (proximityWeight >= 70) {
        routeName = `Ruta Zona ${routeId}`
        description = `${routeTickets.length} tickets agrupados por cercanía geográfica`
      } else if (priorityWeight >= 70) {
        const highCount = routeTickets.filter(t => t.priority === "high").length
        routeName = highCount > routeTickets.length / 2 ? `Ruta Urgente ${routeId}` : `Ruta Prioridad ${routeId}`
        description = `${routeTickets.length} tickets ordenados por nivel de urgencia`
      } else {
        routeName = `Ruta Optimizada ${routeId}`
        description = `${routeTickets.length} tickets balanceando cercanía y prioridad`
      }

      const avgPriorityScore = routeTickets.reduce((sum, t) => sum + (priorityScores[t.priority] || 5), 0) / routeTickets.length

      routes.push({
        id: `hybrid-${routeId}`,
        name: routeName,
        type: "hybrid",
        tickets: routeTickets,
        score: routeTickets.length * 10 + avgPriorityScore,
        description,
      })
      routeId++
    }
  }

  return routes.sort((a, b) => b.score - a.score)
}

export function generatePriorityRoutes(tickets: Ticket[], config: RouteConfig = defaultConfig): SuggestedRoute[] {
  const pendingTickets = tickets.filter((t) => t.status === "open")

  const priorityScores = {
    high: 10,
    medium: 5,
    low: 2,
  }

  const highPriorityTickets = pendingTickets
    .filter((t) => t.priority === "high")
    .sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateA - dateB
    })

  const mediumPriorityTickets = pendingTickets
    .filter((t) => t.priority === "medium")
    .sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateA - dateB
    })

  const routes: SuggestedRoute[] = []
  let routeId = 1

  // Crear multiples rutas para tickets de alta prioridad
  let remainingHigh = [...highPriorityTickets]
  let highSubRoute = 1

  while (remainingHigh.length >= config.minTicketsForRoute) {
    const routeTickets = remainingHigh.slice(0, config.maxTicketsPerRoute)
    remainingHigh = remainingHigh.slice(config.maxTicketsPerRoute)

    const routeName = highSubRoute === 1 
      ? "Ruta Urgente" 
      : `Ruta Urgente (${highSubRoute})`

    routes.push({
      id: `prio-${routeId}`,
      name: routeName,
      type: "priority",
      tickets: routeTickets,
      score: routeTickets.length * priorityScores.high,
      description: `${routeTickets.length} tickets de alta prioridad`,
    })
    routeId++
    highSubRoute++
  }

  // Crear multiples rutas para tickets de prioridad media
  let remainingMedium = [...mediumPriorityTickets]
  let mediumSubRoute = 1

  while (remainingMedium.length >= config.minTicketsForRoute) {
    const routeTickets = remainingMedium.slice(0, config.maxTicketsPerRoute)
    remainingMedium = remainingMedium.slice(config.maxTicketsPerRoute)

    const routeName = mediumSubRoute === 1 
      ? "Ruta Normal" 
      : `Ruta Normal (${mediumSubRoute})`

    routes.push({
      id: `prio-${routeId}`,
      name: routeName,
      type: "priority",
      tickets: routeTickets,
      score: routeTickets.length * priorityScores.medium,
      description: `${routeTickets.length} tickets de prioridad media`,
    })
    routeId++
    mediumSubRoute++
  }

  return routes.sort((a, b) => b.score - a.score)
}
