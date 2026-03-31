import React from "react"
import { CrewsView } from "../components/admin/CrewsView"
import { Users, Info } from "lucide-react"
import { Button } from "../components/ui/button"

export default function CuadrillasPage() {
  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-b-[3rem] bg-primary p-8 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl opacity-30" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl ring-1 ring-white/20 transition-transform hover:scale-105">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">
                  Monitoreo de Cuadrillas
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">En Vivo</span>
                </div>
              </div>
              <p className="mt-1 text-slate-400 font-medium max-w-lg">
                Visualización de rutas activas, estado de resolución de tickets y control de cuadrillas operativas.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-12 px-6 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group font-bold"
            >
              <Info className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
              Reporte Diario
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8">
        <CrewsView />
      </div>
    </div>
  )
}
