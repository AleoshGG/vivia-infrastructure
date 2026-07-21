# Plan: API Gateway (Spring Cloud Gateway)

## Objetivo
Crear un servicio `api-gateway` con Spring Cloud Gateway que sea el único punto de
entrada interno para los servicios de vivia detrás de nginx, encargado de:
validar JWT, aplicar rate limiting, y enrutar cada request al backend correcto.

## Decisiones tomadas
- **Topología:** nginx al frente (TLS/certbot), gateway detrás en `vivia_network`.
- **Rate limit:** límite global v1 (por `userId` si hay token válido, si no por IP).
- **Ubicación:** carpeta propia `api-gateway/` en la raíz.
- **WS/SSE:** pasan **también** por el gateway (no quedan directos en nginx).
- **Versión:** Spring Boot **4.1.0** + Spring Cloud **2025.1.2 (Oakwood)**.
- **Modelo de auth: allowlist estricta.** El gateway exige JWT válido en todas las
  rutas salvo una lista blanca explícita (`gateway.auth.public-paths`). Si un
  request trae token válido se inyecta identidad; si trae token inválido en ruta
  protegida → 401. Las rutas públicas nunca se bloquean.

## Alcance

**Incluido:**
- Módulo Maven `api-gateway/` (Java 21, Spring Boot 4.1.0).
- Filtro global de validación de JWT (HS256, mismo `JWT_SECRET` que `vivia`).
- Rate limiting con Redis (`vivia-redis`, ya existente en `vivia_network`).
- Rutas declarativas hacia todos los backends que hoy resuelve `nginx.conf`,
  incluyendo REST, WebSocket (`/ws`) y SSE (streams).
- `docker-compose.gateway.yml` con el contenedor `api-gateway` + `.env.gateway`.
- `nginx.conf` colapsado: reenvía `/api/**`, `/ws`, SSE y `/health` al gateway;
  conserva TLS/ACME y sirve el SPA (`vivia-web`) directo.

**Excluido:**
- Reemplazar nginx como terminador de TLS (nginx sigue con certbot/443).
- Rate limiting diferenciado por ruta/rol (v1 es límite global).
- Circuit breakers / retries (Resilience4j) — futuro.
- Observabilidad (métricas, tracing) — futuro.

## Stack y versiones
- Java 21, `spring-boot-starter-parent:4.1.0`.
- BOM `spring-cloud-dependencies:2025.1.2` (release train compatible con Boot 4.1.0).
- **Artefacto gateway: `spring-cloud-starter-gateway-server-webflux`** (el antiguo
  `spring-cloud-starter-gateway` está deprecado).
- `spring-boot-starter-data-redis-reactive` (rate limiter reactivo).
- `spring-boot-starter-actuator` (healthcheck `/actuator/health`).
- `jjwt-api/impl/jackson:0.11.5` (mismas versiones que `vivia`).
- **Namespace de config: `spring.cloud.gateway.server.webflux.*`** (cambió respecto
  a versiones previas de SCG).

## Topología

```
Internet → nginx (:443 TLS/certbot)
             ├─ /                → vivia-web:80          (SPA, directo, sin auth)
             ├─ /.well-known/... → certbot              (ACME)
             └─ /api/**, /ws, /health → api-gateway:8080 (interno)
                                          ├─ JwtAuthenticationGlobalFilter
                                          ├─ RequestRateLimiter (Redis, userId|IP)
                                          └─ rutas → vivia-app / anomaly / clustering
                                                     / llm / maps / maps-tiles / chat
```

## Mapa de rutas (replica exacta de nginx.conf original)

El reescrito de path **no es uniforme**: unos servicios reciben `/api/...` completo
y otros lo reciben quitado. El gateway lo replica con `RewritePath`/`StripPrefix`.

