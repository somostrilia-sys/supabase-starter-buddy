import {
  Shield, Users, Car, AlertTriangle, LogOut,
  LayoutDashboard, DollarSign, Target, Kanban, Contact,
  Activity, BarChart3, Building, FileSpreadsheet,
  SlidersHorizontal, Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "PRINCIPAL",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Pipeline", url: "/vendas/pipeline", icon: Kanban },
      { title: "Negociações", url: "/vendas/negociacoes", icon: Target },
      { title: "Atividades", url: "/vendas/atividades", icon: Activity },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { title: "Associados", url: "/associados", icon: Users },
      { title: "Veículos", url: "/veiculos", icon: Car },
      { title: "Sinistros", url: "/sinistros", icon: AlertTriangle },
    ],
  },
  {
    label: "FINANCEIRO",
    items: [
      { title: "Financeiro", url: "/financeiro/fluxo-diario", icon: DollarSign },
      { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "CONFIGURAÇÕES",
    items: [
      { title: "Ferramentas", url: "/vendas/ferramentas", icon: FileSpreadsheet },
      { title: "Minha Empresa", url: "/vendas/minha-empresa", icon: Building },
      { title: "Configurações", url: "/parametros", icon: SlidersHorizontal },
    ],
  },
];

function isItemActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(url + "/");
}

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-base text-sidebar-accent-foreground tracking-wide">GIA</span>
            <p className="text-[11px] text-sidebar-foreground leading-tight">Gestão Integrada de Associações</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {menuSections.map((section) => (
            <div key={section.label}>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/60 px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(location.pathname, item.url);
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.url === "/"}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px] border-primary -ml-px"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
              {user?.user_metadata?.full_name || "Usuário"}
            </p>
            <p className="text-[11px] text-sidebar-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
