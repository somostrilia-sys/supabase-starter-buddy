import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, Car, ClipboardList, Wrench, SlidersHorizontal,
  DollarSign, Truck, AlertTriangle, BarChart3, FileText,
  Globe, ChevronLeft, LayoutDashboard, LogOut, Shield,
} from "lucide-react";
import DashboardTab from "./dashboard/DashboardTab";
import AssociadoTab from "./associado/AssociadoTab";
import VeiculoTab from "./veiculo/VeiculoTab";
import CadastroTab from "./cadastro/CadastroTab";
import FerramentasTab from "./ferramentas/FerramentasTab";
import ParametrosTab from "./parametros/ParametrosTab";
import FinanceiroTab from "./financeiro/FinanceiroTab";
import FornecedorTab from "./fornecedor/FornecedorTab";
import EventoTab from "./evento/EventoTab";
import RelatoriosTab from "./relatorios/RelatoriosTab";
import DocumentacaoTab from "./documentacao/DocumentacaoTab";
import AreaClienteTab from "./area-cliente/AreaClienteTab";

const gestaoTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "associado", label: "Associado", icon: Users },
  { id: "veiculo", label: "Veículo", icon: Car },
  { id: "cadastro", label: "Cadastro", icon: ClipboardList },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench },
  { id: "parametros", label: "Parâmetros", icon: SlidersHorizontal },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "fornecedor", label: "Fornecedor", icon: Truck },
  { id: "evento", label: "Evento", icon: AlertTriangle },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "documentacao", label: "Documentação", icon: FileText },
  { id: "area-cliente", label: "Área do Cliente", icon: Globe },
];

export default function GestaoModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "associado": return <AssociadoTab />;
      case "veiculo": return <VeiculoTab />;
      case "cadastro": return <CadastroTab />;
      case "ferramentas": return <FerramentasTab />;
      case "parametros": return <ParametrosTab />;
      case "financeiro": return <FinanceiroTab />;
      case "fornecedor": return <FornecedorTab />;
      case "evento": return <EventoTab />;
      case "relatorios": return <RelatoriosTab />;
      case "documentacao": return <DocumentacaoTab />;
      case "area-cliente": return <AreaClienteTab />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
              {(() => {
                const tab = gestaoTabs.find(t => t.id === activeTab);
                if (tab) {
                  const Icon = tab.icon;
                  return <Icon className="h-6 w-6" />;
                }
                return null;
              })()}
            </div>
            <p className="text-base font-medium">
              {gestaoTabs.find(t => t.id === activeTab)?.label}
            </p>
            <p className="text-sm">Esta aba será implementada nas próximas partes.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — clean corporate bar */}
      <header className="border-b bg-card shrink-0">
        <div className="flex items-center h-12 px-4 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Gestão</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation — flat, no backdrop blur */}
      <nav className="border-b bg-card shrink-0">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-0 px-4">
            {gestaoTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "text-primary border-primary font-medium"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
