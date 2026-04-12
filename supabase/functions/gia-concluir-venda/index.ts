/**
 * gia-concluir-venda
 * Quando uma negociação é concluída na pipeline de vendas:
 * 1. Cria ou atualiza o associado na gestão (status: Pendente)
 * 2. Cria ou atualiza o veículo vinculado (status: Pendente)
 * 3. Vincula produtos da regional ao veículo (via produto_regras)
 * 4. Calcula ajuste para bater o valor do plano
 * Tudo fica PENDENTE para alteração manual do setor administrativo.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { negociacao_id } = await req.json();
    if (!negociacao_id) return jsonRes({ sucesso: false, error: "negociacao_id obrigatório" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar negociação completa
    const { data: neg, error: negErr } = await supabase
      .from("negociacoes")
      .select("*")
      .eq("id", negociacao_id)
      .single();

    if (negErr || !neg) {
      return jsonRes({ sucesso: false, error: "Negociação não encontrada" }, 404);
    }

    const cpf = (neg.cpf_cnpj || "").replace(/\D/g, "");
    const placa = (neg.veiculo_placa || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

    if (!cpf) return jsonRes({ sucesso: false, error: "CPF/CNPJ não preenchido na negociação" }, 400);

    // 2. Resolver regional pela cidade de circulação
    let regionalId: string | null = null;
    if (neg.cidade_circulacao && neg.estado_circulacao) {
      const { data: mun } = await supabase
        .from("municipios" as any)
        .select("id")
        .eq("uf", neg.estado_circulacao)
        .ilike("nome", neg.cidade_circulacao)
        .limit(1)
        .maybeSingle();
      if (mun) {
        const { data: rc } = await supabase
          .from("regional_cidades" as any)
          .select("regional_id")
          .eq("municipio_id", (mun as any).id)
          .limit(1)
          .maybeSingle();
        if (rc) regionalId = (rc as any).regional_id;
      }
    }
    // Fallback: buscar regional pelo nome
    if (!regionalId && neg.regional) {
      const { data: reg } = await supabase
        .from("regionais")
        .select("id")
        .ilike("nome", `%${neg.regional}%`)
        .limit(1)
        .maybeSingle();
      if (reg) regionalId = reg.id;
    }

    // Buscar cooperativa
    let cooperativaId: string | null = null;
    if (neg.cooperativa) {
      const { data: coop } = await supabase
        .from("cooperativas")
        .select("id")
        .ilike("nome", `%${neg.cooperativa}%`)
        .limit(1)
        .maybeSingle();
      if (coop) cooperativaId = coop.id;
    }

    // 3. Criar ou atualizar associado
    const { data: existingAssoc } = await supabase
      .from("associados")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();

    let associadoId: string;

    if (existingAssoc) {
      associadoId = existingAssoc.id;
      // Atualizar dados (não sobrescreve campos já preenchidos)
      await supabase.from("associados").update({
        nome: neg.lead_nome || undefined,
        telefone: neg.telefone || undefined,
        email: neg.email || undefined,
        endereco_cidade: neg.cidade_circulacao || undefined,
        endereco_uf: neg.estado_circulacao || undefined,
        regional_id: regionalId || undefined,
        cooperativa_id: cooperativaId || undefined,
        updated_at: new Date().toISOString(),
      }).eq("id", associadoId);
    } else {
      const { data: newAssoc, error: assocErr } = await supabase
        .from("associados")
        .insert({
          nome: neg.lead_nome,
          cpf,
          telefone: neg.telefone || null,
          email: neg.email || null,
          endereco_cidade: neg.cidade_circulacao || null,
          endereco_uf: neg.estado_circulacao || null,
          regional_id: regionalId,
          cooperativa_id: cooperativaId,
          status: "pendente",
          origem: "pipeline",
          negociacao_origem_id: neg.id,
          consultor_responsavel: neg.consultor || null,
          dia_vencimento: neg.dia_vencimento || 10,
        })
        .select("id")
        .single();

      if (assocErr) {
        console.error("[concluir-venda] Erro ao criar associado:", assocErr);
        return jsonRes({ sucesso: false, error: assocErr.message }, 500);
      }
      associadoId = newAssoc.id;
    }

    // 4. Criar ou atualizar veículo
    let veiculoId: string | null = null;
    if (placa) {
      const { data: existingVeic } = await supabase
        .from("veiculos")
        .select("id")
        .eq("placa", placa)
        .maybeSingle();

      // Extrair valor FIPE do cache
      let valorFipe = 0;
      if (neg.cache_fipe) {
        try {
          const fipe = typeof neg.cache_fipe === "string" ? JSON.parse(neg.cache_fipe) : neg.cache_fipe;
          valorFipe = Number(fipe?.valorFipe || fipe?.valor_fipe || fipe?.fipe || 0);
        } catch {}
      }

      if (existingVeic) {
        veiculoId = existingVeic.id;
        await supabase.from("veiculos").update({
          modelo: neg.veiculo_modelo || undefined,
          associado_id: associadoId,
          valor_fipe: valorFipe || undefined,
          chassi: neg.chassi || undefined,
          renavam: neg.renavam || undefined,
          ano: neg.ano_fabricacao || undefined,
          cor: neg.cor || undefined,
          combustivel: neg.combustivel || undefined,
          status: "Pendente",
          updated_at: new Date().toISOString(),
        }).eq("id", veiculoId);
      } else {
        const { data: newVeic, error: veicErr } = await supabase
          .from("veiculos")
          .insert({
            placa,
            modelo: neg.veiculo_modelo || null,
            marca: null,
            associado_id: associadoId,
            valor_fipe: valorFipe || null,
            chassi: neg.chassi || null,
            renavam: neg.renavam || null,
            ano: neg.ano_fabricacao || null,
            cor: neg.cor || null,
            combustivel: neg.combustivel || null,
            status: "Pendente",
            dia_vencimento: neg.dia_vencimento || 10,
          })
          .select("id")
          .single();

        if (veicErr) {
          console.error("[concluir-venda] Erro ao criar veículo:", veicErr);
          return jsonRes({ sucesso: false, error: veicErr.message }, 500);
        }
        veiculoId = newVeic.id;
      }

      // 5. Vincular produtos da regional ao veículo
      if (veiculoId && regionalId) {
        // Buscar produtos da regional
        const { data: regras } = await supabase
          .from("produto_regras" as any)
          .select("produto_id")
          .eq("regional_id", regionalId)
          .eq("ativo", true);

        if (regras && regras.length > 0) {
          // Limpar produtos antigos do veículo
          await supabase.from("veiculo_produtos" as any).delete().eq("veiculo_id", veiculoId);
          // Inserir novos
          const inserts = (regras as any[]).map(r => ({
            veiculo_id: veiculoId,
            produto_id: r.produto_id,
            tipo: "principal",
          }));
          await supabase.from("veiculo_produtos" as any).insert(inserts);
        }
      }

      // 6. Calcular ajuste para bater valor do plano
      if (veiculoId && neg.valor_plano && regionalId) {
        // Buscar subtotal dos produtos vinculados
        const { data: prods } = await supabase
          .from("veiculo_produtos" as any)
          .select("produto_id, produtos_gia(valor)")
          .eq("veiculo_id", veiculoId);
        const subtotalProd = (prods || []).reduce((s: number, p: any) => s + (Number(p.produtos_gia?.valor) || 0), 0);

        // Buscar taxa + rateio
        let taxa = 0, rateio = 0;
        if (valorFipe > 0) {
          const modelo = (neg.veiculo_modelo || "").toLowerCase();
          let tipoSga = "AUTOMOVEL";
          if (/moto|cg |cb |honda cg/i.test(modelo)) tipoSga = "MOTOCICLETA";
          else if (/scania|volvo fh|iveco|cargo|constellation/i.test(modelo)) tipoSga = "PESADOS";
          else if (/sprinter|daily|ducato|master/i.test(modelo)) tipoSga = "VANS E PESADOS P.P";
          else if (/fiorino|kangoo|doblo|strada|saveiro/i.test(modelo)) tipoSga = "UTILITARIOS";

          const { data: faixa } = await supabase
            .from("faixas_fipe" as any)
            .select("taxa_administrativa, rateio")
            .eq("regional_id", regionalId)
            .eq("tipo_veiculo", tipoSga)
            .lte("fipe_min", valorFipe)
            .gte("fipe_max", valorFipe)
            .limit(1)
            .maybeSingle();
          if (faixa) {
            taxa = Number((faixa as any).taxa_administrativa) || 0;
            rateio = Number((faixa as any).rateio) || 0;
          }
        }

        const calculado = subtotalProd + taxa + rateio;
        const valorPlano = Number(neg.valor_plano) || 0;
        const ajuste = Math.round((valorPlano - calculado) * 100) / 100;

        if (Math.abs(ajuste) >= 0.01) {
          await supabase.from("veiculos" as any).update({
            ajuste_avulso_valor: ajuste,
            ajuste_avulso_desc: "Ajuste pipeline (automático)",
          }).eq("id", veiculoId);
        }
      }
    }

    // 7. Marcar negociação como sincronizada
    await supabase.from("negociacoes").update({
      sincronizado_gestao: true,
      sincronizado_gestao_at: new Date().toISOString(),
    }).eq("id", neg.id);

    console.log(`[concluir-venda] Neg ${neg.id}: associado=${associadoId}, veiculo=${veiculoId}`);

    return jsonRes({
      sucesso: true,
      associado_id: associadoId,
      veiculo_id: veiculoId,
      status: "pendente",
      mensagem: "Dados sincronizados para gestão. Status: Pendente (aguardando revisão administrativa).",
    });

  } catch (e: any) {
    console.error("[concluir-venda] error:", e);
    return jsonRes({ sucesso: false, error: e.message }, 500);
  }
});
