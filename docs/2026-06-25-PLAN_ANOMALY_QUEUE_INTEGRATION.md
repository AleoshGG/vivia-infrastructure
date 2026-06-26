# Plan: Integración de cola de anomalías entre vivia y vivia-ai

## Objetivo

Cerrar el flujo de publicación de propiedades en el tramo vivia → vivia-ai. Actualmente vivia publica el `AnomalyValidationSubmitEvent` a la cola `vivia.validation.anomaly.submit`, pero vivia-ai no tiene ningún consumidor registrado para esa cola. El endpoint `POST /api/anomaly/analyze` existe pero nadie lo invoca. Además, la URL del webhook de retorno tiene un problema de path que causaría 404 si apuntara directamente a vivia-app.

---

## Alcance

**Incluido:**
- Consumer de RabbitMQ en vivia-ai para la cola `vivia.validation.anomaly.submit`
- Activación del consumer en el lifespan de FastAPI (hilo de background)
- Corrección del `EXTERNAL_SERVICE_URL` en `.env` de vivia-ai para que apunte al gateway NGINX

**Excluido:**
- Cambios en vivia (Spring Boot) — el publisher ya funciona correctamente
- Validación real de anomalías (el use case actual ya simula aprobación, se mantiene)
- Consumer del content validation (`vivia.validation.content.submit`) — fuera de alcance

---

## Problema raíz documentado

### Bug 1 — No existe consumer para `vivia.validation.anomaly.submit`

`vivia/ContentValidationResultConsumer.handleApproval()` publica:
```java
anomalyValidationPublisher.publish(new AnomalyValidationSubmitEvent(draft));
// → exchange: vivia.properties
// → routing key: vivia.validation.anomaly.submit
```

El mensaje contiene el `PropertyDraft` completo serializado como JSON.

En vivia-ai, `main.py` tiene el lifespan vacío:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield   # ← no conecta RabbitMQ, no arranca ningún consumer
```

El mensaje queda acumulado en la cola sin ser procesado.

### Bug 2 — Path incorrecto en webhook de retorno

`analyze_property.py` construye la URL así:
```python
base_url = settings.external_service_url   # default: http://localhost:8080
path = "/api/internal/validations/anomaly/result"
url = f"{base_url}{path}"
```

Si `EXTERNAL_SERVICE_URL=http://vivia-app:8080` (directo al contenedor), Spring recibe la petición con path `/api/internal/validations/anomaly/result`, pero el controller está mapeado en:
```java
@RequestMapping("/internal/validations")   // → /internal/validations/anomaly/result
```

El prefijo `/api/` solo existe en el gateway NGINX — Spring no lo conoce. La llamada retornaría 404.

**Solución:** `EXTERNAL_SERVICE_URL` debe apuntar al NGINX (`http://vivia-nginx`) para que el gateway haga el strip del prefijo `/api/` antes de reenviar.

---

## Cambios por capa

### 1. `vivia-ai/src/anomaly_detector_api/` — Consumer de cola

**Archivo nuevo:** `src/anomaly_detector_api/messaging/anomaly_queue_consumer.py`

- Clase `AnomalyQueueConsumer` que extiende/usa el `QueueConsumer` genérico de `shared/queue_consumer.py`
- Se conecta a la cola `vivia.validation.anomaly.submit`
- Callback: deserializa el JSON recibido de vivia como `PropertyRequest(draft=Draft(**payload["draft"]))` y llama `await AnalyzePropertyUseCase().execute(request)`
- El consumer corre en un hilo de background usando `asyncio.get_event_loop().run_in_executor()` o `threading.Thread`

**Consideración de concurrencia:** `QueueConsumer.start_consuming()` es bloqueante (pika bloqueante). Debe correr en un `ThreadPoolExecutor` para no bloquear el event loop de FastAPI.

### 2. `vivia-ai/src/anomaly_detector_api/main.py` — Lifespan

Activar el consumer en el `lifespan`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = AnomalyQueueConsumer()
    thread = threading.Thread(target=consumer.run, daemon=True)
    thread.start()
    yield
    consumer.stop()
