# 🏗️ Guía educativa: Arquitectura Hexagonal con NestJS + React

> **Rama:** `rama-arq-hexagonal`
> **Nivel:** Desde cero — sin conocimientos previos requeridos
> **Objetivo:** Mejorar un proyecto real, aprendiendo conceptos profesionales paso a paso

---

## 📚 Antes de empezar: ¿Qué vamos a aprender?

Esta guía te llevará de la mano por los mismos conceptos que usan los equipos de desarrollo profesional en empresas reales. No tienes que saber todo de antemano; cada sección explica el "¿por qué?" antes del "¿cómo?".

Al terminar habrás aplicado:

- ✅ Arquitectura Hexagonal en el backend
- ✅ Buenas prácticas en React para el frontend
- ✅ Microservicios desplegados en Azure
- ✅ Pipelines de CI/CD automatizados
- ✅ Pruebas de software (unitarias e integración)
- ✅ Reducción de deuda técnica
- ✅ Estándares de equipo con arquitectura y DevOps

---

## 🗺️ Mapa del camino

```
Paso 1 → Entender la Arquitectura Hexagonal
Paso 2 → Aplicarla en el Backend (NestJS + TypeScript)
Paso 3 → Mejorar el Frontend (ReactJS)
Paso 4 → Desplegar en la nube (Azure)
Paso 5 → Automatizar con CI/CD
Paso 6 → Asegurar calidad con pruebas
Paso 7 → Limpiar la deuda técnica
Paso 8 → Trabajar en equipo con estándares
```

---

## Paso 1 — ¿Qué es la Arquitectura Hexagonal?

### 🧠 Explícamelo como si tuviera 10 años

Imagina que tienes una **caja de música** (tu aplicación). La caja no sabe si la vas a enchufar a la luz, a baterías, o si la vas a usar con auriculares. Solo sabe reproducir música.

La **Arquitectura Hexagonal** funciona igual: el corazón de tu aplicación (la lógica de negocio) **no sabe** si los datos vienen de una base de datos, de una API, de un archivo o de un formulario web. Solo sabe **qué tiene que hacer**.

### 🔑 Concepto clave: Ports & Adapters

| Término | Qué significa en simple |
|---|---|
| **Dominio** | El corazón: las reglas de negocio puras |
| **Port (puerto)** | Un contrato: "necesito que alguien me dé datos así" |
| **Adapter (adaptador)** | Quien cumple ese contrato: la base de datos, una API, etc. |

### 📐 Diagrama de capas

```
┌─────────────────────────────────────────────────┐
│                  INFRAESTRUCTURA                │
│   (Base de datos, APIs externas, HTTP, Azure)   │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │              APLICACIÓN                 │   │
│   │   (Casos de uso: crear usuario, etc.)   │   │
│   │                                         │   │
│   │   ┌───────────────────────────────┐     │   │
│   │   │           DOMINIO             │     │   │
│   │   │  (Entidades + Reglas puras)   │     │   │
│   │   └───────────────────────────────┘     │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

> 💡 **Regla de oro:** Las capas internas **nunca** conocen a las externas. El dominio no sabe que existe NestJS, MySQL, ni Azure.

### 🏗️ Estructura de carpetas en el proyecto

```
src/
├── domain/               ← Capa 1: El corazón (sin dependencias externas)
│   ├── entities/         ← Las "cosas" del negocio (Usuario, Producto...)
│   ├── ports/            ← Los contratos (interfaces)
│   └── value-objects/    ← Valores inmutables (Email, Precio...)
│
├── application/          ← Capa 2: Los casos de uso
│   └── use-cases/        ← Lo que el sistema "puede hacer"
│
└── infrastructure/       ← Capa 3: El mundo exterior
    ├── http/             ← Controladores NestJS
    ├── database/         ← Repositorios (TypeORM, Prisma...)
    └── external/         ← Llamadas a APIs de terceros
```

### ✏️ Ejercicio 1

Antes de escribir código, responde en tu cuaderno:
1. En tu proyecto actual, ¿dónde vive la lógica de negocio? ¿Está mezclada con los controladores?
2. ¿Qué pasaría si mañana cambias MySQL por MongoDB? ¿Cuánto código tendrías que tocar?

---

## Paso 2 — Aplicar Arquitectura Hexagonal en NestJS + TypeScript

### 🧠 ¿Qué es NestJS?

NestJS es un framework de Node.js para construir backends. Usa TypeScript (JavaScript con tipos) y está inspirado en Angular. Su estructura modular encaja perfectamente con la arquitectura hexagonal.

### 🛠️ Tarea: Crea tu primera entidad de dominio

Una **entidad** representa algo del negocio. Por ejemplo, un `User`:

```typescript
// src/domain/entities/user.entity.ts

export class User {
  constructor(
    private readonly id: string,
    private name: string,
    private email: string,
    private readonly createdAt: Date,
  ) {}

  // Regla de negocio: el nombre no puede estar vacío
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    this.name = newName.trim();
  }

  // Getters (para leer los datos)
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getEmail(): string { return this.email; }
}
```

> 💡 **Nota:** ¿Ves que `User` no importa nada de NestJS ni de ninguna base de datos? Eso es arquitectura hexagonal en acción.

### 🛠️ Tarea: Crea un puerto (contrato)

Un **puerto** es una interfaz que define *qué* necesitamos, sin decir *cómo* se implementa:

```typescript
// src/domain/ports/user.repository.port.ts

import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 🛠️ Tarea: Crea un caso de uso

Un **caso de uso** orquesta la lógica. Por ejemplo, "crear un usuario":

```typescript
// src/application/use-cases/create-user.use-case.ts

import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { v4 as uuid } from 'uuid';

export class CreateUserUseCase {
  constructor(
    // Inyectamos el puerto (no la implementación concreta)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(name: string, email: string): Promise<User> {
    // Verificar si el email ya existe
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Ya existe un usuario con ese email');
    }

    // Crear la entidad
    const user = new User(uuid(), name, email, new Date());

    // Guardar usando el puerto
    await this.userRepository.save(user);

    return user;
  }
}
```

