# Checklist de Ejecución — Bearer / Nuclei / ZAP + Evidencia

Repo raíz: `~/Documentos/Ingeniería en Software/9no Cuatrimestre/Integrador/vps` (ajusta la ruta si corres desde otro lugar; abajo se usa `<repo>` como placeholder).

Carpeta de evidencia: `docs/evidencia-seguridad-2026-07-16/{bearer,zap,nuclei,screenshots}/` (ya creada).
Reporte a completar en paralelo: `docs/REPORTE_SEGURIDAD_2026-07-16.md`.

Convención de nombre de captura: `NN-herramienta-target.png`, guardadas en `docs/evidencia-seguridad-2026-07-16/screenshots/`.

---

## 0. Preparación (una sola vez)

- [ ] Confirmar Docker corriendo: `docker info > /dev/null && echo OK`
- [ ] Definir atajo de captura de pantalla en GNOME (`Configuración → Teclado → Accesos directos → Capturas de pantalla`) — usar el de "Capturar una ventana" o "Capturar una región" y que **copie al portapapeles o guarde directo** en `docs/evidencia-seguridad-2026-07-16/screenshots/`.
- [ ] Crear usuario de prueba en `vivia` (no una cuenta real) y obtener un JWT:
  ```bash
  curl -s -X POST https://vivia.aleosh.online/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"<tu-usuario-de-prueba>","password":"<password>"}' | tee /tmp/login-response.json
  ```
  Extraer el token del campo correspondiente (`accessToken`/`token`, según lo que devuelva `AuthServiceImpl`) y guardarlo en variable de entorno:
  ```bash
  export JWT_TOKEN="<pega-aquí-el-token>"
  ```
- [ ] Verificar accesibilidad de las specs OpenAPI (define si ZAP puede usar `zap-api-scan.py` o debe caer a `zap-baseline.py`):
  ```bash
  curl -sI https://vivia.aleosh.online/api/v3/api-docs | head -1
  curl -sI https://vivia.aleosh.online/api/anomaly/openapi.json | head -1
  curl -sI https://vivia.aleosh.online/api/llm/openapi.json | head -1
  ```
  Anotar cuáles responden `200` (usar api-scan) y cuáles no (usar baseline/crawl).
- [ ] Avisar al equipo la ventana de bajo tráfico elegida para las Fases 3-4 (Nuclei/ZAP), ya que no hay staging.

---

## Fase 2 — Bearer (SAST, local, sin riesgo)

> **Nota de mount**: se monta el repo completo como `/repo` dentro del contenedor (no solo la carpeta a escanear), porque el output se guarda en `docs/evidencia-seguridad-2026-07-16/...` que vive fuera de `vivia/`/`vivia-ai/`. Si montas solo la subcarpeta a escanear, el contenedor no puede ver `docs/` y falla con `no such file or directory`.
>
> **Nota de permisos**: el contenedor de Bearer corre internamente como `uid=999`, distinto a tu usuario del host. Si la carpeta `docs/evidencia-seguridad-2026-07-16/bearer/` es tuya (modo `755`), el contenedor no puede escribir ahí y falla con `permission denied`. Se soluciona agregando `--user "$(id -u):$(id -g)"` para que el proceso dentro del contenedor corra con tu mismo UID/GID.
>
> **Nota de scanners**: por defecto Bearer solo corre el scanner `sast`. Se agrega `--scanner=sast,secrets` para incluir detección de secretos hardcodeados (API keys, tokens, passwords en código), relevante para el informe.

### Fila 1 — `vivia`
```bash
cd <repo>
docker pull bearer/bearer:latest

docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia \
  --scanner=sast,secrets \
  --format json --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/vivia-bearer.json

docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia \
  --scanner=sast,secrets \
  --format html --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/vivia-bearer.html
```
- [ ] Correr los dos comandos de arriba.
- [ ] Al terminar, capturar la terminal con el resumen de severidades (`critical/high/medium/low`) → guardar `01-bearer-vivia.png`.
- [ ] Abrir `docs/evidencia-seguridad-2026-07-16/bearer/vivia-bearer.html` en el navegador, capturar → `01b-bearer-vivia-html.png` (opcional pero recomendado).
- [ ] Rellenar fila 1 de la Bitácora en `REPORTE_SEGURIDAD_2026-07-16.md` (comando, resultado, ruta de captura).

### Fila 2 — `vivia-ai/anomaly_detector_api`
```bash
docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia-ai/src/anomaly_detector_api \
  --scanner=sast,secrets \
  --format json --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/anomaly_detector_api-bearer.json

docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia-ai/src/anomaly_detector_api \
  --scanner=sast,secrets \
  --format html --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/anomaly_detector_api-bearer.html
```
- [ ] Correr, capturar terminal → `02-bearer-anomaly.png`.
- [ ] Rellenar fila 2 de la Bitácora.

