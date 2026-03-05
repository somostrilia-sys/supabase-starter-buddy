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
  { id: "produto" as const, title: "Produto Veículo", desc: "Cadastro de coberturas, encargos e benefícios vinculados ao veículo/associado", icon: Package, color: "from-emerald-500 to-emerald-600" },
  { id: "opcionais-assoc" as const, title: "Opcionais do Associado", desc: "Categorias opcionais pré-cadastradas para o associado", icon: CheckSquare, color: "from-blue-500 to-blue-600" },
  { id: "opcionais-veic" as const, title: "Opcionais do Veículo", desc: "Tipos, categorias e cotas de veículo configuráveis", icon: Car, color: "from-amber-500 to-amber-600" },
  { id: "cooperativa" as const, title: "Cadastrar Cooperativa", desc: "Filiais da associação com CNPJ, endereço e vinculação a regionais", icon: Building2, color: "from-purple-500 to-purple-600" },
  { id: "regional" as const, title: "Cadastrar Regional", desc: "Regras geográficas e agrupamento de cooperativas por região", icon: MapPin, color: "from-rose-500 to-rose-600" },
  { id: "voluntario" as const, title: "Cadastrar Voluntário / Usuário", desc: "Colaboradores administrativos e vendedores do sistema", icon: UserCog, color: "from-teal-500 to-teal-600" },
];

export default function CadastroTab() {
  const [view, setView] = useState<View>("menu");

  if (view === "menu") {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cadastro</h1>
            <p className="text-sm text-muted-foreground">Configurações e cadastros do sistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setView(a.id)}
              className="group relative flex items-center gap-5 rounded-xl border bg-card p-6 text-left shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
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
      {view === "produto" && <ProdutoVeiculo />}
      {view === "opcionais-assoc" && <OpcionaisAssociado />}
      {view === "opcionais-veic" && <OpcionaisVeiculo />}
      {view === "cooperativa" && <CadastrarCooperativa />}
      {view === "regional" && <CadastrarRegional />}
      {view === "voluntario" && <CadastrarVoluntario />}
    </div>
  );
}
