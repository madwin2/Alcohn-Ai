-- 001_material.sql

-- 1. Tabla material_piece
CREATE TABLE IF NOT EXISTS material_piece (
    id serial PRIMARY KEY,
    medida int NOT NULL,                -- Ø planchuela (12, 19, 25, 38 mm, etc.)
    largo_actual numeric NOT NULL,      -- largo físico inicial en mm
    nombre text,                       -- opcional, por si queremos etiqueta
    UNIQUE(medida, largo_actual)
);

-- 2. Tabla material_movement
CREATE TABLE IF NOT EXISTS material_movement (
    id serial PRIMARY KEY,
    material_id int NOT NULL REFERENCES material_piece(id) ON DELETE CASCADE,
    programa_id text REFERENCES programas(id),      -- puede ser NULL
    pedido_id bigint REFERENCES pedidos(id),        -- puede ser NULL
    fecha date DEFAULT current_date,
    largo_usado numeric NOT NULL,
    estado text NOT NULL CHECK (estado IN ('RESERVED','USED'))
);

-- 3. Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_material_movement_material_estado ON material_movement(material_id, estado);
CREATE INDEX IF NOT EXISTS idx_material_movement_programa_id ON material_movement(programa_id);
