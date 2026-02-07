#!/bin/bash

# =========================================
# Script de Verificación de Migraciones
# =========================================
# Verifica que las migraciones estén correctamente configuradas
# y muestra el estado actual del sistema

set -e

echo ""
echo "========================================"
echo "🔍 VERIFICACIÓN DE MIGRACIONES"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar archivos de migraciones
echo -e "${BLUE}📂 ARCHIVOS DE MIGRACIONES:${NC}"
echo ""

MIGRATIONS_DIR="src/database/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    COUNT=$(ls -1 $MIGRATIONS_DIR/*.ts 2>/dev/null | wc -l)
    echo -e "  ✅ Carpeta de migraciones: ${GREEN}OK${NC}"
    echo -e "  📊 Archivos encontrados: ${GREEN}$COUNT${NC}"
    echo ""
    ls -1 $MIGRATIONS_DIR/*.ts | while read file; do
        filename=$(basename "$file")
        size=$(du -h "$file" | cut -f1)
        echo "     • $filename ($size)"
    done
else
    echo -e "  ${RED}❌ Carpeta de migraciones no encontrada${NC}"
    exit 1
fi

echo ""
echo "========================================"

# 2. Verificar contenedor Docker
echo -e "${BLUE}🐳 CONTENEDOR DOCKER:${NC}"
echo ""

if docker compose ps mysql | grep -q "Up"; then
    echo -e "  ✅ MySQL: ${GREEN}Corriendo${NC}"
else
    echo -e "  ${RED}❌ MySQL no está corriendo${NC}"
    echo -e "     Ejecuta: ${YELLOW}docker compose up -d${NC}"
    exit 1
fi

echo ""
echo "========================================"

# 3. Verificar tabla migrations en BD
echo -e "${BLUE}💾 MIGRACIONES EN BASE DE DATOS:${NC}"
echo ""

DB_USER=${DB_USERNAME:-socger}
DB_PASS=${DB_PASSWORD:-dcb4f2e8106a0ef44c3f530d3ae3f9fd}
DB_NAME=${DB_DATABASE:-cuidamet}

MIGRATIONS_COUNT=$(docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -sNe "SELECT COUNT(*) FROM migrations" 2>/dev/null || echo "0")

if [ "$MIGRATIONS_COUNT" -gt 0 ]; then
    echo -e "  ✅ Migraciones ejecutadas: ${GREEN}$MIGRATIONS_COUNT${NC}"
    echo ""
    echo "  🔄 Historial:"
    docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT timestamp, name FROM migrations ORDER BY timestamp" 2>/dev/null | tail -n +2
else
    echo -e "  ${YELLOW}⚠️  No hay migraciones ejecutadas${NC}"
    echo -e "     Ejecuta: ${YELLOW}npm run migration:run${NC}"
fi

echo ""
echo "========================================"

# 4. Verificar estructura de users
echo -e "${BLUE}👤 ESTRUCTURA DE TABLA USERS:${NC}"
echo ""

USERS_TABLE=$(docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -sNe "SHOW TABLES LIKE 'users'" 2>/dev/null || echo "")

if [ -n "$USERS_TABLE" ]; then
    echo -e "  ✅ Tabla users: ${GREEN}Existe${NC}"
    echo ""
    
    # Verificar campos clave
    HAS_PHONE=$(docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -sNe "SHOW COLUMNS FROM users LIKE 'phone'" 2>/dev/null || echo "")
    HAS_LOCATION=$(docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -sNe "SHOW COLUMNS FROM users LIKE 'location'" 2>/dev/null || echo "")
    HAS_IS_PREMIUM=$(docker compose exec -T mysql mysql -u $DB_USER -p$DB_PASS $DB_NAME -sNe "SHOW COLUMNS FROM users LIKE 'is_premium'" 2>/dev/null || echo "")
    
    if [ -n "$HAS_PHONE" ] && [ -n "$HAS_LOCATION" ] && [ -n "$HAS_IS_PREMIUM" ]; then
        echo -e "  ✅ Campos de perfil migrados: ${GREEN}OK${NC}"
        echo "     • phone ✓"
        echo "     • location ✓"
        echo "     • is_premium ✓"
    else
        echo -e "  ${YELLOW}⚠️  Algunos campos de perfil faltan${NC}"
        [ -z "$HAS_PHONE" ] && echo "     • phone ✗"
        [ -z "$HAS_LOCATION" ] && echo "     • location ✗"
        [ -z "$HAS_IS_PREMIUM" ] && echo "     • is_premium ✗"
    fi
else
    echo -e "  ${RED}❌ Tabla users no existe${NC}"
    echo -e "     Ejecuta: ${YELLOW}npm run migration:run${NC}"
fi

echo ""
echo "========================================"

# 5. Resumen
echo -e "${BLUE}📋 RESUMEN:${NC}"
echo ""

ALL_OK=true

# Verificaciones
[ "$COUNT" -eq 5 ] && echo -e "  ✅ 5 archivos de migraciones" || { echo -e "  ${RED}❌ Faltan archivos de migraciones${NC}"; ALL_OK=false; }
docker compose ps mysql | grep -q "Up" && echo -e "  ✅ Docker MySQL corriendo" || { echo -e "  ${RED}❌ Docker MySQL no está corriendo${NC}"; ALL_OK=false; }
[ "$MIGRATIONS_COUNT" -ge 5 ] && echo -e "  ✅ Migraciones ejecutadas en BD" || { echo -e "  ${YELLOW}⚠️  Migraciones pendientes de ejecutar${NC}"; ALL_OK=false; }

echo ""

if $ALL_OK; then
    echo -e "${GREEN}✅ TODO CORRECTO - Sistema listo${NC}"
else
    echo -e "${YELLOW}⚠️  ACCIÓN REQUERIDA - Ver detalles arriba${NC}"
fi

echo ""
echo "========================================"
echo ""
echo "📚 Documentación: MIGRACIONES-INFO.md"
echo ""