### 🛠️ Tarea: Crea el adaptador (implementación real)

El **adaptador** implementa el puerto usando la tecnología concreta (TypeORM, Prisma, etc.):

```typescript
// src/infrastructure/database/user.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { Userorm } from './user.orm-entity';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrm)
    private readonly repo: Repository<UserOrm>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) return null;
    return new User(record.id, record.name, record.email, record.createdAt);
  }

  async save(user: User): Promise<void> {
    await this.repo.save({
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
    });
  }

  // ... implementar findByEmail y delete
}
```

### ✏️ Ejercicio 2

1. Crea la entidad `Product` con campos: `id`, `name`, `price`, `stock`.
2. Agrega una regla de negocio: el precio no puede ser negativo.
3. Crea el puerto `ProductRepositoryPort` con métodos: `findById`, `findAll`, `save`.

---

## Paso 3 — Mejorar el Frontend con ReactJS

### 🧠 ¿Por qué separar lógica de presentación en React?

Imagina que tienes un componente que hace todo a la vez: llama a la API, calcula totales, y renderiza la tabla. Si mañana cambias la API, tienes que tocar el mismo archivo que muestra los datos. Eso es frágil.

**La solución:** separar en capas, igual que en el backend.

```
Componentes (UI)         ← Solo renderizan, no saben de APIs
     ↕
Custom Hooks (lógica)    ← Manejan estado y efectos
     ↕
Services (datos)         ← Llaman a las APIs
```

### 🛠️ Tarea: Crea un servicio de datos

```typescript
// src/services/user.service.ts

const API_BASE = process.env.REACT_APP_API_URL;

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },

  async create(name: string, email: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) throw new Error('Error al crear usuario');
    return res.json();
  },
};
```

### 🛠️ Tarea: Crea un Custom Hook

```typescript
// src/hooks/useUsers.ts

import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService.getAll()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const createUser = async (name: string, email: string) => {
    const newUser = await userService.create(name, email);
    setUsers(prev => [...prev, newUser]);
  };

  return { users, loading, error, createUser };
}
```

### 🛠️ Tarea: Componente limpio (solo UI)

```tsx
// src/components/UserList.tsx

import { useUsers } from '../hooks/useUsers';

export function UserList() {
  const { users, loading, error } = useUsers();

  if (loading) return <p>Cargando usuarios...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name} — {user.email}</li>
      ))}
    </ul>
  );
}
```

> 💡 **El componente no sabe nada de `fetch`, ni de la URL de la API.** Solo recibe datos y los muestra. Eso lo hace fácil de testear y de reutilizar.

### ✏️ Ejercicio 3

1. Crea `productService` con métodos `getAll` y `create`.
2. Crea el hook `useProducts` que use ese servicio.
3. Crea el componente `ProductList` que use el hook y muestre nombre y precio.

---

## Paso 4 — Desplegar en Azure

### 🧠 ¿Qué es Azure y por qué lo usamos?

Azure es la plataforma de nube de Microsoft. En lugar de comprar servidores físicos, "alquilas" recursos en internet. Pagas solo lo que usas.

### Servicios que vamos a usar

| Servicio | Para qué sirve |
|---|---|
| **App Services** | Hospedar el backend NestJS y el frontend React |
| **Azure Functions** | Ejecutar tareas puntuales sin mantener un servidor (ej: enviar emails) |
| **SQL Database** | Base de datos gestionada (Azure la mantiene, tú solo la usas) |

### 🛠️ Tarea: Configurar variables de entorno

Nunca guardes credenciales en el código. Usa variables de entorno:

```bash
# .env (NO subir a git — agregar al .gitignore)
DATABASE_URL=Server=tu-server.database.windows.net;...
AZURE_STORAGE_KEY=abc123...
JWT_SECRET=una_clave_muy_segura
```

```typescript
// En NestJS, acceder con ConfigService
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getDatabaseUrl(): string {
    return this.config.get<string>('DATABASE_URL');
  }
}
```

### ✏️ Ejercicio 4

1. Crea un archivo `.env.example` con las variables que necesita tu proyecto (sin valores reales).
2. Verifica que `.env` está en tu `.gitignore`.
3. Documenta en el README qué variable hace qué.

---

## Paso 5 — Automatizar con CI/CD

### 🧠 ¿Qué significa CI/CD?

- **CI (Continuous Integration):** Cada vez que subes código, se ejecutan los tests automáticamente para detectar errores rápido.
- **CD (Continuous Deployment):** Si los tests pasan, el código se despliega automáticamente al servidor.

**Sin CI/CD:** "Funciona en mi máquina 🤷" → deploy manual → errores en producción.
**Con CI/CD:** Push a `main` → tests → deploy automático → producción actualizada en minutos.

### 🛠️ Tarea: Crear el pipeline con GitHub Actions

Crea el archivo `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

# Se ejecuta cuando hay un push a main o un Pull Request
on:
  push:
    branches: [main, rama-arq-hexagonal]
  pull_request:
    branches: [main]

jobs:
  # ── Job 1: Tests del Backend ──────────────────────────
  backend-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Descargar el código
        uses: actions/checkout@v3

      - name: Instalar Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Instalar dependencias
        run: cd backend && npm install

      - name: Ejecutar pruebas
        run: cd backend && npm run test

      - name: Verificar que compila
        run: cd backend && npm run build

  # ── Job 2: Tests del Frontend ─────────────────────────
  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Instalar dependencias
        run: cd frontend && npm install

      - name: Ejecutar pruebas
        run: cd frontend && npm run test -- --watchAll=false

  # ── Job 3: Deploy (solo si los tests pasan) ───────────
  deploy:
    needs: [backend-tests, frontend-tests]  # Espera que ambos pasen
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'     # Solo en rama main

    steps:
      - uses: actions/checkout@v3

      - name: Desplegar en Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'tu-app-name'
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: './backend'
```

> 💡 **`secrets.AZURE_PUBLISH_PROFILE`** es una credencial que guardas en los "Secrets" de GitHub (nunca en el código).

### ✏️ Ejercicio 5

