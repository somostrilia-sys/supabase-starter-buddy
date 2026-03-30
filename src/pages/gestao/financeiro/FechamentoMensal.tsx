import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props { onBack: () => void; }

// ── helpers ──────────────────────────────────────────────────────────────────

function buildMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();
const CURRENT_MONTH = MONTH_OPTIONS[0].value;
const [Y, M] = CURRENT_MONTH.split("-").map(Number);
const PREV1 = `${M === 1 ? Y - 1 : Y}-${String(M === 1 ? 12 : M - 1).padStart(2, "0")}`;
const PREV2 = `${M <= 2 ? Y - 1 : Y}-${String(M <= 2 ? M + 10 : M - 2).padStart(2, "0")}`;

type Status = "Aberto" | "Em processamento" | "Fechado";

function getInitialStatus(month: string): Status {
  if (month === CURRENT_MONTH) return "Aberto";
  if (month === PREV1) return "Em processamento";
  return "Fechado";
}

const STEP_LABELS = [
  "Verificar inadimplentes",
  "Calcular rateio de eventos",
  "Gerar boletos mensalidade",
  "Enviar cobranças",
  "Consolidar relatório",
];

function getInitialSteps(month: string): boolean[] {
  if (month === CURRENT_MONTH) return [true, true, true, false, false];
  if (month === PREV1) return [true, true, true, true, false];
  return [true, true, true, true, true];
}

const HISTORICO = [
  { mes: "Fev/2026", status: "Fechado", boletos: "23.847", total: "R$ 4.769.400", inadimplencia: "5,8%" },
  { mes: "Jan/2026", status: "Fechado", boletos: "23.612", total: "R$ 4.722.400", inadimplencia: "6,2%" },
];

function statusBadge(s: Status) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold";
  if (s === "Fechado") return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300`;
  if (s === "Em processamento") return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`;
  return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function FechamentoMensal({ onBack }: Props) {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(() => ({
    [CURRENT_MONTH]: "Aberto",
    [PREV1]: "Em processamento",
  }));
  const [stepsMap, setStepsMap] = useState<Record<string, boolean[]>>(() => ({
    [CURRENT_MONTH]: getInitialSteps(CURRENT_MONTH),
    [PREV1]: getInitialSteps(PREV1),
    [PREV2]: getInitialSteps(PREV2),
  }));
  const [running, setRunning] = useState(false);

  const status: Status = statusMap[selectedMonth] ?? getInitialStatus(selectedMonth);
  const steps: boolean[] = stepsMap[selectedMonth] ?? getInitialSteps(selectedMonth);

  function setSteps(month: string, next: boolean[]) {
    setStepsMap((prev) => ({ ...prev, [month]: next }));
  }
  function setStatus(month: string, s: Status) {
    setStatusMap((prev) => ({ ...prev, [month]: s }));
  }

  function toggleStep(idx: number) {
    const next = steps.map((v, i) => (i === idx ? !v : v));
    setSteps(selectedMonth, next);
    if (next[idx]) {
      toast({ title: `Etapa ${idx + 1} registrada`, description: STEP_LABELS[idx] });
    }
  }

  async function handleExecutar() {
    setRunning(true);
    const body = { mes: selectedMonth, company_id: "objetivo" };

    try {
      const res = await fetch(
        "https://yrjiegtqfngdliwclpzo.supabase.co/functions/v1/fechamento-mensal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamllZ3RxZm5nZGxpd2NscHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTIyMzksImV4cCI6MjA1ODMyODIzOX0.bhlDxOOQAHFqBRkOT0oY5IOY5bZ3FBQG0P5DaD0CGPI",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // simulate background processing
      await new Promise((r) => setTimeout(r, 2000));
    }

    setStatus(selectedMonth, "Em processamento");
    toast({
      title: "Fechamento iniciado com sucesso",
      description: "Processando em background — acompanhe o status acima.",
    });
    setRunning(false);
  }

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
        <h1 className="text-lg font-semibold">Fechamento Mensal</h1>
        <span className="text-sm text-muted-foreground ml-1 hidden sm:inline">
          — Ciclo financeiro mensal
        </span>
        <div className="ml-auto">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── Status card ─────────────────────────────────────── */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status do Fechamento</span>
            <span className={statusBadge(status)}>{status}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Mês selecionado:{" "}
            <span className="font-semibold text-foreground">
              {MONTH_OPTIONS.find((o) => o.value === selectedMonth)?.label ?? selectedMonth}
            </span>
          </p>

          <Button
            onClick={handleExecutar}
            disabled={running || status === "Fechado"}
            className="w-full mt-auto"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando…
              </>
            ) : (
              "Executar Fechamento"
            )}
          </Button>
        </div>

        {/* ── Stepper ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">Etapas do Fechamento</h2>
          <ol className="flex flex-col gap-3">
            {STEP_LABELS.map((label, idx) => {
              const checked = steps[idx];
              return (
                <li key={idx} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStep(idx)}
                    disabled={status === "Fechado"}
                    className="shrink-0 focus:outline-none disabled:opacity-50"
                    aria-label={checked ? `Desmarcar etapa ${idx + 1}` : `Marcar etapa ${idx + 1}`}
                  >
                    {checked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </button>
                  <span
                    className={`text-sm ${
                      checked ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    <span className="font-medium text-muted-foreground mr-1">{idx + 1}.</span>
                    {label}
                  </span>
                  {checked && (
                    <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Concluída
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Histórico ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Histórico de Fechamentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Mês</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Boletos</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Inadimplência</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICO.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-3.5 font-medium">{row.mes}</td>
                  <td className="px-4 py-3.5">
                    <span className={statusBadge(row.status as Status)}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{row.boletos}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium">{row.total}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-rose-600 dark:text-rose-400">
                    {row.inadimplencia}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
