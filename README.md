# 🚀 Vivia — Entorno de Desarrollo (SOA con Docker)

Esta carpeta (`vps/`) contiene la infraestructura completa del proyecto **Vivia**, organizada como una Arquitectura Orientada a Servicios (SOA). Todos los servicios se comunican a través de una red Docker interna (`vivia_network`) y se administran de manera independiente mediante archivos `compose.yml` por carpeta.

---

## 📐 Arquitectura

```
                        ┌─────────────────────────────────────────────────────────┐
   Cliente / HTTP  ───► │           gateway/  (NGINX — Puerto 80)                 │
                        └────────┬────────────────────────────────────────────────┘
                                 │
             ┌───────────────────┼───────────────────────────────┐
             │                   │                               │
             ▼                   ▼                               ▼
    /api/anomaly/      /api/clustering/  /api/llm/          /api/  (catch-all)
             │                   │                               │
             ▼                   ▼                               ▼
    ┌──────────────────────────────────────┐         ┌─────────────────────┐
    │          vivia-ai/                   │         │      vivia/         │
    │  vivia-anomaly-api    :8001          │         │  vivia-app          │
    │  vivia-clustering-batch :8002        │         │  (Spring Boot :8080)│
    │  vivia-llm-local       :8003         │         └──────────┬──────────┘
    │  vivia-mlflow          :5000         │                    │
    └──────────────┬───────────────────────┘                   │
                   │                                            │
                   └──────────────────────┬─────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │        infra/          │
                              │  vivia-db    (PG :5432)│
                              │  vivia-redis    (:6379) │
                              │  vivia-rabbitmq (:5672) │
                              └────────────────────────┘
```

Todos los contenedores pertenecen a la red externa `vivia_network`.

---

## 📋 Requisitos previos

- **Docker Engine** ≥ 24
- **Docker Compose** (plugin v2, incluido en Docker Engine moderno)
- La red externa de Docker creada **antes** del primer arranque:

```bash
docker network create vivia_network
```

---

## 📂 Estructura del repositorio

```
vps/
├── infra/                        # PostgreSQL, Redis, RabbitMQ
│   ├── docker-compose.infra.yml
│   └── .env.infra
│
├── vivia/                        # API principal (Spring Boot)
│   ├── compose.yml
│   ├── .env
│   └── Dockerfile
│
├── vivia-ai/                     # Microservicios de IA (FastAPI)
│   ├── compose.yml
│   ├── .env  ← copia de .env.example
│   └── .env.example
│
└── gateway/                      # NGINX — Proxy inverso / API Gateway
    ├── docker-compose.gateway.yml
    └── nginx.conf
```

---

## 🔑 Variables de entorno

Antes de levantar el entorno, revisa (y modifica si es necesario) los archivos de configuración de cada servicio:

### `infra/.env.infra`

```env
# PostgreSQL
DB_NAME=vivia_dev
DB_USER=postgres
DB_PASSWORD=vivia_dev

# Redis
REDIS_PASSWORD=vivia_redis_password

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
```

### `vivia/.env`

Contiene las credenciales de la aplicación Spring Boot. Los valores críticos que deben coincidir con `infra/.env.infra`:

| Variable | Valor esperado |
|---|---|
| `DB_URL` | `jdbc:postgresql://vivia-db:5432/vivia_dev` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `vivia_dev` |
| `REDIS_HOST` | `vivia-redis` |
| `REDIS_PASSWORD` | `vivia_redis_password` |
| `RABBITMQ_HOST` | `vivia-rabbitmq` |
| `RABBITMQ_USER` | `guest` |
| `RABBITMQ_PASSWORD` | `guest` |
| `RABBITMQ_VHOST` | `/` |

> **Firebase**: coloca tu archivo `firebase-adminsdk.json` en el servidor y actualiza `FIREBASE_KEY_PATH` con su ruta absoluta.

### `vivia-ai/.env`

Si no existe, créalo a partir de la plantilla:

```bash
cp vivia-ai/.env.example vivia-ai/.env
```

Ajusta los valores de `RABBITMQ_PASSWORD` e `INTERNAL_API_KEY` antes de subir a producción.

---

## ▶️ Levantar el entorno completo

Sigue este **orden obligatorio** para respetar las dependencias entre servicios:

