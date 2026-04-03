/**
 * gia-auto-cotacao
 * Quando cidade_circulacao é preenchida em negociação com placa:
 * 1. Consulta FIPE pela placa via BrasilAPI
 * 2. Calcula cotação usando mesma lógica de gia-cotacao
 * 3. Insere em cotacoes vinculada à negociação
 * 4. Avança stage: novo_lead → em_contato
 * 5. Registra transição em pipeline_transicoes
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Percentual mensal sobre valor FIPE (mesmo do gia-cotacao)
const FIPE_PCT: Record<string, number> = {
  basico: 0.015,
  intermediario: 0.020,
  premium: 0.025,
  frota: 0.012,
  objetivo: 0.018,
  "objetivo (leves)": 0.018,
  completo: 0.022,
  pesados: 0.030,
};

const VALOR_ADESAO = 99.90;

function coberturaPorPlano(plano: string) {
  return {
    colisao: plano !== "basico",
    furto_roubo: true,
    incendio: true,
    assistencia_24h: true,
    carro_reserva: plano === "premium" || plano === "frota",
    vidros: plano !== "basico",
    guincho_ilimitado: plano === "premium" || plano === "frota",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { negociacao_id } = body;

    if (!negociacao_id) {
      return jsonRes({ success: false, error: "negociacao_id é obrigatório" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar negociação
    const { data: neg, error: negErr } = await supabase
      .from("negociacoes")
      .select("*")
      .eq("id", negociacao_id)
      .single();

    if (negErr || !neg) {
      return jsonRes({ success: false, error: "Negociação não encontrada" }, 404);
    }

    if (!neg.veiculo_placa) {
      return jsonRes({ success: false, error: "Negociação sem placa de veículo" }, 400);
    }

    if (!neg.cidade_circulacao) {
      return jsonRes({ success: false, error: "Cidade de circulação ainda não preenchida" }, 400);
    }

    if (neg.auto_cotacao_gerada) {
      return jsonRes({ success: false, error: "Auto-cotação já foi gerada" }, 409);
    }

    // 2. Buscar FIPE pela placa
    const placa = neg.veiculo_placa.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    let fipeValor: number | null = null;
    let fipeModelo: string | null = null;

    // Tentar via gia-buscar-placa (que já tem a lógica)
    try {
      const placaRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gia-buscar-placa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ acao: "placa", placa }),
        signal: AbortSignal.timeout(15000),
      });
      const placaData = await placaRes.json();
      if (placaData.sucesso && placaData.resultado) {
        fipeValor = Number(placaData.resultado.valorFipe) || null;
        fipeModelo = placaData.resultado.modelo || neg.veiculo_modelo;
      }
    } catch (e) {
      console.warn("[auto-cotacao] Falha ao buscar placa via edge:", e);
    }

    // Fallback: BrasilAPI direto
    if (!fipeValor) {
      try {
        const brasilRes = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${placa}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (brasilRes.ok) {
          const brasilData = await brasilRes.json();
          if (Array.isArray(brasilData) && brasilData.length > 0) {
            const item = brasilData[0];
            fipeValor = Number(String(item.valor || "0").replace(/[^0-9.,]/g, "").replace(",", ".")) || null;
            fipeModelo = item.modelo || neg.veiculo_modelo;
          }
        }
      } catch (e) {
        console.warn("[auto-cotacao] Falha BrasilAPI:", e);
      }
    }

    if (!fipeValor) {
      return jsonRes({ success: false, error: "Não foi possível obter valor FIPE para a placa" }, 422);
    }

    // 3. Calcular cotação
    const plano = (neg.plano || "intermediario").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pct = FIPE_PCT[plano] ?? FIPE_PCT["intermediario"];

    let valorPlano = Math.round(fipeValor * pct * 100) / 100;
    let taxaAdmin = Math.round(valorPlano * 0.10 * 100) / 100;

    // Verificar override de plano na tabela gia_planos
    const { data: giaPlano } = await supabase
      .from("gia_planos")
      .select("*")
      .eq("nome", neg.plano || "intermediario")
      .maybeSingle();

    if (giaPlano) {
      if (giaPlano.percentual_fipe) {
        valorPlano = Math.round(fipeValor * Number(giaPlano.percentual_fipe) * 100) / 100;
      } else if (giaPlano.valor_fixo) {
        valorPlano = Number(giaPlano.valor_fixo);
      }
      if (giaPlano.taxa_admin) {
        taxaAdmin = Number(giaPlano.taxa_admin);
      }
    }

    const cobertura = coberturaPorPlano(plano);
    const validade = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 4. Inserir cotação
    const { data: cotacao, error: cotErr } = await supabase
      .from("cotacoes")
      .insert({
        lead_nome: neg.lead_nome,
        cpf_cnpj: neg.cpf_cnpj || null,
        placa: neg.veiculo_placa,
        modelo: fipeModelo || neg.veiculo_modelo,
        plano: neg.plano || "intermediario",
        fipe_valor: fipeValor,
        valor_plano: valorPlano,
        valor_adesao: VALOR_ADESAO,
        taxa_admin: taxaAdmin,
        cobertura,
        status: "pendente",
        validade_horas: 48,
        validade_ate: validade,
        negociacao_id: neg.id,
      })
      .select()
      .single();

    if (cotErr) {
      console.error("[auto-cotacao] Insert cotacao error:", cotErr);
      return jsonRes({ success: false, error: cotErr.message }, 500);
    }

    // 5. Atualizar negociação
    const stageAnterior = neg.stage;
    const novoStage = stageAnterior === "novo_lead" ? "em_contato" : stageAnterior;

    await supabase
      .from("negociacoes")
      .update({
        auto_cotacao_gerada: true,
        valor_plano: valorPlano,
        stage: novoStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", neg.id);

    // 6. Registrar transição no pipeline
    if (stageAnterior !== novoStage) {
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: neg.id,
        stage_anterior: stageAnterior,
        stage_novo: novoStage,
        motivo: "Auto-cotação gerada (LuxSales VoIP → cidade preenchida)",
        automatica: true,
      });
    }

    console.log(`[auto-cotacao] Cotação ${cotacao.id} gerada para negociação ${neg.id}. FIPE=${fipeValor} Plano=${valorPlano}`);

    return jsonRes({
      success: true,
      cotacao_id: cotacao.id,
      valor_plano: valorPlano,
      valor_adesao: VALOR_ADESAO,
      taxa_admin: taxaAdmin,
      fipe_valor: fipeValor,
      stage_atualizado: novoStage,
    });
  } catch (e: any) {
    console.error("[auto-cotacao] error:", e);
    return jsonRes({ success: false, error: e.message }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
