import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import {
  LayoutDashboard, Wallet, Receipt, ArrowLeftRight, TrendingDown,
  TrendingUp, Building2, FileBarChart, FileText, FolderTree,
  LineChart, PieChart, BarChart3, Building, DollarSign,
  ChevronLeft, LogOut,
} from "lucide-react";

import DashboardFinanceiro from "./dashboard/DashboardFinanceiro";
import FluxoDiarioTab from "./fluxo-diario/FluxoDiarioTab";
import BoletosTab from "./boletos/BoletosTab";
import ConciliacaoTab from "./conciliacao/ConciliacaoTab";
import ContasPagarTab from "./contas-pagar/ContasPagarTab";
import ContasReceberTab from "./contas-receber/ContasReceberTab";
import ExtratoBancarioTab from "./extrato/ExtratoBancarioTab";
import DRETab from "./dre/DRETab";
import NotasFiscaisTab from "./notas-fiscais/NotasFiscaisTab";
import CentroCustosTab from "./centro-custos/CentroCustosTab";
import ProjecaoDespesasTab from "./projecao-despesas/ProjecaoDespesasTab";
import RecebimentosCategoriaTab from "./recebimentos-categoria/RecebimentosCategoriaTab";
import AnaliseCustoTab from "./analise-custo/AnaliseCustoTab";
import AnaliseCooperativaTab from "./analise-cooperativa/AnaliseCooperativaTab";
import RelatoriosFinanceiroTab from "./relatorios/RelatoriosFinanceiroTab";

const financeiroTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fluxo-diario", label: "Fluxo Diário", icon: Wallet },
  { id: "boletos", label: "Boletos", icon: Receipt },
  { id: "conciliacao", label: "Conciliação", icon: ArrowLeftRight },
  { id: "contas-pagar", label: "Contas a Pagar", icon: TrendingDown },
  { id: "contas-receber", label: "Contas a Receber", icon: TrendingUp },
  { id: "extrato", label: "Extrato Bancário", icon: Building2 },
  { id: "dre", label: "DRE", icon: FileBarChart },
  { id: "notas-fiscais", label: "Notas Fiscais", icon: FileText },
  { id: "centro-custos", label: "Centro de Custos", icon: FolderTree },
  { id: "projecao", label: "Projeção Despesas", icon: LineChart },
  { id: "recebimentos", label: "Receb. Categoria", icon: PieChart },
  { id: "custo-faturamento", label: "Custo vs Faturamento", icon: BarChart3 },
  { id: "cooperativa", label: "Por Cooperativa", icon: Building },
  { id: "relatorios", label: "Relatórios", icon: FileBarChart },
];

export default function FinanceiroModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brand } = useBrand();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardFinanceiro />;
      case "fluxo-diario": return <FluxoDiarioTab />;
      case "boletos": return <BoletosTab />;
      case "conciliacao": return <ConciliacaoTab />;
      case "contas-pagar": return <ContasPagarTab />;
      case "contas-receber": return <ContasReceberTab />;
      case "extrato": return <ExtratoBancarioTab />;
      case "dre": return <DRETab />;
      case "notas-fiscais": return <NotasFiscaisTab />;
      case "centro-custos": return <CentroCustosTab />;
      case "projecao": return <ProjecaoDespesasTab />;
      case "recebimentos": return <RecebimentosCategoriaTab />;
      case "custo-faturamento": return <AnaliseCustoTab />;
      case "cooperativa": return <AnaliseCooperativaTab />;
      case "relatorios": return <RelatoriosFinanceiroTab />;
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
