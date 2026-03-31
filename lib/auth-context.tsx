"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "admin" | "cuadrilla"

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  crewId?: string // ID de la cuadrilla si el usuario es de tipo cuadrilla
  crew_id?: string | number
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users - en producción esto vendría de una API/base de datos
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      name: "Administrador",
      role: "admin",
    },
  },
  cuadrilla: {
    password: "cuadrilla123",
    user: {
      id: "2",
      username: "cuadrilla",
      name: "Cuadrilla A - Zona Centro",
      role: "cuadrilla",
      crewId: "c1", // Corresponde con mockCrews
    },
  },
  cuadrilla2: {
    password: "cuadrilla123",
    user: {
      id: "3",
      username: "cuadrilla2",
      name: "Cuadrilla B - Zona Norte",
      role: "cuadrilla",
      crewId: "c2",
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    // Redirect logic based on auth state and current path
    if (!user && pathname !== "/login") {
      router.push("/login")
    } else if (user && pathname === "/login") {
      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    }
  }, [user, pathname, isLoading, router])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const userData = mockUsers[username.toLowerCase()]
    if (userData && userData.password === password) {
      setUser(userData.user)
      localStorage.setItem("user", JSON.stringify(userData.user))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
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
