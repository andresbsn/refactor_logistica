---
name: Modern Design System
description: Patrones de diseño premium, configuraciones de TailwindCSS y estilos glassmorphism utilizados en el proyecto.
---

# Modern Design System (Logística Inteligente)

Este skill define el estándar visual premium y la configuración de estilos adoptada en todo el proyecto, basada en la modernización de los componentes como `AdminRoutesPage` y `SuggestedRoutes`. Cualquier nuevo componente o refactorización de UI debe adherirse a estas pautas para mantener la consistencia visual y ofrecer una experiencia de usuario de alta calidad.

## 1. Tipografía y Estructura de Texto

- **Fuentes Principales**: Se utiliza `font-outfit` para encabezados importantes y títulos de tarjetas.
- **Jerarquía y Peso**:
  - Títulos principales (ej. Hero): `text-3xl font-extrabold tracking-tight font-outfit text-white`.
  - Títulos de sección: `font-bold text-lg tracking-tight`.
- **Etiquetas y Metadatos**: Uso de `uppercase tracking-widest` o `tracking-[0.15em]` con tamaño pequeño (ej. `text-[10px]`) para labels, estatus de "En Vivo", y subtítulos.

## 2. Paleta de Colores y Efectos

El esquema de colores ha transicionado de colores planos y oscuros a una paleta azul vibrante (`primary`, `custom-blue`) combinada con blancos y transparencias.

- **Fondo de Componentes Vitales**: 
  - **Premium Header**: `bg-primary` o combinaciones similares.
  - **Tarjetas y Paneles (Glassmorphism)**: Se priorizan los fondos translúcidos sobre blanco opaco o negro. Ej. `bg-white/30` o `bg-white/40` con bordes sutiles `border-white/40` o `border-white/60`.

- **Brillos y Destellos (Glow Effects)**:
  - En contenedores grandes se añaden círculos desenfocados en el fondo (ej. `bg-primary/20 blur-3xl opacity-50` y `bg-blue-500/20 blur-3xl opacity-30`).

## 3. Patrones de Diseño Estructural

### Premium Header (Cabecera Principal)
Se utiliza para la parte superior de pantallas principales como Admin.
```jsx
<div className="relative overflow-hidden rounded-3xl bg-primary p-8 shadow-2xl">
  {/* Efectos de Destello/Glow */}
  <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-50" />
  <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl opacity-30" />
  {/* Contenido principal z-10 */}
  ...
</div>
```

### Glassmorphism Panel (Panel o Tarjeta Principal)
Para contenedores de ajustes, herramientas y visualización.
```jsx
<Card className="glass shadow-premium border-white/40 overflow-hidden rounded-3xl bg-white/30 ...">
  {/* Header del Panel */}
  <div className="flex items-center justify-between px-8 py-5 border-b border-white/20 bg-white/40">...</div>
  {/* Contenido Interno (ej. Parámetros) */}
  <div className="bg-white/50 rounded-2xl border border-white/80 ...">...</div>
</Card>
```

### Contenedores de Íconos
Para destacar un ícono de Lucide-React junto a texto, se envuelve en un pequeño fondo semitransparente:
```jsx
<div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
  <MapPin className="h-5 w-5 text-primary" />
</div>
```

## 4. Botones y Elementos Interactivos

### Botón de Llamada a la Acción (CTA) Principal
Botones con gran peso visual, sombras y micro-animaciones:
```jsx
<Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group">
  <Sparkles className="h-5 w-5 mr-3 text-yellow-400 group-hover:rotate-12 transition-transform" />
  Acción
</Button>
```

### Botones Secundarios (Outline modernizado)
En lugar de botones grises genéricos o bordes negros duros, se utiliza una variante translúcida de azul (`custom-blue` o `primary`):
```jsx
<Button variant="outline" className="h-10 rounded-xl border-custom-blue/20 hover:bg-custom-blue/50 bg-custom-blue/5 hover:text-primary transition-all font-bold">
  ...
</Button>
```

### Botones de Ícono Redondeados
```jsx
<Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-custom-blue hover:bg-blue-100 text-primary transition-all">
  ...
</Button>
```

## 5. Badges, Etiquetas y Alertas

Se utiliza mucho el borde translúcido y fuentes muy legibles:
- **Etiqueta Neutra/Contador**: `bg-primary/5 text-black/70 font-bold border-primary/20 px-3`.
- **Etiqueta Resaltada/En Vivo**: Fondo translúcido con un pseudo-dot animado:
```jsx
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">En Vivo</span>
</div>
```

## 6. Micro-Animaciones
Para dar un aspecto "vivo" a la interfaz:
- `animate-pulse` en íconos (ej. Sparkles `text-yellow-500`) y puntos de estado.
- `animate-spin` para el ícono `RefreshCw` de carga.
- `hover:scale-105` o `hover:scale-[1.02]` para botones grandes y logos.
- `active:scale-95` para proporcionar *feedback* profundo al hacer clic.
- `group-hover:rotate-12` para aplicar rotación a íconos dentro de un botón cuando entra el mouse al grupo.

## Resumen de Reglas de Implementación
1. **Evitar bordes duros (`border-gray-200`, `border-black`)** si no son estrictamente necesarios. Usar `border-white/X` o `border-primary/X` en su lugar.
2. **Priorizar `rounded-2xl` y `rounded-3xl`** en contenedores grandes para un aspecto más fluido.
3. Usar **sombras coloreadas** (`shadow-primary/30`) en vez de sombras grises por defecto de Tailwind para los CTAs.
4. **Colorización del texto**: Utilizar `text-primary`, `text-slate-800` o `text-black/70` en lugar de texto totalmente negro, excepto si existe un contraste que lo justifique.
