import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, AlertTriangle, Car, FileText, DollarSign, Clock,
  Upload, CheckCircle2, ChevronLeft, ChevronRight, Download,
} from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  aberto: { label: "Aberto", class: "bg-sky-500/15 text-sky-400 border-0" },
  em_analise: { label: "Em Análise", class: "bg-amber-500/15 text-amber-400 border-0" },
  aprovado: { label: "Aprovado", class: "bg-emerald-500/15 text-emerald-400 border-0" },
  pago: { label: "Pago", class: "bg-primary/15 text-primary border-0" },
  negado: { label: "Negado", class: "bg-destructive/15 text-destructive border-0" },
};

const tipoLabels: Record<string, string> = {
  roubo: "Roubo", furto: "Furto", colisao: "Colisão", incendio: "Incêndio", enchente: "Enchente", terceiros: "Terceiros",
};

interface Evento {
  id: string; codigo: string; tipo: string; associado: string; placa: string; veiculo: string;
  dataEvento: string; status: string; valorEstimado: number; valorPago: number;
  local: string; descricao: string; bo: string;
}

const mockEventos: Evento[] = [
  { id: "e0", codigo: "EVT-0001", tipo: "colisao", associado: "Carlos Silva", placa: "ABC1D23", veiculo: "Honda Civic 2024", dataEvento: "2026-02-28", status: "em_analise", valorEstimado: 8500, valorPago: 0, local: "Av. Paulista, 1000 - São Paulo/SP", descricao: "Colisão traseira em semáforo", bo: "BO-2026-45678" },
  { id: "e1", codigo: "EVT-0002", tipo: "roubo", associado: "Maria Souza", placa: "DEF2G34", veiculo: "VW Gol 2022", dataEvento: "2026-02-25", status: "aprovado", valorEstimado: 45000, valorPago: 42000, local: "Rua Augusta, 500 - São Paulo/SP", descricao: "Roubo a mão armada", bo: "BO-2026-45123" },
  { id: "e2", codigo: "EVT-0003", tipo: "furto", associado: "José Santos", placa: "GHI3J45", veiculo: "Fiat Argo 2023", dataEvento: "2026-02-20", status: "pago", valorEstimado: 52000, valorPago: 48000, local: "Rua XV de Novembro, 200 - Campinas/SP", descricao: "Furto em estacionamento", bo: "BO-2026-44890" },
  { id: "e3", codigo: "EVT-0004", tipo: "colisao", associado: "Ana Oliveira", placa: "JKL4M56", veiculo: "Hyundai HB20 2023", dataEvento: "2026-02-15", status: "aberto", valorEstimado: 3200, valorPago: 0, local: "BR-101 km 340 - Niterói/RJ", descricao: "Colisão lateral", bo: "BO-2026-44567" },
  { id: "e4", codigo: "EVT-0005", tipo: "incendio", associado: "Francisco Lima", placa: "MNO5P67", veiculo: "Toyota Hilux 2024", dataEvento: "2026-02-10", status: "em_analise", valorEstimado: 180000, valorPago: 0, local: "Fazenda Santa Cruz - Uberlândia/MG", descricao: "Incêndio elétrico no motor", bo: "BO-2026-44234" },
  { id: "e5", codigo: "EVT-0006", tipo: "enchente", associado: "Antônia Ferreira", placa: "QRS6T78", veiculo: "Chevrolet Onix 2024", dataEvento: "2026-01-28", status: "negado", valorEstimado: 15000, valorPago: 0, local: "Rua Vergueiro, 800 - São Paulo/SP", descricao: "Alagamento por chuva forte", bo: "BO-2026-43901" },
  { id: "e6", codigo: "EVT-0007", tipo: "terceiros", associado: "João Costa", placa: "UVW7X89", veiculo: "Renault Kwid 2023", dataEvento: "2026-01-20", status: "pago", valorEstimado: 2800, valorPago: 2500, local: "Av. Brasil, 3000 - Rio de Janeiro/RJ", descricao: "Danos a terceiro em cruzamento", bo: "" },
  { id: "e7", codigo: "EVT-0008", tipo: "colisao", associado: "Rita Pereira", placa: "YZA8B01", veiculo: "VW T-Cross 2024", dataEvento: "2026-01-15", status: "aprovado", valorEstimado: 6700, valorPago: 0, local: "Rua das Flores, 150 - Santos/SP", descricao: "Batida em poste", bo: "BO-2026-43456" },
  { id: "e8", codigo: "EVT-0009", tipo: "roubo", associado: "Pedro Almeida", placa: "BCD9E12", veiculo: "Jeep Compass 2024", dataEvento: "2026-01-05", status: "pago", valorEstimado: 160000, valorPago: 152000, local: "Av. Atlântica, 400 - Rio de Janeiro/RJ", descricao: "Roubo com arma branca", bo: "BO-2026-43123" },
  { id: "e9", codigo: "EVT-0010", tipo: "furto", associado: "Lúcia Ribeiro", placa: "FGH0I23", veiculo: "Honda HR-V 2023", dataEvento: "2025-12-20", status: "pago", valorEstimado: 95000, valorPago: 90000, local: "Shopping Center Norte - Guarulhos/SP", descricao: "Furto em estacionamento coberto", bo: "BO-2025-42800" },
];

