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
  { id: "boletos", title: "Boletos / Fechamento", icon: FileText, desc: "Simular, gerar e cancelar lotes de boletos", color: "from-blue-500 to-blue-600" },
  { id: "conferencia", title: "Conferência", icon: CheckSquare, desc: "Conferir participantes e alterar situação", color: "from-emerald-500 to-emerald-600" },
  { id: "banco", title: "Banco", icon: Building2, desc: "Remessa, retorno e extrato bancário", color: "from-purple-500 to-purple-600" },
  { id: "cobrancas", title: "Cobranças e Recibos", icon: Receipt, desc: "Gestão de cobranças, recibos e envios", color: "from-amber-500 to-amber-600" },
  { id: "historico", title: "Histórico", icon: Clock, desc: "Timeline de movimentações financeiras", color: "from-rose-500 to-rose-600" },
];

export default function FinanceiroTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "boletos") return <BoletosSimulacao onBack={() => setView(null)} />;
  if (view === "conferencia") return <Conferencia onBack={() => setView(null)} />;
  if (view === "banco") return <BancoIntegracao onBack={() => setView(null)} />;
  if (view === "cobrancas") return <CobrancasRecibos onBack={() => setView(null)} />;
  if (view === "historico") return <HistoricoFinanceiro onBack={() => setView(null)} />;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Landmark className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Financeiro / Fechamento</h1>
          <p className="text-sm text-muted-foreground">Gestão completa do ciclo financeiro da associação</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative flex items-center gap-5 rounded-xl border bg-card p-6 text-left shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
              <a.icon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
