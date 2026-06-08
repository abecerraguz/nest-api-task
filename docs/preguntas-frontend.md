# Preparación Entrevista FrontEnd

> **Stack:** React, Next.js (App Router), TypeScript, Node.js, GCP
> **Preparado para:** Alejandro Becerra

---

## Índice

1. [React](#1-react)
2. [Next.js](#2-nextjs)
3. [Node.js / APIs REST](#3-nodejs--apis-rest)
4. [Consumo de APIs](#4-consumo-de-apis)
5. [TypeScript](#5-typescript)
6. [GCP](#6-gcp)
7. [Jira & Metodología](#7-jira--metodología)
8. [Trabajo remoto / Soft skills](#8-trabajo-remoto--soft-skills)
9. [Preguntas técnicas difíciles](#9-preguntas-técnicas-difíciles)
10. [Preguntas sobre el proyecto](#10-preguntas-sobre-el-proyecto)
11. [Checklist antes de la entrevista](#11-checklist-antes-de-la-entrevista)

---

## 1. React

---

### 🟡 Media — `useEffect`: cuándo usarlo y cuándo no

**¿Cuándo usas `useEffect` y cuándo no?**

<details>
<summary>Ver respuesta simple</summary>

Imagina que `useEffect` es el "trabajo de limpieza y conexión" que haces **después** de instalar un artefacto en tu casa:

```
╔══════════════════════════════════════════════════════╗
║              ¿NECESITO useEffect?                    ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  ✅ SÍ — efectos externos al componente             ║
║  ┌────────────────────────────────────────────────┐  ║
║  │  • fetch de datos (en componentes cliente)     │  ║
║  │  • suscripciones a WebSockets                  │  ║
║  │  • manipulación manual del DOM (ref)           │  ║
║  │  • integrar librerías externas (charts, maps)  │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                      ║
║  ❌ NO — cuando puedes hacer esto en su lugar       ║
║  ┌────────────────────────────────────────────────┐  ║
║  │  • fetch de datos → Server Component en Next   │  ║
║  │  • calcular algo del estado → useMemo          │  ║
║  │  • reaccionar a un click → handler directo     │  ║
║  │  • sincronizar dos estados → calcular en render│  ║
║  └────────────────────────────────────────────────┘  ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

**Ejemplo con `useEffect` (cliente que no puede ser Server Component):**

```tsx
// ❌ Clásico pero mejorable
function TareaDetalle({ id }: { id: number }) {
  const [tarea, setTarea] = useState(null);

  useEffect(() => {
    fetch(`/api/tareas/${id}`)
      .then(r => r.json())
      .then(setTarea);
  }, [id]); // Se re-ejecuta cada vez que cambia el id

  return <div>{tarea?.titulo}</div>;
}

// ✅ Mejor — Server Component en Next.js App Router
// No necesita useEffect porque corre en el servidor
async function TareaDetalle({ id }: { id: number }) {
  const tarea = await fetch(`/api/tareas/${id}`).then(r => r.json());
  return <div>{tarea.titulo}</div>;
}
```

> 💡 **Regla de oro:** Si el componente puede ser un Server Component, evita `useEffect`. Úsalo solo cuando necesitas acceder al browser (window, DOM, eventos).

</details>

<details>
<summary>Ver respuesta técnica</summary>

`useEffect` sincroniza el componente con un **sistema externo** (red, DOM, subscripciones). No es el lugar correcto para derivar estado o calcular valores.

- **Array de dependencias vacío `[]`** → se ejecuta solo al montar (equivale a `componentDidMount`).
- **Con dependencias `[id]`** → se re-ejecuta cada vez que `id` cambia.
- **Sin array** → se ejecuta después de cada render (casi nunca lo que quieres).
- **Función de limpieza** → se ejecuta al desmontar o antes de la siguiente ejecución.

En Next.js con **App Router**, los Server Components hacen el fetch directamente sin `useEffect`, reduciendo el JavaScript enviado al cliente y eliminando el parpadeo del estado de carga inicial.

</details>

---

### 🟢 Fácil — Virtual DOM

**¿Qué es el Virtual DOM y qué ventaja tiene?**

<details>
<summary>Ver respuesta simple</summary>

Piensa en el Virtual DOM como un **borrador antes de escribir en el pizarrón real**:

```
╔══════════════════════════════════════════════════════════╗
║                    CÓMO FUNCIONA                         ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  1. Estado cambia                                        ║
║        │                                                 ║
║        ▼                                                 ║
║  2. React calcula el NUEVO árbol virtual (en memoria)    ║
║        │                                                 ║
║        ▼                                                 ║
║  3. Compara nuevo vs anterior (diffing)                  ║
║     Antes: <li>Tarea A</li>                              ║
║     Ahora:  <li>Tarea A</li> + <li>Tarea B</li>  ← nuevo ║
║        │                                                 ║
║        ▼                                                 ║
║  4. Solo aplica los cambios mínimos al DOM real          ║
║     → Solo agrega el <li>Tarea B</li>                    ║
║     → No toca el resto de la página                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Sin Virtual DOM** (manipulación directa del DOM):
```javascript
// Cada cambio re-pinta todo el componente → lento
document.getElementById('lista').innerHTML = generarHTML(todasLasTareas);
```

**Con Virtual DOM** (React):
```tsx
// React calcula el diff y solo actualiza lo que cambió → eficiente
setTareas(prev => [...prev, nuevaTarea]);
```

> 💡 Beneficio clave: evita **repintados innecesarios** del browser, que son costosos en tiempo y recursos.

</details>

---

### 🟡 Media — Re-renders innecesarios

**¿Cómo evitas re-renders innecesarios?**

<details>
<summary>Ver respuesta simple</summary>

Hay tres herramientas principales, cada una para un caso distinto:

```
╔══════════════════════════════════════════════════════════════════╗
║              HERRAMIENTAS CONTRA RE-RENDERS                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  React.memo ─── Para COMPONENTES                                 ║
║  "Si las props no cambiaron, no vuelvas a renderizar"            ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ const FilaTarea = React.memo(({ tarea }) => (            │    ║
║  │   <li>{tarea.titulo}</li>                                │    ║
║  │ ));                                                      │    ║
║  │ // Solo re-renderiza si tarea cambia                     │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  useCallback ─── Para FUNCIONES                                  ║
║  "Misma referencia de función entre renders"                     ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ const handleEliminar = useCallback((id) => {             │    ║
║  │   eliminarTarea(id);                                     │    ║
║  │ }, []);  // ← sin dependencias, siempre la misma ref     │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  useMemo ─── Para VALORES CALCULADOS                             ║
║  "No recalcules algo costoso si las entradas no cambiaron"       ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ const tareasFiltradas = useMemo(() =>                    │    ║
║  │   tareas.filter(t => t.status === filtro),               │    ║
║  │   [tareas, filtro]  // ← recalcula solo si estos cambian │    ║
║  │ );                                                       │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

> 💡 **No abuses de ellos.** Agregan complejidad. Solo úsalos cuando hay un problema real de rendimiento medible.

</details>

---

### 🟡 Media — `useState` vs `useReducer`

**¿Diferencia entre `useState` y `useReducer`?**

<details>
<summary>Ver respuesta simple</summary>

La diferencia es como manejar **un interruptor de luz** vs **un panel de control de avión**:

```tsx
// ✅ useState — estado simple e independiente
// "Prendo o apago"
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ✅ useReducer — estado complejo con múltiples transiciones
// "Tengo muchos estados relacionados que cambian juntos"
type Estado = { isLoading: boolean; error: string | null; data: Tarea[] };
type Accion =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Tarea[] }
  | { type: 'FETCH_ERROR'; payload: string };

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'FETCH_START':
      return { ...estado, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { isLoading: false, error: null, data: accion.payload };
    case 'FETCH_ERROR':
      return { ...estado, isLoading: false, error: accion.payload };
  }
}

const [estado, dispatch] = useReducer(reducer, { isLoading: false, error: null, data: [] });
dispatch({ type: 'FETCH_START' });
```

**Cuándo elegir cada uno:**

| Situación | Usa |
|---|---|
| 1-2 valores simples | `useState` |
| Muchos valores relacionados que cambian juntos | `useReducer` |
| Transiciones que dependen del estado anterior | `useReducer` |
| Lógica de negocio compleja | `useReducer` (similar a Redux) |

</details>

---

### 🔴 Difícil — Reconciliation

**¿Qué es el Reconciliation?**

<details>
<summary>Ver respuesta simple</summary>

Es el proceso interno de React para decidir **qué parte del DOM actualizar** sin repintar todo. Funciona con dos heurísticas clave:

```
HEURÍSTICA 1 — Si el tipo de elemento cambia, destruye y recrea

  Antes:  <div>   →  Después: <span>
          ↓ React destruye todo el subtree y crea uno nuevo
          Costoso, pero predecible

HEURÍSTICA 2 — La KEY es la identidad en listas

  ❌ Sin key (problemático):
  [<li>Tarea A</li>, <li>Tarea B</li>]
  Si agregas al principio → React cree que Tarea A se convirtió en Tarea C
  → re-renderiza todo innecesariamente

  ✅ Con key (correcto):
  [<li key="1">Tarea A</li>, <li key="2">Tarea B</li>]
  React sabe exactamente qué se movió vs qué es nuevo
  → solo actualiza lo que cambió
```

```tsx
// ❌ Nunca uses el índice del array como key si la lista puede reordenarse
{tareas.map((t, index) => <FilaTarea key={index} tarea={t} />)}

// ✅ Usa un identificador único y estable
{tareas.map(t => <FilaTarea key={t.id} tarea={t} />)}
```

> 💡 **Tip de entrevista:** La `key` no es solo un warning de React. Sin ella, puedes tener bugs de estado en componentes con inputs o animaciones.

</details>

---

### 🟡 Media — Higher Order Components (HOC)

**¿Qué es un Higher Order Component (HOC)?**

<details>
<summary>Ver respuesta simple</summary>

Un HOC es una **función que envuelve un componente** y le agrega comportamiento extra. Como un decorator de funciones:

```
🧩 Componente original:  <Dashboard />
         ↓
🔧 HOC withAuth():       withAuth(<Dashboard />)
         ↓
🎁 Componente nuevo:     <Dashboard /> con verificación de auth
```

```tsx
// HOC clásico — withAuth
function withAuth<T>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user } = useAuth();

    if (!user) {
      return <Redirect to="/login" />;
    }

    return <Component {...props} />;
  };
}

// Uso
const DashboardProtegido = withAuth(Dashboard);
```

**¿Cuándo se prefiere un custom hook en lugar de un HOC?**

```tsx
// ✅ Hoy en día se prefiere el custom hook — más simple y composable
function usePuedeAcceder(role: string) {
  const { user } = useAuth();
  return user?.roles.includes(role) ?? false;
}

// Uso directo en el componente
function AdminPanel() {
  const puedeAcceder = usePuedeAcceder('admin');
  if (!puedeAcceder) return <p>Sin permisos</p>;
  return <div>Panel de admin</div>;
}
```

> 💡 Los HOC siguen siendo válidos en librerías (Redux `connect`, React Router `withRouter`). En código propio, los custom hooks son más claros.

</details>

---

### 🟡 Media — Estado global

**¿Cómo manejas el estado global?**

<details>
<summary>Ver respuesta simple</summary>

El estado global sirve para compartir datos entre múltiples componentes sin tener que pasarlos manualmente de padre a hijo (**prop drilling**). La herramienta correcta depende de qué tipo de dato es y con qué frecuencia cambia:

```
╔══════════════════════════════════════════════════════════════════╗
║          ¿POR QUÉ EXISTE EL ESTADO GLOBAL?                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  PROBLEMA — Prop Drilling                                        ║
║                                                                  ║
║  <App usuario={u}>                                               ║
║    <Layout usuario={u}>           ← no lo usa                    ║
║      <Sidebar usuario={u}>        ← no lo usa                    ║
║        <Avatar usuario={u} />     ← al fin lo usa aquí          ║
║                                                                  ║
║  SOLUCIÓN — Estado global: Avatar consume el dato directamente   ║
║  sin que Layout ni Sidebar lo conozcan                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Las 3 opciones principales:**

```
╔══════════════════════════════════════════════════════════════════╗
║  OPCIÓN           CUÁNDO USARLA              RENDIMIENTO         ║
╠═══════════════════╦══════════════════════════╦═══════════════════╣
║  React Context    ║  Datos estáticos o poco  ║  ⚠️  Re-renderiza  ║
║  (nativo)         ║  cambiantes: sesión,     ║  a TODOS los      ║
║                   ║  tema claro/oscuro       ║  consumidores     ║
╠═══════════════════╬══════════════════════════╬═══════════════════╣
║  Zustand          ║  Estado de UI dinámico:  ║  ✅ Solo actualiza ║
║  (librería)       ║  carrito, filtros,       ║  el componente    ║
║                   ║  modales, wizard         ║  que cambió       ║
╠═══════════════════╬══════════════════════════╬═══════════════════╣
║  Redux Toolkit    ║  Apps empresariales con  ║  ✅ Predecible,   ║
║  (librería)       ║  lógica compleja y       ║  pero más         ║
║                   ║  muchos devs en el equipo║  boilerplate      ║
╚═══════════════════╩══════════════════════════╩═══════════════════╝
```

---

**1. React Context — para datos que cambian poco**

```tsx
// Ideal: sesión del usuario, tema de la app
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  return (
    <AuthContext.Provider value={{ usuario, setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

// En app/layout.tsx — envuelve toda la app una sola vez
<AuthProvider>{children}</AuthProvider>

// En cualquier componente profundo — sin prop drilling
const { usuario } = useContext(AuthContext);
```

> ⚠️ **Limitación:** si el Context cambia frecuentemente (ej: una lista de tareas que se filtra), **todos** los componentes suscritos re-renderizan, aunque no usen el dato que cambió.

---

**2. Zustand — la favorita de la comunidad hoy**

```tsx
// store/tareas.store.ts
import { create } from 'zustand';

interface TareasStore {
  filtro: string;
  setFiltro: (filtro: string) => void;
}

export const useTareasStore = create<TareasStore>((set) => ({
  filtro: '',
  setFiltro: (filtro) => set({ filtro }),
}));

// Componente A — cambia el filtro
function BarraBusqueda() {
  const setFiltro = useTareasStore(s => s.setFiltro); // ← solo suscribe a setFiltro
  return <input onChange={e => setFiltro(e.target.value)} />;
}

// Componente B — consume el filtro (solo este re-renderiza al cambiar)
function ListaTareas() {
  const filtro = useTareasStore(s => s.filtro); // ← solo suscribe a filtro
  // ...
}
```

> ✅ **Ventaja clave de Zustand:** al suscribirte solo al selector que necesitas (`s => s.filtro`), el componente **solo re-renderiza cuando ese dato específico cambia**.

---

**3. Redux Toolkit — el estándar empresarial**

```tsx
// features/tareas/tareas.slice.ts
import { createSlice } from '@reduxjs/toolkit';

const tareasSlice = createSlice({
  name: 'tareas',
  initialState: { items: [], isLoading: false },
  reducers: {
    agregarTarea: (state, action) => {
      state.items.push(action.payload); // Immer lo hace inmutable por dentro
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { agregarTarea, setLoading } = tareasSlice.actions;

// Uso en componente
const dispatch = useDispatch();
dispatch(agregarTarea({ id: 1, titulo: 'Nueva tarea' }));
```

> 💡 Redux brilla en equipos grandes: el historial de acciones en **Redux DevTools** permite ver exactamente qué cambio de estado causó cada bug, como un "time-travel debugging".

---

**Resumen de decisión rápida:**

```
¿Datos de sesión / preferencias?  → React Context
¿Estado de UI interactivo?         → Zustand
¿App grande, equipo numeroso?      → Redux Toolkit
¿Datos que vienen de la API?       → SWR / React Query (no estado global)
```

</details>

---

### 🟡 Media — Reglas de los hooks

**¿Cuáles son las reglas de los hooks en React?**

<details>
<summary>Ver respuesta simple</summary>

Los hooks tienen dos reglas fundamentales que React necesita para funcionar correctamente:

```
╔══════════════════════════════════════════════════════════════════╗
║                   REGLAS DE LOS HOOKS                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  REGLA 1 — Solo en componentes funcionales o custom hooks        ║
║  No se pueden usar en clases, funciones normales o callbacks     ║
║                                                                  ║
║  REGLA 2 — Siempre en el nivel superior del componente           ║
║  NUNCA dentro de: if, for, while, funciones anidadas             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**¿Por qué existe la regla 2?** React identifica cada hook por su **orden de ejecución**. Si ese orden cambia entre renders, React mezcla estados y genera bugs.

```tsx
// ❌ INCORRECTO — hook dentro de un condicional
function Componente({ isOpen }) {
  if (isOpen) {
    useEffect(() => { console.log('abierto'); }, []); // 💥 el orden puede cambiar
  }
  return <div>Hola</div>;
}

// ✅ CORRECTO — la condición va DENTRO del hook
function Componente({ isOpen }) {
  useEffect(() => {
    if (isOpen) { console.log('abierto'); }
  }, [isOpen]);
  return <div>Hola</div>;
}
```

```tsx
// ❌ INCORRECTO — hook después de un return temprano
function Componente({ activo }) {
  if (!activo) return null;               // a veces sale aquí...
  const [count, setCount] = useState(0); // 💥 a veces no llega aquí
  return <div>{count}</div>;
}

// ✅ CORRECTO — todos los hooks antes de cualquier return
function Componente({ activo }) {
  const [count, setCount] = useState(0); // ✅ siempre se ejecuta
  if (!activo) return null;
  return <div>{count}</div>;
}
```

> 💡 Usa `eslint-plugin-react-hooks` en tu proyecto — detecta automáticamente violaciones de estas reglas antes de que lleguen a producción.

</details>

---

### 🟡 Media — Cuántos `useEffect` puede tener un componente

**¿Cuántos `useEffect` puede tener un componente?**

<details>
<summary>Ver respuesta simple</summary>

**Tantos como necesite.** No hay límite. Y de hecho, lo recomendable es tener **varios `useEffect` pequeños y enfocados** en lugar de uno grande con todo:

```tsx
// ❌ Un solo useEffect con múltiples responsabilidades — difícil de mantener
useEffect(() => {
  fetchUsuario(userId).then(setUsuario);           // Responsabilidad 1
  window.addEventListener('resize', handleResize); // Responsabilidad 2
  localStorage.setItem('tema', tema);              // Responsabilidad 3
  return () => window.removeEventListener('resize', handleResize);
}, [userId, tema]); // ← mezcla dependencias de 3 efectos distintos

// ✅ Tres useEffect separados — cada uno con su responsabilidad
useEffect(() => {
  fetchUsuario(userId).then(setUsuario);
}, [userId]); // solo cuando cambia userId

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []); // solo al montar/desmontar

useEffect(() => {
  localStorage.setItem('tema', tema);
}, [tema]); // solo cuando cambia el tema
```

> 💡 Si ves un `useEffect` con muchas dependencias mezcladas, es señal de que debería dividirse.

</details>

---

### 🟡 Media — `useEffect` vs `useLayoutEffect`

**¿Diferencia entre `useEffect` y `useLayoutEffect`?**

<details>
<summary>Ver respuesta simple</summary>

La diferencia está en **cuándo** se ejecutan respecto al pintado del browser:

```
╔══════════════════════════════════════════════════════════════════╗
║              CICLO DE RENDER CON EFECTOS                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. React aplica cambios al DOM real                             ║
║        │                                                         ║
║        ├──► useLayoutEffect  ← SÍNCRONO, antes de pintar        ║
║        │    (bloquea el repintado hasta terminar)                ║
║        │                                                         ║
║        ▼                                                         ║
║  2. El browser PINTA en pantalla (el usuario ve los cambios)     ║
║        │                                                         ║
║        └──► useEffect  ← ASÍNCRONO, después de pintar           ║
║             (no bloquea, se ejecuta en background)               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

```tsx
// ✅ useEffect — 99% de los casos
useEffect(() => {
  fetchTareas().then(setTareas);
}, []);

// ✅ useLayoutEffect — cuando necesitas medir el DOM ANTES de que el usuario lo vea
useLayoutEffect(() => {
  const altura = ref.current.getBoundingClientRect().height;
  setPosicionTooltip(altura); // Con useEffect habría un parpadeo visible
}, []);
```

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Cuándo se ejecuta | Después de pintar | Antes de pintar |
| Bloquea el render | No | Sí |
| Rendimiento | Mejor | Puede causar lag |
| Cuándo usar | Casi siempre | Solo para medir/posicionar DOM |

> 💡 Usa `useLayoutEffect` **solo** si hay un parpadeo visual con `useEffect`. En SSR genera un warning — usa `useEffect` con un estado de "montado" como alternativa.

</details>

---

### 🟡 Media — Componentes controlados vs no controlados

**¿Diferencia entre componentes controlados y no controlados?**

<details>
<summary>Ver respuesta simple</summary>

La diferencia está en **quién controla el valor** de un input de formulario:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  CONTROLADO → React es la fuente de verdad                       ║
║  El estado de React controla lo que muestra el input             ║
║                                                                  ║
║  NO CONTROLADO → el DOM es la fuente de verdad                   ║
║  El DOM guarda el valor, lo leemos con ref cuando lo necesitamos ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

```tsx
// ✅ CONTROLADO — el input siempre muestra lo que dice el estado
function FormControlado() {
  const [email, setEmail] = useState('');
  return (
    <input
      value={email}                            // ← React controla el valor
      onChange={e => setEmail(e.target.value)} // ← actualiza el estado en cada tecla
    />
  );
  // Re-renderiza en cada keystroke → permite validación en tiempo real
}

// ✅ NO CONTROLADO — leemos el valor del DOM solo cuando lo necesitamos
function FormNoControlado() {
  const emailRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => console.log(emailRef.current?.value);
  return (
    <input
      ref={emailRef}
      defaultValue=""  // ← valor inicial, no "value" controlado
    />
  );
  // No re-renderiza en cada keystroke → más performante para forms simples
}
```

| | Controlado | No controlado |
|---|---|---|
| Fuente de verdad | Estado de React | DOM |
| Validación en tiempo real | ✅ Fácil | ❌ Difícil |
| Re-renders | Uno por keystroke | Solo al enviar |
| Cuándo usar | Forms con lógica compleja | Forms simples, `react-hook-form` |

> 💡 **`react-hook-form`** usa componentes no controlados internamente — por eso es tan rápido. Solo re-renderiza al validar o enviar, no en cada keystroke.

</details>

---

### 🟡 Media — `useCallback` vs `useMemo`: diferencia real

**¿Cuál es la diferencia real entre `useCallback` y `useMemo`?**

<details>
<summary>Ver respuesta simple</summary>

Ambos "memorizan", pero lo que guardan es distinto:

```
useMemo     → memoriza el RESULTADO de ejecutar una función (un valor)
useCallback → memoriza la REFERENCIA de una función (sin ejecutarla)
```

```tsx
// useMemo — ejecuta la función y guarda el RESULTADO
const tareasFiltradas = useMemo(() =>
  tareas.filter(t => t.status === filtro),
  [tareas, filtro]
);
// tareasFiltradas es un array []

// useCallback — guarda la FUNCIÓN sin ejecutarla
const handleEliminar = useCallback((id: number) => {
  eliminarTarea(id);
}, []);
// handleEliminar es una función () => {}
```

**Son equivalentes internamente:**

```tsx
// Estos dos hacen exactamente lo mismo:
const fn = useCallback(() => hacerAlgo(a, b), [a, b]);

const fn = useMemo(() => () => hacerAlgo(a, b), [a, b]);
//                  ↑ función que devuelve otra función
```

**¿Por qué importa la referencia estable de una función?**

```tsx
// Sin useCallback → función nueva en cada render → Hijo re-renderiza siempre
function Padre() {
  const handleClick = () => console.log('click'); // nueva ref cada render
  return <Hijo onClick={handleClick} />;
}

// Con useCallback → misma referencia → Hijo NO re-renderiza
function Padre() {
  const handleClick = useCallback(() => console.log('click'), []);
  return <Hijo onClick={handleClick} />;
}

// IMPORTANTE: solo tiene efecto si Hijo está memoizado con React.memo
const Hijo = React.memo(({ onClick }) => <button onClick={onClick}>Click</button>);
```

> 💡 No los uses en exceso. Solo aportan valor junto a `React.memo`. Sin memoización en el hijo son optimización prematura con coste de memoria y complejidad.

</details>

---

### 🟡 Media — Error Boundaries

**¿Qué son los Error Boundaries?**

<details>
<summary>Ver respuesta simple</summary>

Son componentes que **capturan errores** en el árbol de hijos y muestran una UI de fallback en lugar de romper toda la app:

```
SIN Error Boundary:
  Error en <TablaTareas /> → 💥 pantalla blanca, toda la app se rompe

CON Error Boundary:
  Error en <TablaTareas /> → muestra "Algo salió mal" solo en esa sección
  El Header y el resto de la app siguen funcionando ✅
```

```tsx
// Debe ser clase — los hooks no pueden capturar errores de render
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, info.componentStack); // enviar a Sentry, Datadog, etc.
  }

  render() {
    if (this.state.hasError) {
      return (
        <p>
          Algo salió mal.{' '}
          <button onClick={() => this.setState({ hasError: false })}>
            Reintentar
          </button>
        </p>
      );
    }
    return this.props.children;
  }
}

// Uso — granularidad por sección
export default function Dashboard() {
  return (
    <div>
      <Header />
      <ErrorBoundary>
        <TablaTareas />   {/* Fallo aislado */}
      </ErrorBoundary>
      <ErrorBoundary>
        <Estadisticas />  {/* Fallo independiente */}
      </ErrorBoundary>
    </div>
  );
}
```

> ⚠️ Los Error Boundaries **NO capturan:** errores en event handlers (usa `try/catch`), errores asíncronos (`fetch`, `setTimeout`), ni errores del propio Error Boundary.

> 💡 Usa [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) para evitar escribir la clase manualmente — da una API funcional con hooks y soporte para `reset`.

</details>

---

### 🟡 Media — StrictMode

**¿Qué es `StrictMode` y por qué renderiza dos veces en desarrollo?**

<details>
<summary>Ver respuesta simple</summary>

`StrictMode` es una herramienta **solo para desarrollo** que activa comprobaciones extra para detectar problemas antes de producción:

```tsx
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**¿Por qué renderiza dos veces?** Es intencional. React invoca los componentes dos veces para exponer side effects en el render que no deberían estar ahí:

```tsx
// ❌ Código que StrictMode detecta: side effect en el render
let contadorGlobal = 0;
function Componente() {
  contadorGlobal++; // 💥 el render modifica estado externo
  return <div>Renders: {contadorGlobal}</div>;
  // Con StrictMode verás el contador subir de 2 en 2 → señal del problema
}

// ✅ El render debe ser PURO: misma entrada = misma salida
function Componente({ titulo }) {
  return <div>{titulo}</div>;
}
```

**Qué detecta StrictMode:**

```
✅ Efectos con limpieza incompleta
✅ Lógica no idempotente (se rompe si se ejecuta 2 veces)
✅ Side effects dentro del render
✅ Uso de APIs obsoletas de React
```

> 💡 El doble render **solo ocurre en desarrollo, nunca en producción**. Si tu componente falla con StrictMode, hay un bug real — corrígelo, no desactives StrictMode.

</details>

---

### 🔴 Difícil — Cancelar `fetch` con `AbortController`

**¿Cómo cancelas correctamente una petición en `useEffect`?**

<details>
<summary>Ver respuesta simple</summary>

**El problema:** el componente se desmonta antes de que termine el fetch, y React intenta actualizar el estado de algo que ya no existe → memory leak / warning.

```tsx
useEffect(() => {
  // 1. Crear el controlador
  const controller = new AbortController();

  // 2. Vincular la señal al fetch
  fetch('/api/tareas', { signal: controller.signal })
    .then(r => r.json())
    .then(data => setTareas(data))
    .catch(error => {
      if (error.name === 'AbortError') return; // cancelación intencional — ignorar
      setError(error);                         // error real de red o servidor
    });

  // 3. Cancelar al desmontar (o cuando cambien las dependencias)
  return () => controller.abort();
}, []);
```

**Con `async/await`:**

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function cargar() {
    try {
      const res = await fetch('/api/tareas', { signal: controller.signal });
      const data = await res.json();
      setTareas(data);
    } catch (error) {
      if (error.name !== 'AbortError') setError(error);
    }
  }

  cargar();
  return () => controller.abort();
}, []);
```

> 💡 Si usas **SWR o React Query**, esto está resuelto automáticamente. Es otra razón para preferirlos sobre el patrón manual con `useEffect`.

</details>

---

### 🔴 Difícil — `useTransition`

**¿Para qué sirve `useTransition` y cuándo usarlo?**

<details>
<summary>Ver respuesta simple</summary>

`useTransition` (React 18) marca actualizaciones como **"no urgentes"** para que React priorice mantener la UI fluida:

```
SIN useTransition:
  Escribes en el input → React actualiza input + filtra 5000 items
  → UI se congela hasta terminar 😞

CON useTransition:
  Escribes en el input → input se actualiza INMEDIATAMENTE
  → El filtrado ocurre en background sin bloquear la UI ✅
```

```tsx
import { useState, useTransition } from 'react';

function BuscadorTareas({ tareas }) {
  const [query, setQuery] = useState('');
  const [resultado, setResultado] = useState(tareas);
  const [isPending, startTransition] = useTransition();
  //     ↑ true mientras la transición está calculando

  const handleChange = (e) => {
    const valor = e.target.value;

    setQuery(valor); // ← URGENTE: actualiza el input de inmediato

    startTransition(() => {
      // NO URGENTE: React puede interrumpir esto si llega algo más urgente
      setResultado(tareas.filter(t =>
        t.titulo.toLowerCase().includes(valor.toLowerCase())
      ));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Filtrando...</span>}
      <ul>{resultado.map(t => <li key={t.id}>{t.titulo}</li>)}</ul>
    </>
  );
}
```

**¿Cuándo usarlo?**

```
✅ Filtrar / ordenar listas grandes en el cliente
✅ Cambiar de pestaña en una UI con renders costosos
❌ Inputs, clicks, scroll — deben ser siempre urgentes
❌ Peticiones de red — usa SWR/React Query
```

> 💡 Antes de React 18, la solución era `debounce` con `setTimeout`. `useTransition` es más elegante: React gestiona la prioridad automáticamente y puede interrumpir la transición si llega algo más urgente.

</details>

---

## 2. Next.js

---

### 🟡 Media — App Router vs Pages Router

**¿Diferencia entre App Router y Pages Router?**

<details>
<summary>Ver respuesta simple</summary>

Ambos son sistemas de enrutamiento de Next.js, pero difieren en arquitectura y capacidades. El **Pages Router** es el sistema tradicional (basado en archivos dentro de `pages/`), mientras que el **App Router** es el enfoque moderno (basado en carpetas dentro de `app/`) que usa React Server Components por defecto y soporta layouts anidados nativos.

```
╔══════════════════════════════════════════════════════════════════════╗
║              PAGES ROUTER vs APP ROUTER                              ║
╠════════════════════════╦═════════════════════════════════════════════╣
║  Pages Router          ║  App Router (Next.js 13+)                   ║
╠════════════════════════╬═════════════════════════════════════════════╣
║  Basado en archivos    ║  Basado en carpetas                         ║
║  pages/tareas/[id].tsx ║  app/tareas/[id]/page.tsx                   ║
╠════════════════════════╬═════════════════════════════════════════════╣
║  getServerSideProps()  ║  async component + await fetch directo      ║
║  getStaticProps()      ║  generateStaticParams()                     ║
║  pages/api/tareas.ts   ║  app/api/tareas/route.ts                    ║
╠════════════════════════╬═════════════════════════════════════════════╣
║  Layout global en      ║  layout.tsx anidados por ruta               ║
║  _app.tsx (uno solo)   ║  (cada segmento puede tener el suyo)        ║
╠════════════════════════╬═════════════════════════════════════════════╣
║  Client Components     ║  Server Components por defecto              ║
║  por defecto           ║  'use client' solo donde se necesite        ║
╠════════════════════════╬═════════════════════════════════════════════╣
║  Sin loading nativo    ║  loading.tsx = Suspense automático          ║
╚════════════════════════╩═════════════════════════════════════════════╝
```

**¿Qué cambia en la práctica?**

```tsx
// ─── PAGES ROUTER ───────────────────────────────────────────
// El fetch de datos NO vive en el componente, sino en una función aparte
export async function getServerSideProps({ params }) {
  const tarea = await obtenerTarea(params.id);
  return { props: { tarea } }; // Se inyecta como prop
}
export default function DetalleTarea({ tarea }) {
  return <div>{tarea.titulo}</div>;
}

// ─── APP ROUTER ─────────────────────────────────────────────
// El componente ES async — el fetch vive junto a la UI
export default async function DetalleTarea({ params }) {
  const tarea = await obtenerTarea(params.id); // Sin wrapper, más limpio
  return <div>{tarea.titulo}</div>;
}
```

**Layouts anidados — la gran diferencia:**

```
Pages Router — un solo _app.tsx para toda la app
app/
└── _app.tsx  ← layout único global

App Router — cada segmento de ruta puede tener su propio layout
app/
├── layout.tsx              ← layout raíz (header, footer)
├── dashboard/
│   ├── layout.tsx          ← layout solo para /dashboard (sidebar)
│   └── page.tsx
└── auth/
    ├── layout.tsx          ← layout solo para /auth (centrado, sin sidebar)
    └── login/page.tsx
```

> 💡 **Ventaja clave del App Router:** menos JavaScript enviado al cliente (Server Components = 0 JS), layouts anidados sin prop drilling, estados de carga nativos con `loading.tsx`, y el fetch vive junto al componente que lo necesita.

</details>

---

### 🔴 Difícil — Server Components

**¿Qué son los Server Components?**

<details>
<summary>Ver respuesta simple</summary>

Son componentes que **solo existen en el servidor**. Nunca llegan al browser como código JavaScript:

```
╔════════════════════════════════════════════════════════════╗
║           SERVER COMPONENT vs CLIENT COMPONENT             ║
╠══════════════════════╦═════════════════════════════════════╣
║  SERVER COMPONENT    ║  CLIENT COMPONENT ('use client')    ║
╠══════════════════════╬═════════════════════════════════════╣
║  Por defecto en App  ║  Necesita 'use client' al inicio    ║
║  Corre en servidor   ║  Corre en el browser                ║
║  Puede usar async    ║  Puede usar useState, useEffect     ║
║  Accede a DB directo ║  Accede a window, localStorage      ║
║  Variables privadas  ║  Maneja eventos (onClick, onChange) ║
║  0 JS al cliente     ║  Aumenta el bundle del cliente      ║
╚══════════════════════╩═════════════════════════════════════╝
```

```tsx
// ✅ Server Component — query directa a la DB, sin API intermedia
// app/tareas/page.tsx (NO tiene 'use client')
export default async function TareasPage() {
  // Esto corre solo en el servidor, el browser nunca ve este código
  const tareas = await prisma.tarea.findMany();
  return <ListaTareas tareas={tareas} />;  // HTML estático al cliente
}

// ✅ Client Component — maneja interactividad
// components/ListaTareas.tsx
'use client';
export function ListaTareas({ tareas }) {
  const [filtro, setFiltro] = useState('');
  return (
    <>
      <input onChange={e => setFiltro(e.target.value)} />
      {tareas.filter(t => t.titulo.includes(filtro)).map(...)}
    </>
  );
}
```

> 💡 **Patrón recomendado:** Server Components para la capa de datos, Client Components solo para la capa de interactividad. Los Client Components pueden ser "hojas" del árbol.

</details>

---

### 🟡 Media — Streaming y Suspense en Next.js

**¿Cómo funciona el streaming en Next.js?**

<details>
<summary>Ver respuesta simple</summary>

Sin streaming, el usuario espera a que **todo** cargue antes de ver algo. Con streaming, ve el layout inmediatamente y las partes lentas aparecen después:

```
SIN STREAMING:
Usuario espera... espera... espera... ← ve TODO a la vez

CON STREAMING (loading.tsx + Suspense):
[0ms]   Usuario ve el layout y el skeleton inmediatamente
[200ms] Llegan los datos del header
[800ms] Llegan los datos de la tabla principal
[1200ms] Llega el widget de estadísticas (era el más lento)
```

```
app/tareas/
├── layout.tsx        ← Se envía inmediatamente
├── loading.tsx       ← Suspense boundary automático (el skeleton)
└── page.tsx          ← Se envía cuando los datos están listos
```

```tsx
// loading.tsx — se muestra mientras page.tsx carga sus datos
export default function TareasLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-48" />    {/* Skeleton del título */}
      <div className="skeleton h-64 w-full" /> {/* Skeleton de la tabla */}
    </div>
  );
}

// Para control más fino, Suspense manual:
export default async function Dashboard() {
  return (
    <div>
      <Header />  {/* Instantáneo */}
      <Suspense fallback={<Spinner />}>
        <TablaTareas />  {/* Puede tardar más */}
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <Estadisticas />  {/* Independiente, no bloquea TablaTareas */}
      </Suspense>
    </div>
  );
}
```

> 💡 **Beneficio real:** el usuario percibe la app como más rápida porque ve contenido antes. El **Time to First Byte (TTFB)** mejora significativamente.

</details>

---

### 🟡 Media — Proteger rutas

**¿Cómo protegerías una API Route y rutas de página?**

<details>
<summary>Ver respuesta simple</summary>

Hay dos capas de protección en Next.js:

```
╔═════════════════════════════════════════════════════════════════╗
║                    DOS CAPAS DE PROTECCIÓN                      ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  CAPA 1 — Middleware (protege páginas)                          ║
║  Corre ANTES del render, en el Edge                             ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │ // middleware.ts (en la raíz del proyecto)                │  ║
║  │ export function middleware(req: NextRequest) {            │  ║
║  │   const token = req.cookies.get('token')?.value;         │  ║
║  │   if (!token) return NextResponse.redirect('/login');    │  ║
║  │   return NextResponse.next();                            │  ║
║  │ }                                                        │  ║
║  │ export const config = { matcher: ['/dashboard/:path*'] } │  ║
║  └───────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║  CAPA 2 — Route Handler (protege la API)                        ║
║  Verifica el JWT en cada llamada a la API                       ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │ // app/api/tareas/route.ts                               │  ║
║  │ export async function GET(req: NextRequest) {            │  ║
║  │   const token = req.headers.get('Authorization')        │  ║
║  │     ?.replace('Bearer ', '');                           │  ║
║  │   if (!token) return NextResponse.json(                 │  ║
║  │     { error: 'No autorizado' }, { status: 401 }         │  ║
║  │   );                                                    │  ║
║  │   const payload = verificarJWT(token); // lanza si falla│  ║
║  │   // ... lógica de negocio                              │  ║
║  │ }                                                       │  ║
║  └───────────────────────────────────────────────────────────┘  ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
```

> 💡 Siempre protege **ambas capas**. Un usuario puede llamar a la API directamente desde el browser aunque el Middleware bloquee la página.

</details>

---

## 3. Node.js / APIs REST

---

### 🔴 Difícil — El Event Loop

**¿Qué es el Event Loop?**

<details>
<summary>Ver respuesta simple</summary>

Node.js es **single-threaded** (un solo hilo), pero aun así maneja miles de peticiones simultáneas. ¿Cómo? Con el Event Loop:

```
╔══════════════════════════════════════════════════════════════╗
║                    EL EVENT LOOP                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Tu código JS corre aquí      Trabajo pesado va aquí         ║
║  ┌─────────────────────┐      ┌──────────────────────┐       ║
║  │  HILO PRINCIPAL     │      │   THREAD POOL (libuv) │       ║
║  │  (single thread)    │ ───► │  (4 hilos por defecto)│       ║
║  │                     │      │                      │       ║
║  │  • Tu lógica JS     │      │  • Lectura de archivos│       ║
║  │  • Event Loop       │      │  • Queries a la DB   │       ║
║  │  • Callbacks        │ ◄─── │  • Crypto pesado     │       ║
║  └─────────────────────┘      └──────────────────────┘       ║
║           │                                                  ║
║           ▼                                                  ║
║  Fases del Event Loop:                                       ║
║  timers → I/O callbacks → poll → check → close              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

```javascript
// ¿Qué pasa aquí?
console.log('1'); // Síncrono — imprime primero

setTimeout(() => console.log('2'), 0); // Timer — imprime último

Promise.resolve().then(() => console.log('3')); // Microtask — imprime segundo

console.log('4'); // Síncrono — imprime después del 1

// Salida: 1, 4, 3, 2
// Las microtasks (Promises) tienen prioridad sobre los timers
```

> 💡 **Nunca bloquees el Event Loop** con operaciones síncronas pesadas (bucles grandes, JSON.parse de archivos enormes). Usa streams o worker threads para eso.

</details>

---

### 🟢 Fácil — Códigos HTTP

**¿Qué códigos HTTP usas y cuándo?**

<details>
<summary>Ver respuesta simple</summary>

```
╔══════════════════════════════════════════════════════════════════╗
║                    CÓDIGOS HTTP ESENCIALES                       ║
╠══════════╦═══════════════════════════════════════════════════════╣
║  Código  ║  Cuándo usarlo                                        ║
╠══════════╬═══════════════════════════════════════════════════════╣
║  200 OK  ║  GET o PUT exitoso                                    ║
║  201     ║  Recurso creado (POST exitoso)                        ║
║  204     ║  DELETE exitoso (sin contenido que retornar)          ║
╠══════════╬═══════════════════════════════════════════════════════╣
║  400     ║  Input inválido (falta un campo, formato incorrecto)  ║
║  401     ║  No autenticado (falta token o es inválido)           ║
║  403     ║  Autenticado pero sin permisos (token OK, rol NO)     ║
║  404     ║  Recurso no encontrado                                ║
║  409     ║  Conflicto (email duplicado, estado inválido)         ║
║  422     ║  Datos válidos en formato pero semánticamente malos   ║
╠══════════╬═══════════════════════════════════════════════════════╣
║  500     ║  Error inesperado del servidor (nunca expongas detalles)║
╚══════════╩═══════════════════════════════════════════════════════╝
```

> 💡 **Diferencia clave 401 vs 403:** `401` significa "no sé quién eres" (sin autenticar). `403` significa "sé quién eres, pero no puedes hacer eso" (sin autorización).

</details>

---

### 🟡 Media — Principios REST

**¿Qué es REST y qué principios sigue?**

<details>
<summary>Ver respuesta simple</summary>

REST es un **estilo arquitectónico** para diseñar APIs predecibles y escalables. Sus principios clave:

```
1. SIN ESTADO (Stateless)
   Cada request tiene toda la info necesaria.
   El servidor no recuerda el request anterior.
   → El JWT va en cada llamada, no hay "sesión" en el servidor

2. RECURSOS IDENTIFICADOS POR URL
   Los sustantivos (recursos) van en la URL, no los verbos
   ✅ GET /api/tareas/5       → obtener tarea 5
   ✅ DELETE /api/tareas/5    → eliminar tarea 5
   ❌ GET /api/obtenerTarea?id=5   → el verbo no va en la URL

3. MÉTODOS HTTP SEMÁNTICOS
   GET    → leer   (idempotente, sin efectos secundarios)
   POST   → crear  (no idempotente)
   PUT    → reemplazar completo (idempotente)
   PATCH  → actualizar parcial
   DELETE → eliminar (idempotente)

4. REPRESENTACIONES
   El mismo recurso puede retornar JSON, XML, etc.
   Content-Type: application/json

5. INTERFAZ UNIFORME
   Contratos predecibles: si sabes cómo funciona /tareas,
   sabes cómo funcionará /usuarios
```

</details>

---

### 🟡 Media — CORS

**¿Qué es CORS y cómo lo configuras?**

<details>
<summary>Ver respuesta simple</summary>

CORS es una medida de seguridad del **browser** que bloquea requests a un dominio diferente al origen:

```
╔══════════════════════════════════════════════════════════════╗
║                    PROBLEMA CORS                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Browser en:          Intenta llamar a:                      ║
║  https://miapp.com ──► https://api.otraapp.com  ← BLOQUEADO  ║
║                                                              ║
║  El browser dice: "Orígenes distintos, necesito permiso"     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                    SOLUCIÓN                                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  El servidor añade headers que le dicen al browser:          ║
║  "Sí, permito requests desde ese origen"                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

```typescript
// En Next.js — next.config.js
const nextConfig = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://miapp.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
      ],
    }];
  },
};

// En un Route Handler específico
export async function OPTIONS() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
```

> 💡 CORS solo lo verifica el **browser**. Una llamada desde `curl` o Postman no lo aplica. Por eso CORS no es una medida de seguridad en sí misma — es solo una política del browser.

</details>

---

## 4. Consumo de APIs

---

### 🟢 Fácil — `fetch` vs `axios`

**¿`fetch` vs `axios`, cuál prefieres y por qué?**

<details>
<summary>Ver respuesta simple</summary>

```
╔══════════════════════════════════════════════════════════════╗
║                   fetch vs axios                             ║
╠════════════════════════╦═════════════════════════════════════╣
║  fetch (nativo)        ║  axios (librería)                   ║
╠════════════════════════╬═════════════════════════════════════╣
║  Sin dependencias      ║  npm install axios                  ║
║  Browser + Node 18+    ║  Funciona en cualquier entorno      ║
║  res.json() manual     ║  JSON automático                    ║
║  No lanza en 4xx/5xx   ║  Lanza error en 4xx/5xx             ║
║  Sin timeout por defecto║  Timeout configurable              ║
║  Sin interceptores     ║  Interceptores de req/res           ║
╚════════════════════════╩═════════════════════════════════════╝
```

```typescript
// Con fetch — hay que verificar res.ok manualmente
const res = await fetch('/api/tareas');
if (!res.ok) throw new Error(`Error ${res.status}`);  // fetch NO lanza en 404
const data = await res.json();

// Con axios — lanza automáticamente en errores HTTP
try {
  const { data } = await axios.get('/api/tareas'); // data ya es el objeto
} catch (err) {
  // Aquí llega si el servidor retorna 4xx o 5xx
}
```

> 💡 **Mi preferencia:** `fetch` + `SWR` para el cliente, `fetch` nativo en Server Components. Si el proyecto ya tiene axios y usa interceptores para el token, lo mantengo.

</details>

---

### 🔴 Difícil — SWR

**¿Qué es SWR y qué ventajas tiene sobre `useEffect + fetch`?**

<details>
<summary>Ver respuesta simple</summary>

SWR (stale-while-revalidate) es una librería de data fetching que **reemplaza el patrón clásico** de `useEffect + fetch + useState`:

```tsx
// ❌ El patrón manual: 20 líneas de boilerplate
function ListaTareas() {
  const [tareas, setTareas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/tareas')
      .then(r => r.json())
      .then(data => { setTareas(data); setIsLoading(false); })
      .catch(err => { setError(err); setIsLoading(false); });
  }, []);

  if (isLoading) return <Spinner />;
  if (error) return <p>Error</p>;
  return <ul>{tareas.map(...)}</ul>;
}

// ✅ Con SWR: 5 líneas, mismo resultado + features extra
function ListaTareas() {
  const { data: tareas, error, isLoading } = useSWR('/api/tareas', fetcher);

  if (isLoading) return <Spinner />;
  if (error) return <p>Error</p>;
  return <ul>{tareas.map(...)}</ul>;
}
```

**Features extra que el patrón manual no tiene:**

```
✅ Cache global por key  → 2 componentes con la misma key comparten datos
✅ Revalidación al volver al tab  → datos siempre frescos sin código extra
✅ Deduplicación  → 5 componentes que piden la misma key = 1 solo request
✅ mutate()  → actualización optimista (UI antes de confirmar el servidor)
✅ Retry automático en errores de red
```

```tsx
// mutate — actualización optimista después de un POST
const { data: tareas, mutate } = useSWR('/api/tareas', fetcher);

async function crearTarea(nuevaTarea) {
  // Actualiza la UI inmediatamente (antes de que el servidor responda)
  mutate([...tareas, { ...nuevaTarea, id: 'temp' }], false);
  await fetch('/api/tareas', { method: 'POST', body: JSON.stringify(nuevaTarea) });
  mutate(); // Revalida con los datos reales del servidor
}
```

</details>

---

## 5. TypeScript

---

### 🟢 Fácil — `interface` vs `type`

**¿Qué es una `interface` vs `type` en TypeScript?**

<details>
<summary>Ver respuesta simple</summary>

```typescript
// interface — para definir la forma de objetos, extensible
interface Tarea {
  id: number;
  titulo: string;
  completada: boolean;
}

// Se puede extender con extends
interface TareaConAutor extends Tarea {
  autor: string;
}

// Declaration merging — puedes "agregar" a una interface existente
interface Tarea {
  prioridad: number; // Se fusiona con la interface original
}

// ─────────────────────────────────────────────

// type — más flexible, puede representar cualquier tipo
type ID = number | string;  // Unión — imposible con interface
type Nullable<T> = T | null;  // Genérico complejo

type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada'; // Union de strings

// También puede definir objetos, como interface
type Tarea = {
  id: number;
  titulo: string;
};
```

**Cuándo usar cada uno:**

| Usa `interface` | Usa `type` |
|---|---|
| Objetos de dominio (`Tarea`, `Usuario`) | Uniones (`'pendiente' \| 'activa'`) |
| Cuando otros la extenderán | Intersecciones (`TipoA & TipoB`) |
| APIs públicas de librerías | Tipos utilitarios o alias |

> 💡 En la práctica la diferencia es pequeña. Lo más importante es ser **consistente** dentro del proyecto.

</details>

---

## 6. GCP

---

### 🟡 Media — Servicios de GCP

**¿Qué servicios de GCP conoces?**

<details>
<summary>Ver respuesta simple</summary>

```
╔══════════════════════════════════════════════════════════════════╗
║                  SERVICIOS GCP CLAVE                             ║
╠═══════════════════════╦══════════════════════════════════════════╣
║  Servicio             ║  Para qué sirve                          ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Cloud Run            ║  Deploy de contenedores Docker sin        ║
║                       ║  gestionar servidores (serverless)        ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Cloud SQL            ║  PostgreSQL/MySQL managed                 ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Cloud Storage        ║  Archivos, imágenes, backups              ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Cloud Build          ║  CI/CD — build + test + deploy automático ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Secret Manager       ║  Variables sensibles encriptadas          ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  IAM                  ║  Gestión de permisos y roles              ║
╠═══════════════════════╬══════════════════════════════════════════╣
║  Firestore            ║  Base de datos NoSQL (documentos)         ║
╚═══════════════════════╩══════════════════════════════════════════╝
```

</details>

---

### 🟡 Media — Deploy en Cloud Run

**¿Cómo desplegarías este proyecto en Cloud Run?**

<details>
<summary>Ver respuesta paso a paso</summary>

```bash
# 1. Construir la imagen Docker
docker build -t gcr.io/[PROJECT_ID]/mi-app .

# 2. Autenticarse en GCP
gcloud auth login
gcloud config set project [PROJECT_ID]

# 3. Push al Container Registry
docker push gcr.io/[PROJECT_ID]/mi-app

# 4. Deploy a Cloud Run
gcloud run deploy mi-app \
  --image gcr.io/[PROJECT_ID]/mi-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

**Configurar variables de entorno de forma segura:**

```bash
# En lugar de pasar las variables en texto plano, usar Secret Manager
gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql://..."
gcloud secrets create JWT_SECRET --data-file=- <<< "mi-secreto"

# Referenciar los secretos en Cloud Run
gcloud run deploy mi-app \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --set-secrets JWT_SECRET=JWT_SECRET:latest
```

> 💡 **Nunca pongas el `DATABASE_URL` ni el `JWT_SECRET` directamente en el comando de deploy** — quedan en el historial del terminal. Usa Secret Manager.

</details>

---

### 🟡 Media — Cloud Build y secretos

**¿Qué es Cloud Build y cómo manejas los secretos?**

<details>
<summary>Ver respuesta simple</summary>

**Cloud Build** es el CI/CD de GCP. Se activa con cada push a GitHub y ejecuta pasos definidos en `cloudbuild.yaml`:

```yaml
# cloudbuild.yaml
steps:
  # Paso 1: Construir la imagen
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/mi-app', '.']

  # Paso 2: Correr tests
  - name: 'node:22'
    entrypoint: 'npm'
    args: ['test']

  # Paso 3: Push al registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mi-app']

  # Paso 4: Deploy automático a Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'gcloud'
      - 'run'
      - 'deploy'
      - 'mi-app'
      - '--image=gcr.io/$PROJECT_ID/mi-app'
      - '--region=us-central1'
```

**Secret Manager** guarda las variables sensibles encriptadas en GCP. Cloud Run las referencia directamente sin que aparezcan en el código ni en el repositorio.

</details>

---

## 7. Jira & Metodología

---

### 🟢 Fácil — Organización en Jira

**¿Cómo organizas tu trabajo en Jira?**

<details>
<summary>Ver respuesta simple</summary>

```
FLUJO DE UNA TAREA EN JIRA:

Backlog → To Do → In Progress → In Review → Done

Cada issue tiene:
├── Descripción + criterio de aceptación (cómo sé que está listo)
├── Estimación en story points (Fibonacci: 1, 2, 3, 5, 8)
├── Etiqueta: feature / bug / chore / tech-debt
└── Link al PR de GitHub

Al empezar:  muevo a "In Progress" + creo rama feat/JIRA-123-nombre
Al terminar: creo PR con "Closes JIRA-123" en la descripción
             muevo a "In Review"
Al hacer merge: Jira lo cierra automáticamente si está integrado con GitHub
```

</details>

---

### 🟢 Fácil — Ciclo de Sprint

**¿Has trabajado con Sprints?**

<details>
<summary>Ver respuesta simple</summary>

```
SPRINT DE 2 SEMANAS:

Lunes semana 1 — Sprint Planning
  • El equipo selecciona issues del backlog
  • Se estiman con story points (Fibonacci)
  • Se define el objetivo del sprint

Diario — Standup (15 min máximo)
  • ¿Qué hice ayer?
  • ¿Qué haré hoy?
  • ¿Tengo algún bloqueo?

Viernes semana 2 — Sprint Review
  • Demo de lo que se construyó al equipo / stakeholders

Mismo viernes — Retrospectiva
  • ¿Qué salió bien?
  • ¿Qué podemos mejorar?
  • Acción concreta para el siguiente sprint
```

> 💡 **Story points con Fibonacci:** los números no crecen linealmente (1,2,3,5,8,13) a propósito. La incertidumbre crece con la complejidad — una tarea de 8 puntos no es 8 veces una de 1 punto, es muchísimo más incierta.

</details>

---

## 8. Trabajo remoto / Soft skills

---

### 🟢 Fácil — Organización remota

**¿Cómo te organizas trabajando remoto?**

<details>
<summary>Ver respuesta</summary>

- **Horario fijo y espacio dedicado** — sin mezclar trabajo con vida personal.
- **Jira actualizado** — el equipo ve mi progreso sin tener que preguntarme.
- **Commits frecuentes** — visibilidad técnica de en qué estoy.
- **Comunicación proactiva** — si hay un bloqueo o retraso, aviso antes de que el equipo lo note.
- **Cámara encendida** en videollamadas — genera confianza y presencia.
- **Decisiones técnicas documentadas** en Confluence o en el propio repositorio (ADR).

> 💡 En remoto, la **comunicación proactiva** vale más que el talento técnico. El silencio se interpreta como inactividad.

</details>

---

### 🟡 Media — Bloqueos técnicos y code review

**¿Cómo manejas bloqueos técnicos y feedback de code review?**

<details>
<summary>Ver respuesta</summary>

**Bloqueos técnicos:**

```
1. Investigo 30-60 minutos (docs, StackOverflow, issues del repo)
2. Si no resuelvo, escalo con contexto claro:
   • Qué intenté hacer
   • Qué esperaba que pasara
   • Qué pasó en realidad
   • Qué intenté para solucionarlo
3. Nunca bloqueo al equipo por orgullo — el costo de mi silencio
   lo paga todo el sprint
```

**Feedback de code review:**

```
• El comentario es sobre el código, no sobre mí
• Respondo con apertura y agradezco el contexto
• Si no entiendo el comentario, pido que me expliquen el "por qué"
• Si tengo una opinión diferente, la argumento con datos técnicos
• El objetivo es que el código del equipo sea mejor, no "ganar"
```

</details>

---

## 9. Preguntas técnicas difíciles

---

### 🔴 Difícil — Problema N+1

**¿Qué es el problema N+1 en ORMs?**

<details>
<summary>Ver respuesta simple</summary>

Es cuando traes una lista y luego **haces una query adicional por cada item** para traer datos relacionados:

```typescript
// ❌ PROBLEMA N+1 — 1 query para tareas + N queries para sus autores
const tareas = await prisma.tarea.findMany(); // 1 query
for (const tarea of tareas) {
  const autor = await prisma.usuario.findUnique({ where: { id: tarea.autorId } });
  // Si hay 100 tareas → 101 queries al total 💀
}

// ✅ SOLUCIÓN — 1 sola query con JOIN
const tareas = await prisma.tarea.findMany({
  include: {
    autor: true,       // JOIN con tabla usuarios
    etiquetas: true,   // JOIN con tabla etiquetas
  },
});
// Resultado: 1 query con todos los datos ✅
```

```
SIN INCLUDE:  1 + N queries   → con 100 tareas = 101 requests a la DB
CON INCLUDE:  1 query         → siempre 1 request, sin importar el tamaño
```

> 💡 En Prisma también puedes usar `select` en lugar de `include` para traer solo los campos que necesitas, reduciendo el payload de la query.

</details>

---

### 🔴 Difícil — Hydration mismatch en Next.js

**¿Qué es el hydration mismatch?**

<details>
<summary>Ver respuesta simple</summary>

Es un error que ocurre cuando el HTML que genera el **servidor** es diferente al que React genera en el **cliente** al "hidratar" (activar) la página:

```
SERVIDOR genera: <p>Bienvenido, el tiempo es 14:32</p>
       ↓
Browser recibe el HTML del servidor y lo muestra
       ↓
React en el cliente intenta "hidratar" (hacer el HTML interactivo)
React genera: <p>Bienvenido, el tiempo es 14:33</p>  ← diferente!
       ↓
💥 Warning: Text content did not match
```

**Causas comunes y soluciones:**

```tsx
// ❌ Date.now() da diferente en servidor y cliente
function Saludo() {
  return <p>Hora: {new Date().toLocaleTimeString()}</p>;
}

// ✅ Solución 1: marcar como 'use client' y usar useEffect
'use client';
function Saludo() {
  const [hora, setHora] = useState('');
  useEffect(() => setHora(new Date().toLocaleTimeString()), []);
  return <p>Hora: {hora}</p>;
}

// ✅ Solución 2: suppressHydrationWarning para casos inevitables
function Saludo() {
  return <time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>;
}

// ❌ Acceder a window/localStorage en un Server Component
function Componente() {
  const tema = localStorage.getItem('tema'); // 💥 window no existe en servidor
}
// ✅ Solución: 'use client' + useEffect
```

> 💡 Regla simple: si accedes a `window`, `document`, `localStorage`, `navigator` o generas valores aleatorios/de tiempo → el componente **debe** ser `'use client'`.

</details>

---

### 🔴 Difícil — Rendimiento de listas grandes

**¿Cómo optimizarías el rendimiento de una lista de 10,000 registros en React?**

<details>
<summary>Ver respuesta simple</summary>

Hay tres niveles de solución, de menor a mayor complejidad:

```
NIVEL 1 — Paginación en el servidor (lo primero que intentar)
  No traer los 10,000 registros de una vez.
  GET /api/tareas?page=1&limit=20
  → Solo 20 registros en memoria, re-fetch al cambiar página
  → Solución más simple y efectiva

NIVEL 2 — Infinite scroll / cursor-based pagination
  GET /api/tareas?cursor=abc123&limit=20
  → Carga más al hacer scroll, sin páginas discretas
  → Mejor UX que la paginación clásica

NIVEL 3 — Virtualización (si DEBES renderizar miles en el cliente)
  Solo renderiza los items visibles en el viewport.
  El resto existe "virtualmente" pero no está en el DOM.
```

```tsx
// Virtualización con react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function ListaGrande({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // altura estimada de cada fila
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.index}
            style={{ position: 'absolute', top: virtualItem.start }}
          >
            {items[virtualItem.index].titulo}
          </div>
        ))}
      </div>
    </div>
  );
}
```

> 💡 En una entrevista, siempre menciona primero la paginación en servidor. La virtualización es el último recurso cuando los datos *deben* estar en cliente.

</details>

---

### 🔴 Difícil — Vulnerabilidades en paquetes NPM

**¿Cuál sería la solución técnica para no estar afecto a vulnerabilidades en paquetes NPM?**

<details>
<summary>Ver respuesta simple</summary>

Los paquetes de NPM son código de terceros que ejecutas en tu proyecto. Una dependencia comprometida o desactualizada puede introducir vulnerabilidades de seguridad sin que lo notes. La defensa se organiza en tres capas:

```
╔══════════════════════════════════════════════════════════════════╗
║              CAPAS DE DEFENSA CONTRA VULNERABILIDADES NPM        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  CAPA 1 — Detección (saber qué tienes)                           ║
║  CAPA 2 — Prevención (no dejar entrar lo malo)                   ║
║  CAPA 3 — Automatización (que el CI/CD te proteja)               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**CAPA 1 — Detección: auditar lo que ya tienes**

