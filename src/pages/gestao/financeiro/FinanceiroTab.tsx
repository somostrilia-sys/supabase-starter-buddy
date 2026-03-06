import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckSquare, Building2, Receipt, Clock, Landmark, ChevronRight, ArrowLeft,
} from "lucide-react";
import BoletosSimulacao from "./BoletosSimulacao";
import Conferencia from "./Conferencia";
import BancoIntegracao from "./BancoIntegracao";
import CobrancasRecibos from "./CobrancasRecibos";
import HistoricoFinanceiro from "./HistoricoFinanceiro";

const actions = [
  { id: "boletos", title: "Boletos / Fechamento", icon: FileText, desc: "Simular, gerar e cancelar lotes de boletos" },
  { id: "conferencia", title: "Conferência", icon: CheckSquare, desc: "Conferir participantes e alterar situação" },
  { id: "banco", title: "Banco", icon: Building2, desc: "Remessa, retorno e extrato bancário" },
  { id: "cobrancas", title: "Cobranças e Recibos", icon: Receipt, desc: "Gestão de cobranças, recibos e envios" },
  { id: "historico", title: "Histórico", icon: Clock, desc: "Timeline de movimentações financeiras" },
];

export default function FinanceiroTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "boletos") return <BoletosSimulacao onBack={() => setView(null)} />;
  if (view === "conferencia") return <Conferencia onBack={() => setView(null)} />;
  if (view === "banco") return <BancoIntegracao onBack={() => setView(null)} />;
  if (view === "cobrancas") return <CobrancasRecibos onBack={() => setView(null)} />;
  if (view === "historico") return <HistoricoFinanceiro onBack={() => setView(null)} />;

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-5">
        <Landmark className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Financeiro / Fechamento</h1>
        <span className="text-sm text-muted-foreground ml-1">— Ciclo financeiro da associação</span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group flex items-center gap-4 rounded-md border bg-card px-4 py-3 text-left hover:bg-muted/50 hover:border-primary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
              <a.icon className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