### Paso 1 — Red Docker (solo una vez)

```bash
docker network create vivia_network
```

### Paso 2 — Infraestructura compartida (DB, Redis, RabbitMQ)

```bash
cd infra
docker compose -f docker-compose.infra.yml --env-file .env.infra up -d
cd ..
```

Espera unos segundos a que los healthchecks pasen (o verifica con `docker ps`).

### Paso 3 — API principal (Spring Boot)

```bash
cd vivia
docker compose up -d
cd ..
```

> El contenedor usa `wait-for-it.sh` para esperar automáticamente a que `vivia-db` y `vivia-rabbitmq` estén disponibles antes de arrancar.

### Paso 4 — Microservicios de IA (FastAPI)

```bash
cd vivia-ai
docker compose up -d
cd ..
```

> La primera ejecución construirá las imágenes de Python; puede tardar varios minutos.

### Paso 5 — API Gateway (NGINX)

```bash
cd gateway
docker compose -f docker-compose.gateway.yml up -d
cd ..
```

---

## ✅ Verificar el estado del entorno

### Ver todos los contenedores

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Se espera ver los 9 contenedores en estado `Up`:

| Contenedor | Rol |
|---|---|
| `vivia-nginx` | API Gateway (puerto 80) |
| `vivia-app` | API Spring Boot |
| `vivia-anomaly-api` | Microservicio de anomalías (IA) |
| `vivia-clustering-batch` | Microservicio de clustering (IA) |
| `vivia-llm-local` | Microservicio LLM local (IA) |
| `vivia-mlflow` | Seguimiento de experimentos de ML |
| `vivia-db` | PostgreSQL |
| `vivia-redis` | Redis |
| `vivia-rabbitmq` | RabbitMQ |

### Probar endpoints vía Gateway

```bash
# Health del gateway (NGINX)
curl http://localhost/health

# Health del microservicio de anomalías (IA)
curl http://localhost/api/anomaly/health

# Health de la API principal (Spring Boot)
curl http://localhost/api/health
```

### Verificar la red interna

```bash
docker network inspect vivia_network
```

---

## 🔄 Operaciones comunes

### Reiniciar solo la API Spring Boot (sin tocar infra)

```bash
cd vivia && docker compose restart
```

### Ver logs de un servicio

```bash
# Spring Boot
docker compose -f vivia/compose.yml logs -f app

# Anomaly API
docker compose -f vivia-ai/compose.yml logs -f anomaly-api

# NGINX
docker compose -f gateway/docker-compose.gateway.yml logs -f nginx
```

### Reconstruir las imágenes de IA (tras cambios de código)

```bash
cd vivia-ai
docker compose build --no-cache
docker compose up -d
```

### Bajar el entorno completo

Deten los servicios en orden inverso para un shutdown limpio:

```bash
cd gateway && docker compose -f docker-compose.gateway.yml down
cd ../vivia-ai && docker compose down
cd ../vivia && docker compose down
cd ../infra && docker compose -f docker-compose.infra.yml down
```

> Agrega `--volumes` al comando `infra` si también deseas eliminar los datos persistentes (⚠️ acción destructiva).

---

## 🌐 Rutas del Gateway (NGINX)

| Path prefix | Servicio destino | Puerto interno |
|---|---|---|
| `/api/anomaly/` | `vivia-anomaly-api` | 8001 |
| `/api/clustering/` | `vivia-clustering-batch` | 8002 |
| `/api/llm/` | `vivia-llm-local` | 8003 |
| `/api/` (resto) | `vivia-app` (Spring Boot) | 8080 |
| `/health` | NGINX (status check) | — |

> **MLflow** (`vivia-mlflow:5000`) no está expuesto públicamente por defecto. Accede a él mediante un túnel SSH o habilita el acceso en `nginx.conf` cuando lo necesites.

---

## 🔐 Notas de Seguridad

- Los puertos de la infraestructura (`5432`, `6379`, `5672`) **no están expuestos al host**. Solo son accesibles desde dentro de `vivia_network`.
- El único puerto expuesto externamente es el **80** (NGINX).
- Para producción: cambia todas las contraseñas de ejemplo, configura TLS en el gateway (descomentar sección HTTPS en `nginx.conf`) y usa secretos de Docker o un vault de credenciales en lugar de archivos `.env` en disco.
