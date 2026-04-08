import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, Filter, Download, MessageSquare, Phone, Mail,
  ChevronLeft, ChevronRight, ExternalLink, Plus, Calendar, AlertTriangle, Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeadScope } from "@/hooks/usePermission";

interface ContatoRow {
  id: string;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  consultor: string;
  cooperativa: string;
  origem: string;
  stage: string;
  plano: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  valor_plano: number;
  created_at: string;
}

async function fetchContatos(scope?: { consultor?: string; cooperativas?: string[] }) {
  let q = (supabase as any)
    .from("negociacoes")
    .select("id, lead_nome, cpf_cnpj, telefone, email, consultor, cooperativa, origem, stage, plano, veiculo_modelo, veiculo_placa, valor_plano, created_at")
    .order("created_at", { ascending: false });
  if (scope?.consultor) q = q.eq("consultor", scope.consultor);
  if (scope?.cooperativas && scope.cooperativas.length > 0) q = q.in("cooperativa", scope.cooperativas);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ContatoRow[];
}

export default function Contatos() {
  const { scope, scopeReady } = useLeadScope();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<ContatoRow | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterConsultor, setFilterConsultor] = useState("all");
  const [filterCooperativa, setFilterCooperativa] = useState("all");

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ["contatos-negociacoes", scope?.consultor, scope?.cooperativas?.join(",")],
    queryFn: () => fetchContatos(scope),
    enabled: scopeReady,
  });

  // Deduplicate by cpf_cnpj or lead_nome to get unique contacts
  const contatosUnicos = useMemo(() => {
    const seen = new Map<string, ContatoRow & { negociacoes: number }>();
    for (const c of contatos) {
      const key = c.cpf_cnpj || c.lead_nome || c.id;
      if (seen.has(key)) {
        seen.get(key)!.negociacoes += 1;
      } else {
        seen.set(key, { ...c, negociacoes: 1 });
      }
    }
    return Array.from(seen.values());
  }, [contatos]);

  const contatosSemNome = contatosUnicos.filter((c) => !c.lead_nome?.trim()).length;

  const consultoresUnicos = useMemo(
    () => [...new Set(contatos.map((c) => c.consultor).filter(Boolean))],
    [contatos]
  );
  const cooperativasUnicas = useMemo(
    () => [...new Set(contatos.map((c) => c.cooperativa).filter(Boolean))],
    [contatos]
  );

  const now = Date.now();
  const day = 86400000;

  const filtered = useMemo(() => {
    let list = contatosUnicos;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.lead_nome?.toLowerCase().includes(s) ||
          c.cpf_cnpj?.includes(s) ||
          c.telefone?.includes(s) ||
          c.email?.toLowerCase().includes(s)
      );
    }
    if (tab === "novos") list = list.filter((c) => now - new Date(c.created_at).getTime() < 7 * day);
    if (tab === "antigos") list = list.filter((c) => now - new Date(c.created_at).getTime() > 90 * day);
    if (tab === "sem-dados") list = list.filter((c) => !c.email || !c.telefone);
    if (tab === "sem-nome") list = list.filter((c) => !c.lead_nome?.trim());
    if (tab === "concluidos") list = list.filter((c) => c.stage === "concluido");
    if (filterConsultor !== "all") list = list.filter((c) => c.consultor === filterConsultor);
    if (filterCooperativa !== "all") list = list.filter((c) => c.cooperativa === filterCooperativa);
    return list;
  }, [contatosUnicos, search, tab, filterConsultor, filterCooperativa, now]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  function initials(nome: string) {
    if (!nome?.trim()) return "—";
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando contatos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} contatos encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
          <Button size="sm" className="shadow-sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Contato
          </Button>
        </div>
      </div>

      {contatosSemNome > 0 && (
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-warning/25 bg-warning/8 text-warning text-xs cursor-pointer hover:bg-warning/15 transition-colors"
          onClick={() => {
            setTab("sem-nome");
            setPage(0);
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{contatosSemNome}</strong> contato{contatosSemNome > 1 ? "s" : ""} sem nome — clique
            para revisar
          </span>
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(0);
        }}
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
          <TabsTrigger value="novos" className="text-xs">Novos (7d)</TabsTrigger>
          <TabsTrigger value="antigos" className="text-xs">Antigos (+90d)</TabsTrigger>
          <TabsTrigger value="sem-dados" className="text-xs">Sem Dados</TabsTrigger>
          <TabsTrigger value="concluidos" className="text-xs">Concluidos</TabsTrigger>
          {contatosSemNome > 0 && (
            <TabsTrigger value="sem-nome" className="text-xs text-warning">
              Sem Nome ({contatosSemNome})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-xs">Consultor</Label>
                <Select value={filterConsultor} onValueChange={setFilterConsultor}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultoresUnicos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cooperativa</Label>
                <Select value={filterCooperativa} onValueChange={setFilterCooperativa}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cooperativasUnicas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => setFilterOpen(false)}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilterConsultor("all");
                  setFilterCooperativa("all");
                  setFilterOpen(false);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-[#747474] bg-muted/30">
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Nome</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">CPF/CNPJ</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Telefone</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Email</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Consultor</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Cadastro</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Stage</th>
                <th className="text-left p-3 text-[10px] font-semibold text-foreground/60 tracking-[0.06em] uppercase">Negoc.</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )}
              {pageData.map((c) => (
                <tr
                  key={c.id}
                  className="table-row-hover border-b-2 border-[#747474] hover:bg-muted/40 cursor-pointer"
                  onClick={() => setSelected(c)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback
                          className={`text-[10px] ${
                            !c.lead_nome?.trim()
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {initials(c.lead_nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`font-medium text-xs ${
                          !c.lead_nome?.trim() ? "italic text-warning" : ""
                        }`}
                      >
                        {c.lead_nome?.trim() || "Contato sem nome"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-xs font-mono text-muted-foreground">{c.cpf_cnpj || "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{c.telefone || "—"}</span>
                      {c.telefone && (
                        <MessageSquare
                          className="h-3.5 w-3.5 text-[#25D366] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const phone = c.telefone.replace(/\D/g, "");
                            window.open(`https://wa.me/55${phone}`, "_blank");
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{c.email || "—"}</td>
                  <td className="p-3 text-xs">{c.consultor || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">{c.stage}</Badge>
                  </td>
                  <td className="p-3">
                    {(c as any).negociacoes > 0 ? (
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        {(c as any).negociacoes}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por pagina:</span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => {
              setPerPage(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length > 0 ? `${page * perPage + 1}-${Math.min((page + 1) * perPage, filtered.length)} de ${filtered.length}` : "0 resultados"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-96">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {initials(selected.lead_nome)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{selected.lead_nome || "Sem nome"}</h3>
                <p className="text-xs text-muted-foreground">{selected.cpf_cnpj || "Sem CPF/CNPJ"}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selected.telefone || "Sem telefone"}
                  {selected.telefone && (
                    <MessageSquare
                      className="h-4 w-4 text-[#25D366] ml-auto cursor-pointer"
                      onClick={() => {
                        const phone = selected.telefone.replace(/\D/g, "");
                        window.open(`https://wa.me/55${phone}`, "_blank");
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selected.email || "Sem email"}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Cadastro: {new Date(selected.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Dados da Negociacao</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veiculo:</span>
                    <span>{selected.veiculo_modelo} - {selected.veiculo_placa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <span>{selected.plano || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-medium">
                      {selected.valor_plano
                        ? selected.valor_plano.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <Badge variant="outline" className="text-[10px]">{selected.stage}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consultor:</span>
                    <span>{selected.consultor || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cooperativa:</span>
                    <span>{selected.cooperativa || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origem:</span>
                    <span>{selected.origem || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
