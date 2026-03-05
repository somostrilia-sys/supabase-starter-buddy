import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Copy, Plug } from "lucide-react";
import AlteracoesLote from "./AlteracoesLote";
import ReplicarItens from "./ReplicarItens";
import Integracoes from "./Integracoes";

const actions = [
  { id: "lote", label: "Alterações em Lote", desc: "Importar, remover ou substituir produtos em massa", icon: Upload, color: "from-orange-500 to-amber-500" },
  { id: "replicar", label: "Replicar Itens em Lote", desc: "Copiar cotas e itens entre regionais e cooperativas", icon: Copy, color: "from-blue-500 to-cyan-500" },
  { id: "integracoes", label: "Integrações", desc: "SPC/Serasa, SMS e WhatsApp", icon: Plug, color: "from-emerald-500 to-green-500" },
];

export default function FerramentasTab() {
  const [view, setView] = useState<string | null>(null);

  if (view === "lote") return <AlteracoesLote onBack={() => setView(null)} />;
  if (view === "replicar") return <ReplicarItens onBack={() => setView(null)} />;
  if (view === "integracoes") return <Integracoes onBack={() => setView(null)} />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Ferramentas</h2>
        <p className="text-sm text-muted-foreground">Utilitários operacionais para gestão em massa e integrações</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm" onClick={() => setView(a.id)}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                <a.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