```bash
# Escanea todas las dependencias contra la base de datos de vulnerabilidades de NPM
npm audit

# Si encuentra vulnerabilidades, intenta corregirlas automáticamente
npm audit fix

# Para vulnerabilidades que requieren cambios de versión mayor (breaking changes)
npm audit fix --force   # ⚠️ Revisar manualmente después
```

```
Salida típica de npm audit:
┌─────────────────────────────────────────────────────┐
│ high   │ Prototype Pollution in lodash               │
│ Path   │ tu-app > alguna-lib > lodash                │
│ Fix    │ Update lodash to 4.17.21                    │
└─────────────────────────────────────────────────────┘
```

---

**CAPA 2 — Prevención: buenas prácticas en el día a día**

```bash
# 1. Bloquear versiones exactas con lockfile (nunca ignorar en git)
# package-lock.json / pnpm-lock.yaml → siempre commitearlo
# Garantiza que todos instalen exactamente las mismas versiones

# 2. Preferir versiones estables y con mantenimiento activo
# ✅ "lodash": "4.17.21"     ← versión exacta
# ⚠️ "lodash": "^4.0.0"     ← acepta cualquier minor (más riesgo)
# ❌ "lodash": "*"           ← acepta cualquier versión (nunca hacer esto)

# 3. Revisar un paquete ANTES de instalarlo
npx npm-check-updates        # ve qué dependencias tienen updates disponibles
```

