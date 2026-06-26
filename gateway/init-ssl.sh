#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# init-ssl.sh — Obtención inicial del certificado SSL de Let's Encrypt
#
# Ejecutar UNA SOLA VEZ en el servidor antes del primer despliegue con HTTPS.
# Requisitos:
#   - El dominio vivia.aleosh.online debe apuntar a la IP de este servidor
#   - El puerto 80 debe estar libre (detener nginx si está corriendo)
#   - Docker instalado
# ─────────────────────────────────────────────────────────────────────────────
set -e

DOMAIN="vivia.aleosh.online"
EMAIL="spartanthealexvro@gmail.com"

echo "=== Inicialización SSL para $DOMAIN ==="
echo ""

# 1. Detener nginx si está corriendo para liberar el puerto 80
echo "[1/3] Deteniendo nginx (si está corriendo)..."
docker stop vivia-nginx 2>/dev/null && docker rm vivia-nginx 2>/dev/null || true

# 2. Solicitar certificado en modo standalone
#    Certbot levanta un servidor HTTP temporal en el puerto 80
#    Los volúmenes usan el mismo nombre que define docker-compose.gateway.yml
echo "[2/3] Solicitando certificado a Let's Encrypt..."
docker run --rm \
  -p 80:80 \
  -v certbot-etc:/etc/letsencrypt \
  -v certbot-www:/var/www/certbot \
  certbot/certbot certonly \
    --standalone \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email

echo ""
echo "[3/3] Certificado generado correctamente."
echo ""
echo "Próximo paso — levantar el gateway completo (nginx + certbot):"
echo ""
echo "  cd ~/vps/gateway"
echo "  docker compose -f docker-compose.gateway.yml up -d"
echo ""
echo "A partir de ahora el workflow de GitHub Actions se encarga de todo."
