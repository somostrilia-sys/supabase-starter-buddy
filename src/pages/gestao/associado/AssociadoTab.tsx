import { useState } from "react";
import {
  UserPlus, UserCog, Link2, FileBarChart, Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CadastrarAssociado from "./CadastrarAssociado";
import AlterarAssociado from "./AlterarAssociado";
import VincularAssociado from "./VincularAssociado";
import RelatorioAlteracoes from "./RelatorioAlteracoes";

type AssociadoView = "menu" | "cadastrar" | "alterar" | "vincular" | "relatorio";

const actions = [
  {
    id: "cadastrar" as const,
    title: "Cadastrar Novo Associado",
    desc: "Formulário completo com dados pessoais, contato, endereço e plano",
    icon: UserPlus,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "alterar" as const,
    title: "Alterar Associado",
    desc: "Buscar e editar cadastro existente com histórico de alterações",
    icon: UserCog,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "vincular" as const,
    title: "Vincular Associado a Veículo",
    desc: "Vincular associado existente a um veículo já cadastrado",
    icon: Link2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "relatorio" as const,
    title: "Relatório de Alterações",
    desc: "Histórico de alterações de beneficiários com filtros e exportação",
    icon: FileBarChart,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export default function AssociadoTab() {
  const [view, setView] = useState<AssociadoView>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Associado</h1>
            <p className="text-sm text-muted-foreground">Selecione a ação desejada</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
              onClick={() => setView(a.id)}
            >
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

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => setView("menu")} className="gap-1.5 mb-4 text-muted-foreground">
      <ArrowLeft className="h-4 w-4" /> Voltar ao menu
    </Button>
  );

  return (
    <div className="p-6">
      {backButton}
      {view === "cadastrar" && <CadastrarAssociado />}
      {view === "alterar" && <AlterarAssociado />}
      {view === "vincular" && <VincularAssociado />}
      {view === "relatorio" && <RelatorioAlteracoes />}
    </div>
  );
}
