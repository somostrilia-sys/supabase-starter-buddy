import { useState } from "react";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Target, Activity,
  Users, Car, AlertTriangle,
  DollarSign, BarChart3,
  FileSpreadsheet, Building, SlidersHorizontal,
} from "lucide-react";

const allItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/vendas/pipeline", icon: Kanban },
  { title: "Negociações", url: "/vendas/negociacoes", icon: Target },
  { title: "Atividades", url: "/vendas/atividades", icon: Activity },
  { title: "Associados", url: "/associados", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Car },
  { title: "Sinistros", url: "/sinistros", icon: AlertTriangle },
  { title: "Financeiro", url: "/financeiro/fluxo-diario", icon: DollarSign },
  { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart3 },
  { title: "Ferramentas", url: "/vendas/ferramentas", icon: FileSpreadsheet },
  { title: "Minha Empresa", url: "/vendas/minha-empresa", icon: Building },
  { title: "Configurações", url: "/parametros", icon: SlidersHorizontal },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-9 w-9">
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar z-50 flex flex-col shadow-modal">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sidebar-accent-foreground">GIA</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-sidebar-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {allItems.map((item) => {
                const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.url === "/"}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                    activeClassName=""
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-sidebar-border">
              <Button
                variant="ghost"
                onClick={() => { signOut(); setOpen(false); }}
                className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
