import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: { 'Content-Type': 'application/json' },
});

const externalApi = axios.create({
    baseURL: 'https://test2panel147.muni-sn.com.ar/app',
    headers: { 'Content-Type': 'application/json' },
});

externalApi.interceptors.request.use((config) => {
    const token = import.meta.env.VITE_EXTERNAL_API_TOKEN;
    if (token) config.headers.Authorization = token;
    return config;
});

// Request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for generic error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Error de conexión con el servidor';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export const ticketService = {
    getAll: (params) => api.get('/tickets', { params }).then(res => res.data),
    getById: (id) => api.get(`/tickets/${id}`).then(res => res.data),
    getImages: (id) => api.get(`/tickets/${id}/images`).then(res => res.data),
    changeStatus: (id, estado, notas = null) => {
        const data = { estado };
        if (notas) data.notas = notas;
        return externalApi.post(`/tickets/${id}/cambiarEstado`, data).then(res => res.data);
    },
};

export const userService = {
    getCrewLeaders: () => api.get('/users/crew-leaders').then(res => res.data),
};

export const routeService = {
    getAll: (params) => api.get('/routes', { params }),
    getById: (id) => api.get(`/routes/${id}`),
    create: (data) => api.post('/routes', data),
    update: (id, data) => api.patch(`/routes/${id}`, data),
    generateRoutes: (params) => api.post('/routes/admin/generate', params),
    getAdminRoutes: (params) => api.get('/routes/admin', { params }),
    confirm: (id, data) => api.patch(`/routes/admin/${id}/confirm`, data),
    logEvent: (routeId, ticketId, eventNumber) => {
        const resolvedTicketId = ticketId == null ? 'null' : ticketId;
        return api.post(`/routes/${routeId}/tickets/${resolvedTicketId}/event`, { eventNumber }).then(res => res.data);
    },
    getTicketStatus: (routeId, ticketId) => api.get(`/routes/${routeId}/tickets/${ticketId}/status`).then(res => res.data),
    getRouteLocations: (routeId, eventId = 5) => api.get(`/routes/${routeId}/locations`, { params: { eventId } }).then(res => res.data),
    updateTicketStatus: (routeId, ticketId, data) => api.patch(`/routes/${routeId}/tickets/${ticketId}/status`, data),
};

export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }).then(res => res.data)

};

export const catalogService = {
    getTasks: () => api.get('/catalog/tasks').then(res => res.data),
    getMaterials: () => api.get('/catalog/materials').then(res => res.data),
};

export const uploadService = {
    uploadImage: (file, path = null) => {
        const formData = new FormData();
        formData.append('image', file);
        if (path) {
            formData.append('path', path);
        }
        return api.post('/upload/single', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    },
    uploadMultipleImages: (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        return api.post('/upload/multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    },
    checkImageExists: (prefix) => {
        return api.get(`/upload/check-image?prefix=${encodeURIComponent(prefix)}`).then(res => res.data);
    },
};

export default api;
