import { useState } from "react";
import {
  Package, CheckSquare, Car, Building2, MapPin, UserCog,
  ArrowLeft, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProdutoVeiculo from "./ProdutoVeiculo";
import OpcionaisAssociado from "./OpcionaisAssociado";
import OpcionaisVeiculo from "./OpcionaisVeiculo";
import CadastrarCooperativa from "./CadastrarCooperativa";
import CadastrarRegional from "./CadastrarRegional";
import CadastrarVoluntario from "./CadastrarVoluntario";

type View = "menu" | "produto" | "opcionais-assoc" | "opcionais-veic" | "cooperativa" | "regional" | "voluntario";

const actions = [
  { id: "produto" as const, title: "Produto Veículo", desc: "Cadastro de coberturas, encargos e benefícios vinculados ao veículo/associado", icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "opcionais-assoc" as const, title: "Opcionais do Associado", desc: "Categorias opcionais pré-cadastradas para o associado", icon: CheckSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "opcionais-veic" as const, title: "Opcionais do Veículo", desc: "Tipos, categorias e cotas de veículo configuráveis", icon: Car, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "cooperativa" as const, title: "Cadastrar Cooperativa", desc: "Filiais da associação com CNPJ, endereço e vinculação a regionais", icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "regional" as const, title: "Cadastrar Regional", desc: "Regras geográficas e agrupamento de cooperativas por região", icon: MapPin, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "voluntario" as const, title: "Cadastrar Voluntário / Usuário", desc: "Colaboradores administrativos e vendedores do sistema", icon: UserCog, color: "text-teal-500", bg: "bg-teal-500/10" },
];

export default function CadastroTab() {
  const [view, setView] = useState<View>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
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
      {view === "produto" && <ProdutoVeiculo />}
      {view === "opcionais-assoc" && <OpcionaisAssociado />}
      {view === "opcionais-veic" && <OpcionaisVeiculo />}
      {view === "cooperativa" && <CadastrarCooperativa />}
      {view === "regional" && <CadastrarRegional />}
      {view === "voluntario" && <CadastrarVoluntario />}
    </div>
  );
}
