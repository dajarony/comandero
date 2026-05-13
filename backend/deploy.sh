#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Deploy Comandero Backend a Google Cloud Run
# ═══════════════════════════════════════════════════════════
#
# Prerequisitos:
#   1. gcloud CLI instalado y autenticado (gcloud auth login)
#   2. Proyecto de GCP creado con Cloud Run API habilitada
#   3. Container Registry o Artifact Registry habilitado
#
# Uso:
#   ./deploy.sh <PROJECT_ID>
#
# Las variables sensibles se pasan como substituciones de Cloud Build.
# En produccion, configuralas en la consola de Cloud Run o usa
# Secret Manager para mayor seguridad.
# ═══════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ID=${1:?"Error: falta PROJECT_ID. Uso: ./deploy.sh <PROJECT_ID>"}

echo "══════════════════════════════════════════════"
echo " Desplegando Comandero Backend"
echo " Proyecto: $PROJECT_ID"
echo " Region:   europe-west1"
echo "══════════════════════════════════════════════"

# Verificar que gcloud esta autenticado
if ! gcloud auth print-identity-token &>/dev/null; then
    echo "Error: No estas autenticado en gcloud. Ejecuta: gcloud auth login"
    exit 1
fi

# Configurar proyecto
gcloud config set project "$PROJECT_ID"

# Habilitar APIs necesarias
echo "Habilitando APIs necesarias..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Ejecutar Cloud Build
echo "Iniciando build y deploy..."
gcloud builds submit --config cloudbuild.yaml \
    --project="$PROJECT_ID" \
    --substitutions=_DATABASE_URL="tu_database_url",_JWT_SECRET="tu_jwt_secret",_ANTHROPIC_API_KEY="tu_api_key"

echo ""
echo "══════════════════════════════════════════════"
echo " Deploy completado!"
echo " IMPORTANTE: Actualiza las variables de entorno"
echo " reales en la consola de Cloud Run o re-ejecuta"
echo " con los valores correctos en --substitutions"
echo "══════════════════════════════════════════════"
