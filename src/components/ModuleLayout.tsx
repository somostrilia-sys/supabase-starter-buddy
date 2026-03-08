import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import {
  Shield, Users, Car, MapPin, Building2, AlertTriangle, FileText,
  ClipboardCheck, Package, UserCog, SlidersHorizontal,
  DollarSign, Wallet, Receipt, ArrowLeftRight, BarChart3,
  Target, Kanban, Contact, Activity, CalendarDays, Crosshair,
  Tag, FileSpreadsheet, Upload, UsersRound, Building,
  LayoutDashboard, LogOut, ChevronLeft, Globe,
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
  { title: "Dashboard", url: "/vendas/dashboard", icon: LayoutDashboard },
  { title: "Pipeline", url: "/vendas/pipeline", icon: Kanban },
  { title: "Contatos", url: "/vendas/contatos", icon: Contact },
  { title: "Atividades", url: "/vendas/atividades", icon: Activity },
  { title: "Calendário", url: "/vendas/calendario", icon: CalendarDays },
  { title: "Metas", url: "/vendas/metas", icon: Crosshair },
  { title: "Vistorias", url: "/vendas/vistorias", icon: ClipboardCheck },
  { title: "Landing Pages", url: "/vendas/landing-pages", icon: Globe },
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
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { brand } = useBrand();
  const activeMod = getActiveModule(location.pathname);

  if (!activeMod) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header bar */}
      <header className="shrink-0 gradient-hero border-b border-white/10">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-white/15" />

          <div className="flex items-center gap-2.5">
            {brand.logoUrl && (
              <img src={brand.logoUrl} alt={brand.name} className="h-7 object-contain brightness-0 invert opacity-80" />
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <activeMod.icon className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide text-white">{activeMod.label}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Module navigation */}
      <nav className="border-b bg-card shrink-0 shadow-sm">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-0.5 px-4 py-1">
            {activeMod.items.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? "text-accent font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  activeClassName=""
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
