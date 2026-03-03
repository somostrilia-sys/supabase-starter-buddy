import {
  Shield,
  Users,
  Car,
  MapPin,
  Building2,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Package,
  UserCog,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  LayoutDashboard,
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
import { cn } from "@/lib/utils";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const location = useLocation();

  const gestaoActive = gestaoItems.some((i) => location.pathname === i.url || location.pathname.startsWith(i.url + "/"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-sidebar-primary-foreground tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                GIA
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-tight uppercase tracking-widest">
                Proteção Veicular
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Dashboard link */}
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

        {/* Módulo Gestão */}
        <Collapsible defaultOpen={gestaoActive || true} className="mt-2">
          <SidebarGroup className="p-0">
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between w-full cursor-pointer text-sidebar-foreground/50 hover:text-sidebar-foreground/80 text-[10px] uppercase tracking-widest px-3 py-2">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-sidebar-primary" />
                  {!collapsed && "Gestão"}
                </span>
                {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gestaoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
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
