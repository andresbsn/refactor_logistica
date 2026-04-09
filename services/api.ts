import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
})

const externalApi = axios.create({
  baseURL: "https://test2panel147.muni-sn.com.ar/app",
  headers: { "Content-Type": "application/json" },
})

externalApi.interceptors.request.use((config) => {
  const token = process.env.NEXT_PUBLIC_EXTERNAL_API_TOKEN
  if (token) config.headers.Authorization = token
  return config
})

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Error de conexión con el servidor"
    console.error("API Error:", message)
    return Promise.reject(error)
  }
)

export const ticketService = {
  getAll: (params?: unknown) => api.get("/tickets", { params }).then((res) => res.data),
  getById: (id: string | number) => api.get(`/tickets/${id}`).then((res) => res.data),
  getImages: (id: string | number) => api.get(`/tickets/${id}/images`).then((res) => res.data),
  registerClosingActivities: (ticketId: string | number, data: { taskIds?: string[]; taskNames?: string[] }) =>
    api.post(`/tickets/${ticketId}/activities`, data).then((res) => res.data),
  changeStatus: (id: string | number, estado: string, notas: string | null = null) => {
    const data: { estado: string; notas?: string | null } = { estado }
    if (notas) data.notas = notas
    return externalApi.post(`/tickets/${id}/cambiarEstado`, data).then((res) => res.data)
  },
}

export const userService = {
  getCrewLeaders: () => api.get("/users/crew-leaders").then((res) => res.data),
}

export const routeService = {
  getAll: (params?: unknown) => api.get("/routes", { params }),
  getById: (id: string | number) => api.get(`/routes/${id}`),
  create: (data: unknown) => api.post("/routes", data),
  update: (id: string | number, data: unknown) => api.patch(`/routes/${id}`, data),
  generateRoutes: (params: unknown) => api.post("/routes/admin/generate", params),
  getAdminRoutes: (params?: unknown) => api.get("/routes/admin", { params }),
  confirm: (id: string | number, data: unknown) => api.patch(`/routes/admin/${id}/confirm`, data),
  logEvent: (routeId: string | number, ticketId: string | number | null, eventNumber: number) => {
    const resolvedTicketId = ticketId == null ? "null" : ticketId
    return api.post(`/routes/${routeId}/tickets/${resolvedTicketId}/event`, { eventNumber }).then((res) => res.data)
  },
  getTicketStatus: (routeId: string | number, ticketId: string | number) =>
    api.get(`/routes/${routeId}/tickets/${ticketId}/status`).then((res) => res.data),
  getRouteLocations: (routeId: string | number, eventId = 5) =>
    api.get(`/routes/${routeId}/locations`, { params: { eventId } }).then((res) => res.data),
  sendCrewLocation: (
    routeId: string | number,
    data: { latitude: number; longitude: number; timestamp?: string }
  ) => api.post(`/routes/${routeId}/crew-location`, data).then((res) => res.data),
  getCrewLocation: (routeId: string | number) => api.get(`/routes/${routeId}/crew-location`).then((res) => res.data),
  updateTicketStatus: (routeId: string | number, ticketId: string | number, data: unknown) =>
    api.patch(`/routes/${routeId}/tickets/${ticketId}/status`, data),
}

export const authService = {
  login: (username: string, password: string) => api.post("/auth/login", { username, password }).then((res) => res.data),
}

export const catalogService = {
  getTasks: () => api.get("/catalog/tasks").then((res) => res.data),
  getMaterials: () => api.get("/catalog/materials").then((res) => res.data),
}

export const uploadService = {
  uploadImage: (file: File, path: string | null = null) => {
    const formData = new FormData()
    formData.append("image", file)
    if (path) {
      formData.append("path", path)
    }
    return api.post("/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).then((res) => res.data)
  },
  uploadMultipleImages: (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append("images", file))
    return api.post("/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).then((res) => res.data)
  },
  checkImageExists: (prefix: string) => api.get(`/upload/check-image?prefix=${encodeURIComponent(prefix)}`).then((res) => res.data),
}

export default api
