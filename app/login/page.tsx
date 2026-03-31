"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Loader2, MapPin, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          if (user.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/")
          }
        }
      } else {
        setError("Usuario o contraseña incorrectos")
      }
    } catch {
      setError("Error al iniciar sesión. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-secondary/30 p-4 font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      
      <Card className="w-full max-w-md shadow-premium-lg glass border-white/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40"></div>
        
        <CardHeader className="pb-0">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">Logística</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Smart Nodes</p>
              </div>
            </div>
          </div>
          <div className="text-center pt-6 pb-4">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Bienvenido
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground font-medium">
              Gestión Inteligente de Logística
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold ml-1">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nombre de usuario"
                className="h-11 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="Contraseña" className="text-sm font-semibold ml-1">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl shadow-premium font-semibold text-base transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Acceder al Sistema"
              )}
            </Button>
          </form>

          <div className="mt-8 p-5 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Credenciales de Acceso</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Administrador</p>
                <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded border border-border/30">admin / admin123</code>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Personal Cuadrilla</p>
                <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded border border-border/30">cuadrilla / cuadrilla123</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-6 text-center w-full pointer-events-none opacity-40">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Logística Inteligente © 2026</p>
      </div>
    </div>
  )
}
