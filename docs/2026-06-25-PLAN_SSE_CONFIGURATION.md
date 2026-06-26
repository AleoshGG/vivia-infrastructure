# Plan: Configuración correcta de SSE (Server-Sent Events)

## Objetivo

Corregir la implementación SSE del flujo de estado del draft de propiedad. La arquitectura general es correcta (Redis Pub/Sub → `DraftStatusMessageListener` → `SseEmitterRegistry` → cliente), pero hay bugs críticos de seguridad, pérdida de datos, y problemas de infraestructura que impiden que funcione de forma confiable en producción.

---

## Flujo actual (referencia)

```
POST /properties/draft
  → draft guardado en Redis (status: PENDING_MEDIA)

Cliente abre:
  GET /api/properties/draft/{draftId}/status/stream   ← SSE
  → PropertyDraftStatusSseController.streamStatus()
  → SseEmitterRegistry.register(draftId, emitter)
  → envía estado actual como primer evento

Cualquier cambio de status (updateStatus en Redis):
  → PropertyDraftRedisRepository.updateStatus()
  → redisTemplate.convertAndSend("draft:status:{draftId}", payload)
  → DraftStatusMessageListener.onMessage()
  → SseEmitterRegistry.notifyStatusChange(draftId, payload)
  → emitter.send(event "status_update")
  → cliente recibe el nuevo status en tiempo real
```

---

## Problemas encontrados

### Bug 1 — NGINX mata las conexiones SSE a los 60 segundos

**Archivo:** `gateway/nginx.conf`

NGINX tiene `proxy_read_timeout` con valor por defecto de 60 segundos. Si el servidor no envía datos en 60s, NGINX cierra la conexión aunque el `SseEmitter` tenga timeout de 30 minutos. Además, `proxy_buffering` está activo por defecto: NGINX acumula los eventos en buffer antes de enviarlos al cliente en lugar de transmitirlos de inmediato.

Resultado: el cliente recibe eventos en ráfagas (o no los recibe hasta que NGINX vacía el buffer) y la conexión cae a los 60s de inactividad.

**Sin ninguna directiva SSE en `nginx.conf` actual:**
```nginx
# ← No hay proxy_buffering, proxy_read_timeout, ni X-Accel-Buffering
location /api/ {
    proxy_pass http://vivia_app/;
}
```

---

### Bug 2 — Emitter registrado aunque el acceso sea denegado o el draft no exista

**Archivo:** `PropertyDraftStatusSseController.java:54-71`

```java
draftRepository.getById(draftId).ifPresent(draft -> {
    if (!draft.getLessorId().equals(userDetails.getUserId())) {
        emitter.completeWithError(new SecurityException("Acceso denegado"));
        return;   // ← sale del lambda, NO del método
    }
    // ...envía estado inicial...
});

sseEmitterRegistry.register(draftId, emitter);  // ← se ejecuta SIEMPRE
```

Dos casos rotos:
- **Draft no existe:** el `ifPresent` no ejecuta nada, el emitter se registra vacío. Nunca recibirá eventos (el Pub/Sub solo publica cuando el draft existe). El emitter queda en memoria hasta que el timeout de 30 min lo expire.
- **Acceso denegado:** se llama a `completeWithError()` y luego se registra ese emitter completado en el registry. El `onError` callback lo eliminará, pero el registro es redundante y confuso.

**Fix:** retornar anticipadamente del método si el draft no existe o el acceso es denegado, antes de llamar a `register`.

---

### Bug 3 — `amenityIds` se pierde en cada `updateStatus()`

**Archivo:** `PropertyDraftRedisRepository.java:122-149` — método `rebuildWithStatus()`

```java
return PropertyDraft.builder()
        .id(draft.getId())
        // ... todos los campos ...
        .rejectedFiles(draft.getRejectedFiles())
        // ← .amenityIds(...) NO está incluido
        .createdAt(draft.getCreatedAt())
        .updatedAt(Instant.now())
        .expiresAt(draft.getExpiresAt())
        .build();
```

Cada vez que se llama a `updateStatus()` (en cada transición de estado), el draft se reconstruye sin el campo `amenityIds`. Cuando el draft llega a `PUBLISHED` y se llama a `propertyPublicationService.publish(draft)`, el draft tiene `amenityIds = null`, por lo que la propiedad publicada en PostgreSQL no tiene ningún amenity asociado.

