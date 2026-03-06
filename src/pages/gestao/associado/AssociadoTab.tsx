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
