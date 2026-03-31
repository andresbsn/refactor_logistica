import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Loader2, MapPin, AlertCircle } from "lucide-react"
import { useAuth } from "../lib/auth-context";
import api from "../services/api";

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showVehicleSelector, setShowVehicleSelector] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [pendingRouteId, setPendingRouteId] = useState(null)
  const [vehicleError, setVehicleError] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const navigate = useNavigate(); 
  const { login, completeLogin } = useAuth();
  const [tempAuth, setTempAuth] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Direct API call instead of context login to avoid immediate redirects
      const loginRes = await api.post('/auth/login', { username, password });
      const { user: userData, token } = loginRes.data;
      const crewIdentifier = userData.crewId || userData.crew_id || userData.id;
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (userData.nivel_app === 'LIDER_CUADRILLA' && (userData.niveles === 2 || userData.niveles === "2")) {
        const [vehiclesRes, routesRes] = await Promise.all([
          api.get('/routes/vehicles'),
          api.get(`/routes/for-login/${crewIdentifier}`)
        ]);
        
        setVehicles(vehiclesRes.data);
        const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
        
        const activeRoute = routesRes.data.find(r => 
          toBool(r.is_active) && r.started_at
        );
        
        if (!activeRoute) {
          const pendingRoute = routesRes.data.find(r => {
            const crewMatch = r.crew_id === crewIdentifier || r.crew_id == crewIdentifier;
            const planedMatch = r.planed === false || r.planed === 'false' || r.planed === 0 || r.planed === '0' || r.planed === null;
            const isActiveMatch = r.is_active === false || r.is_active === 'false' || r.is_active === 0 || r.is_active === '0' || r.is_active === null;
            const startedAtMatch = !r.started_at || r.started_at === null;
            return crewMatch && planedMatch && isActiveMatch && startedAtMatch;
          });
          
          if (pendingRoute) {
            setPendingRouteId(pendingRoute.id);
            setTempAuth({ user: userData, token });
            setShowVehicleSelector(true);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // If we reach here, no vehicle selection needed, complete the global login
      completeLogin(userData, token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  }

  const handleVehicleSelect = async () => {
    if (!selectedVehicle) {
      setVehicleError("Debe seleccionar un vehículo");
      return;
    }
    setVehicleError("")
    setIsAssigning(true);
    try {
      await api.post('/routes/start', {
        routeId: pendingRouteId,
        vehicleId: parseInt(selectedVehicle)
      });
      
      // Finish login with previously stored temp auth data
      if (tempAuth) {
        completeLogin(tempAuth.user, tempAuth.token);
      }
    } catch (err) {
      setVehicleError(err.response?.data?.message || "Error al iniciar la ruta");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-secondary/30 p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in zoom-in-95">
        <Card className="glass shadow-premium border-white/40 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-400 to-primary/60" />
          <CardHeader className="text-center pt-10 pb-6 space-y-6">
            <div className="mx-auto w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4 group hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                Bienvenido
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium text-muted-foreground/80">
                Gestión Inteligente de Logística
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            {showVehicleSelector ? (
              <div className="space-y-6">
                <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-700">
                  <MapPin className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    Seleccione un vehículo para iniciar la ruta
                  </AlertDescription>
                </Alert>

                {vehicleError && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{vehicleError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Vehículo
                  </Label>
                  <select
                    id="vehicle"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="h-12 px-4 bg-white/50 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary transition-all group-hover:border-primary/40 w-full"
                  >
                    <option value="">Seleccionar vehículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.patent || v.brand || `Vehículo ${v.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <Button 
                  onClick={handleVehicleSelect} 
                  className="w-full h-12 text-base font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    "Confirmar Vehículo"
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-700 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Usuario
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Tu usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-12 px-4 bg-white/50 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary transition-all group-hover:border-primary/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Contraseña
                    </Label>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-12 px-4 bg-white/50 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary transition-all group-hover:border-primary/40"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-8 pt-8 border-t border-border/40 text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-60">
                Smart &copy; {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
