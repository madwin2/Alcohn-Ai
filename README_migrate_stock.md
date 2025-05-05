# migrate_stock.js

Script para migrar datos de stock_materiales a material_piece en Supabase.

## Requisitos

- Node.js 18+
- Instalar dependencias: `npm install @supabase/supabase-js`
- Definir variables de entorno:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE

## Uso

1. Configura las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE.
2. Ejecuta:

   node migrate_stock.js

El script migrará todos los registros de stock_materiales a material_piece y mostrará cuántas piezas se crearon.