1. Crea el archivo `.github/workflows/ci.yml` en tu proyecto.
2. Haz un push con un error intencional en un test y observa cómo el pipeline falla.
3. Corrige el error, haz push y verifica que el pipeline pasa.

---

## Paso 6 — Asegurar calidad con pruebas

### 🧠 Tipos de pruebas

| Tipo | Qué testea | Velocidad | Ejemplo |
|---|---|---|---|
| **Unitaria** | Una función o clase aislada | Muy rápida | `CreateUserUseCase` funciona solo |
| **Integración** | Varios componentes juntos | Media | El controlador + el repositorio |
| **E2E (end-to-end)** | Todo el flujo completo | Lenta | Login → ver dashboard |

### 🛠️ Tarea: Prueba unitaria del caso de uso

```typescript
// src/application/use-cases/create-user.use-case.spec.ts

import { CreateUserUseCase } from './create-user.use-case';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';

describe('CreateUserUseCase', () => {
  // Mock: simula el repositorio sin base de datos real
  const mockRepository: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  let useCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateUserUseCase(mockRepository);
  });

  it('debe crear un usuario si el email no existe', async () => {
    // Arrange: el email no existe en la base de datos
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(undefined);

    // Act: ejecutar el caso de uso
    const user = await useCase.execute('Ana García', 'ana@example.com');

    // Assert: verificar los resultados
    expect(user.getName()).toBe('Ana García');
    expect(user.getEmail()).toBe('ana@example.com');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar error si el email ya está registrado', async () => {
    // Arrange: el email YA existe
    mockRepository.findByEmail.mockResolvedValue(/* un usuario existente */);

    // Assert: debe lanzar un error
    await expect(
      useCase.execute('Juan', 'existente@example.com')
    ).rejects.toThrow('Ya existe un usuario con ese email');
  });
});
```

### 🛠️ Tarea: Prueba unitaria de la entidad

```typescript
// src/domain/entities/user.entity.spec.ts

import { User } from './user.entity';

describe('User Entity', () => {
  const createUser = () =>
    new User('1', 'María López', 'maria@example.com', new Date());

  it('debe actualizar el nombre correctamente', () => {
    const user = createUser();
    user.updateName('María González');
    expect(user.getName()).toBe('María González');
  });

  it('debe lanzar error si el nombre está vacío', () => {
    const user = createUser();
    expect(() => user.updateName('')).toThrow('El nombre no puede estar vacío');
    expect(() => user.updateName('   ')).toThrow('El nombre no puede estar vacío');
  });
});
```

### ✏️ Ejercicio 6

1. Escribe 3 tests para la entidad `Product` que creaste en el Ejercicio 2.
2. Escribe tests para un caso de uso `CreateProductUseCase`.
3. Ejecuta `npm run test` y verifica que todos pasan.

---

## Paso 7 — Limpiar la deuda técnica

### 🧠 ¿Qué es la deuda técnica?

Es código que "funciona" pero está mal escrito: difícil de leer, de mantener, o que puede fallar. Es como dejar los platos sucios: a corto plazo no pasa nada, pero si nunca los lavas, la cocina se vuelve inutilizable.

### Señales de alerta (code smells)

```typescript
// ❌ MAL: función que hace demasiado (violación del principio de responsabilidad única)
async function processOrder(orderId: string, userId: string, items: any[]) {
  const user = await db.query(`SELECT * FROM users WHERE id = '${userId}'`); // ← SQL injection!
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].qty;
    await db.query(`UPDATE stock SET qty = qty - ${items[i].qty} WHERE id = ${items[i].id}`);
  }
  await sendEmail(user.email, `Tu pedido #${orderId} por $${total} fue recibido`);
  return { orderId, total, status: 'ok' };
}

// ✅ BIEN: separado en responsabilidades claras
class OrderService {
  constructor(
    private orderRepository: OrderRepositoryPort,
    private stockService: StockService,
    private emailService: EmailService,
  ) {}

  async processOrder(command: ProcessOrderCommand): Promise<Order> {
    const order = await this.orderRepository.findById(command.orderId);
    await this.stockService.decrementStock(order.items);
    await this.emailService.sendOrderConfirmation(order);
    return order;
  }
}
```

### 🛠️ Tarea: Checklist de revisión de código

Antes de hacer un Pull Request, revisa tu código con esta lista:

```markdown
## Checklist PR

### Arquitectura
- [ ] La lógica de negocio está en el dominio (no en controladores)
- [ ] No hay imports de infraestructura en el dominio
- [ ] Los casos de uso usan puertos, no implementaciones concretas

### Código limpio
- [ ] Las funciones hacen UNA sola cosa
- [ ] Los nombres de variables y funciones son descriptivos
- [ ] No hay código comentado sin explicación
- [ ] No hay console.log() olvidados

### Seguridad
- [ ] No hay credenciales en el código
- [ ] Las consultas a BD usan parámetros (no concatenación de strings)
- [ ] Los inputs del usuario se validan

### Pruebas
- [ ] Los nuevos casos de uso tienen tests
- [ ] Las entidades con reglas tienen tests
- [ ] Los tests pasan localmente
```

### ✏️ Ejercicio 7

1. Abre un archivo existente del proyecto y aplica la checklist.
2. Identifica al menos 2 mejoras posibles.
3. Aplica las mejoras y crea un commit con un mensaje descriptivo.

---

## Paso 8 — Trabajar en equipo con estándares

### 🛠️ Tarea: Configurar ESLint + Prettier

Estas herramientas unifican el estilo del código en todo el equipo automáticamente.

```bash
# Instalar
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Crear configuración
npx eslint --init
```

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 🛠️ Tarea: Convención de commits

Usa **Conventional Commits** para que el historial de Git sea legible:

```bash
# Formato
<tipo>(<ámbito>): <descripción corta>

# Tipos disponibles
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: mejora de código sin cambiar funcionalidad
test:     añadir o modificar tests
docs:     cambios en documentación
chore:    tareas de mantenimiento (deps, config)

