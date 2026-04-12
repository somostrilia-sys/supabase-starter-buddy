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

    if (action === "import-faixas-fipe") {
      // Limpar e recriar tabela
      await sql`DROP TABLE IF EXISTS faixas_fipe CASCADE`;
      await sql`
        CREATE TABLE faixas_fipe (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          regional_id UUID REFERENCES regionais(id),
          fipe_min DECIMAL(12,2) DEFAULT 0,
          fipe_max DECIMAL(12,2) DEFAULT 0,
          taxa_administrativa DECIMAL(10,2) DEFAULT 0,
          rateio DECIMAL(10,2) DEFAULT 0,
          cota_fator DECIMAL(6,2) DEFAULT 1,
          tipo_veiculo TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `;
      let inserted = 0;
      if (Array.isArray(data)) {
        for (const r of data) {
          await sql`INSERT INTO faixas_fipe (regional_id, fipe_min, fipe_max, taxa_administrativa, rateio, cota_fator, tipo_veiculo)
            VALUES (${r.regional_id}, ${r.fipe_min}, ${r.fipe_max}, ${r.taxa_administrativa}, ${r.rateio}, ${r.cota_fator}, ${r.tipo_veiculo})`;
          inserted++;
        }
      }
      // Atualizar taxa_administrativa na tabela_precos
      await sql`
        UPDATE tabela_precos tp SET taxa_administrativa = ff.taxa_administrativa
        FROM faixas_fipe ff
        WHERE tp.regional_id = ff.regional_id
        AND tp.valor_menor >= ff.fipe_min AND tp.valor_maior <= ff.fipe_max
        AND (
          (ff.tipo_veiculo = 'AUTOMOVEL' AND tp.tipo_veiculo = 'Carros e Utilitários Pequenos')
          OR (ff.tipo_veiculo = 'MOTOCICLETA' AND tp.tipo_veiculo = 'Motos')
          OR (ff.tipo_veiculo = 'PESADOS' AND tp.tipo_veiculo = 'Pesados e Vans' AND tp.plano_normalizado LIKE '%pesado%')
          OR (ff.tipo_veiculo = 'VANS E PESADOS P.P' AND tp.tipo_veiculo = 'Pesados e Vans' AND tp.plano_normalizado LIKE '%van%')
          OR (ff.tipo_veiculo = 'UTILITARIOS' AND tp.tipo_veiculo = 'Carros e Utilitários Pequenos')
        )
      `;
      // Enable RLS policies
      await sql`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faixas_fipe' AND policyname = 'auth_select_faixas_fipe') THEN
            ALTER TABLE faixas_fipe ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "auth_select_faixas_fipe" ON public.faixas_fipe FOR SELECT TO authenticated USING (true);
            CREATE POLICY "anon_select_faixas_fipe" ON public.faixas_fipe FOR SELECT TO anon USING (true);
          END IF;
        END $$
      `;
      const count = await sql`SELECT COUNT(*) as c FROM faixas_fipe`;
      await sql.end();
      return new Response(JSON.stringify({ status: "ok", inserted, total: count[0].c }), {
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

    if (action === "restore-veiculo-produtos") {
      // Restaurar produtos + ajuste para veículos a partir de dados do relatório SGA
      // data = array de { placa, valor (mensalidade do relatório), codigos (codigo_sga) }
      if (!Array.isArray(data) || data.length === 0) {
        await sql.end();
        return new Response(JSON.stringify({ error: "data deve ser array de {placa, valor, codigos}" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      // Adicionar colunas de ajuste na tabela veiculos (idempotente)
      await sql`ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ajuste_avulso_valor DECIMAL(10,2) DEFAULT 0`;
      await sql`ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ajuste_avulso_desc TEXT`;

      // Limpar tabela de vínculos (apenas no primeiro lote)
      const { clear } = body;
      if (clear) {
        await sql`DELETE FROM veiculo_produtos`;
        await sql`UPDATE veiculos SET ajuste_avulso_valor = 0, ajuste_avulso_desc = NULL`;
      }

      let totalInserido = 0;
      let placasNaoEncontradas = 0;
      let ajustesAplicados = 0;
      let erros: string[] = [];

      for (const item of data) {
        const { placa, valor, codigos } = item;
        if (!placa || !codigos || codigos.length === 0) continue;

        // Buscar veículo + dados para cálculo de taxa/rateio
        const veic = await sql`
          SELECT v.id, v.valor_fipe, v.modelo, a.regional_id, a.endereco_cidade, a.endereco_uf
          FROM veiculos v
          LEFT JOIN associados a ON a.id = v.associado_id
          WHERE REPLACE(v.placa, '-', '') = ${placa.replace(/-/g, '')}
          LIMIT 1
        `;
        if (veic.length === 0) { placasNaoEncontradas++; continue; }
        const v = veic[0];

        // Buscar produto_ids pelos codigo_sga
        const codigosStr = codigos.map((c: number) => String(c));
        const prods = await sql`SELECT id, codigo_sga, valor FROM produtos_gia WHERE codigo_sga = ANY(${codigosStr})`;
        if (prods.length === 0) continue;

        // Inserir vínculos
        for (const p of prods) {
          try {
            await sql`INSERT INTO veiculo_produtos (veiculo_id, produto_id, tipo) VALUES (${v.id}, ${p.id}, 'principal') ON CONFLICT DO NOTHING`;
            totalInserido++;
          } catch (e) {
            erros.push(`${placa}/${p.codigo_sga}: ${e.message}`);
          }
        }

        // Calcular subtotal produtos
        const subtotalProd = prods.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0);

        // Resolver regional (cidade → municipios → regional_cidades, fallback: regional_id)
        let regId = v.regional_id;
        if (v.endereco_cidade && v.estado && !regId) {
          const mun = await sql`SELECT id FROM municipios WHERE uf = ${v.estado} AND LOWER(nome) = LOWER(${v.endereco_cidade}) LIMIT 1`;
          if (mun.length > 0) {
            const rc = await sql`SELECT regional_id FROM regional_cidades WHERE municipio_id = ${mun[0].id} LIMIT 1`;
            if (rc.length > 0) regId = rc[0].regional_id;
          }
        }

        // Buscar taxa + rateio da faixa FIPE
        let taxa = 0, rateio = 0;
        if (regId && v.valor_fipe > 0) {
          const modelo = (v.modelo || "").toLowerCase();
          let tipoSga = "AUTOMOVEL";
          if (/moto|cg |cb |honda cg/i.test(modelo)) tipoSga = "MOTOCICLETA";
          else if (/scania|volvo fh|iveco|cargo|constellation/i.test(modelo)) tipoSga = "PESADOS";
          else if (/sprinter|daily|ducato|master/i.test(modelo)) tipoSga = "VANS E PESADOS P.P";
          else if (/fiorino|kangoo|doblo|strada|saveiro/i.test(modelo)) tipoSga = "UTILITARIOS";

          const faixa = await sql`
            SELECT taxa_administrativa, rateio FROM faixas_fipe
            WHERE regional_id = ${regId} AND tipo_veiculo = ${tipoSga}
              AND fipe_min <= ${v.valor_fipe} AND fipe_max >= ${v.valor_fipe}
            LIMIT 1
          `;
          if (faixa.length > 0) {
            taxa = Number(faixa[0].taxa_administrativa) || 0;
            rateio = Number(faixa[0].rateio) || 0;
          }
        }

        // Calcular ajuste = valor_relatorio - (subtotal + taxa + rateio)
        const calculado = subtotalProd + taxa + rateio;
        const valorRelatorio = Number(valor) || 0;
        const ajuste = Math.round((valorRelatorio - calculado) * 100) / 100;

        if (Math.abs(ajuste) >= 0.01) {
          await sql`UPDATE veiculos SET ajuste_avulso_valor = ${ajuste}, ajuste_avulso_desc = ${"Ajuste SGA (relatório)"} WHERE id = ${v.id}`;
          ajustesAplicados++;
        }
      }

      const stats = await sql`
        SELECT
          (SELECT COUNT(DISTINCT veiculo_id) FROM veiculo_produtos) as veiculos_com_produtos,
          (SELECT COUNT(*) FROM veiculo_produtos) as total_registros,
          (SELECT COUNT(*) FROM veiculos WHERE ajuste_avulso_valor != 0) as veiculos_com_ajuste
      `;
      await sql.end();
      return new Response(JSON.stringify({
        status: "ok",
        total_inserido: totalInserido,
        placas_nao_encontradas: placasNaoEncontradas,
        ajustes_aplicados: ajustesAplicados,
        erros_sample: erros.slice(0, 20),
        stats: stats[0],
      }), { headers: { "Content-Type": "application/json" } });
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
