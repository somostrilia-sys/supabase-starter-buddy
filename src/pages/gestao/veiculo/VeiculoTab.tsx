import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Car, CarFront, Search, UserPlus, ClipboardCheck, BarChart3,
  ArrowLeft, ChevronRight, RefreshCw, User, CheckCircle, Users,
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
  { id: "cadastrar" as const, title: "Cadastrar Veículo", desc: "Cadastro completo com consulta FIPE integrada e vinculação ao associado", icon: CarFront },
  { id: "consultar" as const, title: "Consultar / Alterar Veículo", desc: "Busca por placa, chassi ou associado com edição e histórico", icon: Search },
  { id: "agregado" as const, title: "Cadastrar Agregado", desc: "Cadastro completo de veículo agregado vinculado a um veículo principal", icon: UserPlus },
  { id: "consultar-agregado" as const, title: "Consultar / Alterar Agregado", desc: "Busca, edição e histórico financeiro de veículos agregados", icon: Search },
  { id: "gestao-agregados" as const, title: "Gestão de Agregados", desc: "Vincular, transformar veículo em agregado e vice-versa", icon: RefreshCw },
  { id: "condutor" as const, title: "Condutor", desc: "Cadastrar, consultar, vincular e classificar condutores", icon: Users },
  { id: "proprietario" as const, title: "Proprietário", desc: "CRUD completo de proprietários de veículos", icon: User },
  { id: "aprovar-cadastro" as const, title: "Aprovar Cadastro", desc: "Aprovação e negação em lote de cadastros de veículos", icon: CheckCircle },
  { id: "vistoria" as const, title: "Cadastrar Vistoria", desc: "Registrar vistoria com checklist, acessórios, avarias e fotos", icon: ClipboardCheck },
  { id: "relatorios" as const, title: "Relatórios de Veículo", desc: "Relatórios de alterações, geral de veículos e vinculação financeira", icon: BarChart3 },
];

export default function VeiculoTab() {
  const [view, setView] = useState<View>("menu");
  const [searchParams] = useSearchParams();

  // Se tem query param placa, abrir direto em consultar
  useEffect(() => {
    if (searchParams.get("placa")) {
      setView("consultar");
    }
  }, [searchParams]);

  if (view === "menu") {
    return (
      <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
        <div className="flex items-center gap-2.5 mb-6">
          <Car className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Veículo</h1>
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
