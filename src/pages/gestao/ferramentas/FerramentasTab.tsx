import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Plug, Wrench, ChevronRight } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";
import AlteracaoCotaMassa from "../AlteracaoCotaMassa";
import SPCSerasa from "../SPCSerasa";
import GestorSPCSerasa from "../GestorSPCSerasa";

const actions = [
  { id: "lote", title: "Alterações em Lote", desc: "Importar, remover ou substituir produtos em massa", icon: Upload },
  { id: "replicar", title: "Replicar Itens em Lote", desc: "Copiar cotas e itens entre regionais e cooperativas", icon: Copy },
  { id: "integracoes", title: "Integrações", desc: "SPC/Serasa, SMS e WhatsApp", icon: Plug },
  { id: "cota-massa", title: "Alteração de Cota em Massa", desc: "Importe planilhas para atualizar intervalos de cotas por regional", icon: Upload },
  { id: "spc-serasa", title: "SPC Serasa", desc: "Consulta e controle de associados enviados para negativação", icon: Upload },
  { id: "gestor-spc", title: "Gestor SPC/Serasa", desc: "Painel administrativo de gestão de negativações", icon: Plug },
];

export default function FerramentasTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "lote") return <AlteracoesLote onBack={() => setView(null)} />;
  if (view === "replicar") return <ReplicarItens onBack={() => setView(null)} />;
  if (view === "integracoes") return <Integracoes onBack={() => setView(null)} />;
  if (view === "cota-massa") return <AlteracaoCotaMassa onBack={() => setView(null)} />;
  if (view === "spc-serasa") return <SPCSerasa onBack={() => setView(null)} />;
  if (view === "gestor-spc") return <GestorSPCSerasa onBack={() => setView(null)} />;

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-5">
        <Wrench className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Ferramentas</h1>
        <span className="text-sm text-muted-foreground ml-1">— Utilitários operacionais</span>
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
