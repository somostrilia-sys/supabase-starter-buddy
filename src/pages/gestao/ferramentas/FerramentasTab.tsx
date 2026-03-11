import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Plug, Wrench, ChevronRight, Shield, FileSpreadsheet } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";
import PlanosProtecao from "./PlanosProtecao";
import TabelaCotas from "./TabelaCotas";
import AlteracaoCotaMassa from "../AlteracaoCotaMassa";
import SPCSerasa from "../SPCSerasa";
import GestorSPCSerasa from "../GestorSPCSerasa";

const actions = [
  { id: "planos", title: "Planos de Proteção", desc: "Gerencie planos, coberturas, regionais e categorias de veículo", icon: Shield },
  { id: "tabela-cotas", title: "Tabela de Cotas", desc: "Visualize, edite e importe faixas FIPE com valores de cota e taxa", icon: FileSpreadsheet },
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 auto-rows-fr">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative overflow-hidden rounded-xl border border-[hsl(210_30%_85%)] bg-card text-left transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(210_30%_80%)]/20 hover:-translate-y-0.5 hover:border-[hsl(210_35%_70%)] flex flex-col"
          >
            <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
            <div className="flex items-center gap-5 px-6 py-5 flex-1">
              <div className="w-12 h-12 rounded-full bg-[hsl(212_35%_18%)] flex items-center justify-center shrink-0 shadow-md">
                <a.icon className="h-5 w-5 text-[hsl(210_55%_70%)]" />
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