```typescript
// 4. Principio de mínima dependencia
// Antes de instalar una librería, pregúntate:
// - ¿Puedo hacerlo con 10 líneas de código propio?
// - ¿Cuándo fue el último commit del repo?
// - ¿Cuántas dependencias transitivas trae?

// ❌ Instalar una librería de 50KB solo para formatear una fecha
import { formatDate } from 'super-date-lib';

// ✅ Usar la API nativa del browser / Node
new Intl.DateTimeFormat('es-CL').format(new Date());
```

---

**CAPA 3 — Automatización: que el CI/CD te avise antes de llegar a producción**

```yaml
# GitHub Actions — .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 9 * * 1'  # Cada lunes a las 9am (auditoría semanal automática)

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci           # Instala con lockfile estricto
      - run: npm audit --audit-level=high  # Falla el build si hay vulnerabilidades HIGH o CRITICAL
```

```
Con --audit-level=high:
  low / moderate  → el build continúa (avisa pero no bloquea)
  high / critical → el build FALLA ← no llega a producción ✅
```

---

**Herramientas adicionales del ecosistema:**

```
┌────────────────────┬──────────────────────────────────────────────┐
│  Herramienta       │  Qué hace                                    │
├────────────────────┼──────────────────────────────────────────────┤
│  Dependabot        │  PR automáticos de GitHub cuando hay updates │
│  (GitHub nativo)   │  de seguridad en tus dependencias            │
├────────────────────┼──────────────────────────────────────────────┤
│  Snyk              │  Escaneo más profundo, incluye              │
│                    │  dependencias transitivas y Docker images    │
├────────────────────┼──────────────────────────────────────────────┤
│  Socket.dev        │  Detecta paquetes maliciosos ANTES de        │
│                    │  instalarlos (supply chain attacks)          │
└────────────────────┴──────────────────────────────────────────────┘
```