---

### Bug 4 — Sin heartbeat: conexiones mueren silenciosamente

**Archivo:** `PropertyDraftStatusSseController.java`

El `SseEmitter` tiene timeout de 30 minutos, pero si NGINX (u otros proxies intermedios) tienen timeouts menores, la conexión se cierra sin que el servidor lo sepa. El cliente EventSource intentará reconectarse, pero si el draft cambió de estado mientras estuvo desconectado, puede perderse eventos.

El estándar SSE recomienda enviar comentarios periódicos (`:ping\n\n`) para mantener viva la conexión a través de proxies.

---

### Bug 5 — Sin directiva `retry` en los eventos SSE

**Archivo:** `SseEmitterRegistry.java:34-37`

```java
emitter.send(SseEmitter.event()
        .name("status_update")
        .data(statusPayload));
// ← sin .reconnectTime()
```

Sin `retry`, el navegador usa su valor por defecto (normalmente 3 segundos). Para el caso de uso de vivia, una reconexión de 5 segundos es más adecuada y evita que el cliente martille el servidor al reconectar. También debe enviarse en el primer evento.

---

### Bug 6 — CORS: `allowedOrigins("*")` no funciona con `allowCredentials(true)`

**Archivo:** `WebConfig.java`

```java
registry.addMapping("/**")
        .allowedOrigins("*")
        .allowedMethods("*")
        .allowedHeaders("*");
```

El cliente SSE del navegador necesita enviar el header `Authorization`. Con `allowedOrigins("*")` el navegador acepta la respuesta SSE correctamente para tokens en header (no cookies), por lo que actualmente funciona. Sin embargo, si en el futuro se agrega `allowCredentials(true)` (para cookies de sesión, por ejemplo), `"*"` es inválido y Spring lanzará error. No es un bug activo hoy, pero es una configuración frágil.

Para SSE explícitamente: el preflight OPTIONS a `/api/properties/draft/{id}/status/stream` debe devolver `Access-Control-Allow-Headers: Authorization`. Esto ya lo cubre `allowedHeaders("*")`.

---

## Cambios por archivo

### 1. `gateway/nginx.conf`

Agregar un bloque `location` específico para SSE antes del catch-all `/api/`:

```nginx
# SSE — Server-Sent Events: sin buffering, timeout extendido
location ~ ^/api/properties/draft/[^/]+/status/stream$ {
    proxy_pass         http://vivia_app;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Connection        "";

    proxy_buffering    off;
    proxy_cache        off;
    proxy_read_timeout 35m;       # > timeout SSE del emitter (30m)
    add_header         X-Accel-Buffering no;
    chunked_transfer_encoding on;
}
```

El bloque debe ir ANTES de `location /api/` para que NGINX lo evalúe primero (NGINX usa el prefijo más largo o el primer regex que hace match).

---

### 2. `PropertyDraftStatusSseController.java`

Refactorizar `streamStatus()` para retornar anticipadamente en casos de error, antes de registrar el emitter. Agregar envío de directiva `retry` en el primer evento y heartbeat periódico.

**Lógica corregida:**

```java
@GetMapping(value = "/{draftId}/status/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamStatus(@PathVariable UUID draftId, Authentication authentication) {
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

    // 1. Verificar que el draft existe
    Optional<PropertyDraft> draftOpt = draftRepository.getById(draftId);
    if (draftOpt.isEmpty()) {
        SseEmitter emitter = new SseEmitter(0L);
        emitter.complete();
        return emitter;
    }

    PropertyDraft draft = draftOpt.get();

    // 2. Verificar que el lessor es dueño del draft
    if (!draft.getLessorId().equals(userDetails.getUserId())) {
        SseEmitter emitter = new SseEmitter(0L);
        emitter.completeWithError(new SecurityException("Acceso denegado"));
        return emitter;
    }

    // 3. Crear emitter y enviar estado inicial con retry
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
    try {
        String currentStatus = buildPayload(draftId, draft.getStatus(), draft.getUpdatedAt());
        emitter.send(SseEmitter.event()
                .name("status_update")
                .data(currentStatus)
                .reconnectTime(5_000L));   // ← retry: 5 segundos
    } catch (IOException e) {
        log.warn("Error enviando estado inicial SSE para draftId={}", draftId);
    }

    // 4. Registrar y arrancar heartbeat
    sseEmitterRegistry.register(draftId, emitter);
    scheduleHeartbeat(draftId, emitter);

    return emitter;
}
```

