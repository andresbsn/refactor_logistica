import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import api from "../services/api"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      } catch {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const pathname = location.pathname

    // Redirect logic based on auth state and current path
    if (!user && pathname !== "/login") {
      navigate("/login")
    } else if (user && pathname === "/login") {
      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/")
      }
    }
  }, [user, location.pathname, isLoading, navigate])

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      const { user, token } = response.data
      
      setUser(user)
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", token)
      
      // Set auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { user, token }
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message)
      throw new Error(error.response?.data?.message || 'Error de autenticación')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    delete api.defaults.headers.common['Authorization']
    navigate("/login")
  }

  const completeLogin = (user, token) => {
    setUser(user)
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("token", token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, completeLogin }}>
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