### Fila 3 — `vivia-ai/llm_local_service`
```bash
docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia-ai/src/llm_local_service \
  --scanner=sast,secrets \
  --format json --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/llm_local_service-bearer.json

docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd):/repo" bearer/bearer:latest scan /repo/vivia-ai/src/llm_local_service \
  --scanner=sast,secrets \
  --format html --output /repo/docs/evidencia-seguridad-2026-07-16/bearer/llm_local_service-bearer.html
```
- [ ] Correr, capturar terminal → `03-bearer-llm.png`.
- [ ] Rellenar fila 3 de la Bitácora.

---

## Fase 3 — Nuclei (DAST, reconocimiento — bajo riesgo con autolimitación)

### Fila 4 — Global contra `vivia.aleosh.online`
```bash
docker pull projectdiscovery/nuclei:latest
docker run --rm projectdiscovery/nuclei:latest -update-templates

docker run --rm -v "$(pwd)/docs/evidencia-seguridad-2026-07-16/nuclei:/out" \
  projectdiscovery/nuclei:latest \
  -u https://vivia.aleosh.online \
  -tags cves,exposures,misconfiguration,tech,default-login,ssl \
  -rate-limit 10 -c 5 -timeout 10 -retries 1 \
  -jsonl -o /out/nuclei-global-results.jsonl \
  -me /out/nuclei-global-report
```
- [ ] Correr, capturar la terminal con el progreso/resultado final → `04-nuclei-global.png`.
- [ ] Rellenar fila 4 de la Bitácora.

### Fila 5 — Dirigido a `/api/anomaly/`, `/api/llm/`, `/api/`
```bash
docker run --rm -v "$(pwd)/docs/evidencia-seguridad-2026-07-16/nuclei:/out" \
  projectdiscovery/nuclei:latest \
  -u https://vivia.aleosh.online/api/anomaly/ \
  -u https://vivia.aleosh.online/api/llm/ \
  -u https://vivia.aleosh.online/api/ \
  -tags exposures,misconfiguration \
  -rate-limit 10 -c 5 \
  -jsonl -o /out/nuclei-dirigido-results.jsonl \
  -me /out/nuclei-dirigido-report
```
- [ ] Correr, capturar → `05-nuclei-dirigido.png`.
- [ ] Rellenar fila 5 de la Bitácora.

---

## Fase 4 — OWASP ZAP (DAST activo — riesgo medio/alto, ventana coordinada)

> **Lección aprendida (filas 6-7)**: el flag `-z "-config replacer.full_list(0)..."` de `zap-baseline.py`/`zap-api-scan.py` **no funciona** en versiones recientes de ZAP (rompe las comillas anidadas en el shell y nunca llega a aplicarse — confirmado revisando el `zap.yaml` generado, que no tenía job `replacer`). La forma que sí funciona es escribir un **plan de Automation Framework a mano** con un job `replacer` explícito y correrlo con `zap.sh -cmd -autorun <plan.yaml>`. Nombres de campo correctos del job `replacer` (probado): `matchType`, `matchString` (no `matchStr`), `matchRegex` (no `regex`), `replacementString` (no `replacement`). Además, si el `openapi` job encuentra un problema menor en la spec (ej. tag duplicado), lo reporta como "Automation plan failure" — usar `failOnError: false` en `env.parameters` para que el resto de jobs (replacer, activeScan, report) igual corran.
>
> **Seguridad del token**: el plan YAML lleva el JWT embebido en texto plano. Los archivos `docs/evidencia-seguridad-2026-07-16/zap/*-plan.yaml` están en `.gitignore` — nunca los agregues a git manualmente.

### Fila 6 — ZAP baseline contra `vivia-app` (`/api/`) — sin autenticación (ok para pasivo)
```bash
docker pull zaproxy/zap-stable

docker run --rm -v "$(pwd)/docs/evidencia-seguridad-2026-07-16/zap:/zap/wrk" \
  zaproxy/zap-stable zap-baseline.py \
  -t https://vivia.aleosh.online/api/ \
  -r zap-baseline-vivia.html -J zap-baseline-vivia.json -x zap-baseline-vivia.xml
```
- [ ] Correr, capturar consola con progreso del spider → `06-zap-baseline-vivia.png`.
- [ ] Abrir `docs/evidencia-seguridad-2026-07-16/zap/zap-baseline-vivia.html`, capturar árbol de alertas → `06b-zap-baseline-vivia-html.png`.
- [ ] Rellenar fila 6 de la Bitácora (dejar explícito que es sin auth, cubre solo rutas públicas).

### Fila 7 — ZAP api-scan autenticado contra `vivia-app` (plan de Automation Framework custom)

