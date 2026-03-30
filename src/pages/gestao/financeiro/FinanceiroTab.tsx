import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckSquare, Building2, Receipt, Clock, Landmark, ChevronRight, ArrowLeft, Calculator, Table2, CalendarCheck,
} from "lucide-react";
import BoletosSimulacao from "./BoletosSimulacao";
import Conferencia from "./Conferencia";
import BancoIntegracao from "./BancoIntegracao";
import CobrancasRecibos from "./CobrancasRecibos";
import HistoricoFinanceiro from "./HistoricoFinanceiro";
import CalculadoraMensalidade from "./CalculadoraMensalidade";
import TabelaPlanos from "./TabelaPlanos";
import FechamentoMensal from "./FechamentoMensal";

const actions = [
  { id: "boletos", title: "Boletos / Fechamento", icon: FileText, desc: "Simular, gerar e cancelar lotes de boletos" },
  { id: "conferencia", title: "Conferência", icon: CheckSquare, desc: "Conferir participantes e alterar situação" },
  { id: "banco", title: "Banco", icon: Building2, desc: "Remessa, retorno e extrato bancário" },
  { id: "cobrancas", title: "Cobranças e Recibos", icon: Receipt, desc: "Gestão de cobranças, recibos e envios" },
  { id: "historico", title: "Histórico", icon: Clock, desc: "Timeline de movimentações financeiras" },
  { id: "calculadora", title: "Calculadora de Mensalidade", icon: Calculator, desc: "Simular mensalidade com taxa admin e rateio" },
  { id: "tabela-planos", title: "Tabela de Planos", icon: Table2, desc: "Planos com filtro por região e tipo de veículo" },
  { id: "fechamento-mensal", title: "Fechamento Mensal", icon: CalendarCheck, desc: "Ciclo financeiro mensal — boletos, rateio e relatórios" },
];

export default function FinanceiroTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "boletos") return <BoletosSimulacao onBack={() => setView(null)} />;
  if (view === "conferencia") return <Conferencia onBack={() => setView(null)} />;
  if (view === "banco") return <BancoIntegracao onBack={() => setView(null)} />;
  if (view === "cobrancas") return <CobrancasRecibos onBack={() => setView(null)} />;
  if (view === "historico") return <HistoricoFinanceiro onBack={() => setView(null)} />;
  if (view === "calculadora") return <CalculadoraMensalidade onBack={() => setView(null)} />;
  if (view === "tabela-planos") return <TabelaPlanos onBack={() => setView(null)} />;
  if (view === "fechamento-mensal") return <FechamentoMensal onBack={() => setView(null)} />;

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-2.5 mb-6">
        <Landmark className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Financeiro / Fechamento</h1>
        <span className="text-sm text-muted-foreground ml-1">— Ciclo financeiro da associação</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 auto-rows-fr">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 hover:border-primary/30 flex flex-col"
          >
            
            <div className="flex items-center gap-5 px-6 py-5 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                <a.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] text-foreground">{a.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{a.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
