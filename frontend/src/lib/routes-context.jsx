/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./auth-context"
import { routeService } from "../services/api"
import api from "../services/api"

const RoutesContext = createContext(undefined)

const DATA_VERSION = "6"

// Mock data internal to context for initialization
const mockAssignedRoutes = []

const validateTicketStatus = (ticket) => {
  if (ticket.status === "closed") return "closed"
  if (ticket.estado === "closed" || ticket.estado === "cerrado") return "closed"
  if (ticket.estado === "pending" || ticket.estado === "pendiente") return "pending"
  if (ticket.is_closed === true) return "closed"
  if (ticket.resolution?.is_closed === true) return "closed"
  return "open"
}

const withLegacyTicketState = (ticket, status) => ({
  ...ticket,
  status,
  estado: status,
})

export function RoutesProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth()
  const [assignedRoutes, setAssignedRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const closingRoutesRef = useRef(new Set())

  const normalizeRoute = useCallback((r) => ({
    ...r,
    assignedAt: r.assignedAt || r.assigned_at ? new Date(r.assignedAt || r.assigned_at) : null,
    // Calculate route status if not present
    status: r.status || (r.is_active ? "active" : (r.planed ? "planned" : "active")),
    tickets: (r.tickets || []).map((t) => {
      const resolution = t.resolution
        ? {
            ...t.resolution,
            completedAt: new Date(t.resolution.completedAt || t.resolution.updated_at || Date.now()),
          }
        : undefined
      
      const ticketWithResolution = {
        ...t,
        ticketNumber: t.ticketNumber || t.nro_ticket || `#${t.id}`,
        createdAt: t.createdAt || t.created_at ? new Date(t.createdAt || t.created_at) : undefined,
        resolution,
      }
      
      return {
        ...ticketWithResolution,
        ...withLegacyTicketState(ticketWithResolution, validateTicketStatus(ticketWithResolution)),
      }
    }),
  }), [])

  const fetchRoutes = useCallback(async () => {
    if (authLoading) return

    const token = localStorage.getItem('token')
    if (!token || !user) {
      setAssignedRoutes([])
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const isAdmin = user.role === "admin"
      const crewIdentifier = user.crewId || user.crew_id || user.id
      const response = isAdmin
        ? await routeService.getAll()
        : await api.get(`/routes/for-login/${crewIdentifier}`)

      const normalizedRoutes = (response.data || []).map(normalizeRoute)
      setAssignedRoutes(normalizedRoutes)
    } catch (err) {
      setError("No se pudieron cargar las rutas")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [authLoading, normalizeRoute, user])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVersion = localStorage.getItem("assignedRoutesVersion")
      if (savedVersion !== DATA_VERSION) {
        localStorage.removeItem("assignedRoutes")
        localStorage.setItem("assignedRoutesVersion", DATA_VERSION)
        setAssignedRoutes(mockAssignedRoutes)
        return
      }
      
      const saved = localStorage.getItem("assignedRoutes")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const routes = parsed.map(normalizeRoute)
          setAssignedRoutes(routes)
        } catch (e) {
          console.error("Error loading saved routes:", e)
          localStorage.removeItem("assignedRoutes")
          setAssignedRoutes(mockAssignedRoutes)
        }
      } else {
        setAssignedRoutes(mockAssignedRoutes)
      }
    }
  }, [normalizeRoute])

  useEffect(() => {
    if (typeof window !== "undefined" && assignedRoutes.length > 0) {
      localStorage.setItem("assignedRoutes", JSON.stringify(assignedRoutes))
    }
  }, [assignedRoutes])

  const assignRoute = useCallback((route, crewId, crewName) => {
    const newAssignedRoute = {
      id: route.id || `ar-${Date.now()}`,
      created_at: route.created_at || route.createdAt,
      name: route.name,
      crewId,
      crewName,
      assignedAt: new Date(),
      status: "active",
      planed: false,
      tickets: route.tickets.map((t) => ({
        ...t,
        ticketNumber: t.ticketNumber || `#${t.id}`,
        ...withLegacyTicketState(t, "open"),
        resolution: undefined,
      })),
    }

    setAssignedRoutes((prev) => [...prev, newAssignedRoute])

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("routeAssigned", { detail: newAssignedRoute }))
    }
  }, [])

  const getCrewRoutes = useCallback((crewId) => {
    return assignedRoutes.filter((r) => String(r.crewId) === String(crewId) || String(r.crew_id) === String(crewId))
  }, [assignedRoutes])

  const closeRouteIfCompleted = useCallback(async (route) => {
    if (!route || route.is_active === false) return

    const allClosed = route.tickets.every((t) => t.status === "closed" || t.is_closed === true || t.resolution?.is_closed === true)
    if (!allClosed) return

    const routeKey = String(route.id)
    if (closingRoutesRef.current.has(routeKey)) return
    closingRoutesRef.current.add(routeKey)

    const endedAt = new Date().toISOString()

    try {
      await routeService.update(route.id, {
        ended_at: endedAt,
        is_active: false,
      })
      await routeService.logEvent(route.id, null, 4)

      setAssignedRoutes((prev) =>
        prev.map((currentRoute) =>
          String(currentRoute.id) === String(route.id)
            ? {
                ...currentRoute,
                ended_at: endedAt,
                is_active: false,
                status: "completed",
              }
            : currentRoute
        )
      )
    } catch (err) {
      console.error("Error closing route after final ticket:", err)
    } finally {
      closingRoutesRef.current.delete(routeKey)
    }
  }, [])

  const updateTicketStatus = useCallback((routeId, ticketId, status) => {
    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, ...withLegacyTicketState(t, status), is_closed: status === "closed" ? true : t.is_closed }
              : t
          )
          const allClosed = updatedTickets.every((t) => t.status === "closed" || t.is_closed === true)
          const somePendingOrClosed = updatedTickets.some((t) => t.status === "pending" || t.status === "closed" || t.is_closed === true)
          
          return {
            ...route,
            tickets: updatedTickets,
            status: allClosed ? "completed" : somePendingOrClosed ? "partial" : "active",
          }
        }
        return route
      })
    )
  }, [])

  const saveTicketResolution = useCallback((routeId, ticketId, resolution) => {
    let updatedRoute = null

    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  ...withLegacyTicketState(t, "closed"),
                  is_closed: true,
                  resolution: {
                    ...resolution,
                    is_closed: true,
                  },
                }
              : t
          )
          const allClosed = updatedTickets.every((t) => t.status === "closed" || t.is_closed === true || t.resolution?.is_closed === true)
          const nextRoute = {
            ...route,
            tickets: updatedTickets,
            status: allClosed ? "completed" : "partial",
          }
          updatedRoute = nextRoute
          return nextRoute
        }
        return route
      })
    )

    if (updatedRoute) {
      void closeRouteIfCompleted(updatedRoute)
    }
  }, [closeRouteIfCompleted])

  const closeTicket = useCallback((routeId, ticketId) => {
    let updatedRoute = null

    setAssignedRoutes((prev) =>
      prev.map((route) => {
        if (route.id === routeId) {
          const updatedTickets = route.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, ...withLegacyTicketState(t, "closed"), is_closed: true }
              : t
          )
          const allClosed = updatedTickets.every((t) => t.status === "closed" || t.is_closed === true || t.resolution?.is_closed === true)
          const somePendingOrClosed = updatedTickets.some((t) => t.status === "pending" || t.status === "closed" || t.is_closed === true)
          
          const nextRoute = {
            ...route,
            tickets: updatedTickets,
            status: allClosed ? "completed" : somePendingOrClosed ? "partial" : "active",
          }
          updatedRoute = nextRoute
          return nextRoute
        }
        return route
      })
    )

    if (updatedRoute) {
      void closeRouteIfCompleted(updatedRoute)
    }
  }, [closeRouteIfCompleted])

  const getTicketById = useCallback((ticketId) => {
    for (const route of assignedRoutes) {
      const ticket = route.tickets.find((t) => String(t.id) === String(ticketId))
      if (ticket) return { ...ticket, routeId: route.id }
    }
    return null
  }, [assignedRoutes])

  return (
    <RoutesContext.Provider value={{ 
      assignedRoutes, 
      loading, 
      error, 
      fetchRoutes, 
      assignRoute, 
      getCrewRoutes, 
      updateTicketStatus, 
      saveTicketResolution, 
      closeTicket,
      getTicketById
    }}>
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