```

### 3. `vivia-ai/.env` — Variable de entorno

```env
EXTERNAL_SERVICE_URL=http://vivia-nginx
```

En desarrollo local (sin Docker), se puede usar `http://localhost:80` o `http://localhost:8080` con el path ajustado (ver nota abajo).

---

## Mapeo de payload vivia → vivia-ai

El `AnomalyValidationSubmitEvent` que publica vivia contiene el `PropertyDraft` serializado con los nombres de campo en camelCase (Jackson). El modelo `Draft` de vivia-ai ya declara los alias correctos:

| Campo vivia (camelCase) | Campo vivia-ai (alias) |
|---|---|
| `id` | `id` |
| `lessorId` | `lessor_id` (alias `lessorId`) |
| `propertyType` | `property_type` (alias `propertyType`) |
| `mediaFiles` | `media_files` (alias `mediaFiles`) |
| `areaM2` | `area_m2` (alias `areaM2`) |
| `listedPrice` | `listed_price` (alias `listedPrice`) |
| `availableToRent` | `available_to_rent` (alias `availableToRent`) |
| `expiresAt` | `expires_at` (alias `expiresAt`) |

El payload de la cola tiene la forma:
```json
{
  "draft": { ...PropertyDraft fields... }
}
```

Usar `PropertyRequest.model_validate(payload, from_attributes=False)` con `by_alias=True`.

---

## Pasos de implementación

1. Crear `src/anomaly_detector_api/messaging/__init__.py`
2. Crear `src/anomaly_detector_api/messaging/anomaly_queue_consumer.py`
   - Clase con método `run()` (bloqueante, para correr en thread)
   - Método `stop()` para shutdown limpio
   - Deserialización del payload a `PropertyRequest`
   - Llamada a `AnalyzePropertyUseCase().execute()`
3. Actualizar `src/anomaly_detector_api/main.py`
   - Importar consumer
   - Arrancar thread en `lifespan` startup
   - Detener en `lifespan` teardown
4. Actualizar `vivia-ai/.env`
   - `EXTERNAL_SERVICE_URL=http://vivia-nginx`

---

## Verificación

Flujo completo esperado tras los cambios:

```
vivia: ContentValidationResultConsumer.handleApproval()
  → publica AnomalyValidationSubmitEvent → vivia.validation.anomaly.submit

vivia-ai: AnomalyQueueConsumer (thread background)
  → consume mensaje → deserializa → PropertyRequest(draft=Draft(...))
  → AnalyzePropertyUseCase.execute(request)
  → asyncio.sleep(2) [simulación]
  → POST http://vivia-nginx/api/internal/validations/anomaly/result
       { "draftId": "...", "approved": true, "reason": "..." }
       X-Internal-Api-Key: <key>

NGINX: strip /api/ → reenvía a vivia-app:8080/internal/validations/anomaly/result

vivia: ValidationWebhookController.anomalyResult()
  → valida X-Internal-Api-Key
  → AnomalyValidationResultPublisher.publish(AnomalyValidationResultEvent)
  → vivia.validation.anomaly.result

vivia: AnomalyValidationResultConsumer.handle()
  → si approved=true → moveStagingToPublic + propertyPublicationService.publish() + Firebase push
  → si approved=false → analysisStorageService.saveRejectedDraft() + Firebase push
```

---

## Riesgos, notas y soluciones

### Riesgo 1 — Thread vs async

**Problema:** `AnalyzePropertyUseCase.execute()` es `async`. El callback de pika corre en un thread bloqueante sin event loop propio; llamar `await` directamente lanzaría `RuntimeError: no running event loop`.

**Solución:** Dentro del callback del consumer, ejecutar el use case con `asyncio.run()`. Esto crea un event loop temporal por mensaje, lo que es correcto porque el use case no comparte estado con el loop de FastAPI ni con otros mensajes concurrentes (pika usa `prefetch_count=1`, procesa un mensaje a la vez).

