import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  // Auto-abrir view "alterar" quando houver associado_id ou sub=alterar na URL
  // (integração com Consultar Veículo → link para Consultar/Alterar Associado)
  const initialView: AssociadoView = (searchParams.get("sub") as AssociadoView)
    || (searchParams.get("associado_id") ? "alterar" : "menu");
  const [view, setView] = useState<AssociadoView>(initialView);

  useEffect(() => {
    const sub = searchParams.get("sub") as AssociadoView | null;
    const assocId = searchParams.get("associado_id");
    if (sub && sub !== view) setView(sub);
    else if (assocId && view === "menu") setView("alterar");
  }, [searchParams]);

  if (view === "menu") {
    return (
      <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
        <div className="flex items-center gap-2.5 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Associado</h1>
          <span className="text-sm text-muted-foreground ml-1">— Selecione a ação desejada</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setView(a.id)}
              className="group relative overflow-hidden rounded-2xl border-l-4 border-l-[#0EA5E9] text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col"
              style={{ backgroundColor: "#003870" }}
            >
              <div className="absolute top-4 right-4">
                <ChevronRight className="h-5 w-5 text-[#0EA5E9]" />
              </div>
              <div className="flex items-start gap-4 px-6 py-6 flex-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <a.icon className="h-6 w-6 text-[#0EA5E9]" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-extrabold text-base text-white uppercase tracking-wide leading-tight">{a.title}</h3>
                  <p className="text-sm text-white/70 mt-2 leading-relaxed">{a.desc}</p>
                </div>
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
