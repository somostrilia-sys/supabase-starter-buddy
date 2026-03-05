import { useState } from "react";
import {
  UserPlus, UserCog, Link2, FileBarChart, Users,
  ArrowLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CadastrarAssociado from "./CadastrarAssociado";
import AlterarAssociado from "./AlterarAssociado";
import VincularAssociado from "./VincularAssociado";
import RelatorioAlteracoes from "./RelatorioAlteracoes";

type AssociadoView = "menu" | "cadastrar" | "alterar" | "vincular" | "relatorio";

const actions = [
  { id: "cadastrar" as const, title: "Cadastrar Novo Associado", desc: "Formulário completo com dados pessoais, contato, endereço e plano", icon: UserPlus, color: "from-emerald-500 to-emerald-600" },
  { id: "alterar" as const, title: "Alterar Associado", desc: "Buscar e editar cadastro existente com histórico de alterações", icon: UserCog, color: "from-blue-500 to-blue-600" },
  { id: "vincular" as const, title: "Vincular Associado a Veículo", desc: "Vincular associado existente a um veículo já cadastrado", icon: Link2, color: "from-amber-500 to-amber-600" },
  { id: "relatorio" as const, title: "Relatório de Alterações", desc: "Histórico de alterações de beneficiários com filtros e exportação", icon: FileBarChart, color: "from-purple-500 to-purple-600" },
];

export default function AssociadoTab() {
  const [view, setView] = useState<AssociadoView>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Associado</h1>
            <p className="text-sm text-muted-foreground">Selecione a ação desejada</p>
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

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => setView("menu")} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao menu
      </Button>
      {view === "cadastrar" && <CadastrarAssociado />}
      {view === "alterar" && <AlterarAssociado />}
      {view === "vincular" && <VincularAssociado />}
      {view === "relatorio" && <RelatorioAlteracoes />}
    </div>
  );
}
