"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { AssignedRoute, AssignedTicket, SuggestedRoute, TicketStatus } from "@/types/ticket"
import { mockAssignedRoutes } from "@/lib/mock-assigned-routes"
import { useAuth } from "@/lib/auth-context"

interface TicketResolution {
  tasksCompleted: string[]
  materialsUsed: { materialId: string; materialName: string; quantity: number }[]
  photoBefore: string
  photoAfter: string
  additionalPhotos: string[]
  observations: string
  completedAt: Date
}

const normalizeId = (value: unknown) => (value === undefined || value === null ? "" : String(value))

const API_BASE_URL = "http://localhost:4000/api"
const toBool = (value: unknown) => value === true || value === 1 || value === "1" || value === "true"

const routeCrewIdMatches = (route: AssignedRoute, crewId: string) => {
  const routeCrewId = normalizeId(route.crewId)
  const legacyCrewId = normalizeId((route as AssignedRoute & { crew_id?: unknown }).crew_id)
  const targetCrewId = normalizeId(crewId)

  return routeCrewId === targetCrewId || legacyCrewId === targetCrewId
}

const normalizeTicketStatus = (ticket: any): TicketStatus => {
  if (ticket?.is_closed === true || ticket?.estado === "closed" || ticket?.estado === "cerrado") {
    return "closed"
  }
  if (ticket?.estado === "pending" || ticket?.estado === "pendiente") {
    return "pending"
  }
  return "open"
}

const normalizeRouteStatus = (tickets: AssignedTicket[]) => {
  const allSettled = tickets.every((ticket) => ticket.status !== "open")
  const someSettled = tickets.some((ticket) => ticket.status !== "open")

  return allSettled ? "completed" : someSettled ? "partial" : "active"
}

const normalizeBackendRoutes = (routes: any[]): AssignedRoute[] => {
  return routes.map((route) => ({
    id: normalizeId(route.id),
    name: route.name || `Ruta ${normalizeId(route.id)}`,
    crewId: normalizeId(route.crew_id ?? route.crewId),
    crewName: route.crewName || "",
    assignedAt: new Date(route.assignedAt || route.assigned_at || Date.now()),
    status: toBool(route.is_active) ? "active" : route.started_at ? "completed" : "partial",
    tickets: Array.isArray(route.tickets)
      ? route.tickets.map((ticket: any) => ({
          id: normalizeId(ticket.id),
          ticketNumber: ticket.ticketNumber || `#${normalizeId(ticket.id)}`,
          title: ticket.asunto || ticket.title || "Ticket",
          address: ticket.dire_completa || ticket.address || "",
          contact: ticket.contacto_celular || ticket.contacto_telefono || ticket.contact || "",
          latitude: Number(ticket.latitude) || 0,
          longitude: Number(ticket.longitude) || 0,
          status: normalizeTicketStatus(ticket),
          priority: ticket.prioridad || ticket.priority || "medium",
          agent: ticket.tipo || ticket.agent,
          createdAt: ticket.createdAt ? new Date(ticket.createdAt) : undefined,
        }))
      : [],
  }))
}

interface RoutesContextType {
  assignedRoutes: AssignedRoute[]
  assignRoute: (route: SuggestedRoute, crewId: string, crewName: string) => void
  getCrewRoutes: (crewId: string) => AssignedRoute[]
  updateTicketStatus: (routeId: string, ticketId: string, status: TicketStatus) => void
  saveTicketResolution: (routeId: string, ticketId: string, resolution: TicketResolution) => void
  closeTicket: (routeId: string, ticketId: string) => void
}

const RoutesContext = createContext<RoutesContextType | undefined>(undefined)

// Versión del esquema de datos - incrementar cuando cambien los estados
const DATA_VERSION = "4"

