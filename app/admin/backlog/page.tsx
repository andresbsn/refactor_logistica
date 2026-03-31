"use client"

import { useState, useMemo, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Calendar,
  Ticket,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  TableIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockTickets } from "@/lib/mock-data"
import { useSearchParams } from "next/navigation"
import { useRoutes } from "@/lib/routes-context"
import Loading from "./loading"

const priorityConfig = {
  high: { label: "Alta", color: "bg-red-100 text-red-800 border-red-200" },
  medium: { label: "Media", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  low: { label: "Baja", color: "bg-green-100 text-green-800 border-green-200" },
}

const statusConfig = {
  open: { label: "Abierto", color: "bg-blue-100 text-blue-800" },
  pending: { label: "Pendiente Cierre", color: "bg-orange-100 text-orange-800" },
  closed: { label: "Cerrado", color: "bg-green-100 text-green-800" },
}

export default function BacklogPage() {
  const searchParams = useSearchParams()
  const { assignedRoutes } = useRoutes()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")

  // Obtener IDs de tickets que ya estan asignados a rutas
  const assignedTicketIds = useMemo(() => {
    const ids = new Set<string>()
    assignedRoutes.forEach((route) => {
      route.tickets.forEach((ticket) => {
        ids.add(ticket.id)
      })
    })
    return ids
  }, [assignedRoutes])

  const pendingTickets = useMemo(() => {
    return mockTickets.filter(
      (t) => t.status === "open" && !assignedTicketIds.has(t.id)
    )
  }, [assignedTicketIds])

  const categories = useMemo(() => {
    const cats = new Set(pendingTickets.map((t) => t.category))
    return Array.from(cats)
  }, [pendingTickets])

  const filteredTickets = useMemo(() => {
    return pendingTickets.filter((ticket) => {
      const matchesSearch =
        searchTerm === "" ||
        ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter

      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter

      return matchesSearch && matchesCategory && matchesPriority
    })
  }, [pendingTickets, searchTerm, categoryFilter, priorityFilter])

  const stats = useMemo(() => {
    return {
      total: pendingTickets.length,
      high: pendingTickets.filter((t) => t.priority === "high").length,
      medium: pendingTickets.filter((t) => t.priority === "medium").length,
      low: pendingTickets.filter((t) => t.priority === "low").length,
    }
  }, [pendingTickets])

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Backlog de Tickets</h1>
            <p className="text-muted-foreground">
              Todos los tickets pendientes de asignación
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.high}</p>
                  <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
                  <p className="text-sm text-muted-foreground">Media Prioridad</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.low}</p>
                  <p className="text-sm text-muted-foreground">Baja Prioridad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de ticket, título o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat || "sin-categoria"}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count and view toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredTickets.length} de {pendingTickets.length} tickets
          </p>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              <TableIcon className="h-4 w-4 mr-1" />
              Tabla
            </Button>
          </div>
        </div>

        {/* Tickets List - Cards View */}
        {viewMode === "cards" && (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const isExpanded = expandedTicket === ticket.id
              const priority = priorityConfig[ticket.priority]
              const status = statusConfig[ticket.status]

              return (
                <Card
                  key={ticket.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-primary border-primary">
                              {ticket.category}
                            </Badge>
                            <Badge className={`text-xs ${ticket.ticketNumber}`}>
                              {ticket.ticketNumber || `#${ticket.id}`}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-base">{ticket.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{ticket.address}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={priority.color}>{priority.label}</Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>Contacto: {ticket.contact}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Agente: {ticket.agent}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                Creado:{" "}
                                {ticket.createdAt?.toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Subcategoría:</span>
                              <Badge variant="secondary">{ticket.subcategory}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Estado:</span>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {filteredTickets.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No se encontraron tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tickets List - Table View */}
        {viewMode === "table" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">N Ticket</TableHead>
                      <TableHead>Titulo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Subcategoria</TableHead>
                      <TableHead>Direccion</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => {
                      const priority = priorityConfig[ticket.priority]
                      return (
                        <TableRow key={ticket.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {ticket.ticketNumber || `#${ticket.id}`}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="truncate block">{ticket.title}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-primary border-primary">
                              {ticket.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ticket.subcategory}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="truncate block text-sm">{ticket.address}</span>
                          </TableCell>
                          <TableCell className="text-sm">{ticket.contact}</TableCell>
                          <TableCell>
                            <Badge className={priority.color}>{priority.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm capitalize">{ticket.agent}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ticket.createdAt?.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredTickets.length === 0 && (
                <div className="p-8 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No se encontraron tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Suspense>
  )
}