**Resumen de acción concreta:**

```
1. npm audit          → revisar estado actual del proyecto
2. Lockfile en git    → versiones exactas garantizadas en todos los entornos
3. npm audit en CI    → ninguna vulnerabilidad HIGH llega a producción
4. Dependabot         → actualizaciones automáticas sin esfuerzo manual
```

> 💡 **El riesgo más subestimado:** las **dependencias transitivas** — no es tu código ni una librería que tú instalaste directamente, sino una dependencia de una dependencia. Por eso `npm audit` escanea todo el árbol, no solo tu `package.json`.

</details>

---

## 10. Preguntas sobre el proyecto

---

### ¿Por qué elegiste Prisma?

<details>
<summary>Ver respuesta</summary>

Por su excelente **DX (Developer Experience)**:

- **Schema declarativo** en `prisma.schema` — los modelos se leen como documentación.
- **Migraciones automáticas** — `prisma migrate dev` genera el SQL a partir del schema.
- **Cliente tipado generado** — autocompletado completo, los tipos reflejan la DB real.
- **Queries legibles** — más expresivo que raw SQL o Sequelize para la mayoría de casos.

El enfoque **schema-first** hace que los cambios de modelo sean explícitos y trackeados en git — cualquier miembro del equipo puede ver la evolución de la base de datos.

