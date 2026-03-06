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
  { id: "cadastrar" as const, title: "Cadastrar Novo Associado", desc: "Formulário completo com dados pessoais, contato, endereço e plano", icon: UserPlus },
  { id: "alterar" as const, title: "Consultar / Alterar Associado", desc: "Buscar, visualizar e editar cadastros com histórico completo", icon: UserCog },
  { id: "vincular" as const, title: "Vincular Associado a Veículo", desc: "Vincular associado existente a um veículo já cadastrado", icon: Link2 },
  { id: "relatorio" as const, title: "Relatório de Alterações", desc: "Histórico de alterações de beneficiários com filtros e exportação", icon: FileBarChart },
];

export default function AssociadoTab() {
  const [view, setView] = useState<AssociadoView>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
        <div className="flex items-center gap-2.5 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Associado</h1>
          <span className="text-sm text-muted-foreground ml-1">— Selecione a ação desejada</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setView(a.id)}
              className="group flex items-center gap-6 border-2 border-muted-foreground/30 bg-card px-8 py-8 text-left hover:bg-muted/40 hover:border-primary/40 transition-colors min-h-[130px]"
            >
              <div className="w-16 h-16 bg-[hsl(210_30%_94%)] flex items-center justify-center shrink-0">
                <a.icon className="h-7 w-7 text-[hsl(210_40%_50%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{a.desc}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:px-8">
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