# Ejemplos
feat(users): agregar caso de uso CreateUser
fix(auth): corregir validación de token expirado
refactor(products): extraer lógica a capa de dominio
test(orders): agregar pruebas unitarias al OrderService
docs: actualizar guía de arquitectura hexagonal
```

### 🛠️ Tarea: Configurar protección de la rama principal

En GitHub, ve a **Settings → Branches → Add rule** y activa:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging (selecciona tu pipeline de CI)
- ✅ Require at least 1 approving review

> Esto asegura que **nadie puede subir código directamente a `main`** sin que pasen los tests y sin revisión de un compañero.

### ✏️ Ejercicio 8

1. Configura ESLint y Prettier en el proyecto.
2. Ejecuta `npx eslint src/` y corrige los errores que encuentre.
3. Crea un Pull Request con tus cambios de esta rama siguiendo la convención de commits.

---

## 🎯 Resumen: Lo que aprendiste

| Paso | Concepto | Por qué importa |
|---|---|---|
| 1 | Arquitectura Hexagonal | Código que aguanta el cambio |
| 2 | Entidades, Puertos, Adaptadores | Separación de responsabilidades |
| 3 | Servicios, Hooks, Componentes | Frontend mantenible |
| 4 | Azure (App Services, SQL) | Despliegue profesional en la nube |
| 5 | GitHub Actions / CI/CD | Automatización = menos errores |
| 6 | Tests unitarios e integración | Confianza para cambiar código |
| 7 | Deuda técnica | Código que el equipo puede leer |
| 8 | Estándares de equipo | Colaboración efectiva |

---

## 📖 Recursos para seguir aprendiendo

- [NestJS Docs](https://docs.nestjs.com) — Documentación oficial
- [Arquitectura Hexagonal — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/) — El artículo original
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Jest Docs](https://jestjs.io/docs/getting-started) — Testing en JavaScript/TypeScript
- [GitHub Actions Docs](https://docs.github.com/en/actions) — CI/CD con GitHub

---

> 💬 **¿Tienes dudas?** Crea un Issue en el repositorio con el prefijo `[PREGUNTA]:` y el equipo te ayudará.


---

# 🏗️ Guía educativa: Refactoring a Arquitectura Hexagonal

> **Proyecto:** `nest-api-task` — Task Manager API  
> **Rama:** `rama-arq-hexagonal`  
> **Nivel:** Desde cero — el código actual ya funciona, vamos a mejorarlo  
> **Objetivo:** Transformar la arquitectura actual (Controller → Service → Repository) a Arquitectura Hexagonal

---

## 📌 Punto de partida: ¿Cómo está el proyecto hoy?

Antes de mejorar algo, hay que entender qué tenemos. El proyecto actual funciona así:

```
src/
└── tasks/
    ├── tasks.module.ts         ← Conecta todo
    ├── tasks.controller.ts     ← Recibe peticiones HTTP
    ├── tasks.service.ts        ← Lógica de negocio + acceso a BD
    ├── tasks.service.spec.ts   ← Tests del servicio
    ├── tasks.controller.spec.ts ← Tests del controlador
    ├── dto/
    │   └── task.dto.ts         ← Validación de datos de entrada
    └── entities/
        └── task.entity.ts      ← Tabla en PostgreSQL
```

**El problema que vamos a resolver:**

En `tasks.service.ts`, la lógica de negocio y el acceso a la base de datos viven **en el mismo lugar**:

```typescript
// tasks.service.ts — línea real del proyecto
async getTasks(status?: TaskStatus): Promise<Task[]> {
  if (status) {
    return this.taskRepository.find({ where: { status } }); // ← BD aquí
  }
  return this.taskRepository.find({                         // ← BD aquí también
    order: { priority: 'DESC', createdAt: 'DESC' },
  });
}
```

¿Cuál es el problema? Si mañana cambias de PostgreSQL a MongoDB, tienes que tocar el mismo archivo que contiene las reglas de negocio. Eso es frágil.

La **Arquitectura Hexagonal** separa eso en capas independientes.

---

## 🗺️ El plan de mejora (8 pasos)

```
Paso 1 → Entender el problema con ejemplos del proyecto real
Paso 2 → Diseñar la nueva estructura de carpetas
Paso 3 → Crear la capa de Dominio (Task como entidad pura)
Paso 4 → Crear los Puertos (contratos de la capa de dominio)
Paso 5 → Crear los Casos de Uso (lógica de negocio aislada)
Paso 6 → Crear los Adaptadores (implementaciones concretas)
Paso 7 → Conectar todo en el módulo NestJS
Paso 8 → Actualizar los tests
```

---

## Paso 1 — ¿Por qué cambiar algo que funciona?

### 🧠 La analogía del restaurante

El proyecto actual es como un restaurante donde **el mesero también cocina**. Funciona, pero:

- Si cambias al cocinero, el mesero también cambia.
- Si quieres probar la cocina, tienes que llamar también al mesero.
- Si agregas un delivery, tienes que reescribir todo.

La arquitectura hexagonal separa roles:

```
HOY (proyecto actual):
┌────────────────────────────────────────────────┐
│ TasksController                                │
│   ↓ llama a                                    │
│ TasksService  ← tiene lógica + acceso a BD     │ 
│   ↓ usa directamente                           │
│ Repository<Task>  (TypeORM + PostgreSQL)       │
└────────────────────────────────────────────────┘

DESPUÉS (arquitectura hexagonal):
┌────────────────────────────────────────────────┐
│ INFRAESTRUCTURA (NestJS, TypeORM, PostgreSQL)  │
│   TasksController → llama a casos de uso       │
│   TaskRepositoryAdapter → implementa el puerto │
│                                                │
│   ┌──────────────────────────────────────────┐ │
│   │ APLICACIÓN                               │ │
│   │   CreateTaskUseCase                      │ │
│   │   GetTasksUseCase                        │ │
│   │   DeleteTaskUseCase  ...                 │ │
│   │                                          │ │
│   │   ┌──────────────────────────────────┐   │ │
│   │   │ DOMINIO                          │   │ │
│   │   │   Task (entidad pura)            │   │ │
│   │   │   TaskStatus (valor del negocio) │   │ │
│   │   │   TaskRepositoryPort (contrato)  │   │ │
│   │   └──────────────────────────────────┘   │ │
│   └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### ✏️ Ejercicio 1