</details>

---

### ¿Cómo funciona la autenticación en tu app?

<details>
<summary>Ver respuesta</summary>

```
1. Usuario envía email + password
        │
        ▼
2. API /api/login verifica con bcrypt
   bcrypt.compare(password, hash_en_db)
        │
        ▼
3. Si es correcto, genera JWT
   jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '8h' })
        │
        ▼
4. Cliente guarda el token (cookie httpOnly en producción)
        │
        ▼
5. Middleware de Next.js verifica el token en cada request
   a rutas protegidas → redirige a /login si falla
        │
        ▼
6. Token expira en 8 horas → el usuario vuelve a hacer login
```

> 💡 **Cookie httpOnly** es más seguro que localStorage porque JavaScript del cliente no puede leerla, protegiéndola de ataques XSS.

</details>

---

### ¿Cómo resolviste el bug de timezone?

<details>
<summary>Ver respuesta</summary>

El input `<input type="date">` entrega una string con formato `"2026-04-20"`.

**El problema:**
```javascript
new Date("2026-04-20")
// → JavaScript lo interpreta como UTC medianoche (00:00 UTC)
// → En Chile (UTC-3) eso es las 21:00 del DÍA ANTERIOR
// → La fecha guardada en DB queda un día antes de la elegida 🐛
```

