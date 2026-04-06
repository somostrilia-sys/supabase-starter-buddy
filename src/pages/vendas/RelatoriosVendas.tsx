import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

import DashboardTab from "./relatorios/DashboardTab";
import FunilTab from "./relatorios/FunilTab";
import MotivosTab from "./relatorios/MotivosTab";
import RankingTab from "./relatorios/RankingTab";
import OrigemLeadsTab from "./relatorios/OrigemLeadsTab";
import BancoDadosTab from "./relatorios/BancoDadosTab";
import GrupoTagsTab from "./relatorios/GrupoTagsTab";
import ResumoMetasTab from "./relatorios/ResumoMetasTab";
import VeiculosSemCoberturaTab from "./relatorios/VeiculosSemCoberturaTab";
import ExtratoComissoesTab from "./relatorios/ExtratoComissoesTab";

export default function RelatoriosVendas() {
  const { usuario, isConsultor, isGestor, canViewAllData, cooperativas: minhasCoops } = useUsuario();
  const [tab, setTab] = useState("dashboard");
  const [fCoop, setFCoop] = useState("all");
  const [fConsultor, setFConsultor] = useState("all");

  // Auto-scope for consultores
  const scopedConsultor = isConsultor && usuario?.nome ? usuario.nome : fConsultor;
  const scopedCoop = isGestor && !canViewAllData && fCoop === "all" && minhasCoops.length > 0 ? minhasCoops[0] : fCoop;
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: cooperativas = [] } = useQuery({
    queryKey: ["relatorios-cooperativas"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("negociacoes")
        .select("cooperativa")
        .not("cooperativa", "is", null);
      const unique = [...new Set((data || []).map((r: any) => r.cooperativa).filter(Boolean))] as string[];
      return unique.sort();
    },
  });

  const { data: consultores = [] } = useQuery({
    queryKey: ["relatorios-consultores"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("usuarios")
        .select("nome")
        .eq("grupo_permissao", "consultor")
        .eq("status", "ativo");
      return (data || []).map((r: any) => r.nome as string).sort();
    },
  });

  const activeFilters = [fCoop !== "all", fConsultor !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  function clearFilters() { setFCoop("all"); setFConsultor("all"); setFDateStart(undefined); setFDateEnd(undefined); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Inteligência comercial e relatórios gerenciais</p>
        </div>
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-3.5 w-3.5 mr-1" />Filtros Globais
          {activeFilters > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilters}</Badge>}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                <Select value={fCoop} onValueChange={setFCoop}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Período Início</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">Período Fim</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap gap-1">
          {[
            { v: "dashboard", l: "Dashboard" },
            { v: "funil", l: "Funil de Vendas" },
            { v: "motivos", l: "Motivos de Perda" },
            { v: "ranking", l: "Ranking Consultores" },
            { v: "origens", l: "Origem dos Leads" },
            { v: "banco", l: "Banco de Dados" },
            { v: "tags", l: "Grupos de Tags" },
            { v: "metas", l: "Resumo de Metas" },
            { v: "veiculos", l: "Veículos s/ Cobertura" },
            { v: "extrato-comissoes", l: "Extrato de Comissões" },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v} className="text-xs">{t.l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="funil"><FunilTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="motivos"><MotivosTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="ranking"><RankingTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="origens"><OrigemLeadsTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="banco"><BancoDadosTab /></TabsContent>
        <TabsContent value="tags"><GrupoTagsTab /></TabsContent>
        <TabsContent value="metas"><ResumoMetasTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
        <TabsContent value="veiculos"><VeiculosSemCoberturaTab /></TabsContent>
        <TabsContent value="extrato-comissoes"><ExtratoComissoesTab filters={{ cooperativa: scopedCoop, consultor: scopedConsultor, dateStart: fDateStart, dateEnd: fDateEnd }} /></TabsContent>
      </Tabs>
    </div>
  );
}
