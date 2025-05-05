// migrate_stock.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function run() {
  try {
    // Leer todas las filas de stock_materiales
    const { data: materiales, error } = await supabase
      .from('stock_materiales')
      .select('medida, largo');

    if (error) throw error;

    if (!materiales || materiales.length === 0) {
      console.log('No se encontraron filas en stock_materiales.');
      return;
    }

    // Insertar en material_piece
    let insertCount = 0;
    for (const mat of materiales) {
      const { error: insertError } = await supabase
        .from('material_piece')
        .insert({
          medida: Number(mat.medida),
          largo_actual: Number(mat.largo)
        });
      if (insertError) {
        console.error('Error insertando material:', mat, insertError.message);
      } else {
        insertCount++;
      }
    }

    console.log(`Migración completada. Se crearon ${insertCount} piezas en material_piece.`);
  } catch (err) {
    console.error('Error en la migración:', err.message);
    process.exit(1);
  }
}

// Si se ejecuta directamente, correr la migración
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