**La solución:**
```javascript
// Agregar la hora como string local, sin la 'Z' (que indica UTC)
new Date("2026-04-20T12:00:00")
// → JS lo interpreta como hora LOCAL (no UTC)
// → En Chile serían las 12:00 del 20 de abril → correcto ✅
```

La clave es que `new Date("YYYY-MM-DD")` asume UTC, pero `new Date("YYYY-MM-DDTHH:MM:SS")` (sin `Z`) asume hora local del sistema.

</details>

---

### ¿Por qué Docker en lugar de Nixpacks para Railway?

<details>
<summary>Ver respuesta</summary>

Railway usa **Nixpacks** por defecto, que toma un snapshot de nixpkgs. El problema: ese snapshot tenía solo Node `20.18` y `22.11`, pero Prisma 7 requiere Node `^20.19 || ^22.12 || >=24`.

Con un **Dockerfile propio** usamos `node:22-slim` de Docker Hub, que siempre tiene la versión más reciente de la rama 22 (`22.x.x`). Esto resuelve el conflicto de versiones y nos da control total sobre el entorno de ejecución.

> 💡 Este tipo de bug es muy común al usar herramientas "mágicas" de deploy. Saber escribir un Dockerfile básico te desbloquea de estas restricciones.

</details>

---

## 11. Checklist antes de la entrevista

- [ ] Tener el proyecto corriendo localmente (`npm run dev`)
- [ ] Poder explicar cada archivo en máximo 2 minutos
- [ ] Practicar en voz alta las respuestas de React y Next.js
- [ ] Revisar conceptos de GCP Cloud Run y Cloud Build
- [ ] Tener lista la historia del bug de timezone para contarla con fluidez
- [ ] Preparar 2-3 preguntas inteligentes para hacerle al entrevistador:
  - *¿Cómo está estructurado el equipo de frontend?*
  - *¿Qué stack usa el equipo actualmente en proyectos activos?*
  - *¿Cómo es el proceso de onboarding para proyectos nuevos?*
  - *¿Cuáles son los principales desafíos técnicos que enfrenta el equipo hoy?*
