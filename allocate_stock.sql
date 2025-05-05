-- allocate_stock.sql

CREATE OR REPLACE FUNCTION allocate_stock(
    p_material_measure int,
    p_largo_needed     numeric,
    p_programa_id      text,
    p_pedido_id        bigint
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_piece_id int;
BEGIN
    /* 1. Busca la planchuela mínima que alcance */
    SELECT mp.id
      INTO v_piece_id
      FROM material_remanente mr
      JOIN material_piece mp ON mp.id = mr.material_id
     WHERE mr.medida           = p_material_measure
       AND mr.largo_disponible >= p_largo_needed
     ORDER BY mr.largo_disponible  -- first‑fit (menor sobrante)
     LIMIT 1
     FOR UPDATE;                   -- lock anti‑carrera

    /* 2. Si no hay stock, aborta */
    IF v_piece_id IS NULL THEN
        RETURN FALSE;
    END IF;

    /* 3. Reserva */
    INSERT INTO material_movement(material_id, programa_id, pedido_id,
                                  largo_usado, estado, fecha)
    VALUES (v_piece_id, p_programa_id, p_pedido_id,
            p_largo_needed, 'RESERVED', current_date);

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION allocate_stock(int, numeric, text, bigint) FROM PUBLIC;
