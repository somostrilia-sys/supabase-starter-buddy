import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const situacoesVeiculo = ["Todos", "Ativo", "Inativo", "Negado", "Pendente", "Inadimplente", "Inativo-Com Pendência", "Pendente de Revistoria", "Inativo-Retirada Rastreador"];
const situacoesAssociado = ["Todos", "Ativo", "Inativo", "Negado", "Pendente", "Inadimplente"];
const cooperativasList = ["Todos", "Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste", "Cooperativa Nordeste"];

const statusColor = (s: string) => {
  switch (s) {
    case "Ativo": return "bg-success/10 text-success dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Inativo": return "bg-destructive/8 text-destructive dark:bg-red-900/30 dark:text-red-400";
    case "Pendente": return "bg-warning/10 text-warning dark:bg-amber-900/30 dark:text-warning";
    case "Negado": return "bg-destructive/8 text-destructive dark:bg-red-900/30 dark:text-red-400";
    case "Inadimplente": return "bg-warning/10 text-warning dark:bg-orange-900/30 dark:text-orange-400";
    default: return "bg-muted text-muted-foreground";
  }
};

type RegistroRow = {
  id: number;
  nome: string;
  placa: string;
  regional: string;
  dataCadastro: string;
  dataContrato: string;
  diaVenc: number;
  valorFipe: string;
  cota: string;
  sitVeiculo: string;
  sitAssociado: string;
  cooperativa: string;
  tipoAdesao: string;
  opApp: string;
  validacao: string;
  produtos: number;
};

