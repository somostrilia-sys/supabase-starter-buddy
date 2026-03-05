import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Copy, Plug, Wrench, ChevronRight } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";

const actions = [
  { id: "lote", title: "Alterações em Lote", desc: "Importar, remover ou substituir produtos em massa", icon: Upload, color: "from-orange-500 to-amber-500" },
  { id: "replicar", title: "Replicar Itens em Lote", desc: "Copiar cotas e itens entre regionais e cooperativas", icon: Copy, color: "from-blue-500 to-cyan-500" },
  { id: "integracoes", title: "Integrações", desc: "SPC/Serasa, SMS e WhatsApp", icon: Plug, color: "from-emerald-500 to-green-500" },
];

export default function FerramentasTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "lote") return <AlteracoesLote onBack={() => setView(null)} />;
  if (view === "replicar") return <ReplicarItens onBack={() => setView(null)} />;
  if (view === "integracoes") return <Integracoes onBack={() => setView(null)} />;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Ferramentas</h1>
          <p className="text-sm text-muted-foreground">Utilitários operacionais para gestão em massa e integrações</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setView(a.id)}
            className="group relative flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <a.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-all absolute right-4 top-1/2 -translate-y-1/2" />
          </button>
        ))}
      </div>
    </div>
  );
}
