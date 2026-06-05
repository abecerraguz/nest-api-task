# NestJS - Guía Definitiva para Aprender Desde Cero 🚀

> **¿Nunca has trabajado con NestJS?** Esta guía es para ti. Te explico todo con analogías de la vida real para que entiendas el "por qué" detrás de cada concepto, no solo el "qué".

---

## Tabla de Contenidos

1. [¿Qué diablos es NestJS?](#qué-diablos-es-nestjs)
2. [La analogía del restaurante](#la-analogía-del-restaurante)
3. [Estructura de archivos explained](#estructura-de-archivos-explicada)
4. [Service-Module-Controller: La triada sagrada](#service-module-controller-la-triada-sagrada)
5. [DTO: Qué datos acepto](#dto-qué-datos-acepto)
6. [Entity: Cómo guardo en la base de datos](#entity-cómo-guardo-en-la-base-de-datos)
7. [Decoradores: Las etiquetas mágicas](#decoradores-las-etiquetas-mágicas)
8. [ValidationPipe: El portero Security](#validationpipe-el-portero-de-seguridad)
9. [Pipes: Los transformadores](#pipes-los-transformadores)
10. [HTTP Status: Los códigos de respuesta](#http-status-los-códigos-de-respuesta)
11. [Swagger: Documentación automática](#swagger-documentación-automática)
12. [Tests unitarios: Verificación de código](#tests-unitarios-verificación-de-código)
13. [Configuración final](#configuración-final)

---

## ¿Qué diablos es NestJS?

**NestJS** es un framework de Node.js para crear APIs (backend). Imagina que construyes un edificio:

- **Express** = Solo te dan los ladrillos (tú decides cómo construir)
- **NestJS** = Te dan apartamentos listos (estructura, reglas, organización)

### ¿Por qué NestJS y no Express directo?

```
Express:                        NestJS:
┌─────────────────┐          ┌─────────────────┐
│ Tú decides      │          │ NestJS decide   │
│ toda la         │          │ la estructura   │
│ arquitectura    │          │ por ti          │
│                 │          │                 │
│ - ¿Dónde pongo  │          │ - Cada cosa     │
│   la lógica?    │          │   en su lugar   │
│ - ¿Cómo         │          │ - Easy testing  │
│   organizo?     │          │ - Escalable     │
│ - ¿Cómotesteo?  │          │ - Documentado   │
└─────────────────┘          └─────────────────┘
```

---

## La analogía del restaurante

Piensa en una **API como un restaurante**:

```
   CLIENTE                                          SERVIDOR
   (Frontend/App)                                    (NestJS)
       │                                                  │
       │  "¡Quiero una pizza!"                            │
       │ ────────────────────────────────────►           │
       │                                                  │
       │                             ┌────────────────────┴──────┐
       │                             │                          │
       │                             ▼                          ▼
       │                       ┌──────────┐              ┌──────────┐
       │                       │  MESERO  │              │  SERVICE │
       │                       │(Controller)             │ (Cocina) │
       │                       └──────────┘              └──────────┘
       │                                                       │
       │                                    ┌──────────────────┴──────┐
       │                                    │                          │
       │                                    ▼                          ▼
       │                              ┌──────────┐              ┌──────────┐
       │                              │   DTO    │              │ DATABASE │
       │                              │ (pedido) │              │ (Nevera) │
       │                              └──────────┘              └──────────┘
       │                                    │                          │
       │ ◄─────────────────────────────────┴────────────────────────────┘
       │       "Aquí tienes tu pizza" (Response)
```

**Traducción al mundo NestJS:**

| Restaurante | NestJS |
|------------|--------|
| Cliente hace pedido | Request HTTP |
| Mesero recibe pedido | Controller |
| Cocina prepara la comida | Service |
| Nevera = ingredientes | Database |
| Pedido escrito (nombre del plato) | DTO |
| Ticket con la orden | Entity |
| Instrucciones del chef | Decoradores |

---

## Estructura de archivos explicada

Cuando ejecutas `nest new mi-proyecto`, se crea esta estructura:

```
src/
├── main.ts                    # "Arrancamos el restaurante" (punto de entrada)
├── app.module.ts              # "El manager asigna departamentos"
│                             #
├── tasks/                     # 📦 Módulo TASKS (un departamento)
│   ├── dto/                   # 📝 DTOs: Define qué datos acepto
│   │   ├── create-task.dto.ts #    "Quiero: nombre, edad, email"
│   │   └── update-task.dto.ts
│   ├── entities/              # 🏪 Entities: Cómo guardo en DB
│   │   └── task.entity.ts     #    "Tabla llamada 'tasks' con estas columnas"
│   ├── tasks.controller.ts    # 👨‍💼 Controller: Recibe peticiones HTTP
│   ├── tasks.service.ts       # 👨‍🍳 Service: Lógica de negocio
│   ├── tasks.module.ts        # 📦 Module: Agrupa todo
│   └── tasks.service.spec.ts  # 🧪 Tests: Verifica que todo funcione
│
├── users/                     # 📦 Módulo USERS (otro departamento)
│   └── ...
│
└── products/                  # 📦 Módulo PRODUCTS (otro departamento)
    └── ...
```

### analogía visual

```
┌──────────────────────────────────────────────────────────┐
│                      RESTAURANT                          │
│  main.ts (El dueño abre el restaurante cada mañana)      │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    app.module.ts                         │
│    (El manager organiza los departamentos)               │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ TasksModule │  │ UsersModule│   │ProductsMod  │       │
│  │   (Cocina   │  │  (Bar)      │  │ (Cafetería).│       │
│  │   Pizza)    │  │             │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└──────────────────────────────────────────────────────────┘
```

---

## Service-Module-Controller: La triada sagrada

Esta es la **estructura base** de cualquier funcionalidad en NestJS.

### El flujoreal

```
1. Llega HTTP Request
        │
        ▼
2. @Controller recibe la petición
   - Extrae datos con @Body, @Param, @Query
   - Valida con @UsePipes
        │
        ▼
3. Llama al Service
   - "Oye, necesito crear esta tarea"
        │
        ▼
4. @Service procesa la lógica
   - Accede a la base de datos
   - Transforma datos
   - Aplica reglas de negocio
        │
        ▼
5. Devuelve resultado al Controller
        │
        ▼
6. Controller retorna Response
```

### Ejemplo paso a paso

**1. Controller: Recibe y delega**

```typescript
// El mesero recibe el pedido del cliente
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post()
    createTask(@Body() createTaskDto: CreateTaskDto) {
        // Pasa el pedido a la cocina
        return this.tasksService.createTask(createTaskDto);
    }
}
```

**2. Service: Hace el trabajo real**

```typescript
// La cocina prepara el plato
@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) {}

    // Prepara la comida
    async createTask(dto: CreateTaskDto) {
        // Crea el plato y lo guarda
        const task = this.taskRepository.create(dto);
        return this.taskRepository.save(task);
    }
}
```

**3. Module: Organiza y agrupa**

```typescript
// El manager dice: "Esto es el departamento de tasks"
@Module({
    imports: [TypeOrmModule.forFeature([Task])],  // Aquí están las herramientas
    controllers: [TasksController],                // Los meseros
    providers: [TasksService],                     // Los cocineros
})
export class TasksModule {}
```

### ¿Por qué separar en 3 partes?

```
🍕 Analogía de la pizzeria

Controller = Mesero
├── Recibe el pedido (HTTP Request)
├── Lo anota en papel (Extrae @Body)
└── Lo lleva a cocina (Llama Service)

Service = Cocina
├── Receda instrucciones (Lógica de negocio)
├── Prepara la pizza (Procesa datos)
└── Avisa cuando está listo (Return result)

Module = Manager del restaurante
├── Organiza quién trabaja dónde (Agrupa código)
├── Asegura que fallezcan ingredientes (Configura dependencias)
└── Coordina los departamentos (Inyección de dependencias)
```

**Beneficios:**

| Pregunta | Respuesta |
|---------|----------|
| ¿Puedo cambiar la pizza por hamburguesa? | Sí, solo cambias el service |
| ¿Puedo probar sin cocinar? | Sí, el controller no sabe cómo cocinas |
| ¿Puedo usar otra base de datos? | Sí, solo cambias el repository |

---

## DTO: Qué datos acepto

**DTO = Data Transfer Object** (Objeto de transferencia de datos)

### ¿Qué hace un DTO?

```
Imagina que tienes un formulario web:

┌─────────────────────────────┐
│  Nombre: [           ]     │
│  Edad:   [           ]     │
│  Email:  [           ]     │
│         [ ENVIAR ]         │
└─────────────────────────────┘

El usuario llena esto:
{
    "name": "Juan",         ✅ Válido
    "age": "veinticinco",   ❌ Error: no es número
    "email": "juan@",       ❌ Error: no es email
    "colorFavorito": "rojo" ❌ Ignorado (whitelist)
}

El DTO dice: "Yo solo acepto name, age y email"
```

### Ejemplo completo

```typescript
// create-task.dto.ts
import { IsString, IsInt, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
    // 👇 Con @ApiProperty documentas en Swagger
    @ApiProperty({ 
        example: 'Tarea 1', 
        description: 'Nombre de la tarea' 
    })
    // 👇 Validaciones: "Esto es lo que acepto"
    @IsString()                    // "debe ser texto"
    @MinLength(1)                  // "mínimo 1 carácter"
    name: string;                  // "se llama 'name'"

    @ApiProperty({ example: 25 })
    @IsInt()                       // "debe ser número entero"
    age: number;

    @ApiProperty({ example: 'test@test.com' })
    @IsEmail()                     // "debe ser email válido"
    email: string;
}
```

### Decoradores de validación

| Decorador | Pregunta que responde | Ejemplo |
|-----------|----------------------|---------|
| `@IsString()` | ¿Es texto? | "Hola" ✅, 123 ❌ |
| `@IsInt()` | ¿Es número entero? | 25 ✅, 25.5 ❌ |
| `@IsNumber()` | ¿Es número (incluye decimales)? | 25.5 ✅ |
| `@IsEmail()` | ¿Es email válido? | "a@b.com" ✅ |
| `@MinLength(n)` | ¿Mínimo n caracteres? | "abc" ✅ |
| `@MaxLength(n)` | ¿Máximo n caracteres? | "abc" ✅ |
| `@Min(n)` | ¿Valor mínimo? | 18 ✅ |
| `@Max(n)` | ¿Valor máximo? | 100 ✅ |
| `@IsOptional()` | ¿Puede no venir? | Todo ✅ |
| `@IsEnum(MyEnum)` | ¿Es valor del enum? | "active" ✅ |

### DTO con campos opcionales (Update)

```typescript
// update-task.dto.ts
import { IsString, IsInt, IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: 'Tarea actualizada' })
    @IsOptional()           // "Puede no venir"
    @IsString()
    name?: string;         // "name es opcional"

    @ApiPropertyOptional({ example: 30 })
    @IsOptional()
    @IsInt()
    age?: number;
}
```

---

## Entity: Cómo guardo en la base de datos

**Entity** es la **definición de una tabla** en tu base de datos.

### Analogía

```
Entity = Plano para construir una mesa ( tabla )

┌─────────────────────────────────────┐
│           TABLA: tasks              │
├─────────────────────────────────────┤
│  id    │ name  │ age │ email │ done │
├─────────────────────────────────────┤
│  1     │ Tarea1│  25 │ a@b.c │ false│
│  2     │ Tarea2│  30 │ x@y.z │ true │
└─────────────────────────────────────┘
                          │
                          ▼
                  Entity en TypeORM:
                  
@Entity()
export class Task {
    @PrimaryGeneratedColumn()  → Columna id (auto-incrementable)
    id: number;
    
    @Column()                  → Columna name (texto)
    name: string;
    ...
}
```

### Ejemplo completo

```typescript
// entities/task.entity.ts
import {
    Entity,                     // "Esto es una tabla"
    Column,                     // "Esto es una columna"
    PrimaryGeneratedColumn,      // "ID auto-generado"
    CreateDateColumn,           // "Guarda fecha de creación"
    UpdateDateColumn            // "Guarda fecha de actualización"
} from 'typeorm';

@Entity()                        // "Se llama 'task' en plural: tasks"
export class Task {
    @PrimaryGeneratedColumn()   // ID: 1, 2, 3... (auto-increment)
    id: number;

    @Column()                    // Columna simple
    name: string;

    @Column()                    // Otra columna simple
    email: string;

    @Column()                    // Otra columna simple
    age: number;

    @Column({ default: false })  // Valor por defecto si no viene
    completed: boolean;

    @CreateDateColumn()          // Se填充 automáticamente
    createdAt: Date;

    @UpdateDateColumn()          // Se actualizar automáticamente
    updatedAt: Date;
}
```

### Tipos de columnas

| Decorador | Descripción | Ejemplo en DB |
|-----------|-------------|---------------|
| `@PrimaryGeneratedColumn()` | ID auto-increment | 1, 2, 3... |
| `@PrimaryGeneratedColumn('uuid')` | ID UUID | "abc-123-def..." |
| `@Column()` | Columna texto | "Hola mundo" |
| `@Column({ type: 'int' })` | Columna número | 123 |
| `@Column({ type: 'decimal' })` | Columna decimal | 123.45 |
| `@Column({ type: 'boolean' })` | Columna booleano | true/false |
| `@Column({ type: 'date' })` | Columna fecha | 2024-01-01 |
| `@Column({ type: 'text' })` | Texto largo | "Paragraph..." |
| `@Column({ default: 0 })` | Valor por defecto | 0 |
| `@Column({ nullable: true })` | Puede ser null | null |

---

## Decoradores: Las etiquetas mágicas

En NestJS, los **decoradores** son como **etiquetas en un sobre** que le dicen al mesero qué hacer.

### Analogía

```
┌────────────────────────────────────────┐
│  SOBRES (tu código)                    │
│                                        │
│  ☑️ @AirMail                           │
│     "Enviar por correo aéreo"          │
│                                        │
│  📦 @Fragile                           │
│     "Manejar con cuidado"              │
│                                        │
│  ⏰ @Express                           │
│     "Entregar urgente"                 │
│                                        │
│  En NestJS también usamos etiquetas:   │
│                                        │
│  📧 @Controller('tasks')              │
│     "Ruta base: /tasks"                │
│                                        │
│  ✉️ @Post()                            │
│     "Respondo a POST"                  │
│                                        │
│  📝 @Body()                            │
│     "Extrae el cuerpo del mensaje"     │
└────────────────────────────────────────┘
```

### Decoradores del Controller

```typescript
@Controller('tasks')           // "Mi ruta base es /tasks"
export class TasksController {

    @Get()                      // "Respondo a GET /tasks"
    getAllTasks() {}

    @Get(':id')                  // "Respondo a GET /tasks/123"
    getTask(@Param('id') id) {}

    @Post()                      // "Respondo a POST /tasks"
    createTask(@Body() body) {}

    @Put(':id')                  // "Respondo a PUT /tasks/123"
    updateTask(
        @Param('id') id,        // "El ID viene en la URL"
        @Body() body             // "El cuerpo viene en el body"
    ) {}

    @Delete(':id')               // "Respondo a DELETE /tasks/123"
    deleteTask(@Param('id') id) {}
}
```

### Decoradores para extraer datos

| Decorador | Dato que obtiene | Ejemplo URL |
|-----------|-----------------|-------------|
| `@Body()` | Todo el body JSON | `POST /tasks` con `{"name": "..."}` |
| `@Body('name')` | Solo un campo del body | Extrae solo `name` |
| `@Param('id')` | Parámetro de la URL | `/tasks/5` → `id = "5"` |
| `@Query('page')` | Query string | `?page=1` → `page = "1"` |
| `@Headers('auth')` | Header específico | `Authorization: Bearer xxx` |
| `@Ip()` | IP del cliente | "192.168.1.1" |

### Ejemplo práctico completo

```typescript
@Patch(':id')
patchTask(
    @Param('id', ParseIntPipe) id: number,    // URL → número
    @Body('name', ParseUppercasePipe) name: string,  // Body → uppercase
    @Query('notify') notify: string            // Query → string
) {
    // todo funciona automáticamente ✨
}
```

---

## ValidationPipe: El portero de seguridad

**ValidationPipe** es el **portero** que verifica que los datos son correctos antes de entrar.

### Analogía

```
                    ┌─────────────────┐
                    │   API REQUEST   │
                    │  (los datos)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ VALIDATIONPIPE  │
                    │   (El portero)  │
                    │                 │
                    │ "¿Traes name?   │
                    │  ¿Es texto?    │
                    │  ¿Es email?"   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
        ✅ DATOS VÁLIDOS              ❌ DATOS INVÁLIDOS
        Continue al Service           400 Bad Request
                                         {
                                           "message": [
                                             "name must be a string"
                                           ]
                                         }
```

### Configuración en main.ts

```typescript
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,               // Elimina campos que no conoces
    forbidNonWhitelisted: true,    // Error si envían campos raros
    transform: true,                // Convierte tipos automáticamente
}));
```

### Ejemplo: ¿Qué pasa?

```javascript
// Enviando esto:
{
    "name": "Tarea 1",
    "age": 25,
    "email": "test@test.com",
    "extraField": "no debería estar"  // ⚠️ Campo extra
}

// Con whitelist: true → Se elimina extraField
// Con forbidNonWhitelisted: true → Devuelve 400

// Error:
{
    "message": "property extraField should not exist",
    "error": "Bad Request",
    "statusCode": 400
}
```

### ¿Por qué el ValidationPipe global en main.ts?

```
┌────────────────────────────────────────────────┐
│  main.ts (ValidationPipe GLOBAL)               │
│  └── Aplica a TODA la app automáticamente      │
│                                                 │
│  En un Controller específico:                  │
│  @UsePipes(new ValidationPipe(...))            │
│  └── Solo ese controller                       │
└────────────────────────────────────────────────┘
```

---

## Pipes: Los transformadores

Un **Pipe** transforma datos o los valida. Hay pipes **built-in** que vienen con NestJS.

### analogía

```
PIPE = Filtro en una tubería de agua

     Agua sucia → [FILTRO] → Agua limpia
     
     Datos sucios → [PIPE] → Datos limpios

Ejemplo:
     "123"    → [ParseIntPipe] → 123 (número)
     "true"   → [ParseBoolPipe] → true (booleano)
```

### Pipes disponibles

| Pipe | Convierte | Ejemplo |
|------|-----------|---------|
| `ParseIntPipe` | String → Number | `"5"` → `5` |
| `ParseFloatPipe` | String → Decimal | `"3.14"` → `3.14` |
| `ParseBoolPipe` | String → Boolean | `"true"` → `true` |
| `ValidationPipe` | JSON → DTO validado | Body → DTO |

### Ejemplo con ParseIntPipe

```typescript
// Sin pipe (recibo string):
@Get(':id')
getTask(@Param('id') id) {
    console.log(typeof id);  // "string"
    // id = "5"
}

// Con ParseIntPipe (recibo número):
@Get(':id')
getTask(@Param('id', ParseIntPipe) id) {
    console.log(typeof id);  // "number"
    // id = 5
}
```

### ¿Qué pasa si no puede convertir?

```
GET /tasks/abc  (abc no es número)

Con ParseIntPipe → Lanza 400 Bad Request automáticamente:

{
    "message": "Cast to int failed",
    "error": "Bad Request",
    "statusCode": 400
}
```

---

## HTTP Status: Los códigos de respuesta

Los **códigos HTTP** son como **códigos de estado del pedido**:

```
📦 Analogía del pedido de comida

200 ✅ "Tu pedido llegó OK" (OK)
201 🎉 "Creamos tu pedido" (Created)
204 🚫 "Pedido eliminado, no queda nada" (No Content)
400 ❌ "Los datos están mal" (Bad Request)
404 🔍 "No encontramos tu pedido" (Not Found)
500 💥 "Nuestro fault, lo sentimos" (Server Error)
```

### Códigos comunes en REST

| Código | Nombre | Cuándo retornarlo |
|--------|--------|-------------------|
| 200 | OK | GET exitoso, PUT/PATCH exitoso |
| 201 | Created | POST creó algo nuevo |
| 204 | No Content | DELETE sin body |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | No estás logueado |
| 403 | Forbidden | No tienes permisos |
| 404 | Not Found | El recurso no existe |
| 500 | Server Error | Error interno |

### Cambiar el código por defecto

```typescript
// Por defecto POST retorna 201 Created
// PERO si no retornas nada en DELETE:

@Delete(':id')
deleteTask(id: number) {
    this.service.delete(id);
    // Sin @HttpCode → retorna 200 ❌ (no返回 body!)
    // Con @HttpCode(204) → retorna 204 ✅
}
```

```typescript
// ✅ Forma correcta
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // 204
deleteTask(id: number) {
    this.service.delete(id);
}
```

### Ejercicio mental

```
¿Qué código retorno en cada caso?

1. GET /tasks      → 200 (encontré las tareas)
2. POST /tasks     → 201 (creé la tarea)
3. DELETE /tasks/5 → 204 (la borré, no retorno nada)
4. GET /tasks/999  → 404 (no existe)
```

---

## Swagger: Documentación automática

**Swagger** genera una **documentación interactiva** de tu API. Type para que veas tus endpoints.

### Analogía

```
Sin Swagger:
┌─────────────────────────────────┐
│ 1. Lee el código fuente         │
│ 2. Adivina qué hace cada ruta   │
│ 3. Prueba en Postman            │
│ 4. Esperando que funcione...     │
└─────────────────────────────────┘

Con Swagger:
┌─────────────────────────────────┐
│ 1. Ve a http://localhost:3000/api│
│ 2. Ves TODOS tus endpoints      │
│ 3. Prueba directamente ahí     │
│ 4. Documentación automática    │
└─────────────────────────────────┘
```

### Configuración

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
    .setTitle('Mi Primera API')
    .setDescription('API de tareas con CRUD completo')
    .setVersion('1.0')
    .addTag('tasks')
    .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);

// Accede a: http://localhost:3000/api
```

### Decoradores de documentación

```typescript
@ApiTags('tasks')                     // Grupo en Swagger UI
@ApiOperation({ summary: 'Crea una tarea' })  // Descripción corta
@ApiResponse({ status: 201, description: 'Tarea creada' })
@ApiResponse({ status: 400, description: 'Datos inválidos' })
@ApiResponse({ status: 404, description: 'Tarea no encontrada' })
@ApiParam({ name: 'id', description: 'ID de la tarea' })
@Post()
createTask(@Body() dto: CreateTaskDto) {}
```

### Cómo se ve en Swagger

```
┌─────────────────────────────────────────────────┐
│  Swagger UI                                      │
│                                                      │
│  ▼ tasks                                           │
│    POST /tasks ..................... Crea una tarea │
│    GET  /tasks ..................... Lista tareas  │
│    GET  /tasks/{id} ................. Busca tarea   │
│  ▶ Try it out                              │
│    {                                                │
│      "name": "Tarea 1",                              │
│      "age": 25,                                   │
│      "email": "test@test.com"                      │
│    }                                                │
│    [Execute]                                      │
└─────────────────────────────────────────────────┘
```

---

## Tests unitarios: Verificación de código

Los **tests** son como **ensayos de calidad** en una fábrica.

### Analogía

```
Fábrica de pizzas (tu código):

┌────────────────────────────────────────────────┐
│  ANTES de(enviar al cliente:                   │
│                                                │
│  1. ¿La pizza tiene queso?    → Test           │
│  2. ¿El horno está a 200°?   → Test           │
│  3. ¿Hay pepperoni encima?   → Test           │
│                                                │
│  Si algo falla → No se envía ❌               │
│  Si todo pasa → Se envía al cliente ✅        │
└────────────────────────────────────────────────┘
```

### Estructura de un test

```typescript
describe('TasksService', () => {        // "Voy a probar TasksService"
    let service: TasksService;          // "Instancia del servicio"

    beforeEach(async () => {           // "Antes de cadatests:"
        // Configurar el entorno de prueba
    });

    it('should be defined', () => {     // "Test: debería existir"
        expect(service).toBeDefined();
    });

    it('should return all tasks', async () => {  // "Test: retorna todas"
        // Arrange: preparar datos
        mockRepository.find.mockResolvedValue([task]);

        // Act: ejecutar la función
        const result = await service.getTasks();

        // Assert: verificar el resultado
        expect(result).toEqual([task]);
    });
});
```

### El patrón AAA

```
┌─────────────────────────────────────────────────────┐
│  Arrange → Act → Assert                           │
│                                                       │
│ Arrange: Preparo los datos y el entorno             │
│ Act: Ejecuto la función que quiero probar           │
│ Assert: Verifico que el resultado es correcto      │
└─────────────────────────────────────────────────────┘
```

### Ejemplo práctico completo

```typescript
// tasks.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';

describe('TasksService', () => {
    let service: TasksService;

    // 👇 Mock: una tarea falsa para pruebas
    const mockTask = {
        id: 1,
        name: 'Test Task',
        email: 'test@test.com',
        age: 25,
        completed: false,
    };

    // 👇 Mock del repositorio (simula la base de datos)
    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getTasks', () => {
        it('should return all tasks', async () => {
            // Arrange
            mockRepository.find.mockResolvedValue([mockTask]);

            // Act
            const result = await service.getTasks();

            // Assert
            expect(result).toEqual([mockTask]);
            expect(mockRepository.find).toHaveBeenCalled();
        });
    });

    describe('getTaskById', () => {
        it('should return a single task', async () => {
            // Arrange
            mockRepository.findOne.mockResolvedValue(mockTask);

            // Act
            const result = await service.getTaskById(1);

            // Assert
            expect(result).toEqual(mockTask);
        });

        it('should throw NotFoundException if not found', async () => {
            // Arrange
            mockRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getTaskById(999)).rejects.toThrow(NotFoundException);
        });
    });
});
```

### Ejecutar tests

```bash
pnpm test                    # Ejecutar todos
pnpm run test:watch         # Modo watch (reinicia al guardar)
pnpm run test:cov           # Con cobertura de código
```

### ¿Por qué tests automáticos?

```
Sin tests:                         Con tests:
┌──────────────┐                   ┌──────────────┐
│ Escribes     │                   │ Escribes     │
│ código nuevo │                   │ código nuevo │
│      ↓       │                   │      ↓       │
│ Subes a      │                   │ Ejecutas     │
│ producción   │                   │ pnpm test    │
│      ↓       │                   │      ↓       │
│ "Ups, falló" │                   │ "Falló algo" │
│ 50 usuarios  │                   │      ↓       │
│ afectados😱 │                   │ Arreglas sin │
│              │                   │ afectar a    │
│              │                   │ nadie 🤓    │
└──────────────┘                   └──────────────┘
```

---

## Configuración final

### main.ts completo

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // 🎯 ValidationPipe global
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,                    // Elimina campos extra
        forbidNonWhitelisted: true,          // Error si hay campos raros
        transform: true,                     // Convierte tipos automáticamente
    }));

    // 📚 Swagger Docs
    const config = new DocumentBuilder()
        .setTitle('NestJS Task API')
        .setDescription('API para gestionar tareas')
        .setVersion('1.0')
        .addTag('tasks')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // 🌐 CORS habilitado
    app.enableCors();

    await app.listen(process.env.PORT ?? 3000);
    console.log(`API: http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`Docs: http://localhost:${process.env.PORT ?? 3000}/api`);
}
void bootstrap();
```

### app.module.ts completo

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/entities/task.entity';

@Module({
    imports: [
        // 🗄️ Base de datos
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432'),
            username: process.env.DB_USERNAME ?? 'postgres',
            password: process.env.DB_PASSWORD ?? 'postgres',
            database: process.env.DB_DATABASE ?? 'nestdb',
            entities: [Task],
            synchronize: true,  // ⚠️ Solo en desarrollo!
        }),
        TasksModule,
    ],
})
export class AppModule {}
```

### Variables de entorno

```bash
# .env.example
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nestdb
PORT=3000
```

---

## Próximos pasos 🚀

Ya tienes una API NestJS completa con:

- ✅ CRUD de tareas
- ✅ Base de datos PostgreSQL con TypeORM
- ✅ Validación de datos
- ✅ Documentación automática con Swagger
- ✅ Tests unitarios
- ✅ Variables de entorno

Para seguir aprendiendo:

1. **Agregar autenticación JWT** (`@nestjs/jwt`, Passport)
2. **Relaciones en TypeORM** (OneToMany, ManyToMany)
3. **Deploy con Docker**
4. **Tests E2E**

---

## Recursos

- [Documentación oficial NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [class-validator](https://github.com/typestack/class-validator)
- [Swagger](https://swagger.io/)

**¡Éxito en tu camino de aprendizaje! 🚀**

# Mejoras Aplicadas al Proyecto 💪

> Este documento explica qué cambios hicimos para pasar del código del curso original a una versión moderna y production-ready.

---

## Tabla de Contenidos

1. [¿Qué cambiamos?](#qué-cambiamos)
2. [TypeORM con PostgreSQL](#typeorm-con-postgresql)
3. [Decoradores de Swagger](#decoradores-de-swagger)
4. [ParseIntPipeAutomático](#parseintpipe-automático)
5. [HTTP Status Correctos](#http-status-correctos)
6. [Tests Unitarios](#tests-unitarios)
7. [Variables de Entorno](#variables-de-entorno)
8. [Validación Completa](#validación-completa)
9. [Resumen de Archivos](#resumen-de-archivos)

---

## ¿Qué cambiamos?

Comparación rápida entre el **código original del curso** y la **versión mejorada**:

| Aspecto | Curso Original | Versión Mejorada |
|---------|--------------|-----------------|
| Base de datos | Array en memoria | PostgreSQL (TypeORM) |
| Validaciones | Mínimas | Completas con DTOs |
| Swagger | Sin decoradores | `@Api*` decoradores |
| Tests | Ninguno | 15 tests passing |
| Códigos HTTP | Por defecto | Explícitos con `@HttpCode` |
| Tipos en URL | String manual | `ParseIntPipe` automático |
| Errores | Genéricos | Específicos con excepciones |

---

## TypeORM con PostgreSQL

### El problema del array en memoria

El código original guardaba las tareas en un array:

```typescript
// ❌ ANTES (curso original)
private tasks = [];

createTask(task) {
    this.tasks.push(task);
    return task;
}
```

**Problema:** Al reiniciar el servidor, ¡se pierden todos los datos!

### La solución: Base de datos real

Con TypeORM + PostgreSQL:

```typescript
// ✅ AHORA (improved)
constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
) {}

async createTask(dto: CreateTaskDto) {
    const task = this.taskRepository.create(dto);  // Crea el objeto
    return this.taskRepository.save(task);         // Guarda en DB
}
```

### ¿Cómo funciona?

```
1. Defines tu tabla como código (Entity)
                                        v
┌─────────────────────────────────────────────────────┐
│  @Entity()                                          │
│  export class Task {                                │
│      @PrimaryGeneratedColumn() id: number;          │
│      @Column() name: string;                        │
│      @Column() email: string;                       │
│      @Column() age: number;                         │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                │
                ▼
2. TypeORM crea la tabla automáticamente
                                        v
┌─────────────────────────────────────────────────────┐
│  CREATE TABLE tasks (                               │
│      id SERIAL PRIMARY KEY,                        │
│      name VARCHAR NOT NULL,                        │
│      email VARCHAR NOT NULL,                       │
│      age INTEGER NOT NULL,                          │
│      completed BOOLEAN DEFAULT false               │
│  );                                                │
└─────────────────────────────────────────────────────┘
                │
                ▼
3. CRUD con métodos simple
                                        v
┌─────────────────────────────────────────────────────┐
│  find()        → SELECT * FROM tasks               │
│  findOne()     → SELECT * FROM tasks WHERE id=   │
│  create()      → INSERT INTO tasks...              │
│  save()        → INSERT o UPDATE según ID         │
│  remove()      → DELETE FROM tasks WHERE id=      │
└─────────────────────────────────────────────────────┘
```

### Configuración en app.module.ts

```typescript
TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'nestdb',
    entities: [Task],           // Tus entidades
    synchronize: true,           // ⚠️ Crea tablas automáticamente (solo dev)
}),
```

---

## Decoradores de Swagger

### El problema

El curso original tenía Swagger configurado, pero los endpoints no tenían documentación:

```typescript
// ❌ ANTES
@Post()
createTask(@Body() task: CreateTaskDto) {
    return this.tasksService.createTask(task);
}
```

En Swagger se veía: `POST /tasks` sin descripción.

### La solución: Decoradores @Api*

```typescript
// ✅ AHORA
@ApiTags('tasks')                           // Grupo en Swagger UI
@ApiOperation({ summary: 'Create a new task' })  // Describe el endpoint
@ApiResponse({ status: 201, description: 'Task created successfully' })
@ApiResponse({ status: 400, description: 'Invalid data' })
@ApiResponse({ status: 404, description: 'Tarea no encontrada' })
@ApiParam({ name: 'id', description: 'Task ID', type: Number })
@Post()
createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
}
```

### Resultado en Swagger UI

```
┌─────────────────────────────────────────────────┐
│  ▼ tasks                                        │
│                                                 │
│  POST  /tasks          Crea una tarea           │
│  Summary: Create a new task                     │
│  Responses:                                     │
│    201 ✓ Task created successfully              │
│    400 ✓ Invalid data                           │
│                                                 │
│  [Try it out]                                   │
│  Body: {                                        │
│    "name": "Tarea 1",                           │
│    "age": 25,                                   │
│    "email": "test@test.com"                     │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### Decoradores disponibles

| Decorador | Uso | Ejemplo |
|-----------|-----|---------|
| `@ApiTags('tasks')` | agrupa endpoints | "tasks" en la sidebar |
| `@ApiOperation({ summary: '...' })` | título del endpoint | "Create a task" |
| `@ApiResponse({ status: 201 })` | respuestas posibles | 201 Created |
| `@ApiParam({ name: 'id' })` | parámetros de URL | id: number |
| `@ApiQuery({ name: 'page' })` | query strings | page: number |
| `@ApiBody({ type: CreateTaskDto })` | cuerpo | Schema del body |

---

## ParseIntPipe Automático

### El problema

En el código original, la convierte del string se hacía manualmente:

```typescript
// ❌ ANTES (curso original)
@Get('/:id')
getTask(@Param('id') id: string) {
    return this.tasksService.getTask(parseInt(id));  // Manual
}
```

### La solución: ParseIntPipe

```typescript
// ✅ AHORA
@Get(':id')
getTask(@Param('id', ParseIntPipe) id: number) {  // Automático
    return this.tasksService.getTask(id);          // Ya es número
}
```

### ¿Qué hace ParseIntPipe?

```
Cliente envía:  GET /tasks/abc

Sin ParseIntPipe:
    id = "abc" (string)
    → parseInt("abc") = NaN
    → NaN causa errores sutiles

Con ParseIntPipe:
    id = "abc"
    → Intenta convertir a número
    → ¡No puede! Lanza BAD REQUEST 400 automáticamente
    
    "Cast to Int failed for value \"abc\""
```

### Beneficios

1. **Seguridad**: Si alguien envía `abc`, se rechaza antes de llegar al service
2. **Tipado correcto**: `id` es `number` en TypeScript, no `string`
3. **Código más limpio**: No necesitas `parseInt()` manual

---

## HTTP Status Correctos

### El problema

El curso usaba códigos por defecto, que no siempre son correctos:

```typescript
// ❌ ANTES
@Delete(':id')
deleteTask() {
    this.tasksService.deleteTask();
    return 'Tarea eliminada';  // Returns 200, pero debería ser 204
}
```

### La solución: @HttpCode

```typescript
// ✅ AHORA mejor
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // Returna 204
deleteTask(@Param('id', ParseIntPipe) id: number) {
    this.tasksService.deleteTask(id);
}
```

### Por qué importa

```
DELETE /tasks/5

CÓDIGO 200:                            CÓDIGO 204:
────────────────────────────────       ────────────────────────────────
Response:                              Response:
{                                      (no body)
  "message": "Tarea eliminada"
}                                     ✓ Correcto: DELETE no retorna data
                                       ✓ Estandar REST
                                       ✓ Más performante (menos bytes)
```

### Guía de códigos por endpoint

| Endpoint | Método | Código correcto | Por qué |
|----------|--------|-----------------|---------|
| `GET /tasks` | GET | 200 OK | Retorna lista |
| `GET /tasks/:id` | GET | 200 OK | Retorna objeto |
| `POST /tasks` | POST | 201 Created | Creó algo |
| `PUT /tasks/:id` | PUT | 200 OK | Retorna objeto |
| `PATCH /tasks/:id` | PATCH | 200 OK | Retorna objeto |
| `DELETE /tasks/:id` | DELETE | 204 No Content | No retorna data |

---

## Tests Unitarios

### El problema

El curso no incluía tests. Esto es peligroso:

```
Sin tests:
┌────────────────────────────────┐
│  Escribes código nuevo         │
│        ↓                       │
│  Haces cambios en otro lado    │
│        ↓                       │
│  "Ups, rompiste algo"          │
│        ↓                       │
│  El bug llega a producción 😱   │
└────────────────────────────────┘
```

### La solución: Tests con mocking

Creamos archivos `*.spec.ts` para service y controller:

```typescript
// tasks.service.spec.ts
describe('TasksService', () => {
    let service: TasksService;

    // 👇 Mock: simulamos la base de datos
    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: mockRepository,  // Usamos el mock
                },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
    });

    it('should return all tasks', async () => {
        // Arrange: preparamos el mock
        mockRepository.find.mockResolvedValue([task]);

        // Act: ejecutamos la función
        const result = await service.getTasks();

        // Assert: verificamos el resultado
        expect(result).toEqual([task]);
    });
});
```

### Patrón AAA

```
┌─────────────────────────────────────────────────────┐
│  ARRANGE → ACT → ASSERT                             │
│                                                     │
│  ARRANGE: Preparar datos y mocks                    │
│    mockRepository.find.mockResolvedValue([task]);   │
│                                                     │
│  ACT: Ejecutar la función a probar                  │
│    const result = await service.getTasks();         │
│                                                     │
│  ASSERT: Verificar el resultado                     │
│    expect(result).toEqual([task]);                  │
└─────────────────────────────────────────────────────┘
```

### Ejecutar tests

```bash
pnpm test                    # Todos los tests
pnpm test tasks.service      # Solo service
pnpm run test:watch         # Reinicia al guardar
```

### Cobertura actual

```
Test Suites: 3 passed
Tests:       15 passed
✓ getTasks (2 tests)
✓ getTaskById (2 tests)
✓ createTask (1 test)
✓ updateTask (1 test)
✓ deleteTask (2 tests)
+ Controller tests (7 tests)
```

---

## Variables de Entorno

### El problema

El código original tenía valores hardcoded:

```typescript
// ❌ ANTES
host: 'localhost',
port: 5432,
```

### La solución: .env + process.env

```
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_DATABASE=nestdb
```

```typescript
// ✅ AHORA
TypeOrmModule.forRoot({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    // ...
}),
```

### Beneficios

```
Sin .env:                         Con .env:
────────────────────────────────  ────────────────────────────────
❌ Código igual para todos          ✅ Cada developer tiene su config
❌ Credenciales en código          ✅ .env NO se sube a git
❌ Difícil cambiar en producción   ✅ Cambias .env, cambias todo
```

### Regla de oro

```
⚠️ NUNCA subas .env a git

Usa .env.example (sí se sube)

   .env (ignorar)          .env.example (subir)
   ┌────────────┐          ┌────────────┐
   │ DB_PASSWORD│          │ DB_PASSWORD│
   │ =secret    │          │ =tu_valor  │
   └────────────┘          └────────────┘
```

---

## Validación Completa

### El problema

El curso tenía validaciones mínimas:

```typescript
// ❌ ANTES
@Post()
createTask(@Body() task: any) {
    this.tasks.push(task);
}
```

Con esto, cualquier dato incorrecto llegaba a la base de datos.

### La solución: DTOs con class-validator

```typescript
// create-task.dto.ts
export class CreateTaskDto {
    @ApiProperty({ example: 'Tarea 1' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ example: 25 })
    @IsInt()
    age: number;

    @ApiProperty({ example: 'test@test.com' })
    @IsEmail()
    email: string;
}
```

### ValidationPipe global en main.ts

```typescript
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Elimina campos no definidos
    forbidNonWhitelisted: true, // Error si hay campos raros
    transform: true,            // Convierte tipos automáticamente
}));
```

### ¿Cómo funciona?

```
CLIENTE ENVÍA:
{
    "name": "Test",
    "age": 25,
    "email": "a@b.com",
    "campoExtra": "no debería estar"
}

CON WHITELIST + FORBID:

❌ { "campoExtra": "..." } → Error 400
   "property campoExtra should not exist"

CON @IsEmail():

❌ "not-an-email" → Error 400
   "email must be an email"

✅ "a@b.com" → Pasa al service
```

---

## Resumen de Archivos

### Archivos mejorados

| Archivo | Cambio principal |
|---------|-----------------|
| `main.ts` | Swagger docs + ValidationPipe global |
| `app.module.ts` | TypeORM + PostgreSQL |
| `tasks.service.ts` | Repository pattern + async |
| `tasks.controller.ts` | ParseIntPipe + @Api* + @HttpCode |
| `tasks/dto/*.dto.ts` | Validaciones + @ApiProperty |

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `tasks/entities/task.entity.ts` | Definición de tabla Task |
| `tasks/tasks.service.spec.ts` | Tests del Service |
| `tasks/tasks.controller.spec.ts` | Tests del Controller |
| `.env.example` | Plantilla de variables |

### Flujo completo mejorado

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│  ValidationPipe (global)        │
│  - Whitelist fields             │
│  - Validate @IsEmail, @IsInt... │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  @Controller                    │
│  - ParseIntPipe para :id        │
│  - @Api* for Swagger            │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  @Service                       │
│  - Async methods                │
│  - Repository pattern           │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  TypeORM (PostgreSQL)           │
│  - find(), create(), save()     │
└─────────────────────────────────┘
     │
     ▼
HTTP Response + 201/200/204
     │
     ▼
Swagger UI @ /api
```

---

## Próximos pasos sugeridos

1. **Autenticación JWT** → `@nestjs/jwt` + `@nestjs/passport`
2. **Relaciones TypeORM** → OneToMany → Users con Tasks
3. **Deploy** → Docker + Docker Compose
4. **Logs** → `@nestjs/terms` o Winston
5. **Rate limiting** → `@nestjs/throttle`

---

**¡Estas mejoras te preparan para código de producción!** 🎯