```python
def _on_message(self, ch, method, properties, payload: dict):
    request = PropertyRequest.model_validate({"draft": payload["draft"]})
    asyncio.run(AnalyzePropertyUseCase().execute(request))
```

**Cambio en pasos de implementación:** ninguno adicional — se aplica directamente en `anomaly_queue_consumer.py`.

---

### Riesgo 2 — Reconexión ante caída de RabbitMQ

**Problema:** `QueueConsumer.connect()` falla con excepción si el broker no está disponible. Si el broker cae después de conectar, pika lanza `StreamLostError` y el thread muere silenciosamente. Los mensajes siguen en la cola (durable), pero el consumer no vuelve a conectar solo.

**Solución:** Implementar un loop de retry con backoff exponencial en el método `run()` del consumer:

```python
def run(self):
    delay = 5
    while not self._stop_event.is_set():
        try:
            self.connect()
            self.start_consuming(self._on_message)
        except Exception as e:
            logger.error(f"Consumer error: {e}. Reintentando en {delay}s...")
            time.sleep(delay)
            delay = min(delay * 2, 60)  # backoff hasta 60s
        else:
            delay = 5  # reset si la conexión fue exitosa
```

Usar un `threading.Event` (`_stop_event`) para que `stop()` interrumpa el loop limpiamente.

**Cambio en pasos de implementación:** el método `run()` incluye el loop de retry; `stop()` hace `_stop_event.set()` y cierra la conexión pika.

---

### Riesgo 3 — Requeue infinito ante fallo del use case

**Problema:** `QueueConsumer` hace `basic_nack(requeue=True)` si el callback lanza excepción. Si `AnalyzePropertyUseCase` falla de forma sistemática (ej. timeout de red al llamar el webhook), el mensaje rebota indefinidamente entre la cola y el consumer, generando un loop de CPU sin salida.

**Solución en dos partes:**

**a) Declarar la cola con DLQ args en vivia-ai** para que, tras un número de redeliveries, el mensaje pase a `vivia.dlq` en lugar de rebotar:

```python
self._channel.queue_declare(
    queue=self.queue_name,
    durable=True,
    arguments={
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "vivia.dlq",
    }
)
```

Esto alinea la declaración de vivia-ai con la que ya hace vivia en `RabbitMQConfig.java`.

**b) Cambiar a `requeue=False` en el nack del consumer de anomalías** para que un mensaje que falla vaya directamente a DLQ sin rebotar, dado que el error de webhook es determinista (si falló una vez, fallará de nuevo con el mismo mensaje):

```python
ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
```

Este cambio va en `AnomalyQueueConsumer._on_message()`, no en el `QueueConsumer` genérico, para no alterar el comportamiento de otros posibles consumers.

**Cambio en pasos de implementación:** agregar paso 5 — declarar la cola con DLQ args en `anomaly_queue_consumer.py` sobreescribiendo el `queue_declare` del padre, y usar `requeue=False` en el nack local.

---

## Pasos de implementación (actualizado)

1. Crear `src/anomaly_detector_api/messaging/__init__.py`
2. Crear `src/anomaly_detector_api/messaging/anomaly_queue_consumer.py`
   - `_stop_event: threading.Event` para shutdown limpio
   - `run()` con loop de retry y backoff exponencial (Riesgo 2)
   - `stop()` que setea el evento y cierra la conexión pika
   - `queue_declare` con args de DLQ (Riesgo 3a)
   - `_on_message()` que deserializa el payload y llama `asyncio.run(AnalyzePropertyUseCase().execute(request))` (Riesgo 1)
   - `basic_nack(requeue=False)` en el manejo de errores del mensaje (Riesgo 3b)
3. Actualizar `src/anomaly_detector_api/main.py`
   - Importar consumer
   - Arrancar `threading.Thread(target=consumer.run, daemon=True)` en lifespan startup
   - Llamar `consumer.stop()` en lifespan teardown
4. Actualizar `vivia-ai/.env`
   - `EXTERNAL_SERVICE_URL=http://vivia-nginx`
