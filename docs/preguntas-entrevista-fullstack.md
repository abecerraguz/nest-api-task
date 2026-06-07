# 🎯 Preguntas de entrevista — Fullstack Developer
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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

| Scope | Comportamiento | Cuándo usarlo |
|---|---|---|
| `DEFAULT` (Singleton) | Una instancia por módulo, compartida en toda la app | La gran mayoría de servicios y casos de uso |
| `REQUEST` | Nueva instancia por cada request HTTP | Cuando necesitas inyectar datos del contexto (usuario autenticado, tenant ID) |
| `TRANSIENT` | Nueva instancia cada vez que se inyecta | Objetos con estado mutable interno (poco frecuente) |

En la arquitectura hexagonal de `nest-api-task`, los casos de uso como `CreateTaskUseCase` son buenos candidatos a `DEFAULT` porque no tienen estado entre requests.

> 💡 **Tip:** Si el cliente usa multi-tenancy en Azure SQL Database, el scope `REQUEST` para inyectar el tenant actual es un patrón habitual en consultoría.

</details>

---

### 🔴 Difícil — RBAC con Guards

**¿Cómo implementarías autorización basada en roles (RBAC) en NestJS sin acoplar la lógica al controlador?**

<details>
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida (método STAR)</summary>

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
<summary>Ver respuesta sugerida</summary>

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
<summary>Ver respuesta sugerida</summary>

La docencia desarrolla habilidades que escasean en los equipos técnicos:

- **Comunicación con no técnicos:** explicar arquitectura hexagonal desde cero entrena para hacer lo mismo con clientes o stakeholders que no programan.

- **Documentación de calidad:** quien enseña documenta bien. Los conceptos se articulan explícitamente, no se asumen. Ejemplo directo: la guía `rama-arq-hexagonal.md` que cubre cada concepto con ejemplos del proyecto real.

- **Mentoring sin fricción:** en un equipo de consultores hay devs de distintos niveles. Puedo acompañar a los más juniors sin que eso frene mi trabajo ni el de ellos.

- **Actualización constante:** preparar clases obliga a revisar continuamente qué cambia en el ecosistema (NestJS, TypeScript, herramientas de CI/CD).

> 💡 **Tip:** Esta es tu ventaja diferencial más clara para este rol. Pocos candidatos técnicos tienen también experiencia docente estructurada. No lo subestimes al presentarte.

</details>

---

## 📋 Checklist de preparación

Antes de la entrevista técnica, asegúrate de tener listo:

- [ ] Repositorio `nest-api-task` con rama `rama-arq-hexagonal` funcionando localmente
- [ ] Poder ejecutar `npm run test` y mostrar los tests en verde
- [ ] Poder iniciar el servidor y mostrar Swagger en `http://localhost:3000/api`
- [ ] Preparado para explicar la diferencia entre `task.entity.ts` del dominio vs `task.orm-entity.ts` de infraestructura
- [ ] Ejemplo de `TaskRepositoryPort` listo para explicar ports & adapters en vivo
- [ ] Pipeline de GitHub Actions preparado (aunque sea en borrador) para mostrar la estrategia CI/CD
- [ ] Respuestas STAR ensayadas para las preguntas conductuales

---

## 📖 Recursos de repaso rápido

| Tema | Recurso |
|---|---|
| NestJS Guards y Interceptors | [docs.nestjs.com/guards](https://docs.nestjs.com/guards) |
| Arquitectura Hexagonal original | [alistair.cockburn.us/hexagonal-architecture](https://alistair.cockburn.us/hexagonal-architecture/) |
| Azure App Service vs Functions | [learn.microsoft.com/azure/app-service](https://learn.microsoft.com/azure/app-service) |
| GitHub Actions Environments | [docs.github.com/actions/deployment/environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment) |
| ADR (Architecture Decision Records) | [adr.github.io](https://adr.github.io) |