1. Crear `docs/evidencia-seguridad-2026-07-16/zap/zap-api-vivia-plan.yaml`:
   ```yaml
   env:
     contexts:
       - name: vivia-app
         urls:
           - "https://vivia.aleosh.online/api/.*"
         excludePaths:
           - "https://vivia.aleosh.online/api/anomaly/.*"
           - "https://vivia.aleosh.online/api/clustering/.*"
           - "https://vivia.aleosh.online/api/llm/.*"
           - "https://vivia.aleosh.online/api/maps/.*"
     parameters:
       failOnError: false
       progressToStdout: true
   jobs:
     - type: openapi
       parameters:
         apiUrl: "https://vivia.aleosh.online/api/v3/api-docs"
         targetUrl: "https://vivia.aleosh.online/api/"
         context: vivia-app
     - type: replacer
       parameters: {}
       rules:
         - description: "Inyecta JWT de prueba"
           url: ""
           matchType: REQ_HEADER
           matchString: Authorization
           matchRegex: false
           replacementString: "Bearer <TOKEN>"
     - type: passiveScan-config
       parameters:
         maxAlertsPerRule: 10
     - type: activeScan
       parameters:
         context: vivia-app
         maxRuleDurationInMins: 3
         maxScanDurationInMins: 20
     - type: passiveScan-wait
       parameters:
         maxDuration: 5
     - type: report
       parameters:
         template: traditional-html
         reportDir: /zap/wrk/
         reportFile: zap-api-vivia.html
         reportTitle: "ZAP API Scan - vivia-app (autenticado)"
     - type: report
       parameters:
         template: traditional-json
         reportDir: /zap/wrk/
         reportFile: zap-api-vivia.json
         reportTitle: "ZAP API Scan - vivia-app (autenticado)"
   ```
2. Reemplazar `<TOKEN>` por el JWT real de la cuenta de prueba (paso 0).
3. Correr (tarda ~20-25 min por el active scan, ejecutar en background):
   ```bash
   docker run --rm -v "$(pwd)/docs/evidencia-seguridad-2026-07-16/zap:/zap/wrk" \
     zaproxy/zap-stable zap.sh -cmd -autorun /zap/wrk/zap-api-vivia-plan.yaml
   ```
- [ ] Correr, capturar → `07-zap-apiscan-vivia.png`.
- [ ] Verificar en el JSON/HTML que se alcanzaron rutas protegidas (no solo `401`) — buscar instancias con rutas tipo `/api/properties/me/...` o `/api/lessees/...`. Si todo dio 401, el token no se inyectó bien o expiró (los JWT de `vivia` duran ~1h, regenerar si hace falta).
- [ ] Rellenar fila 7 de la Bitácora.

### Fila 8 — ZAP contra `anomaly_detector_api` (solo si `/api/anomaly/openapi.json` respondió 200 en el paso 0; si no, usar baseline con `-t https://vivia.aleosh.online/api/anomaly/`)

Mismo patrón de plan YAML que la fila 7, ajustando `apiUrl`/`targetUrl` a `https://vivia.aleosh.online/api/anomaly/openapi.json` / `.../api/anomaly/`, contexto `vivia-ai-anomaly` con `urls: ["https://vivia.aleosh.online/api/anomaly/.*"]`, y `reportFile: zap-api-anomaly.html/json`.
- [ ] Crear plan, correr, capturar → `08-zap-anomaly.png`.
- [ ] Rellenar fila 8 de la Bitácora.

### Fila 9 — ZAP contra `llm_local_service` (mismo patrón, ajustar a `/api/llm/openapi.json` / `/api/llm/`)

Igual que la fila 8, con contexto `vivia-ai-llm`, `urls: ["https://vivia.aleosh.online/api/llm/.*"]`, `reportFile: zap-api-llm.html/json`.
- [ ] Crear plan, correr, capturar → `09-zap-llm.png`.
- [ ] Rellenar fila 9 de la Bitácora.

### Fila 10 — ZAP full-scan (opcional, solo si 6-9 no mostraron señales de fragilidad del servidor)
```bash
docker run --rm -v "$(pwd)/docs/evidencia-seguridad-2026-07-16/zap:/zap/wrk" \
  zaproxy/zap-stable zap-full-scan.py \
  -t https://vivia.aleosh.online/api/ \
  -r zap-full-vivia.html -J zap-full-vivia.json -x zap-full-vivia.xml \
  -m 5 -T 30
```
- [ ] Confirmar con el equipo antes de correr (es el más agresivo).
- [ ] Correr, capturar → `10-zap-fullscan.png`.
- [ ] Rellenar fila 10 de la Bitácora.

---

## Fase 5 — Cierre

- [ ] Revisar que las 10 filas de la Bitácora en `REPORTE_SEGURIDAD_2026-07-16.md` tengan comando, resultado y ruta de captura.
- [ ] Pasar los hallazgos de `bearer/*.json`, `nuclei/*.jsonl`, `zap/*.json` a la tabla "Reporte de Hallazgos" (mapeo de severidad ya documentado en el reporte).
- [ ] Completar "Plan de Mitigación" para cada hallazgo Alta/Media.
- [ ] `git status` para revisar qué se va a agregar, luego `git add docs/evidencia-seguridad-2026-07-16/ docs/REPORTE_SEGURIDAD_2026-07-16.md docs/CHECKLIST_EJECUCION_SEGURIDAD_2026-07-16.md` (commit solo cuando tú lo indiques).
