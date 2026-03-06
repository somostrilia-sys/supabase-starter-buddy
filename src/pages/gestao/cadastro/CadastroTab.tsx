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
      <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
        <div className="flex items-center gap-2.5 mb-6">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Cadastro</h1>
          <span className="text-sm text-muted-foreground ml-1">— Configurações e cadastros do sistema</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setView(a.id)}
              className="group relative overflow-hidden rounded-xl border border-[hsl(210_30%_85%)] bg-card text-left transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(210_30%_80%)]/20 hover:-translate-y-0.5 hover:border-[hsl(210_35%_70%)]"
              style={{ borderTop: '3px solid hsl(212 35% 25%)' }}
            >
              <div className="flex items-center gap-5 px-6 py-5">
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
      {view === "produto" && <ProdutoVeiculo />}
      {view === "opcionais-assoc" && <OpcionaisAssociado />}
      {view === "opcionais-veic" && <OpcionaisVeiculo />}
      {view === "cooperativa" && <CadastrarCooperativa />}
      {view === "regional" && <CadastrarRegional />}
      {view === "voluntario" && <CadastrarVoluntario />}
    </div>
  );
}
