# Plan: Arquitectura Orientada a Servicios con Docker Compose

**Fecha:** 2026-06-25  
**Scope:** Infraestructura VPS — `vivia/` + `vivia-ai/`  
**Estado:** 🟢 Decisiones resueltas — listo para implementar

---

## Objetivo

Migrar de dos archivos `compose.yml` aislados (cada uno con sus propias instancias de RabbitMQ y Redis) a una **arquitectura orientada a servicios** compuesta por tres capas de Compose que conviven en una red Docker externa compartida (`vivia_network`).

```
Internet
   │
   ▼
┌──────────────────────────────────┐
│  NGINX Gateway  (:80 / :443)     │  ← gateway/docker-compose.gateway.yml
└────────────────┬─────────────────┘
                 │  vivia_network
     ┌───────────┼───────────────────┐
     ▼           ▼                   ▼
┌─────────┐ ┌──────────────┐ ┌────────────────────┐
│  vivia  │ │  vivia-ai    │ │  Infraestructura   │
│  :8080  │ │  :8001–8003  │ │  RabbitMQ + Redis  │
│ Spring  │ │  FastAPI/Py  │ │  + PostgreSQL      │
└─────────┘ └──────────────┘ └────────────────────┘
```

---

## Alcance

### Incluido
- Crear red externa `vivia_network` en Docker
- Crear `infra/docker-compose.infra.yml` con RabbitMQ, Redis y PostgreSQL centralizados
- Refactorizar `vivia/compose.yml` — eliminar Redis, RabbitMQ, db; conectar a `vivia_network`
- Refactorizar `vivia-ai/docker-compose.yml` — eliminar RabbitMQ propio y NGINX local; conectar a `vivia_network`
- Crear `gateway/docker-compose.gateway.yml` con NGINX como único punto de entrada
- Crear `gateway/nginx.conf` con path-based routing hacia ambos ecosistemas
- Documentar el orden de despliegue y los `.env` necesarios

