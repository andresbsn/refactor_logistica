# Confirm Dialog / Alert Pattern

## Descripción
Pattern para mostrar diálogos de confirmación o alertas en la aplicación.

## Diseño de Alerta (Warning/Confirm)

```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

// Estado para controlar el dialog
const [confirmDialog, setConfirmDialog] = useState({ open: false, message: "", onConfirm: null })

// Función helper
const showConfirmDialog = (message, onConfirm) => {
  setConfirmDialog({ open: true, message, onConfirm })
}

// Render del dialog
<Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
  <DialogContent className="max-w-sm rounded-3xl border-amber-200 bg-amber-50/95 backdrop-blur-sm p-0 shadow-xl">
    <DialogHeader className="pb-2 pt-6 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <DialogTitle className="text-lg font-bold text-amber-800">
          Advertencia
        </DialogTitle>
      </div>
    </DialogHeader>
    <div className="px-6 pb-6">
      <p className="text-sm text-amber-700 leading-relaxed">
        {confirmDialog.message}
      </p>
    </div>
    <div className="flex justify-end gap-3 px-6 pb-6">
      <Button 
        variant="outline"
        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
        className="h-10 px-6 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
      >
        Cancelar
      </Button>
      <Button 
        onClick={() => {
          confirmDialog.onConfirm?.()
          setConfirmDialog({ ...confirmDialog, open: false })
        }}
        className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg"
      >
        Confirmar
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## Variantes

### Éxito (Success)
- Icono: `CheckCircle` con color `text-emerald-600`
- Background: `bg-emerald-50/95`
- Border: `border-emerald-200`
- Botón: `bg-emerald-500 hover:bg-emerald-600`

### Error (Danger)
- Icono: `XCircle` con color `text-red-600`
- Background: `bg-red-50/95`
- Border: `border-red-200`
- Botón: `bg-red-500 hover:bg-red-600`

### Información
- Icono: `Info` con color `text-blue-600`
- Background: `bg-blue-50/95`
- Border: `border-blue-200`
- Botón: `bg-blue-500 hover:bg-blue-600`

## Cuándo usar
- Confirmar acciones destructivas (eliminar, cerrar tickets, etc.)
- Advertir sobre consecuencias de una acción
- Mostrar mensajes de éxito/error después de operaciones
- Confirmar cambios importantes