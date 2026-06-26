# Guía de configuración — Firebase y FCM en Vivia

## Índice

1. [Crear proyecto Firebase](#1-crear-proyecto-firebase)
2. [Generar Service Account Key](#2-generar-service-account-key)
3. [Configurar variables de entorno en vivia](#3-configurar-variables-de-entorno-en-vivia)
4. [Habilitar Firebase en la aplicación](#4-habilitar-firebase-en-la-aplicación)
5. [Registrar token FCM desde el cliente](#5-registrar-token-fcm-desde-el-cliente)
6. [Flujo completo de notificaciones FCM](#6-flujo-completo-de-notificaciones-fcm)
7. [Verificar que funciona](#7-verificar-que-funciona)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Crear proyecto Firebase

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **Agregar proyecto**
3. Nombre del proyecto: `vivia` (o el que corresponda al entorno)
4. Desactivar Google Analytics si no se necesita
5. Clic en **Crear proyecto**

Una vez creado, habilitar **Cloud Messaging**:
- En el menú lateral → **Build** → **Cloud Messaging**
- Firebase habilita FCM por defecto en proyectos nuevos; verificar que aparece `Firebase Cloud Messaging API (V1)` como activa

---

## 2. Generar Service Account Key

La aplicación Spring Boot necesita un archivo JSON de credenciales para autenticarse con Firebase Admin SDK.

1. En la consola de Firebase → ⚙️ **Configuración del proyecto** (ícono de engranaje)
2. Pestaña **Cuentas de servicio**
3. Sección **Firebase Admin SDK** → Seleccionar **Java**
4. Clic en **Generar nueva clave privada**
5. Confirmar → se descarga un archivo `<proyecto>-firebase-adminsdk-<hash>.json`

**Guardar el archivo de forma segura.** Contiene credenciales privadas — no debe commitearse al repositorio.

Colocar el archivo en el servidor:

```bash
# Ejemplo: colocarlo en el directorio de secrets del contenedor
mkdir -p /var/run/secrets
cp vivia-firebase-adminsdk.json /var/run/secrets/firebase-adminsdk.json
chmod 400 /var/run/secrets/firebase-adminsdk.json
```

---

## 3. Configurar variables de entorno en vivia

Editar `vivia/.env`:

```env
# Firebase
FIREBASE_KEY_PATH=/var/run/secrets/firebase-adminsdk.json
FIREBASE_ENABLED=true
```

Si el archivo se coloca en otra ruta, actualizar `FIREBASE_KEY_PATH` en consecuencia.

En `application.properties` ya están definidas las propiedades que leen estas variables:

```properties
firebase.credentials.path=file:${FIREBASE_KEY_PATH:/var/run/secrets/firebase-adminsdk.json}
firebase.enabled=${FIREBASE_ENABLED:false}
```

> **Nota:** El prefijo `file:` es obligatorio cuando la ruta es una ruta del sistema de archivos. Si se usa un recurso en el classpath, usar `classpath:`. En producción siempre usar `file:` con ruta absoluta.

---

## 4. Habilitar FCM en la aplicación

La única variable que controla si Firebase/FCM está activo es `FIREBASE_ENABLED`. El proyecto usa el patrón **bean condicional** para que la aplicación arranque correctamente tanto en entornos con credenciales reales como en desarrollo local sin ellas.

### Beans que se activan con `FIREBASE_ENABLED=true`

| Bean / Clase | Condicional | Qué hace |
|---|---|---|
| `FirebaseApp` (`FirebaseConfig`) | `firebase.enabled=true` | Inicializa el SDK con el service account key |
| `FcmServiceImpl` | `firebase.enabled=true` | Envía mensajes push reales vía `FirebaseMessaging` |
| `AnalysisStorageServiceImpl` | `firebase.enabled=true` | Guarda drafts rechazados en Firestore |

### Beans que se activan con `FIREBASE_ENABLED=false` (o ausente)

| Bean / Clase | Condicional | Qué hace |
|---|---|---|
| `NoOpFcmServiceImpl` | `firebase.enabled=false` (matchIfMissing) | Loguea la notificación en consola sin llamar a FCM |
| `NoOpAnalysisStorageServiceImpl` | `firebase.enabled=false` (matchIfMissing) | Loguea el intento de guardado sin llamar a Firestore |

Con este esquema, **en desarrollo local** basta con no definir `FIREBASE_ENABLED` (o dejarlo en `false`) para que la aplicación arranque sin credenciales y las notificaciones aparezcan solo en los logs.

### Qué ocurre en cada entorno

| Entorno | `FIREBASE_ENABLED` | Notificaciones | Almacenamiento rechazos |
|---|---|---|---|
| Desarrollo local | `false` (default) | Log en consola | Log en consola |
| Staging / Producción | `true` | FCM real al dispositivo | Firestore `rejected_drafts` |

### Flujo de inicialización FCM

Al arrancar con `FIREBASE_ENABLED=true`, Spring:

1. Lee `FIREBASE_KEY_PATH` y carga el JSON del service account
2. Inicializa `FirebaseApp` con las credenciales obtenidas de `GoogleCredentials`
3. Registra `FcmServiceImpl` como implementación activa de `IFcmService`
4. `NotificationConsumer` (listener de `vivia.notification.send`) queda listo para recibir eventos y llamar a `FcmServiceImpl.send()`

No se requiere ninguna configuración adicional en Spring Boot — la dependencia `firebase-admin` ya está declarada en `pom.xml` y FCM V1 no necesita configuración de servidor adicional más allá del service account.

---

## 5. Registrar token FCM desde el cliente

El cliente móvil (Android/iOS) debe registrar su token FCM en vivia después de cada login o cuando FCM renueve el token.

### Endpoint

```
PUT /api/users/me/fcm-token
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "fcmToken": "<token_fcm_del_dispositivo>"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": null,
  "message": "FCM token registrado"
}
```

### Cuándo llamarlo desde el cliente

- Al completar el login (Google OAuth)
- Cuando `FirebaseMessaging.getInstance(context).token` devuelve un token nuevo (listener `onNewToken`)
- Al reabrir la app si el token en memoria cambió

### Ejemplo Android (Kotlin)

```kotlin
// En el servicio de FCM
class ViviaFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Enviar el nuevo token al backend
        CoroutineScope(Dispatchers.IO).launch {
            apiService.registerFcmToken(RegisterFcmTokenRequest(fcmToken = token))
        }
    }
}
```

El token se guarda en la columna `fcm_token` de la tabla `users` (migración `V15__add_fcm_token_to_users.sql`).

---

## 6. Flujo completo de notificaciones FCM

El flujo de notificación está desacoplado mediante RabbitMQ. Ningún componente llama directamente a FCM salvo el `NotificationConsumer`.

```
[Evento de negocio]
  (aprobación, rechazo, error)
        ↓
NotificationPublisher.publish(NotificationEvent)
  → cola: vivia.notification.send
        ↓
NotificationConsumer.handle()
  → userRepository.findFcmTokenByUserId(userId)
  → IFcmService.send(event, fcmToken)
        ↓
FcmServiceImpl.send()
  → FirebaseMessaging.getInstance().send(Message)
        ↓
[Dispositivo del arrendador recibe push]
```

### Eventos que desencadenan FCM en el flujo de anomalías

| Caso | Estado del draft | Título FCM | Quién lo dispara |
|---|---|---|---|
| Aprobado | `PUBLISHED` | "¡Tu propiedad ya está publicada!" | `AnomalyValidationResultConsumer.handleApproval()` |
| Rechazado (anomalía detectada) | `ANOMALY_REJECTED` | "Tu propiedad está en revisión" | `AnomalyValidationResultConsumer.handleRejection()` |
| Error al notificar resultado | `ANOMALY_REJECTED` | "Tu propiedad está en revisión" | Fallback en `AnalyzePropertyUseCase` → llama webhook con `approved=false` |
| Contenido rechazado | `CONTENT_REJECTED` | "Tu propiedad no pudo ser publicada" | `ContentValidationResultConsumer.handleRejection()` |
| Error al encolar anomalías | — | "Ocurrió un problema al procesar tu propiedad" | `ContentValidationResultConsumer.handleApproval()` catch |

### ¿Qué pasa si falla el webhook de vivia-ai → vivia?

`AnalyzePropertyUseCase` implementa retry con backoff exponencial (3 intentos: 2s, 5s, 10s). Si todos fallan:
1. Envía un segundo intento con `approved=false` y reason de error técnico
2. Si ese también falla → lanza `RuntimeError`
3. `AnomalyQueueConsumer` hace `basic_nack(requeue=False)` → mensaje va a `vivia.dlq`
4. El draft permanece en Redis en estado `ANOMALY_VALIDATION_PENDING` hasta que expire el TTL (24h)
5. **No se envía FCM en este caso extremo** — el draft expira silenciosamente

> Para mitigarlo en una iteración futura: agregar un job programado en vivia que detecte drafts en `ANOMALY_VALIDATION_PENDING` con más de N minutos de antigüedad y envíe FCM de error.

---

## 7. Verificar que funciona

### Paso 1 — Verificar que Firebase arrancó correctamente

En los logs de `vivia-app` al iniciar:

```
INFO  FirebaseConfig - Firebase initialized successfully
```

Si aparece este error:

```
ERROR - Failed to initialize Firebase: ...
```

Verificar que `FIREBASE_KEY_PATH` apunta al archivo correcto y que el archivo tiene permisos de lectura.

### Paso 2 — Registrar un token FCM de prueba

```bash
curl -X PUT http://localhost/api/users/me/fcm-token \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "test-token-123"}'
```

Verificar en la base de datos:

```sql
SELECT id, email, fcm_token FROM users WHERE id = '<user_id>';
```

### Paso 3 — Disparar el flujo completo

Publicar un draft completo y esperar a que el flujo de validación complete. Verificar en logs:

```
INFO  NotificationConsumer   - [DEBUG] Enviando notificación push a userId=...
INFO  FcmServiceImpl         - FCM enviado a userId=...: messageId=projects/.../messages/...
```

### Paso 4 — Verificar en la consola de Firebase

Firebase Console → **Cloud Messaging** → **Informes** → se verán los mensajes enviados con timestamp, token destino y estado de entrega.

---

## 8. Troubleshooting

### `IllegalStateException: FirebaseApp named '[DEFAULT]' doesn't exist`

**Causa:** `firebase.enabled=false` (o no definido) pero `FcmServiceImpl` intenta usar `FirebaseMessaging.getInstance()`.

**Estado en el proyecto:** ✅ Resuelto. `FcmServiceImpl` tiene `@ConditionalOnProperty(havingValue = "true")` y `NoOpFcmServiceImpl` cubre el caso contrario con `matchIfMissing = true`. La aplicación arranca sin error en cualquier configuración.

---

### `UnsatisfiedDependencyException` al arrancar sin Firebase

**Causa:** Alguna interfaz (`IFcmService`, `IAnalysisStorageService`) no tiene implementación activa para la condición actual.

**Estado en el proyecto:** ✅ Resuelto. Ambas interfaces tienen par de implementaciones condicionales:

| Interfaz | Con Firebase | Sin Firebase |
|---|---|---|
| `IFcmService` | `FcmServiceImpl` | `NoOpFcmServiceImpl` |
| `IAnalysisStorageService` | `AnalysisStorageServiceImpl` | `NoOpAnalysisStorageServiceImpl` |

Si aparece este error, verificar que `spring.main.allow-bean-definition-overriding=true` esté en `application.properties` (ya está configurado).

---

### `INVALID_ARGUMENT: The registration token is not a valid FCM registration token`

**Causa:** El token FCM guardado en la BD es inválido o expiró.

**Solución:** El cliente debe llamar a `PUT /api/users/me/fcm-token` con un token fresco. El error es capturado en `FcmServiceImpl` dentro del bloque `catch (Exception e)` y se loguea como `ERROR` sin propagar la excepción, por lo que el flujo de validación de la propiedad no se interrumpe.

---

### `UNREGISTERED: Requested entity was not found`

**Causa:** El dispositivo desinstaló la app o FCM invalidó el token.

**Solución pendiente:** Detectar este código de error específico en `FcmServiceImpl` y limpiar el token de la BD:

```java
} catch (FirebaseMessagingException e) {
    if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
        log.warn("Token FCM inválido para userId={}, limpiando...", event.getUserId());
        // userRepository.updateFcmToken(event.getUserId(), null);
    }
    log.error("Error enviando FCM a userId={}: {}", event.getUserId(), e.getMessage(), e);
}
```

Por ahora el token queda en BD y el próximo intento de envío también fallará con el mismo error (sin consecuencias para el flujo de negocio).

---

### FCM no llega al dispositivo pero no hay errores en logs

**Causas comunes:**

1. **El usuario no tiene token registrado** — `NotificationConsumer` loguea `WARN: userId=X no tiene FCM token registrado, notificación omitida`. El cliente debe llamar a `PUT /api/users/me/fcm-token` tras el login.

2. **Doze Mode (Android)** — FCM entrega el mensaje de alta prioridad cuando el dispositivo sale de Doze. Para notificaciones críticas, usar `Message.setAndroidConfig(AndroidConfig.builder().setPriority(Priority.HIGH).build())` en `FcmServiceImpl`.

3. **Token de entorno incorrecto** — El token generado en una build de desarrollo no funciona con las credenciales del proyecto de producción en Firebase. Verificar que la app usa el mismo `google-services.json` que el service account configurado en el servidor.

4. **Notificaciones desactivadas en el SO** — El usuario puede haber desactivado las notificaciones de la app. En este caso FCM entrega el mensaje pero el SO lo descarta; aparecerá como entregado en Firebase Console.
