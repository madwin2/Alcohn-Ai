-- 003_trigger.sql

-- Función para prevenir stock negativo
CREATE OR REPLACE FUNCTION trg_check_material_stock() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_disponible numeric;
BEGIN
    SELECT largo_disponible
      INTO v_disponible
      FROM material_remanente
     WHERE material_id = NEW.material_id
     FOR UPDATE;      -- previene condición de carrera

    IF v_disponible < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente: material % quedaría en negativo (%.2f mm)', 
                        NEW.material_id, v_disponible;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger para llamar a la función después de insertar o actualizar movimientos
CREATE TRIGGER check_stock_not_negative
AFTER INSERT OR UPDATE OF estado, largo_usado ON material_movement
FOR EACH ROW
WHEN (NEW.estado IN ('RESERVED','USED'))
EXECUTE FUNCTION trg_check_material_stock();
