# 🐣 Guía de Aprendizaje de NestJS - Índice Central

> Este es el punto de entrada para aprender NestJS desde cero.
> Sigue los módulos en orden para construir tu Task Manager completo.

---

## 📚 Map de Documentación

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Empieza aquí ─────► README.md (Introducción)                 │
│                          │                                      │
│                          ▼                                      │
│                     QUICKSTART.md                              │
│                     (Guía paso a paso)                        │
│                          │                                      │
│                          ├──────────────────┐                │
│                          ▼                  ▼                  │
│                   ARCHITECTURE.md      IMPROVEMENTS.md        │
│                   (Cómo funciona        (Mejoras aplicadas    │
│                    internamente)         sobre el curso)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📖 Módulos de Aprendizaje

### [README.md](./README.md) - Introducción
**¿Para quién es?** Principiantes absolutos

**Contenido:**
- ¿Qué es NestJS y por qué aprenderlo?
- Analogía del restaurante (Controller = Mesero, Service = Cocina)
- Comparación Express vs NestJS
- Conceptos básicos de arquitectura

**Tiempo estimado:** 15 minutos

---

### [QUICKSTART.md](./QUICKSTART.md) - Práctica paso a paso
**¿Para quién es?** Quien quiere动手跟着做

**Contenido:**
- Paso a paso para crear el Task Manager
- Código completo y funcional
- Tests unitarios explicados
- Comandos para ejecutar y probar

**Tiempo estimado:** 2-3 horas

**Sigue este orden:**
```
1. Preparar el entorno
2. Crear el proyecto
3. Configurar base de datos
4. Crear Módulo → Entidad → Servicio → Controlador → DTOs
5. Configurar main.ts
6. Probar la API
7. Añadir tests
```

---

### [ARCHITECTURE.md](./ARCHITECTURE.md) - Profundización
**¿Para quién es?** Quien quiere entender cómo funciona internamente

**Contenido:**
- Cómo se conectan todos los archivos
- Flujo de una petición HTTP paso a paso
- Inyección de dependencias explicada
- ValidationPipe en detalle
- Diagramas de arquitectura

**Tiempo estimado:** 1-2 horas

**Conceptos cubiertos:**
- El Container de NestJS
- Repository Pattern
- Providers y ProvidersFactory
- Middleware vs Guard vs Pipe

---

### [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Comparación con el curso
**¿Para quién es?** Quien ya sigue el video de Fazt

**Contenido:**
- Qué se mejoró del código original del curso
- TypeORM vs array en memoria
- Decoradores de Swagger (@Api*)
- ParseIntPipe automático
- Tests unitarios

**Tiempo estimado:** 30 minutos

---

## 🚀 Ruta de Aprendizaje Recomendada

### Semana 1: Fundamentos
```
Día 1-2 → Lee README.md completo
           └→ Entender qué es NestJS y por qué existe

Día 3-4 → Sigue QUICKSTART.md paso a paso
           └→ Crear tu primera API desde cero

Día 5-7 → Experimenta con los endpoints
           └→ Modifica el código, rompe cosas, arregla
```

### Semana 2: Profundización
```
Día 8-9 → Lee ARCHITECTURE.md
           └→ Entender cómo funciona internamente

Día 10-11 → Lee IMPROVEMENTS.md
             └→ Comparar con el código original

Día 12-14 → Añade mejoras al proyecto
             └→ Más tests, mejor documentación
```

### Semana 3: Avanzado
```
Día 15-17 → Autenticación JWT
Día 18-19 → Relaciones en TypeORM
Día 20-21 → Deploy en producción
```

---

## 📁 Estructura de Archivos del Proyecto

```
nest-api-task/
│
├── 📄 README.md              → Este archivo (índice)
├── 📄 QUICKSTART.md          → Guía paso a paso
├── 📄 ARCHITECTURE.md         → Explicación interna
├── 📄 IMPROVEMENTS.md         → Mejoras sobre el curso
│
├── src/
│   ├── main.ts               → Punto de entrada
│   ├── app.module.ts         → Módulo raíz
│   └── tasks/
│       ├── tasks.module.ts         → Módulo de tareas
│       ├── tasks.controller.ts     → Endpoints HTTP
│       ├── tasks.controller.spec.ts→ Tests del controller
│       ├── tasks.service.ts        → Lógica de negocio
│       ├── tasks.service.spec.ts    → Tests del service
│       ├── tasks.seeder.ts         → Datos iniciales
│       ├── dto/
│       │   └── task.dto.ts         → Validación de datos
│       └── entities/
│           └── task.entity.ts      → Tabla en la DB
│
├── .env                      → Variables de entorno (NO subir a git)
├── .env.example              → Template de variables
└── package.json              → Dependencias
```

---

## 🔧 Comandos Útiles

```bash
# Iniciar desarrollo
pnpm run start:dev

# Compilar para producción
pnpm run build

# Ejecutar tests
pnpm test

# Ver lint
pnpm run lint

# Ver documentación Swagger
# http://localhost:3000/api
```

---

## 🎯 Objetivos del Proyecto

Al terminar esta guía, habrás construido:

- ✅ API REST completa con CRUD
- ✅ Base de datos PostgreSQL
- ✅ Validación de datos automática
- ✅ Documentación Swagger automática
- ✅ Tests unitarios
- ✅ Separación Service/Controller/Module

---

## 📚 Recursos Externos

- [Documentación oficial de NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [class-validator](https://github.com/typestack/class-validator)
- [Jest](https://jestjs.io/)

---

**¡Éxito en tu aprendizaje! 🚀**