Abre `src/tasks/tasks.service.ts` del proyecto y responde:

1. ¿Puedes identificar cuál es lógica de negocio y cuál es acceso a base de datos?
2. En el método `getTaskStats()`, ¿cuántas veces consulta la BD directamente?
3. Si reemplazaras TypeORM por Prisma, ¿cuántos archivos tendrías que modificar hoy?

---

## Paso 2 — La nueva estructura de carpetas

### La estructura objetivo

```
src/
├── app.module.ts
├── main.ts
└── tasks/
    │
    ├── domain/                          ← 🟣 Capa 1: Núcleo del negocio
    │   ├── task.entity.ts               ← Entidad pura (sin decoradores TypeORM)
    │   ├── task-status.enum.ts          ← Enum de estados (ya existe, se mueve)
    │   └── ports/
    │       └── task.repository.port.ts  ← Contrato: qué operaciones necesitamos
    │
    ├── application/                     ← 🔵 Capa 2: Casos de uso
    │   └── use-cases/
    │       ├── get-tasks.use-case.ts
    │       ├── get-task-by-id.use-case.ts
    │       ├── create-task.use-case.ts
    │       ├── update-task.use-case.ts
    │       ├── delete-task.use-case.ts
    │       └── get-task-stats.use-case.ts
    │
    └── infrastructure/                  ← 🟠 Capa 3: Tecnología concreta
        ├── http/
        │   ├── tasks.controller.ts      ← El controller actual (adaptado)
        │   └── dto/
        │       └── task.dto.ts          ← Los DTOs actuales (se mueven aquí)
        ├── database/
        │   ├── task.orm-entity.ts       ← Entidad TypeORM (con decoradores)
        │   └── task.repository.ts       ← Implementación del puerto
        └── tasks.module.ts              ← Módulo NestJS (adaptado)
```

> 💡 **Regla de oro:** El código en `domain/` nunca importa nada de `infrastructure/`. La dependencia solo va hacia adentro.

---

## Paso 3 — Crear la capa de Dominio

### 🧠 ¿Qué es el dominio?

Es el corazón de la aplicación. Contiene las reglas de negocio **puras**, sin saber que existe NestJS, TypeORM, ni PostgreSQL.

### 3.1 — Mover y limpiar el enum de estados

El `TaskStatus` ya existe en `task.entity.ts`. Lo separamos en su propio archivo:

```typescript
// src/tasks/domain/task-status.enum.ts

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}
```

### 3.2 — Crear la entidad de dominio

Esta es la versión "pura" de `Task`. **Sin** `@Entity()`, **sin** `@Column()`, **sin** TypeORM:

```typescript
// src/tasks/domain/task.entity.ts

import { TaskStatus } from './task-status.enum';

export class Task {
  constructor(
    public readonly id: number,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public priority: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ── Reglas de negocio del dominio ──────────────────────────────────

  /**
   * Una tarea completada no puede volver a pendiente.
   * Esta regla vive aquí, no en el service ni en el controller.
   */
  changeStatus(newStatus: TaskStatus): void {
    if (this.status === TaskStatus.COMPLETED && newStatus === TaskStatus.PENDING) {
      throw new Error('Una tarea completada no puede volver a estado pendiente');
    }
    this.status = newStatus;
  }

  /**
   * El título no puede estar vacío ni ser solo espacios.
   */
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('El título de la tarea no puede estar vacío');
    }
    this.title = newTitle.trim();
  }

  /**
   * Verifica si la tarea está completada.
   * Útil en los casos de uso para validaciones.
   */
  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  /**
   * Verifica si tiene prioridad alta (4 o 5).
   */
  isHighPriority(): boolean {
    return this.priority >= 4;
  }
}
```

> 💡 ¿Ves la diferencia? La `Task` actual en el proyecto tiene decoradores `@Entity()`, `@Column()`, etc. Esos son detalles de infraestructura (TypeORM). La entidad de dominio **no los necesita**.

### ✏️ Ejercicio 3

Compara los dos archivos:

| Característica | `task.entity.ts` actual | `task.entity.ts` nuevo (dominio) |
|---|---|---|
| Importa de TypeORM | Sí (`@Entity`, `@Column`...) | No |
| Tiene reglas de negocio | No | Sí (`changeStatus`, `updateTitle`) |
| Depende de NestJS | Indirectamente | No |
| Se puede testear sin BD | Difícil | Fácil |

Agrega una regla de negocio nueva: `una tarea en progreso no puede bajar directamente a prioridad 1`. Impleméntala en la entidad de dominio.

---

## Paso 4 — Crear los Puertos

### 🧠 ¿Qué es un puerto?

Un **puerto** es un contrato: define *qué* operaciones necesita el dominio, sin decir *cómo* se implementan. Es solo una interfaz TypeScript.

Mira las operaciones que usa `tasks.service.ts` hoy:

```typescript
// Estas 5 operaciones sobre el repositorio son exactamente los métodos de nuestro puerto
this.taskRepository.find(...)     // → findAll / findByStatus
this.taskRepository.findOne(...)  // → findById
this.taskRepository.create(...)   // → (parte de save)
this.taskRepository.save(...)     // → save
this.taskRepository.remove(...)   // → delete
this.taskRepository.count(...)    // → count / countByStatus
```

### Crear el puerto del repositorio