const orcamentosMock = [
  { fornecedor: "Auto Mecânica Central", valor: 8200, aprovado: true },
  { fornecedor: "Funilaria Express", valor: 9100, aprovado: false },
  { fornecedor: "Oficina do João", valor: 7800, aprovado: false },
];

const totalAssociadosAtivos = 450;

export default function Sinistros() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Evento | null>(null);
  const [detailTab, setDetailTab] = useState("dados");
  const [page, setPage] = useState(0);
  const perPage = 10;

  const totalEstimado = mockEventos.reduce((s, e) => s + e.valorEstimado, 0);
  const totalPago = mockEventos.reduce((s, e) => s + e.valorPago, 0);

  const filtered = useMemo(() => {
    if (!search) return mockEventos;
    const s = search.toLowerCase();
    return mockEventos.filter(e =>
      e.codigo.toLowerCase().includes(s) || e.associado.toLowerCase().includes(s) || e.placa.toLowerCase().includes(s)
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos / Sinistros</h1>
          <p className="text-sm text-muted-foreground">{mockEventos.length} eventos · R$ {totalPago.toLocaleString("pt-BR")} pagos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Evento</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-sky-500/10"><AlertTriangle className="h-4 w-4 text-sky-400" /></div><span className="text-[10px] uppercase text-muted-foreground font-medium">Total Eventos</span></div>
          <p className="text-2xl font-bold">{mockEventos.length}</p>
        </CardContent></Card>
        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-amber-500/10"><Clock className="h-4 w-4 text-amber-400" /></div><span className="text-[10px] uppercase text-muted-foreground font-medium">Em Aberto</span></div>
          <p className="text-2xl font-bold">{mockEventos.filter(e=>["aberto","em_analise"].includes(e.status)).length}</p>
        </CardContent></Card>
        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-destructive/10"><DollarSign className="h-4 w-4 text-destructive" /></div><span className="text-[10px] uppercase text-muted-foreground font-medium">Valor Estimado</span></div>
          <p className="text-xl font-bold font-mono">R$ {totalEstimado.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-400" /></div><span className="text-[10px] uppercase text-muted-foreground font-medium">Valor Pago</span></div>
          <p className="text-xl font-bold font-mono text-emerald-400">R$ {totalPago.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por código, associado ou placa..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                {["Código","Tipo","Associado","Veículo","Data","Status","Estimado","Pago"].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pageData.map(e => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => { setSelected(e); setDetailTab("dados"); }}>
                    <td className="p-3 text-xs font-mono text-primary">{e.codigo}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[9px]">{tipoLabels[e.tipo]}</Badge></td>
                    <td className="p-3 text-xs font-medium">{e.associado}</td>
                    <td className="p-3 text-xs"><Badge variant="secondary" className="font-mono text-[9px]">{e.placa}</Badge> <span className="text-muted-foreground">{e.veiculo}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(e.dataEvento).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3"><Badge className={`text-[9px] ${statusMap[e.status].class}`}>{statusMap[e.status].label}</Badge></td>
                    <td className="p-3 text-xs font-mono">R$ {e.valorEstimado.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-xs font-mono text-emerald-400">{e.valorPago > 0 ? `R$ ${e.valorPago.toLocaleString("pt-BR")}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{page*perPage+1}-{Math.min((page+1)*perPage,filtered.length)} de {filtered.length}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{selected.codigo}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{tipoLabels[selected.tipo]}</Badge>
                    <Badge className={`text-[9px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge>
                  </div>
                </div>
                <Select defaultValue={selected.status}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />

              <Tabs value={detailTab} onValueChange={setDetailTab}>
                <TabsList className="bg-muted/50 w-full flex-wrap h-auto gap-1 p-1">
                  {[["dados","Dados"],["veiculo","Veículo"],["docs","Documentos"],["orcamentos","Orçamentos"],["rateio","Rateio"],["pagamento","Pagamento"],["historico","Histórico"]].map(([k,l]) => (
                    <TabsTrigger key={k} value={k} className="text-[10px] flex-1">{l as string}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="dados" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Tipo:</span> {tipoLabels[selected.tipo]}</div>
                    <div><span className="text-muted-foreground">Data:</span> {new Date(selected.dataEvento).toLocaleDateString("pt-BR")}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Local:</span> {selected.local}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span> {selected.descricao}</div>
                    {selected.bo && <div className="col-span-2"><span className="text-muted-foreground">B.O.:</span> <span className="font-mono">{selected.bo}</span></div>}
                    <div><span className="text-muted-foreground">Associado:</span> {selected.associado}</div>
                  </div>
                </TabsContent>

                <TabsContent value="veiculo" className="space-y-3 mt-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card">
                    <Car className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-bold">{selected.veiculo}</p>
                      <Badge variant="secondary" className="font-mono text-[10px]">{selected.placa}</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="space-y-3 mt-3">
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Arraste documentos aqui</p>
                  </div>
                  {["Boletim de Ocorrência.pdf", "Foto Dianteira.jpg", "Foto Traseira.jpg"].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card text-xs">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{f}</div>
                      <span className="text-muted-foreground">{(120 + i * 85)}KB</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="orcamentos" className="space-y-3 mt-3">
                  <Button size="sm" variant="outline" className="text-xs"><Plus className="h-3 w-3 mr-1" /> Adicionar Orçamento</Button>
                  {orcamentosMock.map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card">
                      <div>
                        <p className="text-xs font-medium">{o.fornecedor}</p>
                        <p className="text-sm font-bold font-mono">R$ {o.valor.toLocaleString("pt-BR")}</p>
                      </div>
                      <Badge className={`text-[9px] border-0 ${o.aprovado ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{o.aprovado ? "Aprovado" : "Pendente"}</Badge>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="rateio" className="space-y-3 mt-3">
                  <Card className="border border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-xs font-semibold text-primary">Cálculo de Rateio</p>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Valor do Evento:</span><span className="font-mono font-bold">R$ {selected.valorEstimado.toLocaleString("pt-BR")}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Participação Mínima (10%):</span><span className="font-mono">R$ {(selected.valorEstimado * 0.1).toLocaleString("pt-BR")}</span></div>
                        <Separator />
                        <div className="flex justify-between"><span className="text-muted-foreground">Valor a Ratear:</span><span className="font-mono font-bold">R$ {(selected.valorEstimado * 0.9).toLocaleString("pt-BR")}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Associados Ativos:</span><span>{totalAssociadosAtivos}</span></div>
                        <Separator />
                        <div className="flex justify-between text-sm"><span className="font-semibold text-primary">Valor por Associado:</span><span className="font-mono font-bold text-primary">R$ {((selected.valorEstimado * 0.9) / totalAssociadosAtivos).toFixed(2)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pagamento" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Status:</span> <Badge className={`text-[9px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge></div>
                    <div><span className="text-muted-foreground">Valor Aprovado:</span> <span className="font-mono text-emerald-400">R$ {selected.valorPago > 0 ? selected.valorPago.toLocaleString("pt-BR") : "—"}</span></div>
                    <div><span className="text-muted-foreground">Data Prevista:</span> 15/03/2026</div>
                    <div><span className="text-muted-foreground">Data Pago:</span> {selected.valorPago > 0 ? "12/03/2026" : "—"}</div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-2 mt-3">
                  {[
                    { data: "28/02/2026", acao: "Evento registrado no sistema", user: "Sistema" },
                    { data: "01/03/2026", acao: "B.O. anexado", user: "Maria Santos" },
                    { data: "02/03/2026", acao: "Orçamentos solicitados", user: "João Pedro" },
                    { data: "03/03/2026", acao: "Análise técnica iniciada", user: "Carlos Lima" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 text-xs border-l-2 border-primary/30 pl-3">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{h.acao}</p>
                        <p className="text-[10px] text-muted-foreground">{h.data} · {h.user}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
