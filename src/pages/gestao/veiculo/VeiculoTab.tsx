import { useState } from "react";
import {
  Car, CarFront, Search, UserPlus, ClipboardCheck, BarChart3,
  ArrowLeft, ChevronRight, Link2, RefreshCw, User, CheckCircle, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CadastrarVeiculo from "./CadastrarVeiculo";
import ConsultarVeiculo from "./ConsultarVeiculo";
import CadastrarAgregado from "./CadastrarAgregado";
import CadastrarVistoria from "./CadastrarVistoria";
import RelatoriosVeiculo from "./RelatoriosVeiculo";
import ConsultarAgregado from "./ConsultarAgregado";
import GestaoAgregados from "./GestaoAgregados";
import Condutor from "./Condutor";
import Proprietario from "./Proprietario";
import AprovarCadastro from "./AprovarCadastro";

type View = "menu" | "cadastrar" | "consultar" | "agregado" | "vistoria" | "relatorios" | "consultar-agregado" | "gestao-agregados" | "condutor" | "proprietario" | "aprovar-cadastro";

const actions = [
  { id: "cadastrar" as const, title: "Cadastrar Veículo", desc: "Cadastro completo com consulta FIPE integrada e vinculação ao associado", icon: CarFront, color: "from-emerald-500 to-emerald-600" },
  { id: "consultar" as const, title: "Consultar / Alterar Veículo", desc: "Busca por placa, chassi ou associado com edição e histórico", icon: Search, color: "from-blue-500 to-blue-600" },
  { id: "agregado" as const, title: "Cadastrar Agregado", desc: "Cadastro completo de veículo agregado vinculado a um veículo principal", icon: UserPlus, color: "from-amber-500 to-amber-600" },
  { id: "consultar-agregado" as const, title: "Consultar / Alterar Agregado", desc: "Busca, edição e histórico financeiro de veículos agregados", icon: Search, color: "from-orange-500 to-orange-600" },
  { id: "gestao-agregados" as const, title: "Gestão de Agregados", desc: "Vincular, transformar veículo em agregado e vice-versa", icon: RefreshCw, color: "from-purple-500 to-purple-600" },
  { id: "condutor" as const, title: "Condutor", desc: "Cadastrar, consultar, vincular e classificar condutores", icon: Users, color: "from-cyan-500 to-cyan-600" },
  { id: "proprietario" as const, title: "Proprietário", desc: "CRUD completo de proprietários de veículos", icon: User, color: "from-teal-500 to-teal-600" },
  { id: "aprovar-cadastro" as const, title: "Aprovar Cadastro", desc: "Aprovação e negação em lote de cadastros de veículos", icon: CheckCircle, color: "from-green-500 to-green-600" },
  { id: "vistoria" as const, title: "Cadastrar Vistoria", desc: "Registrar vistoria com checklist, acessórios, avarias e fotos", icon: ClipboardCheck, color: "from-indigo-500 to-indigo-600" },
  { id: "relatorios" as const, title: "Relatórios de Veículo", desc: "Relatórios de alterações, geral de veículos e vinculação financeira", icon: BarChart3, color: "from-rose-500 to-rose-600" },
];

export default function VeiculoTab() {
  const [view, setView] = useState<View>("menu");

  if (view === "menu") {
    return (
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Veículo</h1>
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
      {view === "cadastrar" && <CadastrarVeiculo />}
      {view === "consultar" && <ConsultarVeiculo />}
      {view === "agregado" && <CadastrarAgregado />}
      {view === "consultar-agregado" && <ConsultarAgregado />}
      {view === "gestao-agregados" && <GestaoAgregados />}
      {view === "condutor" && <Condutor />}
      {view === "proprietario" && <Proprietario />}
      {view === "aprovar-cadastro" && <AprovarCadastro />}
      {view === "vistoria" && <CadastrarVistoria />}
      {view === "relatorios" && <RelatoriosVeiculo />}
    </div>
  );
}