```typescript
// src/tasks/domain/ports/task.repository.port.ts

import { Task } from '../task.entity';
import { TaskStatus } from '../task-status.enum';

/**
 * Puerto de salida: define cómo el dominio accede a la persistencia.
 * El dominio DEPENDE de esta interfaz, NO de TypeORM ni PostgreSQL.
 * TypeORM depende de esta interfaz implementándola.
 */
export interface TaskRepositoryPort {
  /**
   * Obtiene todas las tareas, opcionalmente filtradas por estado.
   * Corresponde al método getTasks() del service actual.
   */
  findAll(status?: TaskStatus): Promise<Task[]>;

  /**
   * Obtiene una tarea por su ID.
   * Retorna null si no existe (el caso de uso decide qué hacer con null).
   */
  findById(id: number): Promise<Task | null>;

  /**
   * Guarda una tarea (create o update según si tiene ID).
   * Fusiona taskRepository.create() + taskRepository.save() del service actual.
   */
  save(task: Partial<Task>): Promise<Task>;

  /**
   * Elimina una tarea por su ID.
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta tareas por estado. Usado en getTaskStats().
   */
  countByStatus(status: TaskStatus): Promise<number>;

  /**
   * Cuenta el total de tareas.
   */
  countAll(): Promise<number>;
}
```

> 💡 **Clave:** Esta interfaz no importa nada de TypeORM. Si mañana cambias a MongoDB, este archivo no cambia.

---

## Paso 5 — Crear los Casos de Uso

### 🧠 ¿Qué es un caso de uso?

Un caso de uso representa **una acción del sistema**: "crear una tarea", "obtener estadísticas", etc.

Hoy esa lógica vive toda junta en `tasks.service.ts`. Vamos a separar cada método en su propio archivo, usando el puerto en lugar del repositorio directo.

### 5.1 — Caso de uso: GetTasks

```typescript
// src/tasks/application/use-cases/get-tasks.use-case.ts

import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { TaskStatus } from '../../domain/task-status.enum';
import { Task } from '../../domain/task.entity';

export class GetTasksUseCase {
  constructor(
    // Recibe el PUERTO (interfaz), no la implementación
    private readonly taskRepository: TaskRepositoryPort,
  ) {}

  /**
   * Equivale al método getTasks() del TasksService actual.
   * La diferencia: no sabe nada de TypeORM.
   */
  async execute(status?: TaskStatus): Promise<Task[]> {
    return this.taskRepository.findAll(status);
  }
}
```

### 5.2 — Caso de uso: GetTaskById

```typescript
// src/tasks/application/use-cases/get-task-by-id.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { Task } from '../../domain/task.entity';

export class GetTaskByIdUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  /**
   * Equivale al método getTaskById() del TasksService actual.
   * La lógica del 404 ahora vive aquí, en el caso de uso.
   */
  async execute(id: number): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    return task;
  }
}
```

### 5.3 — Caso de uso: CreateTask

```typescript
// src/tasks/application/use-cases/create-task.use-case.ts

import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { Task } from '../../domain/task.entity';
import { TaskStatus } from '../../domain/task-status.enum';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  priority?: number;
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  /**
   * Equivale al método createTask() del TasksService actual.
   * Podemos agregar reglas: por ejemplo, si el título es "urgente",
   * la prioridad mínima es 4. Eso es lógica de negocio que vive aquí.
   */
  async execute(command: CreateTaskCommand): Promise<Task> {
    // Ejemplo de regla de negocio en el caso de uso:
    let priority = command.priority ?? 1;
    if (command.title.toLowerCase().includes('urgente')) {
      priority = Math.max(priority, 4);
    }

    return this.taskRepository.save({
      title: command.title,
      description: command.description ?? null,
      status: TaskStatus.PENDING,
      priority,
    });
  }
}
```

### 5.4 — Caso de uso: UpdateTask

```typescript
// src/tasks/application/use-cases/update-task.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { Task } from '../../domain/task.entity';
import { TaskStatus } from '../../domain/task-status.enum';

export interface UpdateTaskCommand {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
}

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  /**
   * Equivale al método updateTask() del TasksService actual.
   * Ahora podemos usar las reglas de negocio de la entidad Task.
   */
  async execute(id: number, command: UpdateTaskCommand): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    // Usamos los métodos de la entidad que tienen reglas de negocio
    if (command.title) {
      task.updateTitle(command.title); // ← Valida que no esté vacío
    }

    if (command.status) {
      task.changeStatus(command.status); // ← Valida transiciones inválidas
    }

    if (command.priority !== undefined) {
      task.priority = command.priority;
    }

    if (command.description !== undefined) {
      task.description = command.description;
    }

    return this.taskRepository.save(task);
  }
}
```

### 5.5 — Caso de uso: DeleteTask

```typescript
// src/tasks/application/use-cases/delete-task.use-case.ts

import { NotFoundException } from '@nestjs/common';
import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  /**
   * Equivale al método deleteTask() del TasksService actual.
   */
  async execute(id: number): Promise<void> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    await this.taskRepository.delete(id);
  }
}
```

### 5.6 — Caso de uso: GetTaskStats

```typescript
// src/tasks/application/use-cases/get-task-stats.use-case.ts

import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { TaskStatus } from '../../domain/task-status.enum';

export class GetTaskStatsUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  /**
   * Equivale al método getTaskStats() del TasksService actual.
   */
  async execute() {
    const [total, pending, inProgress, completed] = await Promise.all([
      this.taskRepository.countAll(),
      this.taskRepository.countByStatus(TaskStatus.PENDING),
      this.taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
      this.taskRepository.countByStatus(TaskStatus.COMPLETED),
    ]);

    return { total, pending, inProgress, completed };
  }
}
```

> 💡 **Nota:** Usamos `Promise.all()` en lugar de 4 `await` separados. Esto ejecuta las 4 consultas **en paralelo**, lo que es más eficiente.

### ✏️ Ejercicio 5

Revisa el `tasks.service.ts` actual y completa esta tabla:

| Método en service actual | Caso de uso equivalente | ¿Tiene lógica de negocio? |
|---|---|---|
| `getTasks()` | `GetTasksUseCase` | No (solo delega) |
| `getTaskById()` | `GetTaskByIdUseCase` | Sí (lanza 404) |
| `createTask()` | `CreateTaskUseCase` | Sí (regla "urgente") |
| `updateTask()` | ... | ... |
| `deleteTask()` | ... | ... |
| `getTaskStats()` | ... | ... |

---

## Paso 6 — Crear el Adaptador del Repositorio

### 🧠 ¿Qué es un adaptador?

