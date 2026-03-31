import { useEffect, useState } from "react";
import { ticketService } from "../services/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { LayoutGrid, List, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Backlog() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredTickets = tickets.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const ticketNumber = String(t.nro_ticket || t.id || "").toLowerCase();
    const address1 = (t.dire_completa || "").toLowerCase();
    const address2 = (`${t.calle || ''} ${t.n_calle || ''}`).trim().toLowerCase();
    
    return ticketNumber.includes(term) || address1.includes(term) || address2.includes(term);
  });

  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchOpenTickets = async () => {
      try {
        const data = await ticketService.getAll({ status: "open" });
        setTickets(data);
      } catch (err) {
        setError(err.message || "Error al cargar tickets");
      }
    };
    fetchOpenTickets();
  }, []);

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <Card className="max-w-6xl mx-auto shadow-xl">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">
            Backlog – Tickets abiertos
          </CardTitle>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <LayoutGrid size={18} />
              Card
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <List size={18} />
              Lista
            </button>
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nro de ticket o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
            />
          </div>
        </div>
        <CardContent>
          {error && <p className="text-red-600">{error}</p>}
          {tickets.length === 0 ? (
            <p className="text-gray-500">No hay tickets abiertos.</p>
          ) : filteredTickets.length === 0 ? (
            <p className="text-gray-500">No se encontraron tickets con la búsqueda "{searchTerm}".</p>
          ) : viewMode === "card" ? (
            <ul className="space-y-4">
              {paginatedTickets.map((t) => (
                <li key={t.id} className="border p-4 rounded bg-white shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        #{t.nro_ticket || t.id}
                      </span>
                      <strong className="text-lg text-gray-800">{t.asunto || "Sin asunto"}</strong>
                    </div>
                    {t.prioridad && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                        t.prioridad.toLowerCase() === 'alta' ? 'bg-red-50 text-red-700 border-red-200' :
                        t.prioridad.toLowerCase() === 'media' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {t.prioridad}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2 bg-slate-50 p-3 rounded border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tipo / Subtipo</span>
                      <span>
                        {t.tipo_nombre || t.tipo || "N/A"} 
                        {t.subtipo_nombre ? ` - ${t.subtipo_nombre}` : (t.subtipo ? ` - ${t.subtipo}` : '')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dirección</span>
                      <span className="truncate" title={t.dire_completa || `${t.calle || ''} ${t.n_calle || ''}`.trim() || "No especificada"}>
                        {t.dire_completa || `${t.calle || ''} ${t.n_calle || ''}`.trim() || "No especificada"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Nro</th>
                    <th className="px-4 py-3">Asunto</th>
                    <th className="px-4 py-3">Tipo / Subtipo</th>
                    <th className="px-4 py-3">Dirección</th>
                    <th className="px-4 py-3 text-right">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.map(t => (
                    <tr key={t.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-blue-700">
                        #{t.nro_ticket || t.id}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {t.asunto || "Sin asunto"}
                      </td>
                      <td className="px-4 py-3">
                        {t.tipo_nombre || t.tipo || "N/A"} 
                        {t.subtipo_nombre ? ` - ${t.subtipo_nombre}` : (t.subtipo ? ` - ${t.subtipo}` : '')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="truncate max-w-[200px] inline-block" title={t.dire_completa || `${t.calle || ''} ${t.n_calle || ''}`.trim() || "No especificada"}>
                          {t.dire_completa || `${t.calle || ''} ${t.n_calle || ''}`.trim() || "No especificada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.prioridad && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded border inline-block ${
                            t.prioridad.toLowerCase() === 'alta' ? 'bg-red-50 text-red-700 border-red-200' :
                            t.prioridad.toLowerCase() === 'media' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {t.prioridad}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredTickets.length > pageSize && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> a <span className="font-semibold">{Math.min(currentPage * pageSize, filteredTickets.length)}</span> de <span className="font-semibold">{filteredTickets.length}</span> tickets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <div className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-slate-700">
                  Página {currentPage} de {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