| Ruta externa | Backend | Path interno | Filtro |
|---|---|---|---|
| `/api/llm/**` | vivia-llm-local:8003 | `/api/llm/**` (preservado) | — |
| `/api/anomaly/**` | vivia-anomaly-api:8001 | `/api/anomaly/**` (preservado) | — |
| `/api/clustering/**` | vivia-clustering-batch:8002 | `/api/clustering/**` (preservado) | — |
| `/api/maps/tiles/{z}/{x}/{y}` | vivia-maps-tiles:3000 | `/chiapas/{z}/{x}/{y}` | RewritePath |
| `/api/maps/**` | vivia-maps-api:8004 | `/**` | RewritePath |
| `/api/chat/**` | vivia-chat:3001 | `/chat/**` | RewritePath |
| `/ws` | vivia-chat:3001 (ws://) | `/` | RewritePath |
| SSE streams | vivia-app:8080 | `/**` | StripPrefix + timeout -1 |
| `/api/**` (catch-all) | vivia-app:8080 | `/**` | StripPrefix=1 |

El orden importa: específicas antes del catch-all `/api/**`.

## Componentes Java (`aleosh.online.apigateway`)
- `ApiGatewayApplication` — `@SpringBootApplication @ConfigurationPropertiesScan`.
- `security/AuthenticatedUser` — record con `subject`, `userId`, `role`.
- `security/JwtValidator` — valida HS256 (firma+exp) con `jwt.secret`, extrae
  claims. Espeja la lógica de lectura de `JwtProvider` de vivia.
- `security/GatewayAuthProperties` — `@ConfigurationProperties(gateway.auth)` con
  `publicPaths` y `websocketPaths`.
- `security/JwtAuthenticationGlobalFilter` — `GlobalFilter` de alta precedencia:
  sanea `X-User-*` del cliente; inyecta identidad si el token es válido; 401 en
  ruta protegida sin token válido; delega al backend en rutas WebSocket.
- `ratelimit/UserOrIpKeyResolver` — clave del rate limiter: `user:<userId>` o
  `ip:<ip>` (prioriza `X-Forwarded-For`/`X-Real-IP` de nginx).

## Rutas públicas (allowlist)
Mapeadas desde `SecurityConfig` de vivia a la ruta externa `/api/...`:
`/api/auth/login`, `/api/auth/login/**`, `/api/auth/refresh`, `/api/lessors/**`,
`/api/lessees/**`, `/api/properties`, `/api/properties/types`,
`/api/maps/tiles/**` (maplibre no manda Authorization), swagger/api-docs,
`/api/.well-known/**`. WebSocket: `/ws`.

> El matching es por ruta, no por método. Vivia abre algunos endpoints solo para
> POST (registro); aquí quedan abiertos para todos los métodos pero vivia sigue
> aplicando su seguridad por método. Servicios auxiliares (maps API, llm, anomaly,
> clustering, chat) quedan protegidos por defecto; si alguno debe ser anónimo se
> agrega a `public-paths` (cambio solo de config).

## Infraestructura
- `api-gateway/Dockerfile` — multi-stage Maven → JRE 21, curl para healthcheck,
  wait-for-it esperando Redis.
- `gateway/docker-compose.gateway.yml` — servicio `api-gateway` (sin puertos al
  host, `env_file: .env.gateway`, healthcheck a `/actuator/health`); `nginx`
  con `depends_on: api-gateway`.
- `gateway/.env.gateway` — `REDIS_*`, `JWT_SECRET` (coinciden con infra/vivia),
  `RATE_LIMIT_REPLENISH/BURST`.
- `gateway/nginx.conf` — `/api/**`, `/ws`, SSE y `/health` → `api-gateway`; SPA y
  ACME sin cambios. El bloque SSE mantiene `proxy_buffering off` en nginx.

## Verificación (end-to-end)
1. `mvn -f api-gateway/pom.xml clean package` compila.
2. Levantar infra (redis) + compose del gateway.
3. Ruteo: `/api/llm/...` llega con prefijo; `/api/properties` llega sin `/api`.
4. JWT inválido en ruta protegida → 401; válido → 200 + `X-User-Id/Role` downstream.
5. Anti-suplantación: `X-User-Id` falso del cliente se descarta.
6. Rate limit: ráfaga > burst → 429 (clave por IP anónimo / userId autenticado).
7. SSE: stream abierto sin buffering ni timeout; CORS OK.
8. WebSocket `/ws`: handshake con JWT conecta a vivia-chat.
9. SPA `/` sigue sirviéndose directo por nginx.

## Fuentes
- Spring Cloud 2025.1.2 (Oakwood): https://spring.io/blog/2026/06/11/spring-cloud-2025-1-2-aka-oakwood-has-been-released/
- Starter server-webflux: https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/starter.html
- Config namespace: https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/configuration.html
