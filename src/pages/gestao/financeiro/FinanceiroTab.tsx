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
import BoletoAvulso from "./BoletoAvulso";

const actions = [
  { id: "boletos", title: "Boletos / Fechamento", icon: FileText, desc: "Simular, gerar e cancelar lotes de boletos" },
  { id: "conferencia", title: "Conferência", icon: CheckSquare, desc: "Conferir participantes e alterar situação" },
  { id: "banco", title: "Banco", icon: Building2, desc: "Remessa, retorno e extrato bancário" },
  { id: "cobrancas", title: "Cobranças e Recibos", icon: Receipt, desc: "Gestão de cobranças, recibos e envios" },
  { id: "historico", title: "Histórico", icon: Clock, desc: "Timeline de movimentações financeiras" },
  { id: "calculadora", title: "Calculadora de Mensalidade", icon: Calculator, desc: "Simular mensalidade com taxa admin e rateio" },
  { id: "tabela-planos", title: "Tabela de Planos", icon: Table2, desc: "Planos com filtro por região e tipo de veículo" },
  { id: "fechamento-mensal", title: "Fechamento Mensal", icon: CalendarCheck, desc: "Ciclo financeiro mensal — boletos, rateio e relatórios" },
  { id: "boleto-avulso", title: "Boleto Avulso", icon: Landmark, desc: "Gerar boleto individual por placa com desconto automático de 15%" },
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
  if (view === "boleto-avulso") return <BoletoAvulso onBack={() => setView(null)} />;

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-2.5 mb-6">
        <Landmark className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Financeiro / Fechamento</h1>
        <span className="text-sm text-muted-foreground ml-1">— Ciclo financeiro da associação</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative overflow-hidden rounded-2xl border-l-4 border-l-[#0EA5E9] text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col"
            style={{ backgroundColor: "#003870" }}
          >
            <div className="absolute top-4 right-4">
              <ChevronRight className="h-5 w-5 text-[#0EA5E9]" />
            </div>
            <div className="flex items-start gap-4 px-6 py-6 flex-1">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <a.icon className="h-6 w-6 text-[#0EA5E9]" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-extrabold text-base text-white uppercase tracking-wide leading-tight">{a.title}</h3>
                <p className="text-sm text-white/70 mt-2 leading-relaxed">{a.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
