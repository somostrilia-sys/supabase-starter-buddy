import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Plug, Wrench, ChevronRight } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";
import AlteracaoCotaMassa from "../AlteracaoCotaMassa";

const actions = [
  { id: "lote", title: "Alterações em Lote", desc: "Importar, remover ou substituir produtos em massa", icon: Upload, color: "from-orange-500 to-amber-500" },
  { id: "replicar", title: "Replicar Itens em Lote", desc: "Copiar cotas e itens entre regionais e cooperativas", icon: Copy, color: "from-blue-500 to-cyan-500" },
  { id: "integracoes", title: "Integrações", desc: "SPC/Serasa, SMS e WhatsApp", icon: Plug, color: "from-emerald-500 to-green-500" },
  { id: "cota-massa", title: "Alteração de Cota em Massa", desc: "Importe planilhas para atualizar intervalos de cotas por regional", icon: Upload, color: "from-violet-500 to-purple-500" },
];

export default function FerramentasTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "lote") return <AlteracoesLote onBack={() => setView(null)} />;
  if (view === "replicar") return <ReplicarItens onBack={() => setView(null)} />;
  if (view === "integracoes") return <Integracoes onBack={() => setView(null)} />;
  if (view === "cota-massa") return <AlteracaoCotaMassa onBack={() => setView(null)} />;

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Ferramentas</h1>
          <p className="text-sm text-muted-foreground">Utilitários operacionais para gestão em massa e integrações</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative flex items-center gap-5 rounded-xl border bg-card px-6 flex-1 text-left shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
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
