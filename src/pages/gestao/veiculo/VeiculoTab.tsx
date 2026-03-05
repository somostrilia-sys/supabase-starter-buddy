import { useState } from "react";
import {
  Car, CarFront, Search, UserPlus, ClipboardCheck, BarChart3,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CadastrarVeiculo from "./CadastrarVeiculo";
import ConsultarVeiculo from "./ConsultarVeiculo";
import CadastrarAgregado from "./CadastrarAgregado";
import CadastrarVistoria from "./CadastrarVistoria";
import RelatoriosVeiculo from "./RelatoriosVeiculo";

type View = "menu" | "cadastrar" | "consultar" | "agregado" | "vistoria" | "relatorios";

const actions = [
  { id: "cadastrar" as const, title: "Cadastrar Veículo", desc: "Cadastro completo com consulta FIPE integrada e vinculação ao associado", icon: CarFront, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "consultar" as const, title: "Consultar / Alterar Veículo", desc: "Busca por placa, chassi ou associado com edição e histórico de alterações", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "agregado" as const, title: "Cadastrar Agregado", desc: "Incluir condutor agregado vinculado a um veículo existente", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "vistoria" as const, title: "Cadastrar Vistoria", desc: "Registrar vistoria com checklist, resultado e fotos", icon: ClipboardCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "relatorios" as const, title: "Relatórios de Veículo", desc: "Relatórios de alterações, geral de veículos e vinculação financeira", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-500/10" },
];

export default function VeiculoTab() {
  const [view, setView] = useState<View>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Veículo</h1>
            <p className="text-sm text-muted-foreground">Selecione a ação desejada</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => setView(a.id)}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <a.icon className={`h-6 w-6 ${a.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{a.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => setView("menu")} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao menu
      </Button>
      {view === "cadastrar" && <CadastrarVeiculo />}
      {view === "consultar" && <ConsultarVeiculo />}
      {view === "agregado" && <CadastrarAgregado />}
      {view === "vistoria" && <CadastrarVistoria />}
      {view === "relatorios" && <RelatoriosVeiculo />}
    </div>
  );
}
