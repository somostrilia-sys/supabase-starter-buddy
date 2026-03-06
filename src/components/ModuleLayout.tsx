import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Users, Car, MapPin, Building2, AlertTriangle, FileText,
  ClipboardCheck, Package, UserCog, SlidersHorizontal,
  DollarSign, Wallet, Receipt, ArrowLeftRight, BarChart3,
  Target, Kanban, Contact, Activity, CalendarDays, Crosshair,
  Tag, FileSpreadsheet, Upload, UsersRound, Building,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  { title: "Boletos", url: "/financeiro/boletos", icon: Receipt },
  { title: "Conciliação", url: "/financeiro/conciliacao", icon: ArrowLeftRight },
  { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart3 },
];

const vendasItems = [
  { title: "Pipeline", url: "/vendas/pipeline", icon: Kanban },
  { title: "Contatos", url: "/vendas/contatos", icon: Contact },
  { title: "Atividades", url: "/vendas/atividades", icon: Activity },
  { title: "Calendário", url: "/vendas/calendario", icon: CalendarDays },
  { title: "Metas", url: "/vendas/metas", icon: Crosshair },
  { title: "Tags", url: "/vendas/tags", icon: Tag },
  { title: "Formulários", url: "/vendas/formularios", icon: FileSpreadsheet },
  { title: "Importar Leads", url: "/vendas/importar", icon: Upload },
  { title: "Afiliados", url: "/vendas/afiliados", icon: UsersRound },
  { title: "Relatórios", url: "/vendas/relatorios", icon: BarChart3 },
  { title: "Minha Empresa", url: "/vendas/minha-empresa", icon: Building },
];

const moduleConfigs = [
  {
    prefix: ["/gestao", "/associados", "/veiculos", "/regionais", "/cooperativas", "/sinistros", "/documentacao", "/vistorias", "/produtos", "/usuarios", "/parametros"],
    label: "Gestão",
    icon: Shield,
    items: gestaoItems,
  },
  {
    prefix: ["/financeiro"],
    label: "Financeiro",
    icon: DollarSign,
    items: financeiroItems,
  },
  {
    prefix: ["/vendas"],
    label: "Vendas",
    icon: Target,
    items: vendasItems,
  },
];

function getActiveModule(pathname: string) {
  for (const mod of moduleConfigs) {
    if (mod.prefix.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return mod;
    }
  }
  return null;
}

export function ModuleLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const activeMod = getActiveModule(location.pathname);

  if (!activeMod) return <>{children}</>;

  return (
    <div className="space-y-0">
      {/* Module sub-navigation */}
      <nav className="-mx-6 -mt-6 mb-6 border-b border-border bg-card/50">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-0.5 px-6 py-1">
            {activeMod.items.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition-all whitespace-nowrap rounded-md ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  activeClassName=""
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </nav>

      {children}
    </div>
  );
}