export default function AprovarCadastro() {
  const [sitVeicSel, setSitVeicSel] = useState<string[]>(["Todos"]);
  const [sitAssocSel, setSitAssocSel] = useState<string[]>(["Todos"]);
  const [coopSel, setCoopSel] = useState<string[]>(["Todos"]);
  const [nome, setNome] = useState("");
  const [placa, setPlaca] = useState("");
  const [searchInline, setSearchInline] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<RegistroRow[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const toggleCheckbox = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (val === "Todos") { setter(arr.includes("Todos") ? [] : ["Todos"]); return; }
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr.filter(x => x !== "Todos"), val];
    setter(next);
  };

  const pesquisar = async () => {
    setLoadingSearch(true);
    try {
      let query = (supabase as any)
        .from("veiculos")
        .select("*, associados(nome, cpf, status, regional, cooperativa)")
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (nome) query = query.ilike("associados.nome", `%${nome}%`);
      if (placa) query = query.ilike("placa", `%${placa}%`);

      const { data, error } = await query;
      if (error) throw error;

      const fmtDate = (d: string | null) => {
        if (!d) return "—";
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
      };

      const mapped: RegistroRow[] = (data || []).map((v: any, idx: number) => ({
        id: v.id ?? idx + 1,
        nome: v.associados?.nome || "—",
        placa: v.placa || "—",
        regional: v.associados?.regional || v.regional || "—",
        dataCadastro: fmtDate(v.created_at),
        dataContrato: fmtDate(v.data_contrato || v.created_at),
        diaVenc: v.dia_vencimento || 10,
        valorFipe: v.valor_fipe ? Number(v.valor_fipe).toLocaleString("pt-BR") : "—",
        cota: v.cota || "—",
        sitVeiculo: v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1) : "Pendente",
        sitAssociado: v.associados?.status ? v.associados.status.charAt(0).toUpperCase() + v.associados.status.slice(1) : "—",
        cooperativa: v.associados?.cooperativa || v.cooperativa || "—",
        tipoAdesao: v.tipo_adesao || "Normal",
        opApp: v.op_app ? "Sim" : "Não",
        validacao: v.validacao || "Pendente",
        produtos: v.produtos_count || 0,
      }));

      setResults(mapped);
      setPage(1);
      toast.success(`${mapped.length} registros encontrados`);
    } catch (err: any) {
      toast.error("Erro ao buscar: " + (err.message || "erro desconhecido"));
    } finally {
      setLoadingSearch(false);
    }
  };

  const filtered = results.filter(r =>
    (!searchInline || r.nome.toLowerCase().includes(searchInline.toLowerCase()) || r.placa.toLowerCase().includes(searchInline.toLowerCase()))
  );

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleId = (id: number) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Aprovar Cadastro</h2>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-xs font-medium mb-2 block">Situação Veículo</Label>
            <div className="flex flex-wrap gap-3">
              {situacoesVeiculo.map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <Checkbox checked={sitVeicSel.includes(s)} onCheckedChange={() => toggleCheckbox(sitVeicSel, s, setSitVeicSel)} />
                  <Label className="text-xs">{s}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">Situação Associado</Label>
            <div className="flex flex-wrap gap-3">
              {situacoesAssociado.map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <Checkbox checked={sitAssocSel.includes(s)} onCheckedChange={() => toggleCheckbox(sitAssocSel, s, setSitAssocSel)} />
                  <Label className="text-xs">{s}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">Cooperativa</Label>
            <div className="flex flex-wrap gap-3">
              {cooperativasList.map(c => (
                <div key={c} className="flex items-center gap-1.5">
                  <Checkbox checked={coopSel.includes(c)} onCheckedChange={() => toggleCheckbox(coopSel, c, setCoopSel)} />
                  <Label className="text-xs">{c}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><Label className="text-xs">Data Cadastro Inicial</Label><Input type="date" /></div>
            <div><Label className="text-xs">Data Cadastro Final</Label><Input type="date" /></div>
            <div><Label className="text-xs">Data Contrato Inicial</Label><Input type="date" /></div>
            <div><Label className="text-xs">Data Contrato Final</Label><Input type="date" /></div>
            <div>
              <Label className="text-xs">Ordenação</Label>
              <Select defaultValue="nome"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="nome">Nome</SelectItem><SelectItem value="placa">Placa</SelectItem><SelectItem value="data">Data</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Filtrar por nome" /></div>
            <div><Label className="text-xs">Placa</Label><Input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1D23" /></div>
          </div>
          <Button onClick={pesquisar} disabled={loadingSearch} className="gap-1">
            {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Pesquisar
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Input value={searchInline} onChange={e => setSearchInline(e.target.value)} placeholder="Pesquisar na tabela..." className="w-64" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  <Label className="text-xs">Todos</Label>
                </div>
                <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Regional</TableHead>
                    <TableHead>Dt Cadastro</TableHead>
                    <TableHead>Dt Contrato</TableHead>
                    <TableHead>Venc.</TableHead>
                    <TableHead>Vl. FIPE</TableHead>
                    <TableHead>Cota</TableHead>
                    <TableHead>Sit. Veíc.</TableHead>
                    <TableHead>Sit. Assoc.</TableHead>
                    <TableHead>Cooperativa</TableHead>
                    <TableHead>Tipo Adesão</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Validação</TableHead>
                    <TableHead>Prod.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(r => (
                    <TableRow key={r.id}>
                      <TableCell><Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => toggleId(r.id)} /></TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{r.nome}</TableCell>
                      <TableCell className="text-sm font-mono">{r.placa}</TableCell>
                      <TableCell className="text-sm">{r.regional}</TableCell>
                      <TableCell className="text-sm">{r.dataCadastro}</TableCell>
                      <TableCell className="text-sm">{r.dataContrato}</TableCell>
                      <TableCell className="text-sm">{r.diaVenc}</TableCell>
                      <TableCell className="text-sm">R$ {r.valorFipe}</TableCell>
                      <TableCell className="text-sm">{r.cota}</TableCell>
                      <TableCell><Badge className={statusColor(r.sitVeiculo)}>{r.sitVeiculo}</Badge></TableCell>
                      <TableCell><Badge className={statusColor(r.sitAssociado)}>{r.sitAssociado}</Badge></TableCell>
                      <TableCell className="text-xs">{r.cooperativa.replace("Cooperativa ", "")}</TableCell>
                      <TableCell className="text-sm">{r.tipoAdesao}</TableCell>
                      <TableCell className="text-sm">{r.opApp}</TableCell>
                      <TableCell><Badge className={statusColor(r.validacao === "Aprovado" ? "Ativo" : r.validacao === "Negado" ? "Negado" : "Pendente")}>{r.validacao}</Badge></TableCell>
                      <TableCell className="text-sm text-center">{r.produtos}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{selectedIds.length} selecionado(s) de {filtered.length}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
                <span className="text-xs text-muted-foreground">{page} de {totalPages || 1}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={selectedIds.length === 0} onClick={() => { toast.success(`${selectedIds.length} cadastro(s) aprovado(s)!`); setSelectedIds([]); }}>
                <CheckCircle className="h-4 w-4" /> Aprovar Selecionados
              </Button>
              <Button variant="destructive" className="gap-1" disabled={selectedIds.length === 0} onClick={() => { toast.success(`${selectedIds.length} cadastro(s) negado(s)!`); setSelectedIds([]); }}>
                <XCircle className="h-4 w-4" /> Negar Selecionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
