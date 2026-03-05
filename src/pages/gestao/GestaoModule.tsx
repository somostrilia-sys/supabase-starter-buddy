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
import AssociadoTab from "./associado/AssociadoTab";
import VeiculoTab from "./veiculo/VeiculoTab";
import CadastroTab from "./cadastro/CadastroTab";
import FerramentasTab from "./ferramentas/FerramentasTab";
import ParametrosTab from "./parametros/ParametrosTab";

const gestaoTabs = [
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
  const [activeTab, setActiveTab] = useState("associado");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "associado":
        return <AssociadoTab />;
      case "veiculo":
        return <VeiculoTab />;
      case "cadastro":
        return <CadastroTab />;
      case "ferramentas":
        return <FerramentasTab />;
      case "parametros":
        return <ParametrosTab />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              {(() => {
                const tab = gestaoTabs.find(t => t.id === activeTab);
                if (tab) {
                  const Icon = tab.icon;
                  return <Icon className="h-8 w-8" />;
                }
                return null;
              })()}
            </div>
            <p className="text-lg font-medium">
              {gestaoTabs.find(t => t.id === activeTab)?.label}
            </p>
            <p className="text-sm">Esta aba será implementada nas próximas partes.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm shrink-0">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-wide">Gestão</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b bg-card/60 backdrop-blur-sm shrink-0">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-0.5 px-4 py-1">
            {gestaoTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors whitespace-nowrap rounded-t-md ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
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
