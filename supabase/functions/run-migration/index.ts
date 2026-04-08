import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

Deno.serve(async (req) => {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not set" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const { action, data } = body;

  const sql = postgres(dbUrl);

  try {
    if (action === "prepare") {
      // Adicionar campo mensalidade + limpar dados antigos
      await sql`ALTER TABLE tabela_precos ADD COLUMN IF NOT EXISTS mensalidade DECIMAL(10,2) DEFAULT 0`;
      await sql`DELETE FROM tabela_precos`;
      const count = await sql`SELECT COUNT(*) as c FROM tabela_precos`;
      await sql.end();
      return new Response(JSON.stringify({ status: "prepared", count: count[0].c }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "insert" && Array.isArray(data)) {
      // Inserir lote de registros
      let inserted = 0;
      for (const row of data) {
        await sql`INSERT INTO tabela_precos (
          tabela_id, plano, regional,
          valor_menor, valor_maior, mensalidade, cota,
          taxa_administrativa, adesao, rastreador, instalacao,
          tipo_franquia, valor_franquia, tipo_veiculo,
          plano_normalizado, regional_normalizado
        ) VALUES (
          ${row.tabela_id}, ${row.plano}, ${row.regional},
          ${row.valor_menor}, ${row.valor_maior}, ${row.mensalidade}, ${row.mensalidade},
          0, ${row.adesao}, ${row.rastreador}, ${row.instalacao},
          ${row.tipo_franquia}, ${row.valor_franquia}, ${row.tipo_veiculo},
          ${row.plano_normalizado}, ${row.regional_normalizado}
        )`;
        inserted++;
      }
      await sql.end();
      return new Response(JSON.stringify({ status: "ok", inserted }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "finalize") {
      // Limpar cache e verificar
      await sql`UPDATE negociacoes SET cache_precos = NULL, cache_fipe = NULL WHERE stage NOT IN ('concluido', 'perdido')`;
      const stats = await sql`
        SELECT COUNT(*) as total,
          MIN(mensalidade) as min_mensal,
          MAX(mensalidade) as max_mensal,
          COUNT(DISTINCT regional) as regionais,
          COUNT(DISTINCT plano) as planos
        FROM tabela_precos
      `;
      await sql.end();
      return new Response(JSON.stringify({ status: "finalized", stats: stats[0] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "fix-regional-ids") {
      // Popular regional_id com matching flexível
      const updates = [
        { norm: 'alagoas', nome: 'REGIONAL ALAGOAS' },
        { norm: 'bahia', nome: 'REGIONAL BAHIA' },
        { norm: 'ceara', nome: 'REGIONAL CEARÁ' },
        { norm: 'espirito santo', nome: 'Regional Espírito Santo' },
        { norm: 'interior sao paulo', nome: 'Regional Interior São Paulo' },
        { norm: 'mato grosso sul', nome: 'REGIONAL MATO GROSSO SUL' },
        { norm: 'minas (interior)', nome: 'REGIONAL MINAS (INTERIOR)' },
        { norm: 'natal', nome: 'REGIONAL NATAL' },
        { norm: 'norte minas sul', nome: 'Regional Norte/Minas/Sul' },
        { norm: 'palmas', nome: 'Regional Palmas' },
        { norm: 'parana', nome: 'REGIONAL PARANÁ' },
        { norm: 'rio grande do sul', nome: 'REGIONAL RIO GRANDE DO SUL' },
        { norm: 'sao paulo', nome: 'Regional Sao Paulo' },
      ];
      const results: string[] = [];
      for (const u of updates) {
        const reg = await sql`SELECT id FROM regionais WHERE nome = ${u.nome} LIMIT 1`;
        if (reg.length > 0) {
          await sql`UPDATE tabela_precos SET regional_id = ${reg[0].id} WHERE regional_normalizado = ${u.norm}`;
          results.push(`${u.norm} → ${reg[0].id.substring(0,8)}`);
        } else {
          results.push(`${u.norm} → NOT FOUND in regionais`);
        }
      }
      // Fix remaining nulls with fuzzy match
      await sql`
        UPDATE tabela_precos tp SET regional_id = r.id
        FROM regionais r
        WHERE tp.regional_id IS NULL
        AND LOWER(r.nome) LIKE '%' || tp.regional_normalizado || '%'
      `;
      const nullCount = await sql`SELECT COUNT(*) as c FROM tabela_precos WHERE regional_id IS NULL`;
      await sql.end();
      return new Response(JSON.stringify({ status: "ok", results, nulls: nullCount[0].c }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "drop-trigger") {
      // Listar e remover triggers na tabela negociacoes
      const triggers = await sql`
        SELECT tgname FROM pg_trigger
        WHERE tgrelid = 'public.negociacoes'::regclass AND NOT tgisinternal
      `;
      const dropped: string[] = [];
      for (const t of triggers) {
        await sql.unsafe(`DROP TRIGGER IF EXISTS "${t.tgname}" ON public.negociacoes`);
        dropped.push(t.tgname);
      }
      await sql.end();
      return new Response(JSON.stringify({ status: "ok", dropped }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      const stats = await sql`
        SELECT regional, plano, COUNT(*) as faixas, MIN(mensalidade) as min_mensal, MAX(mensalidade) as max_mensal
        FROM tabela_precos GROUP BY regional, plano ORDER BY regional, plano
      `;
      await sql.end();
      return new Response(JSON.stringify({ stats }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await sql.end();
    return new Response(JSON.stringify({ error: "action required: prepare|insert|finalize|check" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    try { await sql.end(); } catch(_) {}
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
