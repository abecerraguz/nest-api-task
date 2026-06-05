# 🐣 Guía de Aprendizaje de NestJS

> API RESTful para gestión de tareas construida con NestJS.
> Proyecto creado siguiendo el [curso de FaztWeb](https://github.com/FaztWeb/nestjs-course), mejorado con mejores prácticas.

---

## 📚 Documentación de Aprendizaje

Este proyecto incluye guías didácticas para aprender NestJS desde cero:

| Archivo | Descripción | ¿Para quién? |
|---------|-------------|-------------|
| **[INDEX.md](./INDEX.md)** | Este archivo - Navegación central | ⭐ Empezar aquí |
| **[QUICKSTART.md](./QUICKSTART.md)** | Guía paso a paso para crear el proyecto | Principiantes |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Explicación interna de la arquitectura | Intermediate |
| **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** | Mejoras sobre el código del curso | Quien sigue el video |

---

## 🚀 Empezar

### 1. Lee la introducción

Abre **[INDEX.md](./INDEX.md)** para ver la ruta de aprendizaje recomendada.

### 2. Sigue la guía práctica

Abre **[QUICKSTART.md](./QUICKSTART.md)** y sigue los pasos para crear tu Task Manager.

---

## 📋 Características del Proyecto

- ✅ CRUD completo de tareas
- ✅ Estados: `pending`, `in_progress`, `completed`
- ✅ Prioridad de 1 a 5
- ✅ Estadísticas de tareas
- ✅ Filtrado por estado
- ✅ Documentación Swagger automática
- ✅ Tests unitarios (17 tests passing)
- ✅ Base de datos PostgreSQL con TypeORM
- ✅ Validación de datos con class-validator

---

## 🔌 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tasks` | Listar todas las tareas |
| GET | `/tasks?status=pending` | Filtrar por estado |
| GET | `/tasks/stats` | Estadísticas |
| GET | `/tasks/:id` | Obtener tarea por ID |
| POST | `/tasks` | Crear tarea |
| PATCH | `/tasks/:id` | Actualizar tarea |
| DELETE | `/tasks/:id` | Eliminar tarea |

---

## 🛠️ Comandos

```bash
# Desarrollo
pnpm run start:dev

# Compilar
pnpm run build

# Tests
pnpm test

# Ver Swagger
# http://localhost:3000/api
```

---

## 📁 Estructura del Proyecto

```
src/
├── main.ts                     # Entry point + Swagger + CORS
├── app.module.ts               # Módulo raíz + TypeORM
└── tasks/
    ├── tasks.module.ts        # Módulo de tareas
    ├── tasks.controller.ts    # Endpoints HTTP
    ├── tasks.service.ts        # Lógica de negocio
    ├── tasks.seeder.ts         # Datos iniciales
    ├── dto/task.dto.ts        # Validación
    └── entities/task.entity.ts # Tabla en DB
```

---

## 📚 Recursos de Aprendizaje

- [Documentación oficial de NestJS](https://docs.nestjs.com/)
- [Documentación de TypeORM](https://typeorm.io/)
- [Curso original de FaztWeb](https://github.com/FaztWeb/nestjs-course)

---

**¡Éxito en tu aprendizaje! 🚀**