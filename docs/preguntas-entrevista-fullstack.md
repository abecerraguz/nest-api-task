# Preguntas de entrevista — Fullstack Developer

> **Oferta:** Consultor Fullstack — NestJS, Arquitectura Hexagonal, Azure, CI/CD
> **Empresa:** Santiago, Chile (consultora)
> **Preparado para:** Alejandro Becerra

---

## Índice

1. [NestJS & TypeScript](#1-nestjs--typescript)
2. [Arquitectura Hexagonal](#2-arquitectura-hexagonal)
3. [Azure & Cloud](#3-azure--cloud)
4. [CI/CD & DevOps](#4-cicd--devops)
5. [Preguntas conductuales](#5-preguntas-conductuales)

---

## 1. NestJS & TypeScript

---

### 🔴 Difícil — Ciclo de vida de una request

**Explica el ciclo de vida de una request en NestJS. ¿En qué orden se ejecutan Middleware, Guards, Interceptors y Pipes?**

<details>
<summary>Ver respuesta simple</summary>

Imagina que una request es como un cliente entrando a un restaurante:

```
🧑 Cliente (Request) entra al restaurante
    │
    ▼
🍽️ MOZO (Middleware) ─── Recibe al cliente, anota pedido crudo
    │
    ▼
🔐 GUARDIA (Guard) ─── ¿Está autorizado? ¿Tiene rol para entrar?
    │
    ▼
⏱️ CRONÓMETRO (Interceptor - antes) ─── Empieza a medir tiempo
    │
    ▼
📋 CHEF (Pipe) ─── Transforma los ingredientes (valida datos)
    │
    ▼
👨‍🍳 COCINA (Handler) ─── Prepara el plato (ejecuta lógica)
    │
    ▼
⏱️ CRONÓMETRO (Interceptor - después) ─── Termina de medir
    │
    ▼
🚨 ALERTA (ExceptionFilter) ─── Si algo salió mal, maneja el error
    │
    ▼
🍽️ MOZO trae el plato al cliente (Response)
```

**En código sería así:**

```typescript
// 1. MIDDLEWARE - Acceso crudo, sin contexto NestJS
app.use((req, res, next) => {
  console.log('Llegó request:', req.url);
  next(); // Continúa al siguiente paso
});

// 2. GUARD - ¿Puede continuar?
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    // Verifica si el usuario está autenticado
    return this.authService.isAuthenticated();
  }
}

// 3. INTERCEPTOR - Mide tiempo, transforma respuesta
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context, next) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`Duró ${Date.now() - start}ms`))
    );
  }
}

// 4. PIPE - Valida y transforma datos
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

> 💡 **En tu proyecto `nest-api-task`:** El `ValidationPipe` ya está configurado en el controller, actúa como chef que revisa que los ingredientes (datos) estén correctos antes de cocinar (ejecutar el handler).

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

El orden exacto es:

```
Middleware → Guard → Interceptor (antes) → Pipe → Handler → Interceptor (después) → ExceptionFilter
```

- **Middleware**: acceso crudo a `req`/`res`, sin contexto NestJS. Útil para logging global o parseo de headers.
- **Guard**: decide si la request puede continuar. Retorna `true` o `false`. Se usa para autenticación y autorización.
- **Interceptor**: envuelve el handler. Puede transformar la respuesta, medir tiempos, o implementar caché.
- **Pipe**: transforma y valida los parámetros antes de llegar al handler. El `ValidationPipe` actúa aquí.

> 💡 **Tip para la entrevista:** En tu proyecto `nest-api-task` puedes mostrar cómo usarías un Guard de roles junto al `ValidationPipe` ya configurado en el controller de tareas.

</details>

---

### 🟡 Media — Scopes de inyección

**¿Cuál es la diferencia entre `@Injectable()` con scope `DEFAULT`, `REQUEST` y `TRANSIENT`? ¿Cuándo usarías cada uno?**

<details>
<summary>Ver respuesta simple</summary>

Piensa en esto como服务员 en un restaurante:

```
╔══════════════════════════════════════════════════════════════╗
║                    SCOPES DE INYECCIÓN                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  DEFAULT (Singleton) ─── El mismo mozo atiende a TODOS       ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │  Mesa 1 │ Mesa 2 │ Mesa 3 │ Mesa 4 │                │     ║
║  │    🧑    │   🧑   │   🧑   │   🧑   │  ← El mismo!  │     ║
║  └─────────────────────────────────────────────────────┘     ║
║  ✅ Para servicios que NO guardan estado por request         ║
║  ✅ Más eficiente, usa menos memoria                         ║
║                                                              ║
║  REQUEST ─── Cada request tiene su propio mozo               ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │  Request 1 → 🧑 (mozo dedicado)                    │     ║
║  │  Request 2 → 🧑 (otro mozo, no comparte estado)   │     ║
║  │  Request 3 → 🧑 (otro mozo más)                    │     ║
║  └─────────────────────────────────────────────────────┘     ║
║  ✅ Cuando necesitas datos específicos del usuario actual    ║
║  ✅ Ejemplo: inyectar el "tenant ID" en una app multi-tenant ║
║                                                              ║
║  TRANSIENT ─── Cada vez que pides, te dan un mozo nuevo      ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │  getService() → 🧑                                  │     ║
║  │  getService() → 🧑 (diferente!)                     │     ║
║  │  getService() → 🧑 (otro más!)                      │     ║
║  └─────────────────────────────────────────────────────┘     ║
║  ⚠️ Raro de usar, para objetos con estado mutable interno    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Ejemplo práctico:**

```typescript
// DEFAULT - Un solo instance para toda la app
@Injectable({ scope: Scope.DEFAULT })
export class TasksService {
  // Este servicio se comparte entre todos los requests
  // NO tiene estado que cambie entre requests
}

// REQUEST - Nueva instancia por cada request
@Injectable({ scope: Scope.REQUEST })
export class CurrentUserService {
  constructor(@InjectREQUEST() private request: any) {
    // Aquí puedes acceder a datos específicos del request
    this.userId = request.user?.id;
    this.tenantId = request.headers['x-tenant-id'];
  }
}
```

**En tu proyecto hexagonal:**

```typescript
// Los use cases son DEFAULT porque:
// - No guardan estado entre requests
// - Son Stateless (sin estado)
@Injectable()
export class CreateTaskUseCase {
  constructor(private readonly repo: TaskRepositoryPort) {}
  // No importa qué request vino, siempre hace lo mismo
}
```

> 💡 **Ejemplo del mundo real:** En una app de bancos multi-tenant (muchos bancos en la misma app), cada request debe saber "soy del banco A o del banco B". Se usa `REQUEST` scope para inyectar el tenant correcto.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

| Scope | Comportamiento | Cuándo usarlo |
|---|---|---|
| `DEFAULT` (Singleton) | Una instancia por módulo, compartida en toda la app | La gran mayoría de servicios y casos de uso |
| `REQUEST` | Nueva instancia por cada request HTTP | Cuando necesitas inyectar datos del contexto (usuario autenticado, tenant ID) |
| `TRANSIENT` | Nueva instancia cada vez que se inyecta | Objetos con estado mutable interno (poco frecuente) |

En la arquitectura hexagonal de `nest-api-task`, los casos de uso como `CreateTaskUseCase` son buenos candidatos a `DEFAULT` porque no tienen estado entre requests.

> 💡 **Tip:** Si el cliente usa multi-tenancy en Azure SQL Database, el scope `REQUEST` para inyectar el tenant actual es un patrón habitual en consultoría.

</details>

---

### 🔴 Difícil — RBAC (Control de Acceso Basado en Roles) con Guards (Un Guard en NestJS es un guardián que se ejecuta antes de que una request llegue al handler del controller)

**¿Cómo implementarías autorización basada en roles (RBAC) en NestJS sin acoplar la lógica al controlador?**

<details>
<summary>Ver respuesta simple</summary>

**La idea es simple:** El controlador solo dice "qué roles necesito", y un "portero" verifica si el usuario tiene esos roles.

```
╔════════════════════════════════════════════════════════════════╗
║                        RBAC EN NESTJS                         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║   🧑 Usuario quiere borrar una tarea                            ║
║        │                                                      ║
║        ▼                                                      ║
║   🚪 Controller dice: "Necesito rol 'admin'"                   ║
║        │                                                      ║
║        ▼                                                      ║
║   👮 Guard (portero) pregunta: "¿Tienes rol admin?"           ║
║        │                                                      ║
║        ├─── Sí ──→ ✅ Deja pasar, ejecuta el delete           ║
║        │                                                      ║
║        └─── No ──→ ❌ 403 Forbidden "No tienes permisos"       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Paso 1 — Crear el letrero (decorator):**

```typescript
// roles.decorator.ts
// Este es simplemente un letrero que dice "aquí se necesita rol X"

import { SetMetadata } from '@nestjs/common';

// Ejemplo: @Roles('admin') → Ponlo encima de tu método
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
// SetMetadata guarda info en el método, como escribir un letrero
```

**Paso 2 — Crear el portero (guard):**

```typescript
// roles.guard.ts

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  // Reflector nos permite leer los "letreros" de los métodos

  canActivate(context: ExecutionContext): boolean {
    // 1. Lee qué roles necesita el método (el letrero)
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // 2. Si no hay letrero, deja pasar a cualquiera
    if (!requiredRoles) return true;

    // 3. Obtiene el usuario de la request
    const { user } = context.switchToHttp().getRequest();

    // 4. ¿El usuario tiene alguno de los roles necesarios?
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

**Paso 3 — Usar el sistema:**

```typescript
// tasks.controller.ts

@Delete(':id')
@Roles('admin')  // ← Solo admin puede borrar
deleteTask(@Param('id', ParseIntPipe) id: number) {
  return this.deleteTaskUseCase.execute(id);
}

// Otro ejemplo
@Patch(':id')
@Roles('admin', 'editor')  // ← Admin o editor pueden editar
updateTask(@Param('id') id: number, @Body() dto: UpdateTaskDto) {
  return this.updateTaskUseCase.execute(id, dto);
}

// Este endpoint no tiene @Roles, cualquiera puede ver
@Get()
getAllTasks() {
  return this.getTasksUseCase.execute();
}
```

**¿Por qué está desacoplado?**

```
┌─────────────────────────────────────────────────────────────┐
│  LO QUE SUCEDE EN EL CONTROLADOR (limpio):                 │
│                                                              │
│  @Delete(':id')                                             │
│  @Roles('admin')           ← Solo dice "necesito admin"    │
│  deleteTask(...) {         ← No sabe CÓMO se verifica       │
│    ...                             el rol                   │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LO QUE SUCEDE EN EL GUARD (lógica separada):              │
│                                                              │
│  canActivate() {           ← El guard SÍ sabe cómo         │
│    // Lógica compleja de verificar roles                     │
│    // Posiblemente llama a base de datos                    │
│    // Posiblemente cachea resultados                         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

> 💡 **Ventaja:** Si mañana cambias la lógica de roles (ej: agregar "super-admin"), solo cambias el Guard. El controlador no se toca.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

La solución canónica combina un decorator personalizado con un Guard que lee metadata:

**Paso 1 — Decorator personalizado:**
```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Paso 2 — Guard que lee la metadata:**
```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

**Paso 3 — Uso en el controller:**
```typescript
@Delete(':id')
@Roles('admin')
deleteTask(@Param('id', ParseIntPipe) id: number) {
  return this.deleteTaskUseCase.execute(id);
}
```

El controller solo declara qué roles necesita. La lógica de comparación vive en el Guard.

> 💡 **Tip:** Conecta esta respuesta con "definir estándares técnicos junto al equipo de arquitectura" — es exactamente el tipo de patrón que se estandariza a nivel de proyecto.

</details>

---

### 🟢 Básica — DTOs y ValidationPipe

**¿Para qué sirven los DTOs y por qué se usa `class-validator` junto a `ValidationPipe`?**

<details>
<summary>Ver respuesta simple</summary>

**Imagina un restaurante:**

```
╔════════════════════════════════════════════════════════════════╗
║                    DTOs Y VALIDACIÓN                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🍽️ Cliente pide:                                             ║
║     {                                                          ║
║       "nombre": "Juan",                                       ║
║       "edad": 25,                                             ║
║       "email": "juan@mail.com"                                ║
║     }                                                          ║
║                                                                ║
║  🚫 PERO el cliente manda:                                     ║
║     {                                                          ║
║       "nombre": "Juan",                                       ║
║       "edad": -5,              ← Edad no puede ser negativa   ║
║       "email": "no-es-email",   ← No es un email válido        ║
║       "dineroExtra": 1000       ← Campo que no existe         ║
║     }                                                          ║
║                                                                ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │  DTO: Define qué campos ACEPTAMOS                      │   ║
║  │  class-validator: Define las REGLAS de cada campo      │   ║
║  │  ValidationPipe: CHEQUEA antes de procesar             │   ║
║  └─────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ✅ Resultado: Rechaza -5, "no-es-email", y "dineroExtra"    ║
║  ❌ El chef NUNCA recibe datos inválidos                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**¿Qué es un DTO?**

DTO = Data Transfer Object (Objeto de Transferencia de Datos)

Es como un "formulario" que define:
- Qué campos aceptamos
- De qué tipo son
- Si son obligatorios o opcionales

```typescript
// DTO - El formulario que el cliente debe llenar
export class CreateTaskDto {
  title: string;           // Obligatorio, texto
  description?: string;    // Opcional, texto
  priority?: number;       // Opcional, número
}
```

**¿Qué es class-validator?**

Son reglas que se aplican a cada campo:

```typescript
// Con class-validator, el formulario tiene REGLAS
export class CreateTaskDto {
  @IsString()              // Debe ser texto
  @IsNotEmpty()            // No puede estar vacío
  title: string;

  @IsString()              // Debe ser texto
  @IsOptional()            // Puede omitirse
  description?: string;

  @IsInt()                 // Debe ser número entero
  @Min(1)                  // Mínimo 1
  @Max(5)                 // Máximo 5
  @IsOptional()           // Puede omitirse
  priority?: number;
}
```

**¿Qué es ValidationPipe?**

Es el "chef" que revisa el formulario antes de cocinar:

```typescript
// En main.ts o en el controller
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Elimina campos que no existen en el DTO
    forbidNonWhitelisted: true, // Error si vienen campos extra
    transform: true,            // Convierte tipos (string → number)
  })
);
```

**Ejemplo completo:**

```typescript
// 1. El DTO con reglas
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;
}

// 2. El controller usa el DTO
@Post()
createTask(@Body() dto: CreateTaskDto) {
  // dto YA viene validado
  // Si alguien manda "priority": -5 → NestJS rechaza con 400 Bad Request
  return this.createTaskUseCase.execute(dto);
}

// 3. ValidationPipe hace magia automáticamente
// Si la request llega con campos extra o inválidos:
// - whitelist: true  → Elimina los campos que no conoce
// - forbidNonWhitelisted: true → Lanza error si hay campos no permitidos
```

**¿Por qué es importante?**

```
╔════════════════════════════════════════════════════════════════╗
║                    SIN VALIDACIÓN                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Cliente manda: {"title": "", "priority": -999}               ║
║        │                                                      ║
║        ▼                                                      ║
║  Se guarda en BD: title="", priority=-999                    ║
║        │                                                      ║
║        ▼                                                      ║
║  💥 Error en producción, datos corruptos                      ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                    CON VALIDACIÓN                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Cliente manda: {"title": "", "priority": -999}               ║
║        │                                                      ║
║        ▼                                                      ║
║  ValidationPipe rechaza:                                       ║
║  {                                                            ║
║    "statusCode": 400,                                         ║
║    "message": ["title should not be empty", "priority must..."]║
║  }                                                            ║
║        │                                                      ║
║        ▼                                                      ║
║  ✅ Datos siempre válidos, error controlado                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

> 💡 **En tu proyecto hexagonal:** Los DTOs viven en `infrastructure/http/dto/` porque son parte de la capa de adaptación HTTP, no del dominio.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

Los DTOs (Data Transfer Objects) definen la forma exacta que deben tener los datos entrantes, separando la representación de red de las entidades de dominio.

- **`class-validator`**: agrega decoradores como `@IsString()`, `@IsEnum()`, `@IsOptional()` directamente en la clase DTO.
- **`ValidationPipe`** con `whitelist: true` elimina propiedades no declaradas, y `forbidNonWhitelisted: true` lanza error si llegan propiedades extra. Esto previene ataques de mass-assignment.

```typescript
// create-task.dto.ts
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;
}
```

> 💡 **Tip:** En la refactorización a arquitectura hexagonal, los DTOs pasan a vivir en la capa de infraestructura (`infrastructure/http/dto/`), no en el dominio.

</details>

---

## 2. Arquitectura Hexagonal

---

### 🔴 Difícil — Puertos de entrada vs salida

**Explica la diferencia entre un puerto de entrada y uno de salida. Da un ejemplo concreto con NestJS.**

<details>
<summary>Ver respuesta simple</summary>

**Imagina un hospital:**

```
╔════════════════════════════════════════════════════════════════════╗
║                    ARQUITECTURA HEXAGONAL                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  🏥 HOSPITAL (Tu Aplicación)                                      ║
║  ┌────────────────────────────────────────────────────────────┐   ║
║  │                                                            │   ║
║  │   ╔═══════════════════════════════════════════════════╗    │   ║
║  │   ║              DOMINIO (Núcleo)                     ║    │   ║
║  │   ║                                                  ║    │   ║
║  │   ║   - Una tarea tiene estado y prioridad           ║    │   ║
║  │   ║   - Una tarea no puede volver a "pendiente"     ║    │   ║
║  │   ║     si ya está "completada"                     ║    │   ║
║  │   ║   - Esto es la "regla del negocio"              ║    │   ║
║  │   ║                                                  ║    │   ║
║  │   ╚═══════════════════════════════════════════════════╝    │   ║
║  │                          │                                  │   ║
║  │   ╔═══════════════════════════════════════════════════╗    │   ║
║  │   ║         PUERTO DE SALIDA (Driven)                ║    │   ║
║  │   ║                                                  ║    │   ║
║  │   ║   interface TaskRepository {                     ║    │   ║
║  │   ║     guardar(tarea): Task                         ║    │   ║
║  │   ║     buscar(id): Task                             ║    │   ║
║  │   ║   }                                              ║    │   ║
║  │   ║   ← Dice "CÓMO la app ACCEDE al mundo exterior"  ║    │   ║
║  │   ╚═══════════════════════════════════════════════════╝    │   ║
║  │                          │                                  │   ║
║  │   ╔═══════════════════════════════════════════════════╗    │   ║
║  │   ║         PUERTO DE ENTRADA (Driving)              ║    │   ║
║  │   ║                                                  ║    │   ║
║  │   ║   interface CreateTaskUseCase {                  ║    │   ║
║  │   ║     ejecutar(dto): Task                           ║    │   ║
║  │   ║   }                                              ║    │   ║
║  │   ║   ← Dice "CÓMO el mundo EXTERIOR activa la app"  ║    │   ║
║  │   ╚═══════════════════════════════════════════════════╝    │   ║
║  │                                                            │   ║
║  └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
║  ═══════════════════════════════════════════════════════════════════ ║
║  ADAPTADORES (Lo que conecta el hospital con el mundo exterior)      ║
║  ═══════════════════════════════════════════════════════════════════ ║
║                                                                    ║
║  🔌 PUERTO DE SALIDA tiene adaptadores:                             ║
║     - AdaptadorPostgreSQL → Guarda en PostgreSQL                   ║
║     - AdaptadorMongoDB → Guarda en MongoDB (cambias solo esto)     ║
║     - AdaptadorMemoria → Guarda en memoria (para tests)             ║
║                                                                    ║
║  🔌 PUERTO DE ENTRADA tiene adaptadores:                           ║
║     - AdaptadorHTTP → Controller NestJS (recibe REST requests)      ║
║     - AdaptadorGraphQL → Resolver GraphQL                          ║
║     - AdaptadorCLI → Comandos de terminal                          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**Ejemplo con tu proyecto `nest-api-task`:**

```
HTTP Request (crear tarea)
        │
        ▼
┌─────────────────────────────┐
│  TasksController            │  ← ADAPTADOR DE ENTRADA (HTTP)
│  @Post()                    │
│  createTask(@Body dto) {    │
│    return createTask.execute(dto)  │
│  }                          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  CreateTaskUseCase          │  ← PUERTO DE ENTRADA (Caso de uso)
│  execute(dto) {             │  ← "CÓMO se activa la app"
│    const task = Task.create(...)
│    return repo.save(task)    │
│  }                          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  TaskRepositoryPort         │  ← PUERTO DE SALIDA (Interfaz)
│  interface {                │  ← "CÓMO la app ACCEDE a datos"
│    save(task): Promise      │
│    findAll(): Promise       │
│  }                          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  TaskRepository              │  ← ADAPTADOR DE SALIDA (TypeORM)
│  implements TaskRepositoryPort │
│  save(task) {               │
│    return this.repo.save(task) │
│  }                          │
└─────────────┬───────────────┘
              │
              ▼
         PostgreSQL
```

**Resumen simple:**

| Concepto | Analogía | En tu proyecto |
|----------|----------|---------------|
| **Puerto de entrada** | "Cómo un paciente llama al hospital" | `CreateTaskUseCase` - cómo se activa la creación de tareas |
| **Puerto de salida** | "Cómo el hospital pide medicamentos al almacén" | `TaskRepositoryPort` - cómo la app guarda/busca tareas |
| **Adaptador de entrada** | "La recepcionista que atiende" | `TasksController` - recibe el request HTTP |
| **Adaptador de salida** | "El encargado de bodega que pide al almacén" | `TaskRepository` con TypeORM - guarda en PostgreSQL |

> 💡 **Tip para la entrevista:** Tener la rama `rama-arq-hexagonal` funcionando con este patrón es tu demostración más sólida. Muestra cómo el caso de uso NO sabe si está usando PostgreSQL o MongoDB.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

| Tipo | También llamado | Define | Ejemplo en nest-api-task |
|---|---|---|---|
| **Puerto de entrada** | Driving port | Cómo el mundo exterior activa la aplicación | La interfaz que implementa `CreateTaskUseCase` |
| **Puerto de salida** | Driven port | Cómo la aplicación accede al mundo exterior | `TaskRepositoryPort` (lo que usa el caso de uso para persistir) |

```
HTTP Request
     │
     ▼
TasksController          ← Adaptador de entrada
     │ llama a
     ▼
CreateTaskUseCase        ← Caso de uso (núcleo)
     │ usa puerto
     ▼
TaskRepositoryPort       ← Puerto de salida (interfaz)
     │ implementado por
     ▼
TaskRepository           ← Adaptador de salida (TypeORM + PostgreSQL)
```

> 💡 **Tip:** Este es el concepto central de la oferta. Tener la rama `rama-arq-hexagonal` funcionando con este patrón es tu demostración más sólida.

</details>

---

### 🔴 Difícil — Proteger el dominio de infraestructura

**¿Cómo garantizas que el dominio no tiene dependencias de infraestructura?**

<details>
<summary>Ver respuesta simple</summary>

**La regla de oro:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                    LA REGLA DEL DOMINIO                             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║   🏛️ DOMINIO ──────────────────────────────────────────────► ⚠️     ║
║   (domain/)                                                         ║
║        │                                                             ║
║        │ PUEDE importar:                                             ║
║        │ - Solo cosas de JavaScript/TypeScript puro                 ║
║        │ - Otras capas del dominio (entity, enum, ports)             ║
║        │ - @nestjs/common (para excepciones como BadRequestException) ║
║        │                                                              ║
║        ✗ NO PUEDE importar:                                           ║
║        │ - TypeORM (@Entity, @Column, Repository)                    ║
║        │ - NestJS Modules (@Module, @Injectable)                     ║
║        │ - Infraestructura (database, http, etc.)                    ║
║        │ - Frameworks externos                                       ║
║                                                                    ║
║   SI EL DOMINIO IMPORTARA INFRAESTRUCTURA:                         ║
║   💀 Si cambias de PostgreSQL a MongoDB → Se rompe el dominio      ║
║   💀 Si cambias de NestJS a Fastify → Se rompe el dominio          ║
║   💀 Los tests unitarios necesitan mocks de TypeORM                 ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Cómo hacer cumplir esta regla:**

**Estrategia 1 — Convención y revisión manual:**

```typescript
// domain/task.entity.ts - ✅ CORRECTO
import { BadRequestException } from '@nestjs/common';  // Excepción, no infraestructura
import { TaskStatus } from './task-status.enum';       // Propio módulo del dominio

export class Task {
  // Solo lógica de negocio, sin TypeORM
  changeStatus(newStatus: TaskStatus): void {
    if (this.status === TaskStatus.COMPLETED && newStatus === TaskStatus.PENDING) {
      throw new BadRequestException('No se puede volver a pendiente');
    }
    this.status = newStatus;
  }
}
```

```typescript
// domain/task.entity.ts - ❌ INCORRECTO (NO DEBERÍA PASAR)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';  // 💀 INFRAESTRUCTURA
import { InjectRepository } from '@nestjs/typeorm';               // 💀 INFRAESTRUCTURA

@Entity()  // 💀 Esto acopla el dominio a TypeORM
export class Task {
  @PrimaryGeneratedColumn()  // 💀 Decorador de base de datos
  id: number;
}
```

**Estrategia 2 — ESLint con plugin boundaries:**

```bash
npm install --save-dev eslint-plugin-boundaries
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['boundaries'],
  rules: {
    'boundaries/no-external': 'error',
    'boundaries/element-types': [
      'error',
      {
        'domain': {
          'entryPoints': ['./index.ts'],
          'shouldInclude': () => true,
        },
        'rules': [
          { 'from': 'domain', 'allow': ['@nestjs/common'] },
          { 'from': 'domain', 'deny': ['typeorm', '@nestjs/typeorm'] }
        ]
      }
    ]
  }
};
```

**Estrategia 3 — Checklist de PR (revisión manual):**

```markdown
## Checklist antes de hacer merge:

- [ ] ¿El archivo en `domain/` importa algo de `infrastructure/`?
- [ ] ¿Los use cases usan puertos (interfaces), no implementaciones concretas?
- [ ] ¿La entidad de dominio tiene `@Entity` o `@Column` de TypeORM?
```

**Estrategia 4 — Dependency Cruiser (herramienta automática):**

```bash
npm install --save-dev dependency-cruiser
```

Genera un gráfico de dependencias y falla en CI si detecta:

```
src/tasks/domain/task.entity.ts → src/tasks/infrastructure/database/task.orm-entity.ts
                                 🚫 PROHIBIDO
```

> 💡 **Tip:** Mencionar ESLint + CI como guardián es una señal de pensamiento de equipo. Conecta directamente con "colaborar con equipos de arquitectura para definir estándares".

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

Varias estrategias complementarias:

**1. Convención documentada:** la regla es que `domain/` no importa nada de `infrastructure/`. Se comunica en el onboarding y se incluye en el checklist de PR.

**2. ESLint con import boundaries:**
```bash
npm install --save-dev eslint-plugin-boundaries
```
Permite declarar reglas como "domain no puede importar de infrastructure" y falla el CI si se rompen.

**3. Dependency Cruiser:** genera grafos de dependencias y puede fallar si detecta una dependencia prohibida entre capas.

**4. Checklist de PR:**
```markdown
- [ ] ¿Algún archivo en `domain/` importa desde `infrastructure/`?
- [ ] ¿Los casos de uso usan puertos (interfaces), no implementaciones concretas?
```

> 💡 **Tip:** Mencionar ESLint + CI como guardián es una señal de pensamiento de equipo. Conecta directamente con "colaborar con equipos de arquitectura para definir estándares".

</details>

---

### 🟡 Media — Inyección de dependencias con puertos

**En NestJS, ¿cómo inyectas una implementación concreta de un puerto sin que el caso de uso sepa qué implementación es?**

<details>
<summary>Ver respuesta simple</summary>

**El problema:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                      INVERSIÓN DE DEPENDENCIAS                     ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ❌ ANTES (acoplado):                                              ║
║                                                                    ║
║  CreateTaskUseCase                                                 ║
║        │                                                          ║
║        ▼                                                          ║
║  TaskRepository (concreto, sabe que usa TypeORM)                  ║
║        │                                                          ║
║        ▼                                                          ║
║  PostgreSQL                                                        ║
║                                                                    ║
║  💀 Si quiero cambiar PostgreSQL → Tengo que cambiar el UseCase  ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ✅ AHORA (desacoplado):                                          ║
║                                                                    ║
║  CreateTaskUseCase                                                 ║
║        │                                                          ║
║        ▼                                                          ║
║  TaskRepositoryPort (INTERFAZ, no sabe nada)                      ║
║        │                                                          ║
║        ▼                                                          ║
║  TaskRepository (IMPLEMENTACIÓN con TypeORM)                      ║
║        │                                                          ║
║        ▼                                                          ║
║  PostgreSQL                                                        ║
║                                                                    ║
║  🎯 El UseCase solo conoce la INTERFAZ, no la implementación     ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

**La solución: Tokens de inyección**

```typescript
// infrastructure/tasks.module.ts

// 1. Crear un TOKEN que identifica al repositorio
export const TASK_REPOSITORY = 'TASK_REPOSITORY';

// 2. Registrar el ADAPTADOR (implementación concreta)
@Module({
  providers: [
    // Este es el ADAPTADOR que conecta con PostgreSQL
    TaskRepository, // ← Implementa TaskRepositoryPort con TypeORM

    // Registrar con el TOKEN
    {
      provide: TASK_REPOSITORY,
      useExisting: TaskRepository,  // Este token apunta a TaskRepository
    },
  ],
})
export class TasksModule {}
```

```typescript
// application/use-cases/create-task.use-case.ts

export class CreateTaskUseCase {
  // Recibe la INTERFAZ, no la implementación concreta
  // El caso de uso NO sabe si está usando PostgreSQL, MongoDB, o memoria
  constructor(private readonly repo: TaskRepositoryPort) {}

  async execute(dto) {
    const task = Task.create(dto.title, dto.description);
    return this.repo.save(task); // Solo habla con la interfaz
  }
}
```

**El flujo completo:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INYECCIÓN EN NESTJS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Se registra TaskRepository (implementa TaskRepositoryPort)      │
│        │                                                             │
│        ▼                                                             │
│  2. Se crea token TASK_REPOSITORY que apunta a TaskRepository        │
│        │                                                             │
│        ▼                                                             │
│  3. CreateTaskUseCase se declara con useFactory:                    │
│     {                                                                │
│       provide: CreateTaskUseCase,                                   │
│       useFactory: (repo) => new CreateTaskUseCase(repo),            │
│       inject: [TASK_REPOSITORY]  ← Aquí se inyecta                 │
│     }                                                                │
│        │                                                             │
│        ▼                                                             │
│  4. NestJS resuelve: "TASK_REPOSITORY" → "TaskRepository"          │
│     Luego inyecta TaskRepository en CreateTaskUseCase              │
│                                                                      │
│  ¿Resultado? El caso de uso recibe TaskRepositoryPort              │
│  (la interfaz), no sabe que es TypeORM + PostgreSQL                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Ejemplo completo en código:**

```typescript
// 1. La INTERFAZ (contrato)
export interface TaskRepositoryPort {
  save(task: Partial<Task>): Promise<Task>;
  findById(id: number): Promise<Task | null>;
}

// 2. El CASO DE USO (usa la interfaz)
export class CreateTaskUseCase {
  constructor(private readonly repo: TaskRepositoryPort) {}

  async execute(dto) {
    return this.repo.save({ title: dto.title }); // No sabe qué es repo
  }
}

// 3. El MÓDULO conecta todo
@Module({
  providers: [
    // Adaptador con TypeORM
    TaskRepository,

    // Vincular token con implementación
    { provide: TASK_REPOSITORY, useExisting: TaskRepository },

    // Caso de uso recibe el token
    {
      provide: CreateTaskUseCase,
      useFactory: (repo: TaskRepositoryPort) => new CreateTaskUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
  ],
})
export class TasksModule {}
```

**¿Por qué es útil en tests?**

```typescript
// En tests, puedes inyectar un MOCK sin cambiar nada
const mockRepo: jest.Mocked<TaskRepositoryPort> = {
  save: jest.fn().mockResolvedValue({ id: 1 } as Task),
  findById: jest.fn(),
  // ... otros métodos
};

// El caso de uso funciona exactamente igual con el mock
const useCase = new CreateTaskUseCase(mockRepo);
```

> 💡 **Tip:** Este patrón exacto está implementado en la rama `rama-arq-hexagonal` del proyecto. Puedes mostrarlo en vivo durante la entrevista técnica.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

Usando un token de inyección personalizado en el módulo:

```typescript
// tasks.module.ts

export const TASK_REPOSITORY = 'TASK_REPOSITORY';

@Module({
  providers: [
    // El adaptador se registra con el token del puerto
    {
      provide: TASK_REPOSITORY,
      useClass: TaskRepository,        // ← implementación con TypeORM
    },
    // El caso de uso recibe el puerto mediante factory
    {
      provide: CreateTaskUseCase,
      useFactory: (repo) => new CreateTaskUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
  ],
})
export class TasksModule {}
```

El caso de uso solo conoce `TaskRepositoryPort`. En tests se puede inyectar un mock sin cambiar nada del caso de uso ni del módulo.

> 💡 **Tip:** Este patrón exacto está implementado en la rama `rama-arq-hexagonal` del proyecto. Puedes mostrarlo en vivo durante la entrevista técnica.

</details>

---

### 🟡 Media — Domain Events

**¿Cuándo usarías un Domain Event en arquitectura hexagonal? ¿Cómo lo implementarías en NestJS?**

<details>
<summary>Ver respuesta simple</summary>

**La idea: Notificaciones internas**

```
╔═══════════════════════════════════════════════════════════════════╗
║                    DOMAIN EVENTS (Eventos de Dominio)              ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Imagina que cuando completas una tarea en tu app:                ║
║                                                                    ║
║  QUIERES que pase algo MÁS (no solo guardar en BD):               ║
║  - Registrar en auditoría                                          ║
║  - Actualizar un dashboard de métricas                             ║
║  - Enviar un email al usuario                                      ║
║  - Notificar a otros servicios                                     ║
║                                                                    ║
║  ❌ ANTES: El caso de uso hacía TODO                              ║
║                                                                    ║
║  CreateTaskUseCase.execute() {                                    ║
║    const task = this.repo.save(task);                             ║
║    this.auditService.register(task);  ← Acoplamiento               ║
║    this.emailService.send(task);      ← Acoplamiento               ║
║    this.metricsService.update(task);  ← Acoplamiento               ║
║  }                                                                 ║
║                                                                    ║
║  💀 Si cambias email service → tocas el caso de uso              ║
║  💀 Si no quieres email → tocas el caso de uso                    ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ✅ AHORA: Eventos (algo pasó, otros reaccionan)                  ║
║                                                                    ║
║  CreateTaskUseCase.execute() {                                   ║
║    const task = this.repo.save(task);                             ║
║    this.eventBus.publish(new TaskCreatedEvent(task));            ║
║    // ¡Listo! No sabe qué más pasa                                ║
║  }                                                                 ║
║       │                                                             ║
║       ▼                                                             ║
║  📢 EventBus notifica a LOS SUSCRIPTORES:                          ║
║       │                                                             ║
║       ├─── AuditHandler → Registra en auditoría                  ║
║       │                                                             ║
║       ├─── EmailHandler → Envía email                             ║
║       │                                                             ║
║       └─── MetricsHandler → Actualiza dashboard                   ║
║                                                                    ║
║  🎯 El caso de uso NO conoce a los handlers                        ║
║  🎯 Si agregas/quito handlers, el caso de uso no cambia           ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Implementación con NestJS:**

```typescript
// 1. DEFINIR el evento (qué ocurrió)
export class TaskCompletedEvent {
  constructor(
    public readonly taskId: number,
    public readonly completedAt: Date,
    public readonly priority: number
  ) {}
}

// 2. CREAR handlers (qué hacer cuando ocurre)
@Injectable()
export class AuditTaskHandler {
  handle(event: TaskCompletedEvent) {
    // Registrar en auditoría
    console.log(`[AUDIT] Tarea ${event.taskId} completada`);
  }
}

@Injectable()
export class NotifyUserHandler {
  handle(event: TaskCompletedEvent) {
    // Enviar notificación
    console.log(`[EMAIL] Tarea ${event.taskId} completada`);
  }
}

// 3. PUBLICAR desde el caso de uso
@Injectable()
export class UpdateTaskUseCase {
  constructor(
    private readonly repo: TaskRepositoryPort,
    private readonly eventBus: EventBus
  ) {}

  async execute(id: number, dto: UpdateTaskDto) {
    const task = await this.repo.findById(id);
    task.changeStatus(TaskStatus.COMPLETED);

    await this.repo.save(task);

    // PUBLICAR el evento - no sabe quién escucha
    this.eventBus.publish(new TaskCompletedEvent(
      task.id,
      new Date(),
      task.priority
    ));

    return task;
  }
}
```

**Ejemplo en tu proyecto:**

```typescript
// En tu UpdateTaskUseCase, cuando se completa una tarea:
// task.completed === true → Publicar TaskCompletedEvent

// Los handlers podrían:
// - AuditHandler: guardar en tabla de auditoría
// - MetricsHandler: incrementar contador de tareas completadas
// - NotificationHandler: enviar push notification
```

> 💡 **En Azure:** En lugar de un bus interno, los eventos pueden ir a **Azure Service Bus** para comunicar microservicios.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

Los Domain Events representan algo que ocurrió en el dominio al que otros pueden reaccionar sin acoplamiento directo.

**Ejemplo en nest-api-task:** cuando una tarea se completa, podría dispararse un `TaskCompletedEvent` que:
- Registra en un log de auditoría
- Actualiza métricas del dashboard
- Envía una notificación

**Implementación con `@nestjs/cqrs`:**
```typescript
// 1. Definir el evento
export class TaskCompletedEvent {
  constructor(public readonly taskId: number) {}
}

// 2. Handler del evento
@EventsHandler(TaskCompletedEvent)
export class TaskCompletedHandler implements IEventHandler<TaskCompletedEvent> {
  handle(event: TaskCompletedEvent) {
    // notificar, auditar, etc.
  }
}

// 3. Publicar desde el caso de uso
await this.eventBus.publish(new TaskCompletedEvent(task.id));
```

En microservicios en Azure, los eventos pueden publicarse a **Azure Service Bus** en lugar de un bus interno.

</details>

---

## 3. Azure & Cloud

---

### 🔴 Difícil — App Service vs Azure Functions

**¿Cuál es la diferencia entre Azure App Service y Azure Functions para hospedar un microservicio NestJS? ¿Cuándo elegirías cada uno?**

<details>
<summary>Ver respuesta simple</summary>

**La diferencia clave:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    APP SERVICE vs AZURE FUNCTIONS                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  APP SERVICE ──── Tu propio restaurant que nunca cierra               ║
║  ══════════════════════════════════════════════════════════════════  ║
║                                                                        ║
║  🏠 Siempre abierto (24/7)                                           ║
║  👨‍🍳 Cocineros siempre disponibles                                     ║
║  💰 Pagas aunque no vengan clientes (instancia siempre corriendo)     ║
║  🍽️ Puede atender cualquier pedido en cualquier momento              ║
║  🔌 Mantiene conexiones abiertas a la base de datos                   ║
║                                                                        ║
║  Ideal para:                                                          ║
║  ✅ APIs con tráfico constante                                        ║
║  ✅ WebSockets (conexión persistente)                                 ║
║  ✅ Conexiones a DB que se reutilizan                                 ║
║  ✅ Tu app NestJS principal                                           ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  AZURE FUNCTIONS ─── Un chef que solo cocina cuando le piden          ║
║  ═══════════════════════════════════════════════════════════════════  ║
║                                                                        ║
║  👨‍🍳 Solo aparece cuando alguien pide comida                           ║
║  💰 Solo pagas cuando cocina (por ejecución)                          ║
║  😴 Si nadie pide, no hay chef (puede escalar a cero)                ║
║  ⏱️ Puede tardar en aparecer (cold start)                            ║
║                                                                        ║
║  Ideal para:                                                          ║
║  ✅ Tareas eventuales (procesar imagen, generar PDF)                  ║
║  ✅ Webhooks (cuando pasa algo fuera, reactiva)                       ║
║  ✅ Jobs programados (cada 1 hora, enviar emails)                     ║
║  ✅ Procesamiento de colas                                            ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Ejemplo prático para tu proyecto:**

```
PROYECTO TASK MANAGER EN AZURE
══════════════════════════════════════════════════════════════════════

🏠 APP SERVICE (API principal)
   ├── GET /tasks       → Siempre disponible
   ├── POST /tasks      → Siempre disponible
   ├── PATCH /tasks/:id → Siempre disponible
   └── Por qué: tráfico constante, connection pool a PostgreSQL

⚡ AZURE FUNCTIONS (Workers)
   ├── EnviarEmailNotification → Se ejecuta solo cuando alguien completa tarea
   ├── GenerateWeeklyReport     → Se ejecuta cada domingo a las 8am
   ├── CleanupOldTasks           → Se ejecuta cada día a medianoche
   └── Por qué: no necesitan estar siempre corriendo

══════════════════════════════════════════════════════════════════════
```

**Seguridad - Managed Identity:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                    MANAGED IDENTITY                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ANTES (inseguro):                                                 ║
║  connectionString = "Server=...;Password=mi_password_123"         ║
║  💀 El password está en el código                                  ║
║  💀 Si subes a Git, el password se expone                          ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  AHORA (Managed Identity):                                         ║
║                                                                    ║
║  App Service ──────► Azure SQL Database                            ║
║       │                    │                                       ║
║       │                    │                                       ║
║       └──► Managed Identity (identidad administrada por Azure)     ║
║                         │                                          ║
║                         └──► "Eres tú, no necesitas password"      ║
║                                                                    ║
║  ✅ Cero passwords en código                                        ║
║  ✅ Azure gestiona las credenciales                                ║
║  ✅ Si se expone, no importa porque no hay password real           ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

| | Azure App Service | Azure Functions |
|---|---|---|
| **Modelo** | Servidor persistente | Ejecución bajo demanda |
| **Escala** | Manual o auto-scale configurable | Escala automática, incluso a cero |
| **Cold start** | No aplica | Puede ser problemático (mitigable con Premium Plan) |
| **Ideal para** | APIs con tráfico constante, WebSockets, DB pools | Tareas eventuales, webhooks, procesamiento de archivos |
| **Costo** | Paga por instancia activa | Paga por ejecución |

**Arquitectura recomendada para esta oferta:**
- API NestJS principal → **App Service** (tráfico continuo, connection pooling a PostgreSQL)
- Workers secundarios (envío de emails, reportes, notificaciones) → **Azure Functions**

**Seguridad:** App Service tiene integración nativa con **Managed Identity** para acceder a SQL Database y Key Vault sin credenciales en el código.

> 💡 **Tip:** Mencionar Managed Identity (cero passwords hardcodeados) es una señal de madurez en seguridad cloud.

</details>

---

### 🟡 Media — Gestión de secretos

**¿Cómo manejarías variables de entorno y secretos en una app NestJS desplegada en Azure?**

<details>
<summary>Ver respuesta simple</summary>

**Los tres ambientes:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    GESTIÓN DE SECRETOS                                ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  💻 DESARROLLO (tu laptop)                                            ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │   .env (archivo local)                                        │  ║
║  │   DATABASE_URL=postgresql://localhost:5432/taskdb              │  ║
║  │   JWT_SECRET=dev_secret_123456                                 │  ║
║  │   API_KEY=sk_test_123456                                      │  ║
║  │                                                                 │  ║
║  │   ⚠️ Este archivo NUNCA se sube a Git (.gitignore)             │  ║
║  │                                                                 │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ☁️ AZURE APP SERVICE (producción)                                     ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │   Application Settings (en el portal de Azure)                │  ║
║  │   DATABASE_URL=postgresql://prod-server:5432/taskdb_production │  ║
║  │   JWT_SECRET=(valor real, configurado en Azure)               │  ║
║  │   PORT=3000                                                    │  ║
║  │                                                                 │  ║
║  │   ✅ Se injectan como variables de entorno al proceso          │  ║
║  │   ✅ No están en el código ni en el repositorio               │  ║
║  │                                                                 │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🔐 AZURE KEY VAULT (para secretos muy sensibles)                     ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │   Key Vault (la bóveda)                                        │  ║
║  │   ├── JWT_SECRET ──────────► "sk_live_abc123xyz789"            │  ║
║  │   ├── DATABASE_PASSWORD ──► "PostgrePass!2024"                 │  ║
║  │   └── API_KEY ─────────────► "azure_ad_secret_key"             │  ║
║  │                                                                 │  ║
║  │   App Service ────(Managed Identity)───► Key Vault             │  ║
║  │       │                                        │               │  ║
║  │       │                                        ▼               │  ║
║  │       │                              Lee el secreto            │  ║
║  │       │                                        │               │  ║
║  │       │◄───────────────────────────────────────┘               │  ║
║  │       │                                                         │  ║
║  │       ▼                                                         │  ║
║  │   Tu app usa el valor                                          │  ║
║  │                                                                 │  ║
║  │   ✅ Cero credenciales en código                                │  ║
║  │   ✅ Azure gestiona quién puede acceder                        │  ║
║  │   ✅ Rotación de secrets sin cambiar código                    │  ║
║  │                                                                 │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**En NestJS:**

```typescript
// installation con @nestjs/config
npm install @nestjs/config
```

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Disponible en toda la app
      envFilePath: '.env',  // Solo para desarrollo
    }),
  ],
})
export class AppModule {}
```

```typescript
// Usar en cualquier lugar
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  constructor(private config: ConfigService) {
    const host = this.config.get('DB_HOST');           // localhost en dev
    const password = this.config.get('DB_PASSWORD');  // secreto de Key Vault en prod
  }
}
```

**En el pipeline CI/CD:**

```yaml
# GitHub Actions - secrets
jobs:
  deploy:
    steps:
      - name: Deploy to Azure
        run: az webapp up ...
        env:
          DATABASE_URL: ${{ secrets.AZURE_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

El flujo recomendado en tres capas:

**Desarrollo local:**
```bash
# .env (en .gitignore)
DATABASE_URL=postgresql://localhost:5432/taskdb
JWT_SECRET=dev_secret_local
```
Cargado con `@nestjs/config` y validado con Joi o `class-validator`.

**Azure App Service:**
Application Settings en el portal o via CLI. Se inyectan como variables de entorno al proceso Node.js. Nunca en el código fuente.

**Secretos sensibles → Azure Key Vault:**
```
App Service → (Managed Identity) → Key Vault → SECRET_VALUE
```
Sin credenciales adicionales. Las referencias se configuran como:
`@Microsoft.KeyVault(SecretUri=https://mi-vault.vault.azure.net/secrets/JWT-SECRET)`

**En el pipeline CI/CD:** los secrets se guardan en GitHub Actions Secrets o en Azure DevOps Variable Groups ligados al Key Vault.

> 💡 **Tip:** La integración Key Vault + Managed Identity elimina toda credencial del código y del repositorio. Es la respuesta que un equipo de DevOps quiere escuchar.

</details>

---

### 🟡 Media — Migraciones en CI/CD

**¿Qué estrategia usarías para gestionar migraciones de base de datos PostgreSQL en Azure dentro de un pipeline CI/CD?**

<details>
<summary>Ver respuesta simple</summary>

**El problema:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    MIGRACIONES DE BASE DE DATOS                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ❌ LO QUE NUNCA DEBES HACER:                                          ║
║                                                                        ║
║  TypeORM con synchronize: true en producción:                         ║
║                                                                        ║
║  // ormconfig.ts                                                      ║
║  {                                                                    ║
║    synchronize: true   ← 💀 PELIGROSO                                ║
║  }                                                                    ║
║                                                                        ║
║  ¿Qué pasa? TypeORM ALTERA la base de datos automáticamente          ║
║  - Puede ELIMINAR columnas si las quitas del código                  ║
║  - Puede PERDER datos si hace mal la transformación                  ║
║  - No hay forma de hacer ROLLBACK                                    ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**La solución correcta:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    PIPELINE DE MIGRACIONES                             ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  CODE ──► BUILD ──► MIGRATE ──► DEPLOY                                ║
║            │          │          │                                     ║
║            │          │          └──► App Service (código nuevo)     ║
║            │          │                                                ║
║            │          └──► Se ejecuta ANTES del deploy                ║
║            │                   Si falla → No se despliega            ║
║            │                                                            ║
║            └──► Compila el código                                     ║
║                        └─► Solo si pasa tests                        ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Configuración de TypeORM:**

```typescript
// ormconfig.ts (producción)
export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,      // ← NUNCA true en prod
  migrationsRun: false,    // ← Lo corre el pipeline, no el arranque
});
```

**Crear una migración:**

```bash
# Cuando haces cambios en tu entidad
npx typeorm migration:generate -n AddPriorityToTask
```

```typescript
// migrations/1709123456789-AddPriorityToTask.ts
export class AddPriorityToTask1709123456789 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumn('tasks', new TableColumn({
      name: 'priority',
      type: 'int',
      default: 1,
    }));
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.dropColumn('tasks', 'priority');
  }
}
```

**Pipeline CI/CD:**

```yaml
# .github/workflows/deploy.yml

jobs:
  # ... lint, tests, build ...

  migrate:
    runs-on: ubuntu-latest
    needs: [build]  # ← Solo si el build pasó
    steps:
      - name: Run migrations
        run: npx typeorm migration:run -d dist/data-source.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    runs-on: ubuntu-latest
    needs: [migrate]  # ← Solo si la migración pasó
    steps:
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v3
```

**¿Por qué este orden?**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POR QUÉ ESTE ORDEN                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Build pasa?         → Siguiente paso                             │
│  2. Migración pasa?     → Siguiente paso                             │
│  3. Deploy pasa?        → Listo                                      │
│                                                                      │
│  ❌ Si la migración falla:                                          │
│     - NO se despliega el código nuevo                               │
│     - La base de datos queda en estado consistente                 │
│     - Rollback de migración si es necesario                         │
│                                                                      │
│  ✅ Si la migración pasa:                                           │
│     - El deploy sabe que la DB está lista                           │
│     - El código nuevo es compatible con el schema                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

**Nunca usar `synchronize: true` en producción** — TypeORM puede eliminar columnas o tablas.

**Estrategia recomendada:**

```typescript
// ormconfig.ts (producción)
{
  synchronize: false,           // ← NUNCA true en prod
  migrationsRun: false,         // las corre el pipeline, no el arranque
  migrations: ['dist/migrations/*.js'],
}
```

**En el pipeline (GitHub Actions):**
```yaml
jobs:
  db-migrate:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - name: Run migrations
        run: npx typeorm migration:run -d dist/data-source.js
        env:
          DATABASE_URL: ${{ secrets.AZURE_DATABASE_URL }}

  deploy:
    needs: [db-migrate]   # Deploy solo si la migración pasa
```

Cada migración tiene su método `down()` para poder hacer rollback si algo falla en producción.

</details>

---

## 4. CI/CD & DevOps

---

### 🔴 Difícil — Diseño de pipeline completo

**Diseña un pipeline CI/CD completo para el API NestJS con base de datos en Azure. ¿Qué jobs incluirías y en qué orden?**

<details>
<summary>Ver respuesta simple</summary>

**Imagina una cadena de producción:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    PIPELINE CI/CD (Cadena de producción)              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  📦 MATERIA PRIMA (tu código)                                         ║
║       │                                                                ║
║       ▼                                                                ║
║  🔍 INSPECCIÓN 1 (Linting) ── ¿El código está limpio?                ║
║       │                                                                ║
║       ├─── ❌ Falla ──→ Parar todo, avisar al developer               ║
║       │                                                                ║
║       └─── ✅ Pasa ──► Siguiente paso                                ║
║       │                                                                ║
║       ▼                                                                ║
║  🔍 INSPECCIÓN 2 (Tests unitarios) ── ¿las piezas funcionan?        ║
║       │                                                                ║
║       ├─── ❌ Falla ──→ Parar todo, no se despliega                 ║
║       │                                                                ║
║       └─── ✅ Pasa ──► Siguiente paso                                ║
║       │                                                                ║
║       ▼                                                                ║
║  🏗️ ENSAMBLAJE (Build) ── Compila el código                          ║
║       │                                                                ║
║       ├─── ❌ Falla ──→ Error de compilación                         ║
║       │                                                                ║
║       └─── ✅ Pasa ──► Siguiente paso                                ║
║       │                                                                ║
║       ▼                                                                ║
║  🧪 INSPECCIÓN 3 (Tests de integración) ── ¿las piezas se conectan?║
║       │                                                                ║
║       ├─── ❌ Falla ──→ No se despliega                              ║
║       │                                                                ║
║       └─── ✅ Pasa ──► Siguiente paso                                ║
║       │                                                                ║
║       ▼                                                                ║
║  🔄 PREPARAR DB (Migraciones) ── Actualizar base de datos            ║
║       │                                                                ║
║       ├─── ❌ Falla ──→ No se despliega, rollback migración          ║
║       │                                                                ║
║       └─── ✅ Pasa ──► Siguiente paso                                ║
║       │                                                                ║
║       ▼                                                                ║
║  🚀 DESPLIEGUE (Deploy a Azure) ── Subir a producción                ║
║       │                                                                ║
║       └─── ✅ Exito ──→ El mundo ve tu código                        ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**El pipeline en código:**

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD

on:
  push:
    branches: [main]        # Cada vez que alguien push a main
  pull_request:
    branches: [main]        # Cada vez que alguien abre un PR

jobs:

  # ═══════════════════════════════════════════════════════════════════
  # FASE 1: CALIDAD (rápido y barato)
  # ═══════════════════════════════════════════════════════════════════
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint          # ¿El código sigue las reglas?
      - run: npx tsc --noEmit     # ¿TypeScript compila?

  # ═══════════════════════════════════════════════════════════════════
  # FASE 2: TESTS UNITARIOS (sin base de datos)
  # ═══════════════════════════════════════════════════════════════════
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test -- --coverage  # ¿Las piezas funcionan?

  # ═══════════════════════════════════════════════════════════════════
  # FASE 3: BUILD (compilar)
  # ═══════════════════════════════════════════════════════════════════
  build:
    needs: [lint-and-typecheck, unit-tests]  # ← Solo si los anteriores pasan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build        # Compila a JavaScript

  # ═══════════════════════════════════════════════════════════════════
  # FASE 4: TESTS DE INTEGRACIÓN (con base de datos real)
  # ═══════════════════════════════════════════════════════════════════
  integration-tests:
    needs: [build]  # ← Necesita el código compilado
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: taskdb_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:e2e  # ¿Todo funciona junto?

  # ═══════════════════════════════════════════════════════════════════
  # FASE 5: MIGRACIÓN Y DEPLOY (SOLO en main)
  # ═══════════════════════════════════════════════════════════════════
  db-migrate:
    needs: [integration-tests]
    if: github.ref == 'refs/heads/main'  # ← Solo en main, no en PRs
    runs-on: ubuntu-latest
    steps:
      - run: npx typeorm migration:run -d dist/data-source.js

  deploy-production:
    needs: [db-migrate]  # ← Solo si la migración pasó
    environment: production  # ← Requiere aprobación manual
    runs-on: ubuntu-latest
    steps:
      - uses: azure/webapps-deploy@v3
        with:
          app-name: nest-api-task
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

**¿Por qué este orden?**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LÓGICA DEL ORDEN                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  COSTO ($) y TIEMPO (⏱️) de cada fase:                             │
│                                                                      │
│  1. Lint + Typecheck:  ~10 seg,   $0.01                             │
│  2. Unit tests:        ~30 seg,   $0.05                              │
│  3. Build:            ~1 min,    $0.10                               │
│  4. Integration tests:~2 min,    $0.30                              │
│  5. Migrate + Deploy: ~3 min,    $0.50                              │
│                                                                      │
│  💡 PRINCIPIO: Fallar rápido y barato                                │
│     Si falla en el paso 1, no ejecuto los pasos 2,3,4,5             │
│                                                                      │
│  📍 Los primeros jobs (lint, unit-tests) pueden correr EN PARALELO   │
│     para ahorrar tiempo total del pipeline                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:

  # ── Fase 1: Calidad de código (rápido y barato) ──────────
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  # ── Fase 2: Tests unitarios (sin BD) ────────────────────
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test -- --coverage

  # ── Fase 3: Build ────────────────────────────────────────
  build:
    needs: [lint-and-typecheck, unit-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

  # ── Fase 4: Tests de integración (con BD real) ──────────
  integration-tests:
    needs: [build]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: taskdb_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:e2e

  # ── Fase 5: Migración y deploy (solo en main) ───────────
  db-migrate:
    needs: [integration-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npx typeorm migration:run -d dist/data-source.js

  deploy-production:
    needs: [db-migrate]
    environment: production    # ← requiere aprobación manual
    runs-on: ubuntu-latest
    steps:
      - uses: azure/webapps-deploy@v3
        with:
          app-name: nest-api-task
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

**Orden y por qué:**

| Job | Cuándo corre | Por qué ese orden |
|---|---|---|
| `lint-and-typecheck` | PRs + main | Falla rápido, costo mínimo |
| `unit-tests` | PRs + main | Sin BD, segundos de ejecución |
| `build` | Después de tests | No buildear si los tests fallan |
| `integration-tests` | Después de build | Necesita el artefacto compilado |
| `db-migrate` | Solo en main | Solo si todo lo anterior pasó |
| `deploy-production` | Solo en main | Con aprobación manual configurada |

> 💡 **Tip:** Los jobs 1 y 2 pueden correr en paralelo para ahorrar tiempo total del pipeline.

</details>

---

### 🟡 Media — Environments y protecciones

**¿Cómo estructurarías los environments en GitHub Actions para separar staging y producción?**

<details>
<summary>Ver respuesta simple</summary>

**La idea: dos "salas de pruebas"**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    ENVIRONMENTS (Salas de pruebas)                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🧪 STAGING (Sala de pruebas informal)                                 ║
║  ════════════════════════════════════════════════════════════════════ ║
║                                                                        ║
║  Se activa: Cada vez que alguien hace merge a main                     ║
║  URL: https://nest-api-task-staging.azurewebsites.net                  ║
║                                                                        ║
║  ✅ Deploy automático (no necesita aprobación)                        ║
║  ✅ Secrets de staging (DB de staging, etc.)                          ║
║  ✅ Cualquiera del equipo puede ver los cambios                        ║
║  ✅ Para probar antes de mostrar al cliente                           ║
║                                                                        ║
║  ⚠️ Si algo sale mal: El cliente real NO se entera                     ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🏭 PRODUCTION (Sala de producción real)                               ║
║  ════════════════════════════════════════════════════════════════════ ║
║                                                                        ║
║  Se activa: Después de que staging funciona y alguien dice "OK"       ║
║  URL: https://nest-api-task.azurewebsites.net                          ║
║                                                                        ║
║  🔒 Requiere APPROBACIÓN MANUAL antes de ejecutar                      ║
║  🔒 Secrets de producción (nadie los ve)                                ║
║  🔒 Solo personas autorizadas pueden aprobar                          ║
║  🔒 Todo queda documentado (quién aprobó, cuándo)                    ║
║                                                                        ║
║  ✅ El cliente real solo ve cosas que ya fueron probadas              ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Configuración en GitHub Actions:**

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  environment: staging  # ← GitHub sabe que esto es staging
  steps:
    - name: Deploy
      run: az webapp up ...
      env:
        DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

deploy-production:
  runs-on: ubuntu-latest
  environment: production  # ← GitHub sabe que esto es producción
  # ↑ GitHub automáticamente:
  #   - Muestra "Pending approval" en la UI
  #   - No ejecuta hasta que alguien approve
  #   - Registra quién aprobó y cuándo
  steps:
    - name: Deploy
      run: az webapp up ...
      env:
        DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

**Protecciones de la rama main:**

```
Settings → Branches → Branch protection rules
══════════════════════════════════════════════════════════════════════

✅ Require a pull request before merging
   → Nadie puede push directamente a main, siempre PR

✅ Require status checks to pass
   → El PR no se puede merge si lint, tests o build fallan

✅ Require at least 1 approving review
   → Alguien debe revisar el código antes de merge

✅ Do not allow bypassing the above settings
   → Ni el admin puede saltarse las reglas
```

**Flujo completo:**

```
Developer hace PR
       │
       ▼
Code Review (alguien aprueba)
       │
       ▼
Lint + Tests pasan (automático)
       │
       ▼
Merge a main
       │
       ▼
Deploy automático a STAGING
       │
       ▼
¿Staging funciona? → SÍ
       │
       ▼
⏸️ PENDING APPROVAL (alguien debe aprobar)
       │
       ├─── Aprueban → Deploy a PRODUCTION ✅
       │
       └─── Rechazan → Nada cambia, investigar ❌
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

En GitHub Actions, los **Environments** permiten configurar protecciones por etapa:

**Staging:**
- Deploy automático en cada merge a `main`
- Secrets propios (staging DB, staging App Service)
- Sin aprobación manual
- URL: `https://nest-api-task-staging.azurewebsites.net`

**Production:**
- Mismo trigger (merge a `main`)
- Requiere aprobación de al menos 1 reviewer antes de ejecutar
- Secrets completamente independientes de staging
- URL: `https://nest-api-task.azurewebsites.net`

**Protecciones en la rama `main`:**
```
Settings → Branches → Branch protection rules:
  ✅ Require a pull request before merging
  ✅ Require status checks to pass (lint, unit-tests, build)
  ✅ Require at least 1 approving review
  ✅ Do not allow bypassing the above settings
```

> 💡 **Tip:** La aprobación manual en producción es un requisito habitual en empresas con ISO 27001 o SOC 2. Mencionarlo conecta bien con equipos de DevOps maduros.

</details>

---

### 🟢 Básica — Unit tests vs Integration tests

**¿Cuál es la diferencia entre pruebas unitarias y de integración en NestJS? ¿Qué mockeas en cada una?**

<details>
<summary>Ver respuesta simple</summary>

**Imagina un auto:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    TIPOS DE TESTS                                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🔧 UNIT TEST ─── Probar UNA pieza aislada                           ║
║  ════════════════════════════════════════════════════════════════════ ║
║                                                                        ║
║  Ejemplo: Probar solo el MOTOR del auto                              ║
║                                                                        ║
║  - El motor está fuera del auto                                       ║
║  - No necesita ruedas, batería, etc.                                 ║
║  - Le conectas corriente directamente y mides potencia               ║
║                                                                        ║
║  En código: Probar CreateTaskUseCase sin base de datos              ║
║                                                                        ║
║  ⚡ Velocidad: Muy rápido (milisegundos)                              ║
║  🔧 Mantenimiento: Fácil                                              ║
║  🎯 Objetivo: ¿Esta pieza funciona correctamente?                    ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🔩 INTEGRATION TEST ─── Probar varias piezas JUNTAS                  ║
║  ════════════════════════════════════════════════════════════════════ ║
║                                                                        ║
║  Ejemplo: Probar el AUTO COMPLETO (motor + ruedas + batería)         ║
║                                                                        ║
║  - Necesitas todas las piezas conectadas                             ║
║  - Necesitas un banco de pruebas real                                ║
║  - Mides si todo funciona junto                                      ║
║                                                                        ║
║  En código: Probar el Controller + Service + Repository + DB        ║
║                                                                        ║
║  ⏱️ Velocidad: Más lento (segundos)                                   ║
║  🔧 Mantenimiento: Más complejo                                       ║
║  🎯 Objetivo: ¿Las piezas funcionan juntas?                          ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Ejemplo en tu proyecto con arquitectura hexagonal:**

**Unit Test (aislado):**

```typescript
// create-task.use-case.spec.ts

// Mock del PUERTO (interface) - NO mockeas TypeORM ni la DB
const mockRepository: jest.Mocked<TaskRepositoryPort> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn().mockResolvedValue({
    id: 1,
    title: 'Test',
    description: null,
    status: TaskStatus.PENDING,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task),
  delete: jest.fn(),
  countByStatus: jest.fn(),
  countAll: jest.fn(),
};

// Crear el use case con el mock
const useCase = new CreateTaskUseCase(mockRepository);

// Testear
const result = await useCase.execute({ title: 'New Task' });

expect(result.title).toBe('New Task');
expect(mockRepository.save).toHaveBeenCalled(); // Solo verifica que se llamó
```

**¿Por qué es fácil?**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIT TEST EN HEXAGONAL                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CreateTaskUseCase                                                   │
│       │                                                              │
│       │ usa (interface)                                              │
│       ▼                                                              │
│  TaskRepositoryPort  ──► mockRepository (fake)                     │
│                                                                      │
│  ✅ Solo mockeas UNA cosa (el puerto)                               │
│  ✅ No necesitas base de datos                                      │
│  ✅ No necesitas NestJS completo                                     │
│  ✅ Corre en milisegundos                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Integration Test (con todo junto):**

```typescript
// tasks.controller.spec.ts

// Levanta el MÓDULO COMPLETO de NestJS
const app = await Test.createTestingModule({
  imports: [TasksModule],  // ← Carga TODO: Controller + Service + Repo + DB
}).compile();

const controller = app.get(TasksController);

// Ahora pruebas que TODO funciona junto
// - El controller llama al use case
// - El use case llama al repositorio
// - El repositorio habla con PostgreSQL
```

**Comparación directa:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    COMPARACIÓN UNIT vs INTEGRATION                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  UNIT TEST                         INTEGRATION TEST                    ║
║  ─────────────────────────────────────────────────────────────────── ║
║                                                                        ║
║  ✅ Tests: 1 clase                          Tests: Múltiples clases   ║
║  ✅ DB: No (usa mocks)                      DB: PostgreSQL real        ║
║  ✅ Tiempo: ~5ms por test                   Tiempo: ~500ms por test   ║
║  ✅ Corre en: Cada commit/PR                Corre en: Solo pipeline CI ║
║  ✅ Fallo: Específico (clase)              Fallo: Puede ser anywhere ║
║  ✅ Mantenimiento: Fácil                    Mantenimiento: Complejo   ║
║                                                                        ║
║  💡 EN HEXAGONAL: Los unit tests son MUCHO más fáciles                ║
║     Porque solo mockeas el puerto (interface)                         ║
║     En arquitectura tradicional tendrías que mockear                   ║
║     Repository<Task> de TypeORM con todos sus métodos                ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

| | Unit Test | Integration Test |
|---|---|---|
| **Qué testea** | Una clase en aislamiento | Varias piezas funcionando juntas |
| **Base de datos** | No (mock) | Sí (PostgreSQL en Docker) |
| **Velocidad** | Muy rápido (ms) | Más lento (segundos) |
| **Corre en** | Cada PR y push | Solo en pipeline CI |

**Unit test en nest-api-task (con arquitectura hexagonal):**
```typescript
// Mock del PUERTO — no de TypeORM
const mockRepository: jest.Mocked<TaskRepositoryPort> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  countByStatus: jest.fn(),
  countAll: jest.fn(),
};

const useCase = new CreateTaskUseCase(mockRepository);
```

**Integration test:**
```typescript
// Levanta el módulo real de NestJS con PostgreSQL
const app = await Test.createTestingModule({
  imports: [TasksModule],
}).compile();
```

> 💡 **La arquitectura hexagonal facilita enormemente los unit tests:** mockear `TaskRepositoryPort` es mucho más simple que mockear `Repository<Task>` de TypeORM con todos sus métodos internos.

</details>

---

## 5. Preguntas conductuales

---

### 🟡 Media — Experiencia con arquitectura hexagonal (STAR)

**Cuéntame de un proyecto donde hayas aplicado arquitectura hexagonal. ¿Qué problema resolvió y qué desafíos enfrentaste?**

<details>
<summary>Ver respuesta simple</summary>

**Usa el método STAR: Situación → Tarea → Acción → Resultado**

---

**📖 SITUACIÓN (Contexto)**

Tenía un proyecto Task Manager API (`nest-api-task`) construido con NestJS. El código original mezclaba:
- Lógica de negocio
- Acceso a base de datos (TypeORM)
- Validación de datos
- Endpoints HTTP

Todo estaba en un archivo `TasksService` de 200 líneas. Si quería cambiar de PostgreSQL a MongoDB, tenía que reescribir casi todo. Los tests necesitaban una base de datos real o mocks muy complejos de TypeORM.

---

**🎯 TAREA (El desafío)**

Necesitaba refactorizar a arquitectura hexagonal para:
1. Separar la lógica de negocio (domain) de la infraestructura
2. Hacer los tests unitarios fáciles de escribir
3. Preparar el proyecto para escalar a microservicios en Azure
4. Crear una guía educativa para mis alumnos

---

**🔧 ACCIÓN (Qué hice)**

```
Paso 1: Identifiqué las tres capas
├── Domain (reglas de negocio puras)
├── Application (casos de uso)
└── Infrastructure (adaptadores: DB, HTTP)

Paso 2: Extraje el dominio
├── Task (entidad pura, sin TypeORM)
├── TaskStatus (enum)
└── TaskRepositoryPort (interface/contrato)

Paso 3: Creé los casos de uso
├── CreateTaskUseCase
├── GetTaskByIdUseCase
├── UpdateTaskUseCase
├── DeleteTaskUseCase
└── GetTasksUseCase

Paso 4: Implementé los adaptadores
├── TaskOrmEntity (TypeORM)
├── TaskRepository (implementa el puerto)
└── TasksController (HTTP)

Paso 5: Configuré la inyección de dependencias
├── TOKEN_REPOSITORY para identificar el puerto
└── useFactory para conectar puerto → implementación

Paso 6: Escribí tests unitarios
├── Mock del TaskRepositoryPort (no de TypeORM)
└── Tests que corren en milisegundos
```

---

**✅ RESULTADO (Qué logré)**

```
ANTES:
├── TasksService: 200 líneas con todo mezclado
├── Tests: necesitan base de datos real
└── Cambiar DB: reescribir medio proyecto

AHORA:
├── CreateTaskUseCase: 20 líneas, hace UNA cosa
├── Tests: mockean el puerto, corren en ms
└── Cambiar DB: solo modificar TaskRepository
```

**Lo más importante:** Los tests unitarios pasaron de ser difíciles de escribir a triviales. Ahora pruebo la lógica de negocio sin necesidad de base de datos ni NestJS completo.

Documenté todo en `GUIA-ARQUITECTURA-HEXAGONAL.md` (1515 líneas) para que otros puedan seguir el proceso.

---

**💡 Lección aprendida**

La arquitectura hexagonal no es "overkill" para proyectos simples, pero hay que saber cuándo aplicarla. Para un CRUD básico quizás no valga la pena. Para proyectos que necesitan escalar, tests fáciles, o cambio frecuente de base de datos, es invaluable.

> 💡 **Tip:** Mostrar la rama durante la entrevista técnica es mucho más poderoso que describirlo. Prepara el repo para demos en vivo.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

**Situación:**
Proyecto `nest-api-task`, un Task Manager API construido con NestJS y TypeScript. La arquitectura inicial tenía la lógica de negocio y el acceso a TypeORM mezclados en un `TasksService` monolítico. Si cambiaba la base de datos o quería testear un caso de uso en aislamiento, tenía que mockear todo TypeORM.

**Tarea:**
Refactorizar a arquitectura hexagonal para mejorar la testabilidad, la mantenibilidad y preparar el proyecto para escalar a microservicios en Azure.

**Acción:**
- Separé en tres capas: `domain/` (entidades puras + puertos), `application/` (6 casos de uso independientes), `infrastructure/` (adaptadores TypeORM + controller HTTP).
- Creé `TaskRepositoryPort` como contrato entre el dominio y la BD.
- Los tests unitarios pasaron a mockear el puerto — sin base de datos, sin NestJS.
- Documenté el proceso como guía educativa paso a paso para mis alumnos.

**Resultado:**
Los tests unitarios se simplificaron significativamente. Cambiar de PostgreSQL a MongoDB requeriría modificar solo `task.repository.ts`. El proyecto está disponible en GitHub en la rama `rama-arq-hexagonal`.

> 💡 **Tip:** Mostrar la rama durante la entrevista técnica es mucho más poderoso que describirlo. Prepara el repo para demos en vivo.

</details>

---

### 🟡 Media — Trabajo con equipos de arquitectura

**¿Cómo abordarías definir estándares técnicos junto a un equipo de arquitectura que tiene criterios distintos a los tuyos?**

<details>
<summary>Ver respuesta simple</summary>

**La clave: Colaborar, no imponer**

---

**Paso 1: Escuchar primero**

Antes de proponer cualquier cosa, pregunto:
- "¿Por qué llegamos a esta conclusión?"
- "¿Hay restricciones de negocio que no conozco?"
- "¿Qué pasó con intentos anteriores?"

A veces hay contexto histórico detrás de sus criterios. Puede que un patrón haya fallado antes o que haya regulaciones que no son visibles desde fuera.

---

**Paso 2: Proponer con evidencia**

Si tengo una idea diferente, no digo "estás equivocado". En cambio:

```
❌ MAL: "La arquitectura hexagonal es mejor y deberías usarla"

✅ BIEN: "Vi que tenemos problemas de testabilidad. Propongo 
         hacer una prueba de concepto con hexagonal en una 
         feature pequeña. Midamos: tiempo de tests, complejidad 
         de onboarding, y velocidad de desarrollo. Después 
         decidimos juntos."
```

Hacer una PoC (prueba de concepto) es la mejor forma de demostrar valor sin imponer.

---

**Paso 3: Documentar las decisiones (ADRs)**

Si llegamos a un acuerdo, documentamos el "por qué" con un ADR:

```markdown
## ADR-001: Arquitectura para nuevos módulos

**Contexto:**
El equipo actual tiene dificultades para escribir tests unitarios
debido al acoplamiento con TypeORM. Los juniors tardan semanas
en entender cómo funciona el acceso a datos.

**Decisión:**
Adoptar arquitectura hexagonal (ports & adapters) para todos
los nuevos módulos.

**Consecuencias:**
- +Testabilidad: Los tests unitarios son más fáciles
- +Tiempo inicial: Hay más archivos y estructura
- -Acoplamiento: El dominio no depende de frameworks
- +Flexibilidad: Podemos cambiar de DB fácilmente

**Alternativas consideradas:**
- Módulos NestJS simples (menos estructura, más acoplamiento)
- Clean Architecture (más complejo, overkill para el scope)

**Fecha:** 2024-01-15
**Decidido por:** Equipo de arquitectura
```

---

**Paso 4: Aceptar que no siempre se gana**

A veces el equipo decide de forma diferente a lo que yo proponía. En esos casos:
- Si la decisión no es peligrosa, la acepto
- Documento mis preocupaciones para referencia futura
- Me enfoco en executar bien lo decidido

La consistencia del equipo a veces vale más que la solución "técnicamente óptima".

---

**💡 ¿Por qué funciona este enfoque?**

1. **No soy amenazante:** No impongo, propongo
2. **Soy pragmático:** Muestro resultados con datos, no opiniones
3. **Documento todo:** Si algo sale mal, hay contexto de por qué se decidió así
4. **Respeto la jerarquía:** El equipo tiene información que yo no tengo

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

Enfoque colaborativo sobre el "técnicamente correcto":

1. **Entender primero:** hay contexto histórico o restricciones de negocio detrás de sus criterios que no son visibles al llegar.

2. **Comparar con evidencia:** "podríamos hacer una prueba de concepto de ambos enfoques en una feature pequeña y medir tiempos de test, complejidad, y facilidad de onboarding".

3. **Documentar con ADR (Architecture Decision Record):** capturar el trade-off, no solo la decisión final:
```markdown
## ADR-001: Usar arquitectura hexagonal en el backend

**Contexto:** El service actual mezcla lógica de negocio con acceso a TypeORM...
**Decisión:** Adoptar ports & adapters en todos los nuevos módulos.
**Consecuencias:** +testabilidad, +tiempo inicial de desarrollo, -acoplamiento.
**Alternativas consideradas:** Clean Architecture tradicional, módulos NestJS simples.
```

4. **Aceptar que no siempre se gana:** la consistencia del equipo a veces vale más que la solución técnicamente óptima.

> 💡 **Tip:** Hablar de ADRs es una señal de experiencia en equipos grandes. Pocos candidatos los mencionan espontáneamente.

</details>

---

### 🟡 Media — Perfil docente como ventaja diferencial

**Tienes experiencia como instructor de desarrollo fullstack. ¿Cómo aporta eso en un equipo de consultores?**

<details>
<summary>Ver respuesta simple</summary>

**Las 4 habilidades que la docencia desarrolla:**

---

**1. 🎯 Comunicación con no técnicos**

Cuando enseñas, aprendes a explicar conceptos complejos de forma simple. Esto es crucial cuando:

- Le explicas al cliente qué es la arquitectura hexagonal (sin术语 técnicos)
- Presentas avances a stakeholders que no programan
- Traduces requerimientos de negocio a decisiones técnicas

```
❌ ANTES: "Vamos a implementar ports & adapters para desacoplar..."

✅ AHORA: "El código va a estar organizado en capas. Si mañana 
          queremos cambiar de base de datos, solo modificamos 
          una parte, no todo el sistema."
```

---

**2. 📚 Documentación de calidad**

Quien enseña, documenta bien. Porque:

- Los conceptos no se asumen, se articulan explícitamente
- Los ejemplos tienen contexto y explicación
- La estructura sigue un orden lógico (de simple a complejo)

**Ejemplo real:** La guía `GUIA-ARQUITECTURA-HEXAGONAL.md` (1515 líneas) que cubre cada concepto con ejemplos del proyecto real. Alguien que nunca vio hexagonal puede seguirla paso a paso.

---

**3. 👥 Mentoring sin fricción**

En equipos de consultores hay devs de distintos niveles:

- **Juniors:** Necesitan guía, explicación, ejemplos
- **Seniors:** Necesitan autonomía y confianza

La experiencia docente te permite:
- Acompañar a juniors sin que eso frene tu trabajo
- Explicar una vez y que muchos entiendan
- Dar feedback constructivo sin ser condescendiente

---

**4. 🔄 Actualización constante**

Preparar clases obliga a:
- Revisar qué cambia en el ecosistema (NestJS, TypeScript, herramientas)
- Mantenerse al día con mejores prácticas
- Questionar qué es relevante y qué está obsoleto

Un consultor que no se actualiza ofrece soluciones outdated.

---

**¿Por qué esto me hace mejor consultor?**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    EL INSTRUCTOR COMO CONSULTOR                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  Enseñar → Explicar → Presentar → Documentar → Mentorear              ║
║       │        │          │          │          │                     ║
║       ▼        ▼          ▼          ▼          ▼                     ║
║    +Clarity  +Simplicity +Clout   +Adoption  +Team Growth             ║
║                                                                        ║
║  En un equipo de consultoría, esto se traduce en:                     ║
║                                                                        ║
║  ✅ Clientes que entienden qué entregamos                            ║
║  ✅ Soluciones mantenibles y bien documentadas                       ║
║  ✅ Equipos que absorben conocimiento rápidamente                     ║
║  ✅ Valor continuo, no dependencia del consultor                      ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

**💡 La ventaja más clara**

Pocos candidatos técnicos tienen también experiencia docente estructurada. La combinación de:

- Capacidad técnica (saber hacer)
- Capacidad pedagógica (saber enseñar)
- Capacidad comunicativa (saber vender)

...es rara y muy valiosa en equipos de consultoría donde el éxito depende de transferir conocimiento, no solo entregar código.

</details>

<details>
<summary>Ver respuesta sugerida (técnica)</summary>

La docencia desarrolla habilidades que escasean en los equipos técnicos:

- **Comunicación con no técnicos:** explicar arquitectura hexagonal desde cero entrena para hacer lo mismo con clientes o stakeholders que no programan.

- **Documentación de calidad:** quien enseña documenta bien. Los conceptos se articulan explícitamente, no se asumen. Ejemplo directo: la guía `GUIA-ARQUITECTURA-HEXAGONAL.md` que cubre cada concepto con ejemplos del proyecto real.

- **Mentoring sin fricción:** en un equipo de consultores hay devs de distintos niveles. Puedo acompañar a los más juniors sin que eso frene mi trabajo ni el de ellos.

- **Actualización constante:** preparar clases obliga a revisar continuamente qué cambia en el ecosistema (NestJS, TypeScript, herramientas de CI/CD).

> 💡 **Tip:** Esta es tu ventaja diferencial más clara para este rol. Pocos candidatos técnicos tienen también experiencia docente estructurada. No lo subestimes al presentarte.

</details>

---

## Checklist de preparación

Antes de la entrevista técnica, asegúrate de tener listo:

- [ ] Repositorio `nest-api-task` con rama `rama-arq-hexagonal` funcionando localmente
- [ ] Poder ejecutar `npm run test` y mostrar los tests en verde
- [ ] Poder iniciar el servidor y mostrar Swagger en `http://localhost:3000/api`
- [ ] Preparado para explicar la diferencia entre `task.entity.ts` del dominio vs `task.orm-entity.ts` de infraestructura
- [ ] Ejemplo de `TaskRepositoryPort` listo para explicar ports & adapters en vivo
- [ ] Pipeline de GitHub Actions preparado (aunque sea en borrador) para mostrar la estrategia CI/CD
- [ ] Respuestas STAR ensayadas para las preguntas conductuales

---

## Recursos de repaso rápido

| Tema | Recurso |
|---|---|
| NestJS Guards y Interceptors | [docs.nestjs.com/guards](https://docs.nestjs.com/guards) |
| Arquitectura Hexagonal original | [alistair.cockburn.us/hexagonal-architecture](https://alistair.cockburn.us/hexagonal-architecture/) |
| Azure App Service vs Functions | [learn.microsoft.com/azure/app-service](https://learn.microsoft.com/azure/app-service) |
| GitHub Actions Environments | [docs.github.com/actions/deployment/environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment) |
| ADR (Architecture Decision Records) | [adr.github.io](https://adr.github.io) |