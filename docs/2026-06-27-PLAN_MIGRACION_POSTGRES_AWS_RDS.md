# Plan: Apuntar el proyecto a las dos instancias RDS (sin migrar datos)

**Fecha:** 2026-06-27
**Scope:** VPS — reemplazar los dos PostgreSQL en Docker por las RDS ya creadas
**Estado:** 🟢 Listo para aplicar

---

## Qué queremos lograr

- Dejar de correr PostgreSQL dentro de Docker y usar las **dos RDS que ya existen**.
- **No importa perder datos** (eran de prueba): los esquemas se recrean solos
  (Flyway en `vivia`, Alembic + MLflow en `vivia-ai`).
- Que el **deploy por GitHub Actions (`deploy.yml`) no falle** y que haya
  **conectividad total** desde el VPS hacia las RDS.

## Lo que ya existe (no se toca)

| Instancia RDS | La usa | Base que debe contener | Acceso |
|---------------|--------|------------------------|--------|
| `vivia`       | `vivia-app` (Spring/Flyway) | `vivia` | público, inbound 5432, outbound todo |
| `vivia_ai`    | `vivia-anomaly-api` + `vivia-mlflow` | `vivia_ai` | público, inbound 5432, outbound todo |

> Nombres de base = nombre de la instancia: **`vivia`** (transaccional) y **`vivia_ai`** (IA).
> El antiguo `vivia_dev` queda descartado por completo.

> El VPS está intacto y las RDS también. Solo cambiamos configuración del repo.

---

## Idea central del cambio

Hoy las apps se conectan a los hostnames internos de Docker `vivia-db` y `vivia-postgres`.
Vamos a:

1. **Borrar** los servicios `db` (infra) y `postgres` (vivia-ai) de los Compose, junto con sus volúmenes.
2. Hacer que el **host de la base sea una variable** (`DB_HOST`, `AI_DB_HOST`) que apunte al
   endpoint de la RDS, inyectada por el Action desde secrets de GitHub.
3. Quitar todo `depends_on` y `wait-for-it` que apunte a los contenedores de Postgres que ya no existen.

Como los esquemas se recrean solos, **no hay pasos de `pg_dump`/`pg_restore`**.

---

## Pre-requisito de conectividad (AWS) — para que NO falle

El runner de GitHub Actions entra por SSH al VPS/EC2 y desde **ahí** se conecta a las RDS.
Por lo tanto la conexión sale de la **IP pública del VPS**, no del runner. Verifica:

1. **Security Group de cada RDS** → regla *inbound* TCP `5432` cuyo origen incluya la
   **IP pública (elástica) del VPS/EC2**. Como hoy está en `0.0.0.0/0`, ya funciona;
   cuando quieras endurecer, cámbialo a esa IP. (Outbound de la RDS: dejarlo como está.)
2. **Security Group del VPS/EC2** → *outbound* debe permitir salida a `5432` (normalmente "all traffic" ya lo cubre).
3. **Las RDS deben tener "Public accessibility: Yes"** (ya lo tienen) para resolverse por su endpoint público.
4. **Bases ya creadas** (confirmado): instancia `vivia` → base `vivia`; instancia `vivia_ai` → base `vivia_ai`. No hay que crear nada.
5. **SSL obligatorio**: todas las conexiones a RDS se fuerzan con TLS. RDS ya expone un
   certificado de servidor, así que basta con pedir SSL desde el cliente:
   - **Spring (JDBC)** → `?sslmode=require` en `DB_URL`.
   - **MLflow (psycopg2)** → `?sslmode=require` en `MLFLOW_BACKEND_STORE_URI`.
   - **anomaly-api (asyncpg/SQLAlchemy)** → `?ssl=require` en `DATABASE_URL`.

   > `require` cifra la conexión sin validar la CA (no falla por cadena de confianza).
   > Para validación estricta de la CA (`verify-full`), montar el bundle
   > `rds-combined-ca-bundle.pem` — queda como endurecimiento posterior.

---

## Cambio 1 — `infra/docker-compose.infra.yml`

Eliminar el servicio `db` y su volumen. Infra queda solo con Redis y RabbitMQ.

```diff
   redis:
     ...
     networks:
       - vivia_network

-  db:
-    image: postgres:15-alpine
-    container_name: vivia-db
-    restart: always
-    environment:
-      POSTGRES_DB: ${DB_NAME:-vivia_dev}
-      POSTGRES_USER: ${DB_USER:-postgres}
-      POSTGRES_PASSWORD: ${DB_PASSWORD}
-    volumes:
-      - vivia-db-data:/var/lib/postgresql/data
-      - ../vivia/docker-config/database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
-    healthcheck:
-      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
-      interval: 10s
-      timeout: 5s
-      retries: 5
-    networks:
-      - vivia_network
-
 volumes:
   vivia-rabbitmq-data:
   vivia-redis-data:
-  vivia-db-data:
```

---

## Cambio 2 — `vivia/compose.yml`

El host de la BD pasa de `vivia-db` a la variable `DB_HOST` (endpoint de la RDS `vivia`).