El **heartbeat** envía un comentario SSE (`:heartbeat`) cada 25 segundos para mantener viva la conexión a través de proxies:

```java
private void scheduleHeartbeat(UUID draftId, SseEmitter emitter) {
    // Usar un ScheduledExecutorService compartido (bean de Spring)
    // Cancelar la tarea cuando el emitter complete/timeout/error
    ScheduledFuture<?> task = taskScheduler.scheduleAtFixedRate(() -> {
        try {
            emitter.send(SseEmitter.event().comment("heartbeat"));
        } catch (Exception e) {
            // emitter ya cerrado — la tarea se cancelará vía onCompletion
        }
    }, Duration.ofSeconds(25));

    emitter.onCompletion(task::cancel);
    emitter.onTimeout(task::cancel);
    emitter.onError(e -> task.cancel(true));
}
```

Requiere agregar un bean `TaskScheduler` a la configuración de Spring (ver paso 3).

---

### 3. `RedisConfig.java` o nueva clase `AsyncConfig.java`

Agregar un `TaskScheduler` para los heartbeats de SSE:

```java
@Bean
public TaskScheduler sseHeartbeatScheduler() {
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(2);    // 2 threads es suficiente para heartbeats
    scheduler.setThreadNamePrefix("sse-heartbeat-");
    scheduler.initialize();
    return scheduler;
}
```

---

### 4. `PropertyDraftRedisRepository.java` — `rebuildWithStatus()`

Agregar la línea faltante:

```java
return PropertyDraft.builder()
        // ... todos los campos existentes ...
        .rejectedFiles(draft.getRejectedFiles())
        .amenityIds(draft.getAmenityIds())   // ← línea que falta
        .createdAt(draft.getCreatedAt())
        .updatedAt(Instant.now())
        .expiresAt(draft.getExpiresAt())
        .build();
```

---

## Pasos de implementación

1. **`gateway/nginx.conf`** — agregar bloque SSE con `proxy_buffering off` y `proxy_read_timeout 35m`
2. **`PropertyDraftRedisRepository.java`** — agregar `.amenityIds()` en `rebuildWithStatus()` *(bug independiente, cambio de una línea)*
3. **`RedisConfig.java`** (o nueva `AsyncConfig.java`) — declarar bean `TaskScheduler` para heartbeats
4. **`PropertyDraftStatusSseController.java`** — refactorizar `streamStatus()`: retorno anticipado, `reconnectTime`, inyectar `TaskScheduler`, heartbeat cada 25s

---

## Relación con FCM

SSE y FCM cubren el mismo tipo de evento (cambio de estado del draft) pero para canales distintos:

| Canal | Cuándo funciona | Cuándo no funciona |
|---|---|---|
| **SSE** | App en primer plano, conexión activa | App en background, conexión cerrada |
| **FCM** | App en background o cerrada | — (llega siempre, salvo token inválido) |

Ambos deben convivir. El cliente debe:
1. Abrir SSE al crear el draft y mantenerlo mientras la app esté activa
2. Al recibir FCM push (app en background), recargar el estado del draft desde la API REST

No es redundante: SSE da actualizaciones inmediatas en foreground; FCM garantiza entrega aunque la app no esté activa.

---

## Riesgos y notas

- **Un `SseEmitter` = un thread de Tomcat** en modo servlet bloqueante. Con muchos drafts en validación simultánea, el pool de threads (default 200) puede agotarse. Para producción, considerar configurar Spring en modo reactivo (WebFlux + `Flux<ServerSentEvent>`) o aumentar el pool de Tomcat.
- **`SseEmitterRegistry` es en memoria**: si vivia-app escala a múltiples instancias, el pub/sub de Redis puede llegar a la instancia que no tiene el emitter del usuario. Para escalar horizontalmente, el registry debe ser reemplazado por un enfoque donde cada instancia suscrita a Redis recibe el mensaje (lo que ya ocurre, pero el emitter del usuario solo existe en una instancia). Acceptable para una sola instancia.
- El `TaskScheduler` compartido para heartbeats no debe bloquearse — los heartbeats son operaciones de I/O rápidas, no hay riesgo con pool de 2 threads para el volumen esperado.