export function RoutesProvider({ children }: { children: React.ReactNode }) {
  const [assignedRoutes, setAssignedRoutes] = useState<AssignedRoute[]>([])
  const { user, isLoading: authLoading } = useAuth()
  const closingRoutesRef = useRef(new Set<string>())

  // Función para validar y corregir estado del ticket basado en su resolución
  const validateTicketStatus = (ticket: AssignedTicket): TicketStatus => {
    // Si tiene resolución, solo puede estar en "pending" o "closed"
    if (ticket.resolution) {
      if (ticket.status === "closed") return "closed"
      return "pending" // Si tiene resolución pero no está closed, debe estar pending
    }
    // Si no tiene resolución, debe estar en "open"
    return "open"
  }

  // Cargar rutas asignadas desde backend cuando hay sesión, o usar cache/mock
  useEffect(() => {
    if (authLoading) return

    if (typeof window !== "undefined") {
      const savedVersion = localStorage.getItem("assignedRoutesVersion")

      const loadCachedRoutes = () => {
        if (savedVersion !== DATA_VERSION) {
          localStorage.removeItem("assignedRoutes")
          localStorage.setItem("assignedRoutesVersion", DATA_VERSION)
          return mockAssignedRoutes
        }

        const saved = localStorage.getItem("assignedRoutes")
        if (!saved) return mockAssignedRoutes

        try {
          const parsed = JSON.parse(saved)
          return parsed.map((r: AssignedRoute) => ({
            ...r,
            assignedAt: new Date(r.assignedAt),
            tickets: r.tickets.map((t: AssignedTicket) => {
              const resolution = t.resolution
                ? {
                    ...t.resolution,
                    completedAt: new Date(t.resolution.completedAt),
                  }
                : undefined

              const ticketWithResolution = {
                ...t,
                ticketNumber: t.ticketNumber || `#${t.id}`,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                resolution,
              }

              return {
                ...ticketWithResolution,
                status: validateTicketStatus(ticketWithResolution),
              }
            }),
          }))
        } catch {
          localStorage.removeItem("assignedRoutes")
          return mockAssignedRoutes
        }
      }

      const crewIdentifier = normalizeId(user?.crewId ?? user?.crew_id ?? user?.id)

      if (user?.role === "cuadrilla" && crewIdentifier) {
        ;(async () => {
          try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/routes/for-login/${encodeURIComponent(crewIdentifier)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            const routes = normalizeBackendRoutes(data)
            setAssignedRoutes(routes)
            return
          } catch {
            setAssignedRoutes(loadCachedRoutes())
          }
        })()
        return
      }

      setAssignedRoutes(loadCachedRoutes())
    }
  }, [authLoading, user])

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== "undefined" && assignedRoutes.length > 0) {
      localStorage.setItem("assignedRoutes", JSON.stringify(assignedRoutes))
    }
  }, [assignedRoutes])

  const assignRoute = useCallback((route: SuggestedRoute, crewId: string, crewName: string) => {
    const newAssignedRoute: AssignedRoute = {
      id: `ar-${Date.now()}`,
      name: route.name,
      crewId,
      crewName,
      assignedAt: new Date(),
      status: "active",
      tickets: route.tickets.map((t) => ({
        ...t,
        ticketNumber: t.ticketNumber || `#${t.id}`,
        status: "open" as const, // Abierto cuando se asigna a cuadrilla
        resolution: undefined,
      })),
    }

    setAssignedRoutes((prev) => [...prev, newAssignedRoute])

    // Disparar evento para notificar a otros componentes
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("routeAssigned", { detail: newAssignedRoute }))
    }
  }, [])

  const getCrewRoutes = useCallback((crewId: string) => {
    return assignedRoutes.filter((r) => routeCrewIdMatches(r, crewId))
  }, [assignedRoutes])

  const updateTicketStatus = useCallback((routeId: string, ticketId: string, status: TicketStatus) => {
    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId ? { ...t, status } : t
          )
          const nextStatus = normalizeRouteStatus(updatedTickets)
          
          return {
            ...route,
            tickets: updatedTickets,
            status: nextStatus,
          }
        }
        return route
      })
    )
  }, [])

  const closeRouteIfCompleted = useCallback(async (route: AssignedRoute) => {
    if (!route) return

    const routeKey = normalizeId(route.id)
    if (!routeKey || closingRoutesRef.current.has(routeKey)) return

    const allSettled = route.tickets.every((ticket) => ticket.status !== "open")
    if (!allSettled) return

    closingRoutesRef.current.add(routeKey)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      await fetch(`${API_BASE_URL}/routes/${encodeURIComponent(routeKey)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
          is_active: false,
        }),
      })

      await fetch(`${API_BASE_URL}/routes/${encodeURIComponent(routeKey)}/tickets/null/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eventNumber: 4 }),
      })

      setAssignedRoutes((prev) =>
        prev.map((currentRoute) =>
          normalizeId(currentRoute.id) === routeKey
            ? { ...currentRoute, is_active: false, status: "completed" }
            : currentRoute
        )
      )
    } catch (error) {
      console.error("Error closing route after final ticket:", error)
    } finally {
      closingRoutesRef.current.delete(routeKey)
    }
  }, [])

  // Guardar resolución completa del ticket (cuando la cuadrilla resuelve)
  const saveTicketResolution = useCallback((routeId: string, ticketId: string, resolution: TicketResolution) => {
    let nextRoute: AssignedRoute | null = null

    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId 
              ? { 
                  ...t, 
                  status: "pending" as TicketStatus, // Pendiente de cierre por admin
                  resolution: {
                    tasksCompleted: resolution.tasksCompleted,
                    materialsUsed: resolution.materialsUsed,
                    photoBefore: resolution.photoBefore,
                    photoAfter: resolution.photoAfter,
                    additionalPhotos: resolution.additionalPhotos,
                    observations: resolution.observations,
                    completedAt: resolution.completedAt,
                  }
                } 
              : t
          )
          const routeStatus = normalizeRouteStatus(updatedTickets)

          nextRoute = {
            ...route,
            tickets: updatedTickets,
            status: routeStatus,
          }
          return nextRoute
        }
        return route
      })
    )

    if (nextRoute) {
      void closeRouteIfCompleted(nextRoute)
    }
  }, [closeRouteIfCompleted])

  // Cerrar ticket (solo admin) - cambia de pending a closed
  const closeTicket = useCallback((routeId: string, ticketId: string) => {
    let nextRoute: AssignedRoute | null = null

    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId && t.status === "pending" ? { ...t, status: "closed" as const } : t
          )
          const routeStatus = normalizeRouteStatus(updatedTickets)
          
          nextRoute = {
            ...route,
            tickets: updatedTickets,
            status: routeStatus,
          }
          return nextRoute
        }
        return route
      })
    )

    if (nextRoute) {
      void closeRouteIfCompleted(nextRoute)
    }
  }, [closeRouteIfCompleted])

  return (
    <RoutesContext.Provider value={{ assignedRoutes, assignRoute, getCrewRoutes, updateTicketStatus, saveTicketResolution, closeTicket }}>
      {children}
    </RoutesContext.Provider>
  )
}

export function useRoutes() {
  const context = useContext(RoutesContext)
  if (!context) {
    throw new Error("useRoutes debe usarse dentro de RoutesProvider")
  }
  return context
}
