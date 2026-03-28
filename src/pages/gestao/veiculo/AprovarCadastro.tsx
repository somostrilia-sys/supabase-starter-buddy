import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

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

const mockRegistros = [
  { id: 1, nome: "Carlos Alberto Silva", placa: "ABC-1D23", regional: "Capital", dataCadastro: "10/01/2025", dataContrato: "15/01/2025", diaVenc: 10, valorFipe: "92.500", cota: "Cota A", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa São Paulo", tipoAdesao: "Normal", opApp: "Sim", validacao: "Pendente", produtos: 3 },
  { id: 2, nome: "Maria Aparecida Santos", placa: "DEF-4G56", regional: "Interior", dataCadastro: "12/01/2025", dataContrato: "18/01/2025", diaVenc: 15, valorFipe: "85.000", cota: "Cota B", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa São Paulo", tipoAdesao: "Normal", opApp: "Não", validacao: "Pendente", produtos: 4 },
  { id: 3, nome: "José Roberto Oliveira", placa: "GHI-7J89", regional: "Metropolitana", dataCadastro: "15/02/2025", dataContrato: "20/02/2025", diaVenc: 5, valorFipe: "145.000", cota: "Cota C", sitVeiculo: "Pendente", sitAssociado: "Pendente", cooperativa: "Cooperativa Rio", tipoAdesao: "Transferência", opApp: "Sim", validacao: "Pendente", produtos: 5 },
  { id: 4, nome: "Ana Paula Ferreira", placa: "JKL-2M34", regional: "Capital", dataCadastro: "01/03/2025", dataContrato: "05/03/2025", diaVenc: 20, valorFipe: "162.000", cota: "Cota A", sitVeiculo: "Ativo", sitAssociado: "Ativo", cooperativa: "Cooperativa Minas", tipoAdesao: "Normal", opApp: "Sim", validacao: "Aprovado", produtos: 3 },
  { id: 5, nome: "Francisco das Chagas Lima", placa: "MNO-5P67", regional: "Litoral", dataCadastro: "10/03/2025", dataContrato: "12/03/2025", diaVenc: 10, valorFipe: "265.000", cota: "Cota D", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa Sul", tipoAdesao: "Normal", opApp: "Não", validacao: "Pendente", produtos: 6 },
  { id: 6, nome: "Francisca Helena Costa", placa: "QRS-8T90", regional: "Interior", dataCadastro: "15/03/2025", dataContrato: "18/03/2025", diaVenc: 25, valorFipe: "88.000", cota: "Cota B", sitVeiculo: "Negado", sitAssociado: "Inativo", cooperativa: "Cooperativa Centro-Oeste", tipoAdesao: "Normal", opApp: "Sim", validacao: "Negado", produtos: 2 },
  { id: 7, nome: "Antônio Carlos Pereira", placa: "UVW-1X23", regional: "Capital", dataCadastro: "20/03/2025", dataContrato: "22/03/2025", diaVenc: 15, valorFipe: "178.000", cota: "Cota C", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa São Paulo", tipoAdesao: "2ª Via", opApp: "Não", validacao: "Pendente", produtos: 4 },
  { id: 8, nome: "Adriana Souza Rodrigues", placa: "YZA-4B56", regional: "Metropolitana", dataCadastro: "25/03/2025", dataContrato: "28/03/2025", diaVenc: 5, valorFipe: "95.000", cota: "Cota A", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa Rio", tipoAdesao: "Normal", opApp: "Sim", validacao: "Pendente", produtos: 3 },
  { id: 9, nome: "Paulo Henrique Almeida", placa: "BCD-5E67", regional: "Capital", dataCadastro: "01/04/2025", dataContrato: "03/04/2025", diaVenc: 10, valorFipe: "138.000", cota: "Cota B", sitVeiculo: "Pendente", sitAssociado: "Ativo", cooperativa: "Cooperativa São Paulo", tipoAdesao: "Normal", opApp: "Sim", validacao: "Pendente", produtos: 5 },
  { id: 10, nome: "Juliana Cristina Nascimento", placa: "FGH-8I90", regional: "Interior", dataCadastro: "05/04/2025", dataContrato: "08/04/2025", diaVenc: 20, valorFipe: "82.000", cota: "Cota A", sitVeiculo: "Inativo", sitAssociado: "Inativo", cooperativa: "Cooperativa Minas", tipoAdesao: "Normal", opApp: "Não", validacao: "Aprovado", produtos: 2 },
];

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
  const [results, setResults] = useState<typeof mockRegistros>([]);

  const toggleCheckbox = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (val === "Todos") { setter(arr.includes("Todos") ? [] : ["Todos"]); return; }
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr.filter(x => x !== "Todos"), val];
    setter(next);
  };

  const pesquisar = () => {
    setResults(mockRegistros);
    setPage(1);
    toast.success(`${mockRegistros.length} registros encontrados`);
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
          <Button onClick={pesquisar} className="gap-1"><Search className="h-4 w-4" /> Pesquisar</Button>
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
