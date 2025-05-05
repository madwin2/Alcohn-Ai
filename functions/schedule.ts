import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let txId;
  try {
    // Iniciar transacción
    const { data: txBegin, error: txError } = await supabaseAdmin.rpc("pg_temp.begin");
    if (txError) throw txError;
    txId = txBegin;

    const body = await req.json().catch(() => ({}));
    const programasFilter = body.programas || null;

    // Fetch pedidos pendientes
    const { data: pedidos, error: errorPedidos } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .is("asignado", null)
      .eq("pedido_bloqueado", false);
    if (errorPedidos) throw errorPedidos;

    // Fetch programas abiertos
    let programasQuery = supabaseAdmin
      .from("programas")
      .select("*")
      .eq("estado", "Sin Hacer");
    if (programasFilter) {
      programasQuery = programasQuery.in("id", programasFilter);
    }
    const { data: programas, error: errorProgramas } = await programasQuery;
    if (errorProgramas) throw errorProgramas;

    // Fetch stock
    const { data: stock, error: errorStock } = await supabaseAdmin
      .from("material_remanente")
      .select("*");
    if (errorStock) throw errorStock;

    // Score & sort
    const score = (p: any) => {
      const prioridad = p.prioridad ? 1000 : 0;
      const rehacer = p.rehacer ? 500 : 0;
      const antiguedad = Date.now() - Date.parse(p.fecha);
      return prioridad + rehacer + antiguedad / 8.64e7;
    };
    pedidos.sort((a: any, b: any) => score(b) - score(a));

    // First-fit
    const warnings: any[] = [];
    const updatesPedidos: { id: any; asignado: any }[] = [];
    const updatesProgramas: { id: any; tiempo_programa: any }[] = [];
    const programasById: Record<string, any> = Object.fromEntries(programas.map((pr: any) => [pr.id, { ...pr, tiempo_total: pr.tiempo_programa || 0 }]));

    for (const pedido of pedidos) {
      let asignado = false;
      for (const pr of programas.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())) {
        const tiempoDisponible = (programasById[pr.id].tiempo_total || 0) + (pedido.tiempo_estimado || 0) <= 400;
        if (!tiempoDisponible) continue;
        // Llama allocate_stock
        const { data: ok, error: errorAlloc } = await supabaseAdmin.rpc("allocate_stock", {
          p_material_measure: pedido.medida_real,
          p_largo_needed: pedido.largo_utilizado,
          p_programa_id: pr.id,
          p_pedido_id: pedido.id,
        });
        if (errorAlloc) continue;
        if (ok) {
          // Actualizar en memoria
          programasById[pr.id].tiempo_total += pedido.tiempo_estimado || 0;
          updatesPedidos.push({ id: pedido.id, asignado: pr.id });
          updatesProgramas.push({ id: pr.id, tiempo_programa: programasById[pr.id].tiempo_total });
          asignado = true;
          break;
        }
      }
      if (!asignado) warnings.push(pedido.id);
    }

    // Actualizar en batch
    await Promise.all([
      ...updatesPedidos.map((p) =>
        supabaseAdmin.from("pedidos").update({ asignado: p.asignado }).eq("id", p.id)
      ),
      ...updatesProgramas.map((pr) =>
        supabaseAdmin.from("programas").update({ tiempo_programa: pr.tiempo_programa }).eq("id", pr.id)
      ),
    ]);

    // Commit
    await supabaseAdmin.rpc("pg_temp.commit");

    return new Response(
      JSON.stringify({ ok: true, updatedPrograms: updatesProgramas, warnings }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    if (txId) await supabaseAdmin.rpc("pg_temp.rollback");
    return new Response(
      JSON.stringify({ error: err.message || err.toString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
