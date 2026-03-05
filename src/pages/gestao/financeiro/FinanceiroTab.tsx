import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckSquare, Building2, Receipt, Clock,
} from "lucide-react";
import BoletosSimulacao from "./BoletosSimulacao";
import Conferencia from "./Conferencia";
import BancoIntegracao from "./BancoIntegracao";
import CobrancasRecibos from "./CobrancasRecibos";
import HistoricoFinanceiro from "./HistoricoFinanceiro";

const actions = [
  { id: "boletos", label: "Boletos / Fechamento", icon: FileText, desc: "Simular, gerar e cancelar lotes de boletos" },
  { id: "conferencia", label: "Conferência", icon: CheckSquare, desc: "Conferir participantes e alterar situação" },
  { id: "banco", label: "Banco", icon: Building2, desc: "Remessa, retorno e extrato bancário" },
  { id: "cobrancas", label: "Cobranças e Recibos", icon: Receipt, desc: "Gestão de cobranças, recibos e envios" },
  { id: "historico", label: "Histórico", icon: Clock, desc: "Timeline de movimentações financeiras" },
];

export default function FinanceiroTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "boletos") return <BoletosSimulacao onBack={() => setView(null)} />;
  if (view === "conferencia") return <Conferencia onBack={() => setView(null)} />;
  if (view === "banco") return <BancoIntegracao onBack={() => setView(null)} />;
  if (view === "cobrancas") return <CobrancasRecibos onBack={() => setView(null)} />;
  if (view === "historico") return <HistoricoFinanceiro onBack={() => setView(null)} />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Financeiro / Fechamento</h2>
        <p className="text-sm text-muted-foreground">Gestão completa do ciclo financeiro da associação</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((a) => (
          <Button
            key={a.id}
            variant="outline"
            className="h-auto p-5 flex flex-col items-start gap-2 text-left"
            onClick={() => setView(a.id)}
          >
            <div className="flex items-center gap-2">
              <a.icon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{a.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{a.desc}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