```diff
       - SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}
-      - DB_URL=jdbc:postgresql://vivia-db:5432/${DB_NAME:-vivia_dev}
+      - DB_URL=jdbc:postgresql://${DB_HOST}:5432/${DB_NAME:-vivia}?sslmode=require
       - DB_USER=${DB_USER:-postgres}
```

---

## Cambio 3 — `vivia/Dockerfile`

El `wait-for-it` espera a `vivia-db`, que ya no existe. Lo apuntamos al host de RDS leyendo
`DB_HOST` en tiempo de arranque (forma shell para expandir la variable).

```diff
-# Espera RabbitMQ (:5672) y PostgreSQL (:5432) antes de levantar Spring
-ENTRYPOINT ["/wait-for-it.sh", "vivia-rabbitmq:5672", "--", \
-            "/wait-for-it.sh", "vivia-db:5432", "--", \
-            "java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
+# Espera RabbitMQ y la RDS (DB_HOST) antes de levantar Spring
+ENTRYPOINT ["/bin/sh", "-c", \
+  "/wait-for-it.sh vivia-rabbitmq:5672 -t 60 -- /wait-for-it.sh \"$DB_HOST:5432\" -t 60 -- java -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
```

---

## Cambio 4 — `vivia-ai/compose.yml`

Eliminar el servicio `postgres`, su volumen, y los `depends_on: postgres`.
`DATABASE_URL` y `MLFLOW_BACKEND_STORE_URI` ya vienen completas desde el `.env` que escribe el
Action (Cambio 6), así que aquí solo hay que quitar el contenedor y las dependencias.

```diff
 services:
-  postgres:
-    image: postgres:16
-    container_name: vivia-postgres
-    environment:
-      - POSTGRES_USER=${POSTGRES_USER}
-      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
-      - POSTGRES_DB=${POSTGRES_DB}
-    volumes:
-      - vivia-pg-data:/var/lib/postgresql/data
-    healthcheck:
-      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
-      interval: 10s
-      timeout: 5s
-      retries: 5
-    networks:
-      - vivia_network
-
   mlflow:
     ...
     environment:
       - MLFLOW_ARTIFACT_ROOT=${MLFLOW_ARTIFACT_ROOT}
       - MLFLOW_BACKEND_STORE_URI=${MLFLOW_BACKEND_STORE_URI}
       - GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcs.json
     volumes:
       - ${GCS_CREDENTIALS_HOST:-./credentials/gcs-vivia.json}:/secrets/gcs.json:ro
-    depends_on:
-      postgres:
-        condition: service_healthy
     networks:
       - vivia_network

   anomaly-api:
     ...
     depends_on:
       mlflow:
         condition: service_started
-      postgres:
-        condition: service_healthy
     networks:
       - vivia_network

 volumes:
-  vivia-pg-data:
```

> `clustering-batch` y `llm-local` no dependían de postgres; quedan igual.

---

## Cambio 5 — `vivia-ai` necesita el driver `psycopg2` para MLflow

MLflow usa la URL **síncrona** `postgresql://...` (psycopg2). El servicio anomaly usa `asyncpg`.
Confirma que `mlflow.Dockerfile` instale `psycopg2-binary` (lo necesita el backend-store de MLflow
contra RDS). Si no está, agrégalo al `pip install` de ese Dockerfile.

---

## Cambio 6 — `.github/workflows/deploy.yml`

Tres ajustes para que el Action no falle y apunte a RDS.

### 6.1 — Bloque infra: ya no escribe credenciales de Postgres

El `.env` de infra solo necesita RabbitMQ y Redis (ya no hay contenedor `db`):

```diff
             cat > ~/vps/infra/.env << EOF
             RABBITMQ_USER=${{ secrets.RABBITMQ_USER }}
             RABBITMQ_PASSWORD=${{ secrets.RABBITMQ_PASSWORD }}
             RABBITMQ_VHOST=${{ secrets.RABBITMQ_VHOST }}
-            DB_NAME=${{ secrets.DB_NAME }}
-            DB_USER=${{ secrets.DB_USER }}
-            DB_PASSWORD=${{ secrets.DB_PASSWORD }}
             REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}
             EOF
```

### 6.2 — Bloque vivia: agregar `DB_HOST` (endpoint RDS `vivia`)

```diff
             cat > ~/vps/vivia/.env << EOF
+            DB_HOST=${{ secrets.DB_HOST }}
             DB_PASSWORD=${{ secrets.DB_PASSWORD }}
             DB_NAME=${{ secrets.DB_NAME }}
             DB_USER=${{ secrets.DB_USER }}
```

### 6.3 — Bloque vivia-ai: apuntar las URLs a la RDS `vivia_ai` y quitar el arranque de `postgres`

