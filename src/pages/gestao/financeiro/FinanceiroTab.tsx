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
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-2.5 mb-6">
        <Landmark className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Financeiro / Fechamento</h1>
        <span className="text-sm text-muted-foreground ml-1">— Ciclo financeiro da associação</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group flex items-center gap-6 border border-[hsl(210_30%_88%)] bg-[hsl(210_30%_96%)] px-8 py-8 text-left hover:bg-[hsl(210_30%_93%)] hover:border-[hsl(210_30%_80%)] transition-colors min-h-[130px]"
          >
            <div className="w-16 h-16 bg-[hsl(212_35%_18%)] flex items-center justify-center shrink-0">
              <a.icon className="h-7 w-7 text-[hsl(210_55%_70%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{a.desc}</p>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
