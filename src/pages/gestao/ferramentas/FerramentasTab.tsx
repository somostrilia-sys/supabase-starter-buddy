import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Plug, Wrench, ChevronRight, Shield, FileSpreadsheet, Settings2 } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";
import PlanosProtecao from "./PlanosProtecao";
import TabelaCotas from "./TabelaCotas";
import AlteracaoCotaMassa from "../AlteracaoCotaMassa";
import SPCSerasa from "../SPCSerasa";
import GestorSPCSerasa from "../GestorSPCSerasa";
import DistribuicaoRateioFerramenta from "./DistribuicaoRateioFerramenta";
import SituacoesAssociado from "./SituacoesAssociado";

const actions = [
  { id: "planos", title: "Planos de Proteção", desc: "Gerencie planos, coberturas, regionais e categorias de veículo", icon: Shield },
  { id: "tabela-cotas", title: "Tabela de Cotas", desc: "Visualize, edite e importe faixas FIPE com valores de cota e taxa", icon: FileSpreadsheet },
  { id: "situacoes", title: "Situações do Associado", desc: "CRUD de situações cadastrais com fechamento e rateio", icon: Settings2 },
  { id: "distribuicao-rateio", title: "Distribuição de Rateio", desc: "Calcule e distribua o rateio por categoria e regional", icon: Upload },
  { id: "lote", title: "Alterações em Lote", desc: "Importar, remover ou substituir produtos em massa", icon: Upload },
  { id: "replicar", title: "Replicar Itens em Lote", desc: "Copiar cotas e itens entre regionais e cooperativas", icon: Copy },
  { id: "integracoes", title: "Integrações", desc: "SPC/Serasa, SMS e WhatsApp", icon: Plug },
  { id: "cota-massa", title: "Alteração de Cota em Massa", desc: "Importe planilhas para atualizar intervalos de cotas por regional", icon: Upload },
  { id: "spc-serasa", title: "SPC Serasa", desc: "Consulta e controle de associados enviados para negativação", icon: Upload },
  { id: "gestor-spc", title: "Gestor SPC/Serasa", desc: "Painel administrativo de gestão de negativações", icon: Plug },
];

export default function FerramentasTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "planos") return <PlanosProtecao onBack={() => setView(null)} />;
  if (view === "tabela-cotas") return <TabelaCotas onBack={() => setView(null)} />;
  if (view === "situacoes") return <SituacoesAssociado onBack={() => setView(null)} />;
  if (view === "distribuicao-rateio") return <DistribuicaoRateioFerramenta onBack={() => setView(null)} />;
  if (view === "lote") return <AlteracoesLote onBack={() => setView(null)} />;
  if (view === "replicar") return <ReplicarItens onBack={() => setView(null)} />;
  if (view === "integracoes") return <Integracoes onBack={() => setView(null)} />;
  if (view === "cota-massa") return <AlteracaoCotaMassa onBack={() => setView(null)} />;
  if (view === "spc-serasa") return <SPCSerasa onBack={() => setView(null)} />;
  if (view === "gestor-spc") return <GestorSPCSerasa onBack={() => setView(null)} />;

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-2.5 mb-6">
        <Wrench className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Ferramentas</h1>
        <span className="text-sm text-muted-foreground ml-1">— Utilitários operacionais</span>
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
