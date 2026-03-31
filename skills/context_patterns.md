# Skill: context_patterns

## Contexto
Patrones para React Context en el frontend (Vite).

## Estructura de un Context

**Ubicación**: `frontend/src/lib/[name]-context.jsx`

### Componentes Requeridos

1. **Context** - `createContext(undefined)`
2. **Provider** - Componente que envuelve children con el valor
3. **Hook** - `use[Name]()` para acceder al contexto

### Ejemplo: AuthContext

```jsx
import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Cargar sesión existente
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { user, token } = response.data
    setUser(user)
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("token", token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    delete api.defaults.headers.common['Authorization']
    navigate("/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

### Provider en App

```jsx
// main.jsx
import { AuthProvider } from "./lib/auth-context"

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
```

## Contexts Existentes

1. **AuthContext** (`auth-context.jsx`)
   - `user`: objeto usuario o null
   - `login(username, password)`: función de login
   - `logout()`: cerrar sesión
   - `isLoading`: boolean para estado de carga

2. **RoutesContext** (`routes-context.jsx`)
   - `assignedRoutes`: rutas asignadas a la cuadrilla
   - `assignRoute(route, crewId, crewName)`: asignar ruta
   - `saveTicketResolution(routeId, ticketId, resolution)`: guardar resolución

## Reglas

- **Siempre** lanzar error si se usa hook fuera del Provider
- **Usar** `useState` para estado reactivo
- **Usar** `useEffect` para efectos secundarios (localStorage, redirects)
- **No** guardar passwords en localStorage
- **Limpiar** tokens en logout
