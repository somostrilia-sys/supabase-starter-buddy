import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Search, Users, Car, FileText, BarChart3, Eye,
  DollarSign, UserCog, TrendingUp, Shield, Truck, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const cooperativas = ["Central SP", "Central RJ", "Norte MG", "Oeste PR", "Sul RS"];
const regionais = ["Grande SP", "Campinas", "Rio de Janeiro", "Triângulo Mineiro", "Curitiba", "Porto Alegre"];

// ── Mock data ──
const mockAssociados = [
  { id: 1, nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", telefone: "(11) 98765-4321", email: "carlos@email.com", placa: "BRA2E19", modelo: "Onix Plus", ano: 2023, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 50-70 mil", cooperativa: "Central SP", regional: "Grande SP", situacao: "ativo", dataCadastro: "2024-01-15", dataContrato: "2024-02-01", nascimento: "1985-03-22", endereco: "Rua das Flores, 123 - São Paulo/SP" },
  { id: 2, nome: "Maria Fernanda Oliveira", cpf: "987.654.321-00", telefone: "(21) 97654-3210", email: "maria@email.com", placa: "RIO4F56", modelo: "HB20", ano: 2022, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 40-50 mil", cooperativa: "Central RJ", regional: "Rio de Janeiro", situacao: "ativo", dataCadastro: "2024-02-10", dataContrato: "2024-03-01", nascimento: "1990-07-14", endereco: "Av. Brasil, 456 - Rio de Janeiro/RJ" },
  { id: 3, nome: "José Roberto Santos", cpf: "456.789.123-00", telefone: "(31) 96543-2109", email: "jose@email.com", placa: "MGA7B32", modelo: "Strada", ano: 2024, tipo: "Utilitário", categoria: "Trabalho", cota: "R$ 70-100 mil", cooperativa: "Norte MG", regional: "Triângulo Mineiro", situacao: "ativo", dataCadastro: "2024-03-05", dataContrato: "2024-04-01", nascimento: "1978-11-30", endereco: "Rua Minas, 789 - Uberlândia/MG" },
  { id: 4, nome: "Ana Paula Costa", cpf: "321.654.987-00", telefone: "(21) 95432-1098", email: "ana@email.com", placa: "RJO3K21", modelo: "Kicks", ano: 2023, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 70-100 mil", cooperativa: "Central RJ", regional: "Rio de Janeiro", situacao: "inadimplente", dataCadastro: "2023-11-20", dataContrato: "2024-01-01", nascimento: "1992-05-08", endereco: "Rua Copacabana, 321 - Rio de Janeiro/RJ" },
  { id: 5, nome: "Pedro Henrique Lima", cpf: "654.321.987-00", telefone: "(31) 94321-0987", email: "pedro@email.com", placa: "MGB5C44", modelo: "Hilux", ano: 2021, tipo: "Utilitário", categoria: "Trabalho", cota: "R$ 100-150 mil", cooperativa: "Norte MG", regional: "Triângulo Mineiro", situacao: "inativo", dataCadastro: "2023-08-15", dataContrato: "2023-09-01", nascimento: "1983-09-17", endereco: "Av. Amazonas, 654 - Belo Horizonte/MG" },
  { id: 6, nome: "Fernanda Rodrigues", cpf: "789.123.456-00", telefone: "(41) 93210-9876", email: "fernanda@email.com", placa: "CWB1D45", modelo: "T-Cross", ano: 2024, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 70-100 mil", cooperativa: "Oeste PR", regional: "Curitiba", situacao: "ativo", dataCadastro: "2024-04-10", dataContrato: "2024-05-01", nascimento: "1995-01-25", endereco: "Rua XV de Novembro, 987 - Curitiba/PR" },
  { id: 7, nome: "Ricardo Almeida", cpf: "147.258.369-00", telefone: "(19) 92109-8765", email: "ricardo@email.com", placa: "CPR8H67", modelo: "Corolla Cross", ano: 2024, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 100-150 mil", cooperativa: "Central SP", regional: "Campinas", situacao: "pendente", dataCadastro: "2024-05-01", dataContrato: "2024-06-01", nascimento: "1988-12-03", endereco: "Rua Barão, 147 - Campinas/SP" },
  { id: 8, nome: "Juliana Martins", cpf: "258.369.147-00", telefone: "(21) 91098-7654", email: "juliana@email.com", placa: "RJM2L89", modelo: "Argo", ano: 2022, tipo: "Automóvel leve", categoria: "Passeio", cota: "R$ 30-40 mil", cooperativa: "Central RJ", regional: "Rio de Janeiro", situacao: "ativo", dataCadastro: "2024-01-25", dataContrato: "2024-02-15", nascimento: "1997-06-19", endereco: "Rua Tijuca, 258 - Rio de Janeiro/RJ" },
];

const mockBoletos = [
  { id: "BOL-001", associado: "Carlos Eduardo Silva", valor: 189.90, gerado: "2025-06-25", vencimento: "2025-07-10", pagamento: "2025-07-08", situacao: "pago_dia" },
  { id: "BOL-002", associado: "Maria Fernanda Oliveira", valor: 245.50, gerado: "2025-06-25", vencimento: "2025-07-10", pagamento: null, situacao: "pendente" },
  { id: "BOL-003", associado: "José Roberto Santos", valor: 312.00, gerado: "2025-06-25", vencimento: "2025-07-10", pagamento: "2025-07-12", situacao: "pago_atraso" },
  { id: "BOL-004", associado: "Ana Paula Costa", valor: 178.40, gerado: "2025-05-25", vencimento: "2025-06-10", pagamento: null, situacao: "vencido" },
  { id: "BOL-005", associado: "Fernanda Rodrigues", valor: 198.30, gerado: "2025-06-25", vencimento: "2025-07-10", pagamento: "2025-07-09", situacao: "pago_dia" },
];

const situacaoColor: Record<string, string> = {
  ativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inativo: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  inadimplente: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pago_dia: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pago_atraso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  vencido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const outrosRelatorios = [
  { id: "usuarios", label: "Usuários", icon: UserCog, desc: "Listagem de usuários do sistema com perfis e acessos" },
  { id: "produtividade", label: "Produtividade", icon: TrendingUp, desc: "Produtividade por operador/vendedor" },
  { id: "cobranca", label: "Cobrança", icon: DollarSign, desc: "Relatório detalhado de cobranças e inadimplência" },
  { id: "cotas", label: "Cotas", icon: BarChart3, desc: "Distribuição de veículos por faixa de cota" },
  { id: "alt_beneficiario", label: "Alterações de Beneficiário", icon: Users, desc: "Log de alterações em dados de associados" },
  { id: "alt_veiculos", label: "Alterações em Veículos", icon: Car, desc: "Histórico de modificações cadastrais de veículos" },
  { id: "veic_boletos", label: "Veículos e Boletos", icon: FileText, desc: "Vinculação financeira veículo × boleto" },
  { id: "eventos", label: "Eventos", icon: AlertTriangle, desc: "Relatório consolidado de sinistros e eventos" },
  { id: "fornecedores", label: "Fornecedores", icon: Truck, desc: "Relatório de fornecedores e sincronismos" },
];

// Columns selector
const allColumns = [
  { key: "nome", label: "Nome" }, { key: "cpf", label: "CPF" }, { key: "endereco", label: "Endereço" },
  { key: "telefone", label: "Telefone" }, { key: "email", label: "E-mail" }, { key: "placa", label: "Placa" },
  { key: "modelo", label: "Modelo" }, { key: "ano", label: "Ano" }, { key: "tipo", label: "Tipo" },
  { key: "categoria", label: "Categoria" }, { key: "cota", label: "Cota" }, { key: "cooperativa", label: "Cooperativa" },
  { key: "regional", label: "Regional" }, { key: "dataCadastro", label: "Data Cadastro" }, { key: "situacao", label: "Situação" },
];

export default function RelatoriosTab() {
  const [busca, setBusca] = useState("");
  const [filtroCooperativa, setFiltroCooperativa] = useState("todas");
  const [filtroRegional, setFiltroRegional] = useState("todas");
  const [filtroSituacao, setFiltroSituacao] = useState("todas");
  const [detalhe, setDetalhe] = useState<typeof mockAssociados[0] | null>(null);
  const [selectedCols, setSelectedCols] = useState<string[]>(["nome", "cpf", "telefone", "placa", "cooperativa", "situacao"]);
  const [outroAtivo, setOutroAtivo] = useState<string | null>(null);

  const filteredAssoc = mockAssociados.filter(a => {
    if (filtroCooperativa !== "todas" && a.cooperativa !== filtroCooperativa) return false;
    if (filtroRegional !== "todas" && a.regional !== filtroRegional) return false;
    if (filtroSituacao !== "todas" && a.situacao !== filtroSituacao) return false;
    if (busca && !a.nome.toLowerCase().includes(busca.toLowerCase()) && !a.cpf.includes(busca) && !a.placa.includes(busca.toUpperCase())) return false;
    return true;
  });

  const exportCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const header = keys.join(";") + "\n";
    const rows = data.map(r => keys.map(k => String(r[k] ?? "")).join(";")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
    toast.success("Relatório exportado");
  };

  const toggleCol = (key: string) => setSelectedCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);

  return (
    <div className="p-6 space-y-6">
      <div><h2 className="text-xl font-bold">Central de Relatórios</h2><p className="text-sm text-muted-foreground">Relatórios completos com filtros avançados e exportação</p></div>

      <Tabs defaultValue="associados">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="associados" className="gap-1"><Users className="h-3.5 w-3.5" />Associados</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-1"><Car className="h-3.5 w-3.5" />Veículos</TabsTrigger>
          <TabsTrigger value="boletos" className="gap-1"><FileText className="h-3.5 w-3.5" />Boletos</TabsTrigger>
          <TabsTrigger value="outros" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Demais</TabsTrigger>
        </TabsList>

        {/* ── ASSOCIADOS ── */}
        <TabsContent value="associados" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome, CPF ou placa..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
                <div><Label className="text-xs">Cooperativa</Label><Select value={filtroCooperativa} onValueChange={setFiltroCooperativa}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Regional</Label><Select value={filtroRegional} onValueChange={setFiltroRegional}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Situação</Label><Select value={filtroSituacao} onValueChange={setFiltroSituacao}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="inadimplente">Inadimplente</SelectItem><SelectItem value="pendente">Pendente</SelectItem></SelectContent></Select></div>
                <div className="flex items-end"><Button variant="outline" size="sm" onClick={() => exportCsv(filteredAssoc as unknown as Record<string, unknown>[], "associados")}><Download className="h-4 w-4" />Exportar</Button></div>
              </div>
              <div className="mt-3"><Label className="text-xs mb-1 block">Colunas visíveis:</Label>
                <div className="flex flex-wrap gap-2">{allColumns.map(c => (
                  <label key={c.key} className="flex items-center gap-1 text-xs cursor-pointer"><Checkbox checked={selectedCols.includes(c.key)} onCheckedChange={() => toggleCol(c.key)} className="h-3.5 w-3.5" />{c.label}</label>
                ))}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>{selectedCols.map(k => <TableHead key={k}>{allColumns.find(c => c.key === k)?.label}</TableHead>)}<TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAssoc.map(a => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetalhe(a)}>
                      {selectedCols.map(k => (
                        <TableCell key={k}>
                          {k === "situacao" ? <Badge className={situacaoColor[a.situacao]}>{a.situacao}</Badge>
                           : k === "dataCadastro" ? new Date(a.dataCadastro).toLocaleDateString("pt-BR")
                           : String((a as Record<string, unknown>)[k] ?? "")}
                        </TableCell>
                      ))}
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{filteredAssoc.length} registros encontrados</p>
        </TabsContent>

        {/* ── VEÍCULOS ── */}
        <TabsContent value="veiculos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Filtros de Veículos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div><Label className="text-xs">Buscar</Label><Input placeholder="Placa ou modelo..." /></div>
                <div><Label className="text-xs">Tipo</Label><Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="leve">Automóvel leve</SelectItem><SelectItem value="utilitario">Utilitário</SelectItem><SelectItem value="moto">Motocicleta</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Cota</Label><Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="30-40">R$ 30-40 mil</SelectItem><SelectItem value="40-50">R$ 40-50 mil</SelectItem><SelectItem value="50-70">R$ 50-70 mil</SelectItem><SelectItem value="70-100">R$ 70-100 mil</SelectItem><SelectItem value="100-150">R$ 100-150 mil</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Cooperativa</Label><Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-end"><Button variant="outline" size="sm" onClick={() => exportCsv(mockAssociados.map(a => ({ placa: a.placa, modelo: a.modelo, ano: a.ano, tipo: a.tipo, categoria: a.categoria, cota: a.cota, associado: a.nome, cooperativa: a.cooperativa })), "veiculos")}><Download className="h-4 w-4" />Exportar</Button></div>
              </div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead>Ano</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Cota</TableHead><TableHead>Associado</TableHead><TableHead>Cooperativa</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockAssociados.map(a => (
                  <TableRow key={a.id}><TableCell className="font-mono">{a.placa}</TableCell><TableCell>{a.modelo}</TableCell><TableCell>{a.ano}</TableCell><TableCell><Badge variant="outline">{a.tipo}</Badge></TableCell><TableCell>{a.categoria}</TableCell><TableCell>{a.cota}</TableCell><TableCell className="font-medium">{a.nome}</TableCell><TableCell>{a.cooperativa}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* ── BOLETOS ── */}
        <TabsContent value="boletos" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{mockBoletos.length}</p><p className="text-xs text-muted-foreground">Total gerado</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{mockBoletos.filter(b => b.situacao === "pago_dia").length}</p><p className="text-xs text-muted-foreground">Pagos em dia</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{mockBoletos.filter(b => b.situacao === "pago_atraso").length}</p><p className="text-xs text-muted-foreground">Pagos em atraso</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{mockBoletos.filter(b => b.situacao === "vencido").length}</p><p className="text-xs text-muted-foreground">Vencidos</p></CardContent></Card>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Associado</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Gerado</TableHead><TableHead>Vencimento</TableHead><TableHead>Pagamento</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockBoletos.map(b => (
                  <TableRow key={b.id}><TableCell className="font-mono text-xs">{b.id}</TableCell><TableCell className="font-medium">{b.associado}</TableCell><TableCell className="text-right">R$ {b.valor.toFixed(2)}</TableCell><TableCell>{new Date(b.gerado).toLocaleDateString("pt-BR")}</TableCell><TableCell>{new Date(b.vencimento).toLocaleDateString("pt-BR")}</TableCell><TableCell>{b.pagamento ? new Date(b.pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell><TableCell><Badge className={situacaoColor[b.situacao]}>{b.situacao.replace("_", " ")}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
          <Button variant="outline" size="sm" onClick={() => exportCsv(mockBoletos as unknown as Record<string, unknown>[], "boletos")}><Download className="h-4 w-4" />Exportar Excel</Button>
        </TabsContent>

        {/* ── DEMAIS ── */}
        <TabsContent value="outros" className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outrosRelatorios.map(r => (
              <Card key={r.id} className={`cursor-pointer transition-colors hover:border-primary/50 ${outroAtivo === r.id ? "border-primary" : ""}`} onClick={() => setOutroAtivo(r.id)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <r.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div><p className="font-semibold text-sm">{r.label}</p><p className="text-xs text-muted-foreground">{r.desc}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {outroAtivo && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">{outrosRelatorios.find(r => r.id === outroAtivo)?.label}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-3 mb-4">
                  <div><Label className="text-xs">Data início</Label><Input type="date" /></div>
                  <div><Label className="text-xs">Data fim</Label><Input type="date" /></div>
                  <div><Label className="text-xs">Cooperativa</Label><Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">Regional</Label><Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm"><Search className="h-4 w-4" />Gerar Relatório</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Relatório exportado")}><Download className="h-4 w-4" />Exportar Excel</Button>
                </div>
                <div className="mt-4 p-8 bg-muted rounded-lg text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Aplique os filtros e clique em "Gerar Relatório"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detalhe Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Cadastro Completo</SheetTitle></SheetHeader>
          {detalhe && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2 text-sm">
                {([
                  ["Nome", detalhe.nome], ["CPF", detalhe.cpf], ["Nascimento", new Date(detalhe.nascimento).toLocaleDateString("pt-BR")],
                  ["Telefone", detalhe.telefone], ["E-mail", detalhe.email], ["Endereço", detalhe.endereco],
                  ["Cooperativa", detalhe.cooperativa], ["Regional", detalhe.regional],
                  ["Data Cadastro", new Date(detalhe.dataCadastro).toLocaleDateString("pt-BR")],
                  ["Data Contrato", new Date(detalhe.dataContrato).toLocaleDateString("pt-BR")],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-muted-foreground">Situação:</span><Badge className={situacaoColor[detalhe.situacao]}>{detalhe.situacao}</Badge></div>
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <p className="font-semibold">Veículo</p>
                {([["Placa", detalhe.placa], ["Modelo", detalhe.modelo], ["Ano", String(detalhe.ano)], ["Tipo", detalhe.tipo], ["Categoria", detalhe.categoria], ["Cota", detalhe.cota]] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
