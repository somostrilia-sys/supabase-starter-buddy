import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props { onBack?: () => void; }

function buildMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();
const CURRENT_MONTH = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

type Conferencia = {
  resumo: {
    total_boletos: number;
    pendentes: number;
    pagos: number;
    vencidos: number;
    valor_total: number;
    valor_recebido: number;
  };
  inadimplentes: number;
};

type LoteResult = {
  contratos_ativos: number;
  ja_com_boleto: number;
  boletos_a_gerar?: number;
  boletos_pendentes?: number;
  processados_nesta_call?: number;
  restantes?: number;
  sucessos?: number;
  falhas?: number;
  erros?: any[];
  simulacao: boolean;
};

export default function FechamentoMensal({ onBack }: Props) {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [conferencia, setConferencia] = useState<Conferencia | null>(null);
  const [loadingConf, setLoadingConf] = useState(false);
  const [simResult, setSimResult] = useState<LoteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ feitos: 0, total: 0, falhas: 0 });
  const [loteLog, setLoteLog] = useState<string[]>([]);

  async function loadConferencia() {
    setLoadingConf(true);
    try {
      const { data, error } = await supabase.functions.invoke("fechamento-mensal", {
        body: { etapa: "conferencia", mes_referencia: selectedMonth, modo: "simular" },
      });
      if (error) throw error;
      setConferencia(data as Conferencia);
    } catch (e: any) {
      toast({ title: "Erro na conferência", description: e.message, variant: "destructive" });
    } finally {
      setLoadingConf(false);
    }
  }

  useEffect(() => {
    setConferencia(null);
    setSimResult(null);
    setProgress({ feitos: 0, total: 0, falhas: 0 });
    setLoteLog([]);
    loadConferencia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  async function simular() {
    setSimResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("fechamento-mensal", {
        body: { etapa: "lote", mes_referencia: selectedMonth, modo: "simular" },
      });
      if (error) throw error;
      setSimResult(data as LoteResult);
    } catch (e: any) {
      toast({ title: "Erro na simulação", description: e.message, variant: "destructive" });
    }
  }

  async function executarLote() {
    if (!simResult) return;
    const total = simResult.boletos_a_gerar ?? 0;
    if (total === 0) {
      toast({ title: "Nada a gerar", description: "Todos os contratos já têm boleto no mês" });
      return;
    }

    const confirmacao = window.confirm(
      `Confirma a emissão de ${total} boletos reais na Cora para ${selectedMonth}?\n\nIsto vai enviar email + gerar cobrança real para os associados.`
    );
    if (!confirmacao) return;

    setRunning(true);
    setProgress({ feitos: 0, total, falhas: 0 });
    setLoteLog([]);

    try {
      let restantes = total;
      let totalSucessos = 0;
      let totalFalhas = 0;
      let iteracao = 0;

      while (restantes > 0 && iteracao < 50) {
        iteracao++;
        const { data, error } = await supabase.functions.invoke("fechamento-mensal", {
          body: {
            etapa: "lote",
            mes_referencia: selectedMonth,
            modo: "executar",
            limite: 50,
          },
        });
        if (error) throw error;
        const r = data as LoteResult;
        totalSucessos += r.sucessos ?? 0;
        totalFalhas += r.falhas ?? 0;
        restantes = r.restantes ?? 0;
        setProgress({ feitos: totalSucessos, total, falhas: totalFalhas });
        setLoteLog((prev) => [
          ...prev,
          `Lote ${iteracao}: +${r.sucessos} sucessos, +${r.falhas} falhas, ${restantes} restantes`,
        ]);
        if ((r.processados_nesta_call ?? 0) === 0) break;
      }

      toast({
        title: "Lote finalizado",
        description: `${totalSucessos} emitidos, ${totalFalhas} falhas`,
      });
      await loadConferencia();
      await simular();
    } catch (e: any) {
      toast({ title: "Erro no lote", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  async function conciliacao() {
    try {
      const { data, error } = await supabase.functions.invoke("fechamento-mensal", {
        body: { etapa: "conciliacao", mes_referencia: selectedMonth, modo: "executar" },
      });
      if (error) throw error;
      toast({
        title: "Conciliação aplicada",
        description: `Vencidos e inadimplentes atualizados`,
      });
      await loadConferencia();
    } catch (e: any) {
      toast({ title: "Erro na conciliação", description: e.message, variant: "destructive" });
    }
  }

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
        <h1 className="text-lg font-semibold">Fechamento Mensal</h1>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={loadConferencia} disabled={loadingConf}>
            <RefreshCw className={`h-4 w-4 ${loadingConf ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Conferência */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Situação do mês</h2>
        {loadingConf ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : conferencia ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <Stat label="Total" value={conferencia.resumo.total_boletos.toString()} />
            <Stat label="Pendentes" value={conferencia.resumo.pendentes.toString()} />
            <Stat label="Pagos" value={conferencia.resumo.pagos.toString()} color="text-emerald-600" />
            <Stat label="Vencidos" value={conferencia.resumo.vencidos.toString()} color="text-rose-600" />
            <Stat label="Valor total" value={brl(conferencia.resumo.valor_total)} />
            <Stat
              label="Recebido"
              value={brl(conferencia.resumo.valor_recebido)}
              color="text-emerald-600"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados</p>
        )}
      </div>

      {/* Lote */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Gerar boletos mensais (Cora)</h2>
          <Button variant="outline" size="sm" onClick={simular} disabled={running}>
            Simular
          </Button>
        </div>

        {simResult ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <Stat label="Contratos ativos" value={simResult.contratos_ativos.toString()} />
            <Stat label="Já com boleto" value={simResult.ja_com_boleto.toString()} />
            <Stat
              label="A gerar"
              value={(simResult.boletos_a_gerar ?? 0).toString()}
              color="text-amber-600"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Clique em <b>Simular</b> pra ver quantos boletos seriam emitidos.
          </p>
        )}

        <Button
          onClick={executarLote}
          disabled={running || !simResult || (simResult.boletos_a_gerar ?? 0) === 0}
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Emitindo {progress.feitos}/{progress.total}…
            </>
          ) : (
            `Emitir ${simResult?.boletos_a_gerar ?? 0} boletos na Cora`
          )}
        </Button>

        {running && (
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${progress.total > 0 ? (progress.feitos / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {progress.feitos} emitidos · {progress.falhas} falhas
            </div>
          </div>
        )}

        {loteLog.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Log de lotes ({loteLog.length})
            </summary>
            <pre className="text-xs mt-2 p-2 bg-muted/40 rounded overflow-x-auto">
              {loteLog.join("\n")}
            </pre>
          </details>
        )}
      </div>

      {/* Conciliação */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Conciliação</h2>
            <p className="text-xs text-muted-foreground">
              Marca boletos pendentes vencidos e atualiza status dos associados
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={conciliacao} disabled={running}>
            Aplicar conciliação
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold tabular-nums ${color ?? ""}`}>{value}</div>
    </div>
  );
}
