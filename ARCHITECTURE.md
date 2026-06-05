# Arquitectura del Proyecto - Task Manager API 🏗️

> Guía completa para entender cómo se连接 todos los archivos y por qué.

---

## Tabla de Contenidos

1. [Vista General](#vista-general)
2. [Flujo de una Petición](#flujo-de-una-petición)
3. [Cada Archivo Explicado](#cada-archivo-explicado)
4. [Cómo se Relaciónan](#cómo-se-relacionan)
5. [Inyección de Dependencias](#inyección-de-dependencias-en-detall)
6. [El Pipe de Validación](#el-pipe-de-validación-explicado)

---

## Vista General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APLICACIÓN NESTJS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│    │   main.ts   │     │ app.module  │     │tasks.module │         │
│    │  (Entry)    │     │  (Root)     │     │  (Feature)  │         │
│    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘         │
│           │                    │                    │               │
│           │                    ▼                    ▼               │
│           │    ┌───────────────────────────────────────┐          │
│           └───► │  Bootstrap: Arrancar la aplicación    │          │
│                └───────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Jerarquía de Módulos

```
main.ts (Punto de entrada)
    │
    └─► AppModule (Módulo raíz)
            │
            ├─► TypeOrmModule (Conexión a PostgreSQL)
            │
            └─► TasksModule (Módulo de tareas)
                    │
                    ├─► TasksController (Endpoints HTTP)
                    ├─► TasksService (Lógica de negocio)
                    ├─► TasksSeeder (Datos iniciales)
                    ├─► Task (Entity - tabla en BD)
                    └─► CreateTaskDto, UpdateTaskDto (Validación)
```

---

## Flujo de una Petición

### Ejemplo: Crear una tarea

```
CLIENTE                                       SERVIDOR
   │                                              │
   │ POST /tasks                                   │
   │ Content-Type: application/json                │


   │ {"title":"Nueva tarea","priority":3}        │
   │ ─────────────────────────────────────────────►│
   │                                              │
   │                                        ┌──────▼──────┐
   │                                        │  main.ts     │
   │                                        │  ValidatePipe│
   │                                        │  ① Valida   │
   │                                        └──────┬──────┘
   │                                              │
   │                                        ┌──────▼──────┐
   │                                        │ Controller   │
   │                                        │ ② Extrae    │
   │                                        │ @Body()     │
   │                                        └──────┬──────┘
   │                                              │
   │                                        ┌──────▼──────┐
   │                                        │ Service     │
   │                                        │ ③ Lógica   │
   │                                        │ createTask()│
   │                                        └──────┬──────┘
   │                                              │
   │                                        ┌──────▼──────┐
   │                                        │TypeORM/Repo │
   │                                        │ ④ SQL      │
   │                                        │  INSERT    │
   │                                        └──────┬──────┘
   │                                              │
   │                                        ┌──────▼──────┐
   │                                        │ PostgreSQL  │
   │                                        │ ⑤ Guarda    │
   │                                        └─────────────┘
   │                                              │
   │ ◄─────────────────────────────────────────────
   │  201 Created                                  │
   │  {"id":1,"title":"Nueva tarea",...}          │
```

### Paso a paso

| Paso | Qué pasa | Dónde |
|------|----------|-------|
| 1 | Validación del body contra DTO | ValidationPipe (global) |
| 2 | Extraer datos del request | Controller |
| 3 | Procesar lógica de negocio | Service |
| 4 | Generar SQL | Repository TypeORM |
| 5 | Ejecutar en base de datos | PostgreSQL |
| 6 | Retornar respuesta | Controller → Cliente |

---

## Cada Archivo Explicado

### 1. `main.ts` - El punto de entrada

```
┌─────────────────────────────────────────────────────────────┐
│                         main.ts                            │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Carga variables de entorno (dotenv)                    │
│  ├── Crea la aplicación NestJS                             │
│  ├── Configura ValidationPipe global                       │
│  ├── Configura Swagger                                      │
│  ├── Habilita CORS                                          │
│  └── Inicia el servidor en el puerto 3000                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
import 'dotenv/config';  // Carga .env ANTES de todo
async function bootstrap() {
    app.useGlobalPipes(new ValidationPipe({...}));  // Valida TODO
    SwaggerModule.setup('api', app, config);        // Documentación
    await app.listen(3000);
}
```

**¿Por qué está al inicio?**
- Es lo PRIMERO que ejecuta Node.js
- Sin él, nada funciona

---

### 2. `app.module.ts` - El módulo raíz

```
┌─────────────────────────────────────────────────────────────┐
│                       app.module.ts                        │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Configura la conexión a PostgreSQL                     │
│  ├── Importa TasksModule                                    │
│  └── Registra controllers/providers globales               │
│                                                             │
│  ¿Cómo se connecta con main.ts?                            │
│  └── NestJS.createApp(AppModule) lo carga                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
TypeOrmModule.forRoot({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    entities: [Task],           // ← Le dice qué tablas usar
    synchronize: true,          // ← Crea/modifica tablas automáticamente
}),
TasksModule,                    // ← Incluimos nuestro módulo
```

**Analogía:**
```
AppModule = El directorio de un edificio
├── Recepcionista (TypeORM) → Conecta con la base de datos
└── Departamentos (TasksModule) → Cada sección del edificio
```

---

### 3. `tasks.module.ts` - El módulo de tareas

```
┌─────────────────────────────────────────────────────────────┐
│                      tasks.module.ts                       │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Registra el Controller                                │
│  ├── Registra el Service                                    │
│  ├── Registra el Seeder                                    │
│  └── Conecta Entity con TypeORM                             │
│                                                             │
│  ¿Cómo sabe NestJS que Task tiene repository?              │
│  └── TypeOrmModule.forFeature([Task]) lo crea              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
@Module({
    imports: [TypeOrmModule.forFeature([Task])],  // Crea el repositorio
    controllers: [TasksController],                // Registra endpoints
    providers: [TasksService, TasksSeeder],       // Registra lógica
})
export class TasksModule {}
```

**Analogía:**
```
TasksModule = El departamento de tareas
├── TypeOrmModule.forFeature = Los archivadores (base de datos)
├── TasksController = El secretary que recibe pedidos
├── TasksService = El empleado que hace el trabajo
└── TasksSeeder = El que llena archivos la primera vez
```

---

### 4. `tasks.entity.ts` - La tabla en la base de datos

```
┌─────────────────────────────────────────────────────────────┐
│                      task.entity.ts                         │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Define cómo es la tabla "tasks"                       │
│  ├── Define las columnas y sus tipos                        │
│  └── TypeORM genera el SQL automáticamente                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
@Entity()                    // "Esta clase es una tabla"
export class Task {
    @PrimaryGeneratedColumn()  // id = PRIMARY KEY AUTO_INCREMENT
    id: number;

    @Column()                 // columna "title"
    title: string;

    @Column({ type: 'enum', enum: TaskStatus })
    status: TaskStatus;

    // SQL generado automáticamente:
    // CREATE TABLE task (
    //     id SERIAL PRIMARY KEY,
    //     title VARCHAR NOT NULL,
    //     status VARCHAR DEFAULT 'pending',
    //     ...
    // );
}
```

**Analogía:**
```
Entity = El plano de una casa
├── Cada @Column es una habitación
├── @PrimaryGeneratedColumn es el número de casa
└── TypeORM lee el plano y construye la casa (tabla)
```

---

### 5. `task.dto.ts` - Definición de datos de entrada

```
┌─────────────────────────────────────────────────────────────┐
│                       task.dto.ts                          │
│                                                             │
│  DTO = Data Transfer Object                                 │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Define qué datos ACEPTA la API                        │
│  ├── Define las validaciones necesarias                    │
│  └── Documenta en Swagger automáticamente                   │
│                                                             │
│  CreateTaskDto → Para POST /tasks                           │
│  UpdateTaskDto → Para PATCH /tasks/:id                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
export class CreateTaskDto {
    @IsString()              // Validación: debe ser texto
    @MinLength(1)           // Validación: mínimo 1 carácter
    title: string;          // El campo "title" es obligatorio

    @IsOptional()          // Este campo es opcional
    @IsString()
    description?: string;   // description es opcional
}
```

**Analogía:**
```
DTO = El formulario de solicitud
├── "Complete su nombre" (@IsString)
├── "Solo números" (@IsInt)
├── "Debe ser un email válido" (@IsEmail)
└── Si llena mal → Error antes de procesar
```

---

### 6. `tasks.controller.ts` - Los endpoints HTTP

```
┌─────────────────────────────────────────────────────────────┐
│                    tasks.controller.ts                     │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Recibe las peticiones HTTP                            │
│  ├── Extrae datos con @Body, @Param, @Query               │
│  ├── Delega la lógica al Service                           │
│  └── Retorna la respuesta HTTP                             │
│                                                             │
│  Rutas disponibles:                                        │
│  ├── GET /tasks         → getAllTasks()                    │
│  ├── GET /tasks/stats   → getTaskStats()                   │
│  ├── GET /tasks/:id     → getTaskById()                    │
│  ├── POST /tasks        → createTask()                     │
│  ├── PATCH /tasks/:id   → updateTask()                     │
│  └── DELETE /tasks/:id  → deleteTask()                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
@Controller('tasks')        // Ruta base: /tasks
export class TasksController {
    @Post()                  // Ruta: POST /tasks
    @HttpCode(201)          // Código: 201 Created
    createTask(@Body() dto) { // @Body extrae el JSON
        return this.service.createTask(dto);
    }
}
```

**Analogía:**
```
Controller = El mesero en un restaurante
├── Recibe el pedido (HTTP Request)
├── Lo anota (@Body, @Param, @Query)
├── Lo lleva a cocina (Service)
└── Entrega la comida (HTTP Response)
```

---

### 7. `tasks.service.ts` - La lógica de negocio

```
┌─────────────────────────────────────────────────────────────┐
│                    tasks.service.ts                        │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Procesa toda la lógica de negocio                     │
│  ├── Accede a la base de datos via Repository              │
│  ├── Maneja errores                                        │
│  └── Retorna datos al Controller                            │
│                                                             │
│  ⚠️ Aquí NO se usa Express/HTTP directamente                │
│  ⚠️ Solo trabaja con objetos JavaScript/TypeScript          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) {}

    async createTask(dto: CreateTaskDto) {
        const task = this.taskRepository.create(dto);
        return this.taskRepository.save(task);
    }
}
```

**Analogía:**
```
Service = La cocina del restaurante
├── Recibe instrucciones del mesero
├── Prepara la comida (lógica de negocio)
├── Saca ingredientes de la nevera (base de datos)
└── Avisa cuando está listo (return)
```

---

### 8. `tasks.seeder.ts` - Datos iniciales

```
┌─────────────────────────────────────────────────────────────┐
│                    tasks.seeder.ts                         │
│                                                             %
│  ¿Qué hace?                                                │
│  ├── Se ejecuta al iniciar la aplicación                   │
│  ├── Verifica si ya hay datos                              │
│  └── Si no hay, crea 12 tareas de ejemplo                   │
│                                                             %
│  ¿Cuándo se ejecuta?                                        │
│  └── OnModuleInit (implementación de ciclo de vida)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
export class TasksSeeder implements OnModuleInit {
    async onModuleInit() {
        const count = await this.taskRepository.count();
        if (count === 0) {  // Solo si la tabla está vacía
            await this.seed();
        }
    }
}
```

**Analogía:**
```
Seeder = El empleado que decora el restaurante
├── Llega antes de abrir
├── Ve si ya hay decoración (count)
├── Si no hay → decora (seed)
└── Si ya hay → no hace nada
```

---

### 9. `*.spec.ts` - Tests unitarios

```
┌─────────────────────────────────────────────────────────────┐
│                    tasks.service.spec.ts                   │
│                    tasks.controller.spec.ts                │
│                                                             │
│  ¿Qué hace?                                                │
│  ├── Prueba cada función del Service/Controller            │
│  ├── Usa "mocks" para simular la base de datos             │
│  └── Verifica que el código funcione correctamente          │
│                                                             │
│  ¿Por qué mocks?                                           │
│  ├── No necesitamos PostgreSQL real                        │
│  ├── Los tests son rápidos                                 │
│  └── Podemos probar casos de error                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Código clave:**
```typescript
const mockRepository = {
    find: jest.fn(),          // Simula find()
    findOne: jest.fn(),       // Simula findOne()
    save: jest.fn(),          // Simula save()
};

beforeEach(() => {
    service = new TasksService(mockRepository); // Con mock
});

// Test
mockRepository.find.mockResolvedValue([task]);
const result = await service.getTasks();
expect(result).toEqual([task]);  // Verifica el resultado
```

**Analogía:**
```
Tests = Ensayos de calidad en una fábrica
├── Antes de vender → verificamos que todo funciona
├── Si algo falla → lo arreglamos antes del cliente
└── Si pasa las pruebas → OK para producción
```

---

## Cómo se Relationan

### Diagrama de conexiones

```
                          ┌─────────────────┐
                          │    main.ts       │
                          │  (Bootstrap)     │
                          └────────┬────────┘
                                   │
                                   ▼
┌─────────────────┐        ┌────────────────┐
│  Entity         │◄──────│ app.module.ts │
│  Task           │        └────────────────┘
└────────┬────────┘               │
         │                         │
         │                  ┌──────┴──────┐
         │                  │             │
         │                  ▼             ▼
         │         ┌────────────────┐    (imports)
         │         │tasks.module.ts│
         │         └───────┬────────┘
         │                 │
         │    ┌────────────┼────────────┐
         │    │            │            │
         │    ▼            ▼            ▼
         │ ┌──────┐  ┌─────────┐  ┌──────────┐
         │ │DTOs  │  │Service  │  │ Seeder   │◄─┐
         │ └──┬───┘  └────┬────┘  └──────────┘  │
         │    │          │                     │_onModuleInit
         │    │          │                     │
         │    │    ┌─────┴───────────┐          │
         │    │    │                 │          │
         │    │    ▼                 ▼          │
         │    │ ┌────────┐    ┌───────────┐     │
         │    │ │Controller   │  Repository   │  │
         │    │ └──┬────┘    └──────┬──────┘   │
         │    │    │                  │         │
         │    │    │ (llama)          │ (usa)   │
         │    │    ▼                  │         │
         │    └────┘                  │         │
         │                            │         │
         │                            ▼         │
         │                    ┌────────────────┐  │
         │                    │  PostgreSQL   │──┘
         │                    └────────────────┘
         │
         ▼
┌─────────────────┐
│  Task Entity    │
│  (Tabla en DB)  │
└─────────────────┘
```

### Flujo de datos

```
REQUEST (Cliente)
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ VALIDATIONPIPE (main.ts)                                     │
│ Checks: ¿El JSON tiene title? ¿email es válido? etc.        │
└──────────────────────────────────────────────────────────────┘
    │
    ▼ (Sí, pasa la validación)
┌──────────────────────────────────────────────────────────────┐
│ CONTROLLER                                                   │
│ Input: @Body() → CreateTaskDto                               │
│ Output: service.createTask(dto)                              │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVICE                                                     │
│ Input: CreateTaskDto                                         │
│ Operation: repository.create(dto) + repository.save()       │
│ Output: Task (con id asignado)                              │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ REPOSITORY                                                   │
│ Translate: JavaScript objects → SQL                          │
│ SQL Generated: INSERT INTO task (title, ...) VALUES (...)    │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ POSTGRESQL                                                   │
│ Execution: INSERT statement                                  │
│ Result: Task inserted with id=1                              │
└──────────────────────────────────────────────────────────────┘
    │
    ▼ (Response hacia arriba)
RESPONSE (Cliente)
```

---

## Inyección de Dependencias en Detalle

### Sin inyección de dependencias

```typescript
// ❌ NO HARÍAS ESTO
@Controller('tasks')
export class TasksController {
    getAllTasks() {
        const service = new TasksService(new SomeRepository());
        return service.getTasks();
    }
}
```

**Problemas:**
- Cada vez que llamas `getAllTasks()`, se crea un nuevo `TasksService`
- En tests, tendrías que crear todo manualmente
- No puedes cambiar la implementación fácilmente

### Con inyección de dependencias

```typescript
// ✅ ESTO ES LO CORRECTO
@Controller('tasks')
export class TasksController {
    constructor(private service: TasksService) {}

    getAllTasks() {
        return this.service.getTasks();  // Ya viene inyectado
    }
}
```

**NestJS lo hace por ti:**
1. Ve que `TasksController` necesita `TasksService`
2. Ve que `TasksService` está marcada como `@Injectable()`
3. Crea una instancia de `TasksService`
4. La inyecta en el constructor
5. Tú solo la usas

### Registry de NestJS

```
┌─────────────────────────────────────────────────────────────┐
│                    NESTJS CONTAINER                        │
│                                                             │
│  Cuando se carga TasksModule:                              │
│                                                             │
│  1. @Injectable() → TasksService se registra               │
│  2. TypeOrmModule.forFeature([Task])                       │
│     → Crea repository y se registra                        │
│  3. Controller → Se detecta que necesita TasksService      │
│                                                             │
│  En tiempo de ejecución:                                    │
│  TasksService ──inyecta──► Controller                      │
│  Repository ───inyecta──► TasksService                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## El Pipe de Validación Explicado

### ¿Qué hace ValidationPipe?

```
CLIENTE ENVÍA:                          │
{                                       │
    "title": "Tarea",                   │
    "description": "...",              │
    "priority": "alta",                │ ← Debería ser número 1-5
    "extra": "no debería estar"       │ ← Campo extra (whitelist)
}                                       │
    │                                   │
    ▼                                   ▼
    ┌───────────────────────────────┐   ┌─────────────────────────────┐
    │ VALIDATIONPIPE                │   │ VALIDATIONPIPE              │
    │                               │   │                             │
    │ 1. @IsString() → ✓ title      │   │ FORBID NON WHITELISTED:     │
    │ 2. @IsInt() → ✗ priority      │   │ "extra" debería dar error   │
    │ 3. whitelist → "extra" removido│   │                             │
    │                               │   │ Pero en este caso sería    │
    └───────────────────────────────┘   │ 400 Bad Request            │
                                         └─────────────────────────────┘
```

### Configuración en main.ts

```typescript
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Elimina campos no definidos en DTO
    forbidNonWhitelisted: true, // Error si envían campos extra
    transform: true,             // Convierte tipos (string → number)
    transformOptions: {
        enableImplicitConversion: true,
    },
}));
```

### Résultat con diferentes escenarios

```
ENVIAS:                                          RESPUESTA:
───────────────────────────────────────────────────────────────
{                                                  
  "title": "Tarea",                               ✅ 201 Created
  "priority": 3                                    
}                                                   

───────────────────────────────────────────────────────────────
{                                                  
  "title": "",                                    ❌ 400 Bad Request
  "priority": -1                                  │ "title must be longer than 1"
}                                                    │ "priority must not be less than 1"

───────────────────────────────────────────────────────────────
{                                                  
  "title": "Tarea",                               ❌ 400 Bad Request
  "extraField": "hack"                            │ "property extraField should not exist"
}

───────────────────────────────────────────────────────────────
{                                                  
  "title": "Tarea",                               ✅ 201 (convierte "5" string a 5 número)
  "priority": "5"                                   
}
```

---

## Resumen de Responsabilidades

| Archivo | Responsabilidad |
|---------|-----------------|
| `main.ts` | Arrancar app, configurar global |
| `app.module.ts` | Organizar módulos, conectar DB |
| `tasks.module.ts` | Agrupar funcionalidad de tareas |
| `task.entity.ts` | Definir tabla en PostgreSQL |
| `task.dto.ts` | Definir validación de entrada |
| `tasks.controller.ts` | Recibir HTTP requests |
| `tasks.service.ts` | Lógica de negocio |
| `tasks.seeder.ts` | Poblar datos iniciales |
| `*.spec.ts` | Pruebas automatizadas |

---

## Comandos útiles

```bash
# Iniciar en desarrollo
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar tests
npm test

# Ver lint
npm run lint
```

---

**¡Ahora tienes una visión completa de cómo funciona todo!** 🎉
