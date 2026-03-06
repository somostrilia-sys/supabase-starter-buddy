import {
  Shield, Users, Car, MapPin, Building2, AlertTriangle, FileText,
  ClipboardCheck, Package, UserCog, SlidersHorizontal, LogOut,
  ChevronDown, LayoutDashboard, DollarSign, Target, CalendarDays,
  BarChart3, Receipt, ArrowLeftRight, Wallet, Kanban, Contact, Building,
  Activity, UsersRound, Tag, FileSpreadsheet, Upload, Crosshair,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const gestaoItems = [
  { title: "Associados", url: "/associados", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Car },
  { title: "Regionais", url: "/regionais", icon: MapPin },
  { title: "Cooperativas", url: "/cooperativas", icon: Building2 },
  { title: "Eventos/Sinistros", url: "/sinistros", icon: AlertTriangle },
  { title: "Documentação", url: "/documentacao", icon: FileText },
  { title: "Vistorias", url: "/vistorias", icon: ClipboardCheck },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Usuários", url: "/usuarios", icon: UserCog },
  { title: "Parâmetros", url: "/parametros", icon: SlidersHorizontal },
];

const financeiroItems = [
  { title: "Fluxo Diário", url: "/financeiro/fluxo-diario", icon: Wallet },
  { title: "Boletos Recebidos", url: "/financeiro/boletos", icon: Receipt },
  { title: "Conciliação Bancária", url: "/financeiro/conciliacao", icon: ArrowLeftRight },
  { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart3 },
];

const vendasItems = [
  { title: "Pipeline", url: "/vendas/pipeline", icon: Kanban },
  { title: "Negociações", url: "/vendas/negociacoes", icon: Target },
  { title: "Contatos", url: "/vendas/contatos", icon: Contact },
  { title: "Atividades", url: "/vendas/atividades", icon: Activity },
  { title: "Calendário", url: "/vendas/calendario", icon: CalendarDays },
  { title: "Metas", url: "/vendas/metas", icon: Crosshair },
  { title: "Tags", url: "/vendas/tags", icon: Tag },
  { title: "Formulários", url: "/vendas/formularios", icon: FileSpreadsheet },
  { title: "Importar Leads", url: "/vendas/importar", icon: Upload },
  { title: "Afiliados", url: "/vendas/afiliados", icon: UsersRound },
  { title: "Relatórios", url: "/vendas/relatorios", icon: BarChart3 },
  { title: "Financeiro", url: "/vendas/financeiro", icon: DollarSign },
  { title: "Ferramentas", url: "/vendas/ferramentas", icon: FileSpreadsheet },
  { title: "Minha Empresa", url: "/vendas/minha-empresa", icon: Building },
];

interface ModuleGroupProps {
  label: string;
  icon: React.ElementType;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  pathname: string;
}

function ModuleGroup({ label, icon: ModIcon, items, collapsed, pathname }: ModuleGroupProps) {
  const isActive = items.some((i) => pathname === i.url || pathname.startsWith(i.url + "/"));

  return (
    <Collapsible defaultOpen={isActive} className="mt-1">
      <SidebarGroup className="p-0">
        <CollapsibleTrigger className="w-full group">
          <SidebarGroupLabel className="flex items-center justify-between w-full cursor-pointer text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-[10px] uppercase tracking-widest px-3 py-2">
            <span className="flex items-center gap-2">
              <ModIcon className="h-3.5 w-3.5" />
              {!collapsed && label}
            </span>
            {!collapsed && (
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/60 text-sidebar-foreground/70 text-[13px]"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-primary-foreground tracking-tight">
                GIA
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 leading-tight uppercase tracking-wider">
                Proteção Veicular
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 overflow-y-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/"
                end
                className="hover:bg-sidebar-accent/60"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <ModuleGroup
          label="Gestão"
          icon={Shield}
          items={gestaoItems}
          collapsed={collapsed}
          pathname={location.pathname}
        />

        <ModuleGroup
          label="Financeiro"
          icon={DollarSign}
          items={financeiroItems}
          collapsed={collapsed}
          pathname={location.pathname}
        />

        <ModuleGroup
          label="Vendas"
          icon={Target}
          items={vendasItems}
          collapsed={collapsed}
          pathname={location.pathname}
        />
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-[11px] text-sidebar-foreground/40 truncate mb-2 px-2">
            {user?.email}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