```diff
             POSTGRES_USER=${{ secrets.AI_DB_USER }}
             POSTGRES_PASSWORD=${{ secrets.AI_DB_PASSWORD }}
             POSTGRES_DB=${{ secrets.AI_DB_NAME }}
-            DATABASE_URL=postgresql+asyncpg://${{ secrets.AI_DB_USER }}:${{ secrets.AI_DB_PASSWORD }}@vivia-postgres:5432/${{ secrets.AI_DB_NAME }}
-            MLFLOW_BACKEND_STORE_URI=postgresql://${{ secrets.AI_DB_USER }}:${{ secrets.AI_DB_PASSWORD }}@vivia-postgres:5432/${{ secrets.AI_DB_NAME }}
+            DATABASE_URL=postgresql+asyncpg://${{ secrets.AI_DB_USER }}:${{ secrets.AI_DB_PASSWORD }}@${{ secrets.AI_DB_HOST }}:5432/${{ secrets.AI_DB_NAME }}?ssl=require
+            MLFLOW_BACKEND_STORE_URI=postgresql://${{ secrets.AI_DB_USER }}:${{ secrets.AI_DB_PASSWORD }}@${{ secrets.AI_DB_HOST }}:5432/${{ secrets.AI_DB_NAME }}?sslmode=require
             GCS_CREDENTIALS_HOST=/home/${{ secrets.EC2_USERNAME }}/secrets/gcs-vivia.json
             EOF

             cd ~/vps/vivia-ai
             docker compose down --remove-orphans
             docker compose build --no-cache

-            # Arranque escalonado: las dependencias primero, luego registramos el
-            # modelo en MLflow (idempotente) y por último levantamos anomaly-api.
-            docker compose up -d postgres mlflow
+            # Arranque escalonado: MLflow primero (la BD ya es RDS, externa),
+            # registramos el modelo (idempotente) y por último levantamos todo.
+            docker compose up -d mlflow
             docker compose run --rm anomaly-api python -m scripts.register_anomaly_model
             docker compose up -d
             docker image prune -f
```

> `down --remove-orphans` se encarga de borrar los contenedores `vivia-db`/`vivia-postgres`
> que queden de despliegues anteriores. Los volúmenes viejos pueden borrarse a mano una vez
> (`docker volume rm vivia_vivia-db-data vivia-ai_vivia-pg-data` — nombre real según `docker volume ls`).

---

## Secrets de GitHub (entorno `production`)

**Nuevos:**

| Secret | Valor |
|--------|-------|
| `DB_HOST` | endpoint de la RDS `vivia` (ej. `vivia.xxxx.<region>.rds.amazonaws.com`) |
| `AI_DB_HOST` | endpoint de la RDS `vivia_ai` |

**Existentes — verificar que coincidan con las RDS:**

| Secret | Debe ser |
|--------|----------|
| `DB_NAME` | `vivia` |
| `DB_USER` / `DB_PASSWORD` | usuario/clave maestros de la RDS `vivia` |
| `AI_DB_NAME` | `vivia_ai` |
| `AI_DB_USER` / `AI_DB_PASSWORD` | usuario/clave maestros de la RDS `vivia_ai` |

---

## Verificación (tras el primer deploy)

1. **Action en verde** — el job "Desplegar servicios" termina sin error.
2. **Conexión RDS desde el VPS**:
   ```bash
   psql -h <endpoint-vivia>    -U <DB_USER> -d vivia -c '\dt'      # tablas creadas por Flyway
   psql -h <endpoint-vivia_ai> -U <AI_DB_USER> -d vivia_ai -c '\dt'  # anomaly_inferences + tablas MLflow
   ```
3. **Logs Spring**: `Successfully applied N migrations` (Flyway crea el esquema en RDS vacía).
4. **`docker ps`**: ya NO aparecen `vivia-db` ni `vivia-postgres`. Sí aparecen
   `vivia-app`, `vivia-mlflow`, `vivia-anomaly-api`, `vivia-redis`, `vivia-rabbitmq`, `vivia-nginx`.
5. **Endpoints**: `curl https://vivia.aleosh.online/api/health` y `.../api/anomaly/health` responden.

---

## Pasos de implementación

- [ ] **1.** Verificar pre-requisitos AWS de conectividad (SG inbound 5432, bases `vivia_dev` y `vivia` creadas).
- [ ] **2.** Crear secrets `DB_HOST` y `AI_DB_HOST`; verificar `DB_NAME=vivia` y `AI_DB_NAME=vivia_ai`.
- [ ] **3.** Editar `infra/docker-compose.infra.yml` (Cambio 1).
- [ ] **4.** Editar `vivia/compose.yml` (Cambio 2) y `vivia/Dockerfile` (Cambio 3).
- [ ] **5.** Editar `vivia-ai/compose.yml` (Cambio 4) y confirmar `psycopg2` en `mlflow.Dockerfile` (Cambio 5).
- [ ] **6.** Editar `.github/workflows/deploy.yml` (Cambio 6).
- [ ] **7.** Commit + push a `main` → corre el Action → revisar **Verificación**.
- [ ] **8.** Borrar volúmenes Docker huérfanos de Postgres en el VPS.
- [ ] **9.** (Opcional) Endurecer: inbound 5432 solo a la IP del VPS y SSL `verify-full` con el CA bundle de RDS.
```