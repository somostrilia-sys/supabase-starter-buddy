import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import {
  Wallet, PieChart, ArrowLeftRight, TrendingDown,
  LineChart, FileBarChart, BarChart3, Building,
  ChevronLeft, LogOut,
} from "lucide-react";

import FluxoCaixaTab from "./fluxo-caixa/FluxoCaixaTab";
import RecebimentosCategoriaTab from "./recebimentos-categoria/RecebimentosCategoriaTab";
import ConciliacaoTab from "./conciliacao/ConciliacaoTab";
import ContasPagarTab from "./contas-pagar/ContasPagarTab";
import ProjecaoDespesasTab from "./projecao-despesas/ProjecaoDespesasTab";
import RelatoriosFinanceiroTab from "./relatorios/RelatoriosFinanceiroTab";
import AnaliseCustoTab from "./analise-custo/AnaliseCustoTab";
import AnaliseCooperativaTab from "./analise-cooperativa/AnaliseCooperativaTab";

const financeiroTabs = [
  { id: "fluxo-caixa", label: "Fluxo de Caixa", icon: Wallet },
  { id: "recebimentos", label: "Recebimentos", icon: PieChart },
  { id: "conciliacao", label: "Conciliação", icon: ArrowLeftRight },
  { id: "contas-pagar", label: "Contas a Pagar", icon: TrendingDown },
  { id: "projecao", label: "Projeção", icon: LineChart },
  { id: "relatorios", label: "Relatórios", icon: FileBarChart },
  { id: "analise-consultor", label: "Análise Consultor", icon: BarChart3 },
  { id: "analise-cooperativa", label: "Análise Cooperativa", icon: Building },
];

export default function FinanceiroModule() {
  const [activeTab, setActiveTab] = useState("fluxo-caixa");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brand } = useBrand();

  const renderContent = () => {
    switch (activeTab) {
      case "fluxo-caixa": return <FluxoCaixaTab />;
      case "recebimentos": return <RecebimentosCategoriaTab />;
      case "conciliacao": return <ConciliacaoTab />;
      case "contas-pagar": return <ContasPagarTab />;
      case "projecao": return <ProjecaoDespesasTab />;
      case "relatorios": return <RelatoriosFinanceiroTab />;
      case "analise-consultor": return <AnaliseCustoTab />;
      case "analise-cooperativa": return <AnaliseCooperativaTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b shrink-0" style={{ backgroundColor: `hsl(${brand.headerBg})` }}>
        <div className="flex items-center h-14 px-6 lg:px-8 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10 h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Painel</span>
          </Button>

          <div className="h-5 w-px bg-white/20" />

          <div className="flex items-center gap-3">
            {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="h-8 object-contain" />}
            <span className="font-semibold text-sm text-white">Financeiro</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-white/50 hidden md:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b shrink-0" style={{ backgroundColor: `hsl(${brand.tabBg})` }}>
        <div className="px-6 lg:px-8">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-0">
              {financeiroTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-[13px] whitespace-nowrap transition-colors font-medium ${
                      isActive
                        ? ""
                        : "text-[hsl(210_20%_45%)] hover:text-[hsl(210_30%_30%)] hover:bg-white/40"
                    }`}
                    style={isActive ? { backgroundColor: `hsl(${brand.tabActiveBg})`, color: brand.tabActiveText } : undefined}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
