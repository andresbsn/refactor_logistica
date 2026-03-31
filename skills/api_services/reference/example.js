export const ticketService = {
    getAll: (params) => api.get('/tickets', { params }).then(res => res.data),
    getById: (id) => api.get(`/tickets/${id}`).then(res => res.data),
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
};

export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }).then(res => res.data)
};
