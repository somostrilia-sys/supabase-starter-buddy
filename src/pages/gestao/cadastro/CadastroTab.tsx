import { useState } from "react";
import {
  Package, CheckSquare, Car, Building2, MapPin, UserCog,
  ArrowLeft, ClipboardList, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProdutoVeiculo from "./ProdutoVeiculo";
import OpcionaisAssociado from "./OpcionaisAssociado";
import OpcionaisVeiculo from "./OpcionaisVeiculo";
import CadastrarCooperativa from "./CadastrarCooperativa";
import CadastrarRegional from "./CadastrarRegional";
import CadastrarVoluntario from "./CadastrarVoluntario";

type View = "menu" | "produto" | "opcionais-assoc" | "opcionais-veic" | "cooperativa" | "regional" | "voluntario";

const actions = [
  { id: "produto" as const, title: "Produto Veículo", desc: "Cadastro de coberturas, encargos e benefícios vinculados ao veículo/associado", icon: Package },
  { id: "opcionais-assoc" as const, title: "Opcionais do Associado", desc: "Categorias opcionais pré-cadastradas para o associado", icon: CheckSquare },
  { id: "opcionais-veic" as const, title: "Opcionais do Veículo", desc: "Tipos, categorias e cotas de veículo configuráveis", icon: Car },
  { id: "cooperativa" as const, title: "Cadastrar Cooperativa", desc: "Filiais da associação com CNPJ, endereço e vinculação a regionais", icon: Building2 },
  { id: "regional" as const, title: "Cadastrar Regional", desc: "Regras geográficas e agrupamento de cooperativas por região", icon: MapPin },
  { id: "voluntario" as const, title: "Cadastrar Voluntário / Usuário", desc: "Colaboradores administrativos e vendedores do sistema", icon: UserCog },
];

export default function CadastroTab() {
  const [view, setView] = useState<View>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2.5 mb-5">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Cadastro</h1>
          <span className="text-sm text-muted-foreground ml-1">— Configurações e cadastros do sistema</span>
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

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => setView("menu")} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao menu
      </Button>
      {view === "produto" && <ProdutoVeiculo />}
      {view === "opcionais-assoc" && <OpcionaisAssociado />}
      {view === "opcionais-veic" && <OpcionaisVeiculo />}
      {view === "cooperativa" && <CadastrarCooperativa />}
      {view === "regional" && <CadastrarRegional />}
      {view === "voluntario" && <CadastrarVoluntario />}
    </div>
  );
}
