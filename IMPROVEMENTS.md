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
│      @PrimaryGeneratedColumn() id: number;         │
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