Es quien **implementa el puerto** usando tecnología concreta (TypeORM). Traduce entre el mundo del dominio y el mundo de la base de datos.

### 6.1 — Mantener la entidad TypeORM por separado

La entidad ORM es diferente a la entidad de dominio. Tiene los decoradores de TypeORM:

```typescript
// src/tasks/infrastructure/database/task.orm-entity.ts

import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../domain/task-status.enum';

/**
 * Esta clase es el "mapa" entre el dominio y la base de datos.
 * Solo vive en la capa de infraestructura.
 */
@Entity('tasks')
export class TaskOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 6.2 — Implementar el puerto con TypeORM

```typescript
// src/tasks/infrastructure/database/task.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { Task } from '../../domain/task.entity';
import { TaskStatus } from '../../domain/task-status.enum';
import { TaskOrmEntity } from './task.orm-entity';

@Injectable()
export class TaskRepository implements TaskRepositoryPort {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly ormRepository: Repository<TaskOrmEntity>,
  ) {}

  // ── Métodos de mapeo (ORM → Dominio) ─────────────────────────────────

  /**
   * Convierte un registro de BD (TaskOrmEntity) a entidad de dominio (Task).
   * El dominio no sabe nada de TypeORM, este mapper es el traductor.
   */
  private toDomain(orm: TaskOrmEntity): Task {
    return new Task(
      orm.id,
      orm.title,
      orm.description,
      orm.status,
      orm.priority,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  // ── Implementación del puerto ─────────────────────────────────────────

  async findAll(status?: TaskStatus): Promise<Task[]> {
    const records = await this.ormRepository.find({
      where: status ? { status } : undefined,
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
    return records.map(this.toDomain);
  }

  async findById(id: number): Promise<Task | null> {
    const record = await this.ormRepository.findOne({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(task: Partial<Task>): Promise<Task> {
    const saved = await this.ormRepository.save(task);
    return this.toDomain(saved as TaskOrmEntity);
  }

  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    return this.ormRepository.count({ where: { status } });
  }

  async countAll(): Promise<number> {
    return this.ormRepository.count();
  }
}
```

---

## Paso 7 — Conectar todo en el módulo NestJS

### 7.1 — Adaptar el controller

El controller deja de llamar al `TasksService` y llama directamente a los casos de uso:

```typescript
// src/tasks/infrastructure/http/tasks.controller.ts

import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
  UsePipes, ValidationPipe, ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { GetTasksUseCase }      from '../../application/use-cases/get-tasks.use-case';
import { GetTaskByIdUseCase }   from '../../application/use-cases/get-task-by-id.use-case';
import { CreateTaskUseCase }    from '../../application/use-cases/create-task.use-case';
import { UpdateTaskUseCase }    from '../../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase }    from '../../application/use-cases/delete-task.use-case';
import { GetTaskStatsUseCase }  from '../../application/use-cases/get-task-stats.use-case';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from '../../domain/task-status.enum';

@ApiTags('tasks')
@Controller('tasks')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class TasksController {
  constructor(
    // Inyectamos casos de uso, no un "service" monolítico
    private readonly getTasksUseCase: GetTasksUseCase,
    private readonly getTaskByIdUseCase: GetTaskByIdUseCase,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly getTaskStatsUseCase: GetTaskStatsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  getAllTasks(@Query('status') status?: TaskStatus) {
    return this.getTasksUseCase.execute(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de tareas' })
  getTaskStats() {
    return this.getTaskStatsUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', type: Number })
  getTaskById(@Param('id', ParseIntPipe) id: number) {
    return this.getTaskByIdUseCase.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  createTask(@Body() dto: CreateTaskDto) {
    return this.createTaskUseCase.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.updateTaskUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.deleteTaskUseCase.execute(id);
  }
}
```

### 7.2 — Adaptar el módulo

El módulo ahora registra los casos de uso y conecta el repositorio concreto con el puerto:

```typescript
// src/tasks/infrastructure/tasks.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController }     from './http/tasks.controller';
import { TaskRepository }      from './database/task.repository';
import { TaskOrmEntity }       from './database/task.orm-entity';

import { GetTasksUseCase }     from '../application/use-cases/get-tasks.use-case';
import { GetTaskByIdUseCase }  from '../application/use-cases/get-task-by-id.use-case';
import { CreateTaskUseCase }   from '../application/use-cases/create-task.use-case';
import { UpdateTaskUseCase }   from '../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase }   from '../application/use-cases/delete-task.use-case';
import { GetTaskStatsUseCase } from '../application/use-cases/get-task-stats.use-case';

/**
 * Token para identificar el repositorio en el contenedor de NestJS.
 * Permite que los casos de uso reciban el puerto sin saber qué implementación usan.
 */
export const TASK_REPOSITORY = 'TASK_REPOSITORY';

@Module({
  imports: [TypeOrmModule.forFeature([TaskOrmEntity])],
  controllers: [TasksController],
  providers: [
    // 1. Registro del adaptador de repositorio con el token del puerto
    {
      provide: TASK_REPOSITORY,
      useClass: TaskRepository,
    },

    // 2. Registro de cada caso de uso con su dependencia inyectada
    {
      provide: GetTasksUseCase,
      useFactory: (repo) => new GetTasksUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: GetTaskByIdUseCase,
      useFactory: (repo) => new GetTaskByIdUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: CreateTaskUseCase,
      useFactory: (repo) => new CreateTaskUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: UpdateTaskUseCase,
      useFactory: (repo) => new UpdateTaskUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: DeleteTaskUseCase,
      useFactory: (repo) => new DeleteTaskUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
    {
      provide: GetTaskStatsUseCase,
      useFactory: (repo) => new GetTaskStatsUseCase(repo),
      inject: [TASK_REPOSITORY],
    },
  ],
})
export class TasksModule {}
```

---

## Paso 8 — Actualizar los Tests

### 🧠 ¿Por qué la nueva arquitectura hace los tests más fáciles?

Hoy en `tasks.service.spec.ts` necesitas mockear el `Repository<Task>` de TypeORM.  
Con la nueva arquitectura, solo necesitas mockear el **puerto** (una interfaz simple).

### 8.1 — Test del caso de uso CreateTask

```typescript
// src/tasks/application/use-cases/create-task.use-case.spec.ts

import { CreateTaskUseCase } from './create-task.use-case';
import { TaskRepositoryPort } from '../../domain/ports/task.repository.port';
import { TaskStatus } from '../../domain/task-status.enum';
import { Task } from '../../domain/task.entity';

describe('CreateTaskUseCase', () => {
  // Mock del puerto: mucho más simple que mockear TypeORM
  const mockRepository: jest.Mocked<TaskRepositoryPort> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
    countAll: jest.fn(),
  };

  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTaskUseCase(mockRepository);
  });

  it('debe crear una tarea con prioridad 1 por defecto', async () => {
    // Arrange
    const savedTask = new Task(1, 'Nueva tarea', null, TaskStatus.PENDING, 1, new Date(), new Date());
    mockRepository.save.mockResolvedValue(savedTask);

    // Act
    const result = await useCase.execute({ title: 'Nueva tarea' });

    // Assert
    expect(result.title).toBe('Nueva tarea');
    expect(result.status).toBe(TaskStatus.PENDING);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nueva tarea', status: TaskStatus.PENDING })
    );
  });

  it('debe asignar prioridad mínima 4 si el título contiene "urgente"', async () => {
    // Arrange
    const savedTask = new Task(2, 'Urgente: fix en prod', null, TaskStatus.PENDING, 4, new Date(), new Date());
    mockRepository.save.mockResolvedValue(savedTask);

    // Act
    await useCase.execute({ title: 'Urgente: fix en prod', priority: 1 });

    // Assert: la prioridad debe haberse subido a 4
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 4 })
    );
  });
});
```

### 8.2 — Test de la entidad de dominio (sin BD, sin NestJS)

```typescript
// src/tasks/domain/task.entity.spec.ts

import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

describe('Task Entity', () => {
  const createTask = (status = TaskStatus.PENDING) =>
    new Task(1, 'Configurar proyecto', 'Descripción', status, 3, new Date(), new Date());

  describe('changeStatus', () => {
    it('debe permitir pasar de PENDING a IN_PROGRESS', () => {
      const task = createTask(TaskStatus.PENDING);
      task.changeStatus(TaskStatus.IN_PROGRESS);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('debe lanzar error al intentar volver de COMPLETED a PENDING', () => {
      const task = createTask(TaskStatus.COMPLETED);
      expect(() => task.changeStatus(TaskStatus.PENDING))
        .toThrow('Una tarea completada no puede volver a estado pendiente');
    });
  });

  describe('updateTitle', () => {
    it('debe actualizar el título correctamente', () => {
      const task = createTask();
      task.updateTitle('Nuevo título');
      expect(task.title).toBe('Nuevo título');
    });

    it('debe lanzar error si el título está vacío', () => {
      const task = createTask();
      expect(() => task.updateTitle('')).toThrow('El título de la tarea no puede estar vacío');
      expect(() => task.updateTitle('   ')).toThrow('El título de la tarea no puede estar vacío');
    });
  });

  describe('isHighPriority', () => {
    it('debe retornar true si prioridad es 4 o más', () => {
      const highPriorityTask = new Task(1, 'Test', null, TaskStatus.PENDING, 4, new Date(), new Date());
      expect(highPriorityTask.isHighPriority()).toBe(true);
    });

    it('debe retornar false si prioridad es menor a 4', () => {
      const lowPriorityTask = new Task(1, 'Test', null, TaskStatus.PENDING, 2, new Date(), new Date());
      expect(lowPriorityTask.isHighPriority()).toBe(false);
    });
  });
});
```

### ✏️ Ejercicio 8

1. Corre los tests actuales del proyecto: `npm run test`
2. Escribe el test para `GetTaskStatsUseCase` usando el mock del puerto
3. Escribe el test para `DeleteTaskUseCase` que verifique que lanza `NotFoundException` cuando la tarea no existe

---

## 🎯 Resumen: Qué cambió y por qué

| Archivo / concepto | Antes | Después |
|---|---|---|
| `task.entity.ts` | Una clase con decoradores TypeORM | Dos archivos: entidad de dominio pura + ORM entity |
| `tasks.service.ts` | Toda la lógica en un archivo | 6 casos de uso, uno por operación |
| `TasksController` | Inyecta `TasksService` | Inyecta 6 casos de uso |
| Tests | Mockean `Repository<Task>` (TypeORM) | Mockean `TaskRepositoryPort` (interfaz simple) |
| Cambiar de PostgreSQL a MongoDB | Tocarías `tasks.service.ts` y más | Solo cambias `task.repository.ts` |

---

## 📐 Diagrama del flujo completo

```
HTTP Request (POST /tasks)
         │
         ▼
┌─────────────────────────────────┐
│  TasksController                │  ← Infraestructura HTTP
│  @Post() createTask(@Body() dto)│
└─────────────────────────────────┘
         │ llama a
         ▼
┌─────────────────────────────────┐
│  CreateTaskUseCase              │  ← Aplicación
│  execute({ title, priority })   │
│  + regla: "urgente" → min p:4   │
└─────────────────────────────────┘
         │ llama al puerto
         ▼
┌─────────────────────────────────┐
│  TaskRepositoryPort             │  ← Dominio (interfaz)
│  save(task: Partial<Task>)      │
└─────────────────────────────────┘
         │ implementado por
         ▼
┌─────────────────────────────────┐
│  TaskRepository                 │  ← Infraestructura BD
│  (TypeORM + PostgreSQL)         │
└─────────────────────────────────┘
         │
         ▼
    PostgreSQL
```

---

## 📖 Recursos para seguir aprendiendo

- [Documentación oficial de NestJS — Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Arquitectura Hexagonal original — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeORM Docs](https://typeorm.io/)
- [Jest — Mocking](https://jestjs.io/docs/mock-functions)

---

> 💬 **¿Tienes dudas?** Crea un Issue en el repo con el prefijo `[PREGUNTA]:` y el equipo te ayudará.