### Excluido
- Configuración TLS/HTTPS (certificados Let's Encrypt — fase posterior)
- CI/CD pipelines
- Balanceo de carga horizontal (múltiples réplicas)

---

## Estructura de Archivos Resultante

```
vps/
├── docs/
│   └── PLAN_SOA_DOCKER_2026-06-25.md   ← este archivo
├── infra/
│   ├── docker-compose.infra.yml         ← NUEVO
│   └── .env.infra                       ← NUEVO
├── gateway/
│   ├── docker-compose.gateway.yml       ← NUEVO
│   ├── nginx.conf                       ← NUEVO
│   └── .env.gateway                     ← (reservado para TLS)
├── vivia/
│   └── compose.yml                      ← MODIFICADO
└── vivia-ai/
    └── compose.yml                      ← RENOMBRADO + MODIFICADO (era docker-compose.yml)
```

---

## Paso 1 — Red Docker Externa

### Qué hacer
```bash
docker network create vivia_network
```

### Por qué importa
- Una **red externa** (`external: true`) es creada fuera de cualquier Compose y sobrevive a `docker compose down`.
- Los contenedores la referencian por nombre sin poseer su ciclo de vida.
- Si estuviera definida dentro de uno de los Composes, haría a todos los demás dependientes del orden de levantamiento del primer Compose.

---

## Paso 2 — Infraestructura Compartida

### `infra/docker-compose.infra.yml`

| Contenedor        | Imagen                              | Puerto host   |
|-------------------|-------------------------------------|---------------|
| `vivia-rabbitmq`  | `rabbitmq:3.13-management-alpine`   | **no expuesto** |
| `vivia-redis`     | `redis:7-alpine`                    | **no expuesto** |
| `vivia-db`        | `postgres:15-alpine`                | **no expuesto** |

> Los puertos del host se omiten deliberadamente. Para administración remota usar túnel SSH.

```yaml
services:
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: vivia-rabbitmq
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
      RABBITMQ_DEFAULT_VHOST: ${RABBITMQ_VHOST:-/}
    volumes:
      - vivia-rabbitmq-data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vivia_network

  redis:
    image: redis:7-alpine
    container_name: vivia-redis
    restart: always
    command: redis-server ${REDIS_PASSWORD:+--requirepass ${REDIS_PASSWORD}}
    volumes:
      - vivia-redis-data:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ${REDIS_PASSWORD:+-a $$REDIS_PASSWORD} ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vivia_network

  db:
    image: postgres:15-alpine
    container_name: vivia-db
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME:-vivia_dev}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - vivia-db-data:/var/lib/postgresql/data
      - ../vivia/docker-config/database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vivia_network

volumes:
  vivia-rabbitmq-data:
  vivia-redis-data:
  vivia-db-data:

networks:
  vivia_network:
    external: true
```

### ⚠️ Cosas que pasan desapercibidas

1. **Vhost de RabbitMQ**: ✅ **Decisión tomada — vhost único `/`** para ambos ecosistemas. vivia-ai usaba `vivia_ai` en su `.env`; debe actualizarse a `/`.

2. **Redis para vivia-ai**: vivia-ai nunca tuvo Redis propio. Cuando la IA empiece a usar el Redis compartido (cache de embeddings), necesitará recibir `REDIS_PASSWORD` de infra.

3. **El `init.sql` de vivia** ahora lo monta el compose de infra, no el de vivia. El path relativo `../vivia/docker-config/database/init.sql` asume que `infra/` vive a la misma altura que `vivia/`.

---

## Paso 3 — Ecosistema Transaccional (`vivia/compose.yml`)

### Qué se quita

| Servicio / Sección eliminada | Motivo |
|------------------------------|--------|
| `services.redis`             | Vive en infra |
| `services.rabbitmq`          | Vive en infra |
| `services.db`                | Vive en infra |
| `volumes:` (redis, rabbitmq, db) | Ya no los gestiona este compose |
| `ports: 8080:8080` del `app` | Solo el gateway lo expone |

### Cambios de variables de entorno en `app`

| Antes                              | Después                               |
|------------------------------------|---------------------------------------|
| `REDIS_HOST=redis`                 | `REDIS_HOST=vivia-redis`              |
| `RABBITMQ_HOST=rabbitmq`           | `RABBITMQ_HOST=vivia-rabbitmq`        |
| `DB_URL=jdbc:postgresql://db:5432` | `DB_URL=jdbc:postgresql://vivia-db:5432` |

> ⚠️ **Hostname en red compartida**: Con red externa, los contenedores se resuelven por su `container_name`, **no** por el nombre del servicio del compose que los define. `redis` ya no existe; el hostname es `vivia-redis`.

### `vivia/compose.yml` resultado

```yaml
services:
  app:
    build: .
    container_name: vivia-app
    restart: always
    environment:
      - SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}
      - DB_URL=jdbc:postgresql://vivia-db:5432/${DB_NAME:-vivia_dev}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD}
      - SERVER_PORT=${SERVER_PORT:-8080}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - REDIS_HOST=vivia-redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
      - RABBITMQ_HOST=vivia-rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_USER:-vivia}
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=${JWT_EXPIRATION:-3600}
      - JWT_REFRESH_EXPIRATION=${JWT_REFRESH_EXPIRATION:-2592000000}
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
      - FIREBASE_KEY_PATH=${FIREBASE_KEY_PATH}
      - AWS_REGION=${AWS_REGION:-us-east-1}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET:-vivia-media-bucket}
      - AWS_SNS_REKOGNITION_ROLE_ARN=${AWS_SNS_REKOGNITION_ROLE_ARN}
      - AWS_REKOGNITION_SNS_TOPIC_ARN=${AWS_REKOGNITION_SNS_TOPIC_ARN}
    # SIN ports — el gateway es el único punto de entrada externo
    networks:
      - vivia_network

networks:
  vivia_network:
    external: true
```

### ⚠️ Cosas que pasan desapercibidas

1. **`depends_on` ya no funciona entre composes**: Solo conoce servicios del mismo archivo. ✅ **Decisión tomada — usar `wait-for-it.sh`** en el Dockerfile de Spring Boot para bloquear el arranque hasta que RabbitMQ y PostgreSQL acepten conexiones. Ver sección **Dockerfile actualizado** más abajo.

2. **`vivia/.env` debe actualizarse**: Los valores `REDIS_HOST=localhost` y `RABBITMQ_HOST=localhost` deben cambiar.

3. **Puerto 5432 desaparece del host**: Antes `vivia/compose.yml` lo exponía. Ahora solo se accede por `docker exec vivia-db psql` o túnel SSH.

### Dockerfile de `vivia/` — agregar `wait-for-it.sh`

El script `wait-for-it.sh` (MIT License, del repositorio `vishnubob/wait-for-it`) bloquea el entrypoint hasta que los servicios estén aceptando TCP.

```dockerfile
# Etapa 1: Construcción (Build)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# wait-for-it para esperar infra antes de arrancar
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY --from=build /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=dev
EXPOSE 8080

# Espera RabbitMQ (:5672) y PostgreSQL (:5432) antes de levantar Spring
ENTRYPOINT ["/wait-for-it.sh", "vivia-rabbitmq:5672", "--",
            "/wait-for-it.sh", "vivia-db:5432", "--",
            "java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

> ⚠️ El `ADD` descarga el script en build time. Alternativa más robusta: copiar el script al repo en `vivia/scripts/wait-for-it.sh` y usar `COPY` para no depender de internet en build.

---

## Paso 4 — Ecosistema de IA (`vivia-ai/compose.yml`)

> ℹ️ El archivo se **renombra** de `docker-compose.yml` a `compose.yml` para alinearse con la convención de Compose v2 y hacer consistente la nomenclatura con `vivia/compose.yml`.

### Qué se quita

| Servicio / Sección eliminada       | Motivo |
|------------------------------------|--------|
| `services.rabbitmq`                | Vive en infra |
| `services.nginx`                   | Se mueve al gateway centralizado |
| `networks: vivia-network: driver: bridge` | Ahora es red externa |
| `version: '3.8'`                   | Obsoleto en Compose v2 |

### `vivia-ai/docker-compose.yml` resultado

```yaml
services:
  mlflow:
    build:
      context: .
      dockerfile: ./infrastructure/docker/mlflow.Dockerfile
    container_name: vivia-mlflow
    environment:
      - MLFLOW_ARTIFACT_ROOT=${MLFLOW_ARTIFACT_ROOT}
    # SIN ports
    networks:
      - vivia_network

  anomaly-api:
    build:
      context: .
      dockerfile: ./infrastructure/docker/anomaly_api.Dockerfile
    container_name: vivia-anomaly-api
    env_file: .env
    depends_on:
      - mlflow
    networks:
      - vivia_network
    # Monta en: /api/anomaly/* (confirmado en main.py)

  clustering-batch:
    build:
      context: .
      dockerfile: ./infrastructure/docker/clustering_batch.Dockerfile
    container_name: vivia-clustering-batch
    env_file: .env
    depends_on:
      - mlflow
    networks:
      - vivia_network

  llm-local:
    build:
      context: .
      dockerfile: ./infrastructure/docker/llm_local.Dockerfile
    container_name: vivia-llm-local
    env_file: .env
    networks:
      - vivia_network

networks:
  vivia_network:
    external: true
```

### ⚠️ Cosas que pasan desapercibidas

1. **Vhost unificado a `/`**: ✅ Se elimina `RABBITMQ_VHOST=vivia_ai` del `.env` de vivia-ai. Ambos ecosistemas usarán el vhost por defecto `/`. No se necesita script de init.

2. **`anomaly-api` y `clustering-batch` ya no tienen `depends_on: rabbitmq`**: Deben implementar reconexión con retry (aio-pika soporta esto nativamente con `robust_connect`).

3. **`version: '3.8'` obsoleto**: Docker Compose v2+ ignora este campo; eliminarlo sigue el estándar actual.

4. **`vivia-ai/.env` necesita actualizarse**: `RABBITMQ_HOST=rabbitmq` → `RABBITMQ_HOST=vivia-rabbitmq` y `RABBITMQ_VHOST=vivia_ai` → `RABBITMQ_VHOST=/`.

---

## Paso 5 — API Gateway (`gateway/`)

### Responsabilidades de NGINX
- Único punto de entrada externo (puerto `80`; puerto `443` reservado para fase TLS)
- Enrutamiento por path:
  - `/api/*` → `vivia-app:8080` (Spring Boot — sin prefijo de versión en el gateway)
  - `/api/anomaly/*` → `vivia-anomaly-api:8001` ✅ confirmado con `main.py`
  - `/api/clustering/*` → `vivia-clustering-batch:8002`
  - `/api/llm/*` → `vivia-llm-local:8003`
  - MLflow: ✅ **solo interno**, no expuesto en gateway
- Headers `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Proto`
- Endpoint `/health` para monitoreo del gateway

> ℹ️ **Orden de `location` en NGINX**: Las rutas más específicas (`/api/anomaly/`) deben declararse **antes** que la ruta genérica (`/api/`), ya que NGINX usa el prefijo más largo que coincida.

### `gateway/docker-compose.gateway.yml`

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: vivia-nginx
    restart: always
    ports:
      - "80:80"
      # - "443:443"  # Descomentar para TLS
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      # - ./certs:/etc/nginx/certs:ro
    networks:
      - vivia_network

networks:
  vivia_network:
    external: true
```

### `gateway/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream vivia_app {
        server vivia-app:8080;
    }

    upstream vivia_anomaly {
        server vivia-anomaly-api:8001;
    }

    upstream vivia_clustering {
        server vivia-clustering-batch:8002;
    }

    upstream vivia_llm {
        server vivia-llm-local:8003;
    }

    server {
        listen 80;
        server_name _;  # Cambiar a dominio real en producción

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # ── Servicios de IA (más específicos — van primero) ────
        location /api/anomaly/ {
            proxy_pass http://vivia_anomaly;
        }

        location /api/clustering/ {
            proxy_pass http://vivia_clustering;
        }

        location /api/llm/ {
            proxy_pass http://vivia_llm;
        }

        # ── Backend transaccional (catch-all para /api/) ───────
        location /api/ {
            proxy_pass http://vivia_app;
        }

        # ── MLflow: solo interno, no expuesto ──────────────────
        # location /mlflow/ { ... }  # Deshabilitado — acceso solo via docker exec

        location /health {
            return 200 'ok';
            add_header Content-Type text/plain;
        }
    }
}
```

### ⚠️ Cosas que pasan desapercibidas

1. **`server_name _`**: Comodín que acepta cualquier hostname. En producción cambiar a `server_name tudominio.com`.

2. **`proxy_pass` sin slash final**: `proxy_pass http://vivia_app;` preserva el path completo. Con `/` final reescribiría el path — **no agregar la barra**.

3. **Rutas confirmadas sin rewrite**: ✅ FastAPI monta sus rutas en `/api/anomaly/`, `/api/clustering/`, `/api/llm/`. NGINX envía el path tal cual — coincide perfectamente, no se necesita `rewrite`.

4. **NGINX falla si un upstream no existe al arrancar**: Si `vivia-app` no está corriendo cuando NGINX inicia, falla. Por eso el gateway se levanta al final.

---

## Paso 6 — Secuencia de Despliegue

```bash
# ── Pre-requisito (solo una vez) ───────────────────────────
docker network create vivia_network

# ── 1. Infraestructura ─────────────────────────────────────
cd vps/infra
docker compose -f docker-compose.infra.yml --env-file .env.infra up -d

# Verificar que estén healthy antes de continuar
docker compose -f docker-compose.infra.yml ps

# ── 2. Aplicaciones (pueden levantarse en paralelo) ─────────
cd ../vivia && docker compose up -d &
cd ../vivia-ai && docker compose up -d &
wait

# ── 3. Gateway ─────────────────────────────────────────────
cd ../gateway
docker compose -f docker-compose.gateway.yml up -d
```

| Paso | Razón del orden |
|------|-----------------|
| Infra primero | RabbitMQ y PostgreSQL deben aceptar conexiones antes de que Spring Boot arranque |
| Apps después | Dependen de la infra estable |
| Gateway al final | NGINX resuelve hostnames al arrancar; si los contenedores de app no existen, NGINX falla en startup |

---

## Variables de Entorno — Resumen de Cambios

### `infra/.env.infra` (nuevo archivo)

```env
# PostgreSQL
DB_NAME=vivia_dev
DB_USER=postgres
DB_PASSWORD=CAMBIAR_EN_PRODUCCION

# Redis
REDIS_PASSWORD=CAMBIAR_EN_PRODUCCION

# RabbitMQ
RABBITMQ_USER=vivia
RABBITMQ_PASSWORD=CAMBIAR_EN_PRODUCCION
RABBITMQ_VHOST=/
```

### `vivia/.env` — diff

```diff
- DB_URL=jdbc:postgresql://localhost:5432/vivia_dev
+ DB_URL=jdbc:postgresql://vivia-db:5432/vivia_dev

- REDIS_HOST=localhost
+ REDIS_HOST=vivia-redis

- RABBITMQ_HOST=localhost
+ RABBITMQ_HOST=vivia-rabbitmq
```

### `vivia-ai/.env` — diff

```diff
- RABBITMQ_HOST=rabbitmq
+ RABBITMQ_HOST=vivia-rabbitmq

- RABBITMQ_VHOST=vivia_ai
+ RABBITMQ_VHOST=/
```

---

## Decisiones Resueltas ✅

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | ¿RabbitMQ vhost único o separado? | **Vhost único `/`** — sin script de init |
| 2 | ¿Rutas de FastAPI? | **`/api/anomaly/`** — confirmado en `main.py`, sin `rewrite` en NGINX |
| 3 | ¿MLflow en gateway? | **Solo interno** — no expuesto; acceso por `docker exec` o túnel SSH |
| 4 | ¿`wait-for-it.sh` o retry de Spring? | **`wait-for-it.sh`** en el `Dockerfile` de vivia |

---

## Pasos de Implementación

- [ ] **1.** Crear `vps/infra/docker-compose.infra.yml` y `vps/infra/.env.infra`
- [ ] **2.** Refactorizar `vivia/compose.yml` — quitar redis, rabbitmq, db; ajustar hostnames; quitar `ports` del app
- [ ] **3.** Actualizar `vivia/Dockerfile` — agregar `wait-for-it.sh`
- [ ] **4.** Actualizar `vivia/.env` con los nuevos hostnames
- [ ] **5.** Renombrar `vivia-ai/docker-compose.yml` → `vivia-ai/compose.yml` y refactorizar — quitar rabbitmq y nginx; red externa; sin `version`
- [ ] **6.** Actualizar `vivia-ai/.env` — `RABBITMQ_HOST=vivia-rabbitmq`, `RABBITMQ_VHOST=/`
- [ ] **7.** Crear `vps/gateway/docker-compose.gateway.yml` y `vps/gateway/nginx.conf`
- [ ] **8.** Dry-run: `docker compose config` en cada directorio para validar sintaxis
- [ ] **9.** Ejecutar secuencia de despliegue y verificar conectividad con `docker network inspect vivia_network`
