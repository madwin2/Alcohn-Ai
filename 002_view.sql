-- 002_view.sql

CREATE OR REPLACE VIEW material_remanente AS
SELECT  mp.id              AS material_id,
        mp.medida,
        mp.largo_actual
        - COALESCE(SUM(mm.largo_usado) FILTER (WHERE mm.estado IN ('RESERVED','USED')), 0)
          AS largo_disponible
FROM    material_piece mp
LEFT JOIN material_movement mm
       ON mm.material_id = mp.id
GROUP BY mp.id;
