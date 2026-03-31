"use client"

import { ArrowDown } from "lucide-react"

const layers = [
  {
    title: "Presentación",
    subtitle: "Frontend UI",
    color: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-900",
    badgeColor: "bg-blue-600",
    items: [
      { name: "Dashboard Page", description: "Panel principal operativo" },
      { name: "Panel de Tickets", description: "Lista filtrable de reclamos" },
      { name: "Panel de Mapa", description: "Visualización geográfica en vivo" },
      { name: "Panel de Cuadrillas", description: "Estado y rutas activas" },
      { name: "Panel de Alertas", description: "Cola de alertas operativas" },
      { name: "Drawer de Detalle", description: "Detalle completo del ticket" },
    ],
  },
  {
    title: "Aplicación",
    subtitle: "Lógica de Negocio / Casos de Uso",
    color: "bg-sky-50 border-sky-200",
    titleColor: "text-sky-900",
    badgeColor: "bg-sky-600",
    items: [
      { name: "Cargar datos del dashboard", description: "Inicialización de datos" },
      { name: "Asignar ticket a cuadrilla", description: "Vinculación ticket-ruta" },
      { name: "Cambiar estado del ticket", description: "open → pending → closed" },
      { name: "Iniciar ruta", description: "Activar recorrido de cuadrilla" },
      { name: "Finalizar ruta", description: "Cerrar recorrido completado" },
      { name: "Refrescar posiciones", description: "Actualización GPS en vivo" },
    ],
  },
  {
    title: "Dominio",
    subtitle: "Modelos del Núcleo",
    color: "bg-indigo-50 border-indigo-200",
    titleColor: "text-indigo-900",
    badgeColor: "bg-indigo-600",
    items: [
      { name: "Ticket", description: "Reclamo del ciudadano" },
      { name: "Cuadrilla", description: "Equipo de trabajo" },
      { name: "Ruta", description: "Recorrido asignado" },
      { name: "Ubicación", description: "Coordenadas geográficas" },
      { name: "Alerta Operativa", description: "Notificación del sistema" },
    ],
  },
  {
    title: "Infraestructura",
    subtitle: "Datos y Servicios Externos",
    color: "bg-slate-50 border-slate-200",
    titleColor: "text-slate-900",
    badgeColor: "bg-slate-600",
    items: [
      { name: "API Client", description: "Cliente HTTP base" },
      { name: "Tickets API", description: "CRUD de reclamos" },
      { name: "Rutas API", description: "Gestión de recorridos" },
      { name: "Ubicaciones API", description: "Servicio de geolocalización" },
      { name: "Servicio de Autenticación", description: "Login y permisos" },
    ],
  },
]

export default function ArquitecturaPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sistema 147 – Panel Operativo
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Diagrama de Arquitectura
        </p>
      </div>

      {/* Layers */}
      <div className="max-w-6xl mx-auto flex flex-col gap-0">
        {layers.map((layer, layerIndex) => (
          <div key={layer.title}>
            {/* Layer Box */}
            <div className={`rounded-xl border-2 p-6 ${layer.color}`}>
              {/* Layer Header */}
              <div className="flex items-center gap-3 mb-5">
                <span className={`${layer.badgeColor} text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full`}>
                  Capa {layerIndex + 1}
                </span>
                <div>
                  <h2 className={`text-xl font-bold ${layer.titleColor}`}>
                    {layer.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {layer.subtitle}
                  </p>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {layer.items.map((item) => (
                  <div
                    key={item.name}
                    className="bg-white/80 border border-white rounded-lg p-3 shadow-sm"
                  >
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow between layers */}
            {layerIndex < layers.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center text-muted-foreground/60">
                  <div className="w-px h-4 bg-muted-foreground/30" />
                  <ArrowDown className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flow Legend */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-6 bg-muted/50 rounded-full px-6 py-3">
            <span className="font-medium text-foreground">Flujo de datos:</span>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Frontend</span>
              <ArrowDown className="h-3 w-3 rotate-[-90deg]" />
              <span className="bg-sky-600 text-white text-xs px-2 py-0.5 rounded">Casos de Uso</span>
              <ArrowDown className="h-3 w-3 rotate-[-90deg]" />
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">Dominio</span>
              <ArrowDown className="h-3 w-3 rotate-[-90deg]" />
              <span className="bg-slate-600 text-white text-xs px-2 py-0.5 rounded">Infraestructura</span>
              <ArrowDown className="h-3 w-3 rotate-[-90deg]" />
              <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded">Backend APIs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
