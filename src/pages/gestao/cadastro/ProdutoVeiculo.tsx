import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Package, Pencil, Trash2, Search } from "lucide-react";

const tiposProduto = [
  "Assistência", "Carro Reserva", "Crédito", "Débito", "Desconto",
  "Proteção a Terceiros", "Produto Adicional Veículo", "Produto Adicional Associado",
  "Rastreador", "Rateio", "Tarifa Bancária", "Taxa Administrativa", "Vidros",
];

const tiposVeiculoElegivel = [
  "Todos", "Automóvel Leve", "Motocicleta", "Utilitário",
  "Vans e Caminhões Pequeno Porte", "Extra Pesado",
];

interface Produto {
  id: string;
  tipo: string;
  descricao: string;
  descricaoBoleto: string;
  exibirBoleto: boolean;
  formatoCobranca: "reais" | "porcentagem";
  valor: number;
  custoInterno: number;
  permiteDesconto: boolean;
  exibirApp: boolean;
  tipoVeiculoElegivel: string;
  fornecedor: string;
  grupo: string;
  cooperativas: string;
  ativo: boolean;
}

const mockProdutos: Produto[] = [
  { id: "p1", tipo: "Assistência", descricao: "Assistência 24h Nacional", descricaoBoleto: "ASSIST 24H", exibirBoleto: true, formatoCobranca: "reais", valor: 29.90, custoInterno: 15.00, permiteDesconto: false, exibirApp: true, tipoVeiculoElegivel: "Todos", fornecedor: "Assistência Brasil", grupo: "Serviços", cooperativas: "Todas", ativo: true },
  { id: "p2", tipo: "Carro Reserva", descricao: "Carro Reserva 7 dias", descricaoBoleto: "CARRO RESERVA", exibirBoleto: true, formatoCobranca: "reais", valor: 45.00, custoInterno: 30.00, permiteDesconto: true, exibirApp: true, tipoVeiculoElegivel: "Automóvel Leve", fornecedor: "Localiza", grupo: "Serviços", cooperativas: "Todas", ativo: true },
  { id: "p3", tipo: "Rastreador", descricao: "Rastreador Veicular GPS", descricaoBoleto: "RASTREADOR", exibirBoleto: true, formatoCobranca: "reais", valor: 39.90, custoInterno: 20.00, permiteDesconto: false, exibirApp: true, tipoVeiculoElegivel: "Todos", fornecedor: "TrackGPS", grupo: "Segurança", cooperativas: "Todas", ativo: true },
  { id: "p4", tipo: "Proteção a Terceiros", descricao: "Proteção a Terceiros até R$ 50.000", descricaoBoleto: "PROT TERCEIROS", exibirBoleto: true, formatoCobranca: "reais", valor: 19.90, custoInterno: 8.00, permiteDesconto: true, exibirApp: true, tipoVeiculoElegivel: "Todos", fornecedor: "-", grupo: "Coberturas", cooperativas: "Todas", ativo: true },
  { id: "p5", tipo: "Vidros", descricao: "Cobertura de Vidros", descricaoBoleto: "VIDROS", exibirBoleto: true, formatoCobranca: "reais", valor: 15.00, custoInterno: 7.50, permiteDesconto: true, exibirApp: true, tipoVeiculoElegivel: "Automóvel Leve", fornecedor: "VidroFácil", grupo: "Coberturas", cooperativas: "Todas", ativo: true },
  { id: "p6", tipo: "Taxa Administrativa", descricao: "Taxa Administrativa Mensal", descricaoBoleto: "TAXA ADM", exibirBoleto: true, formatoCobranca: "porcentagem", valor: 10, custoInterno: 0, permiteDesconto: false, exibirApp: false, tipoVeiculoElegivel: "Todos", fornecedor: "-", grupo: "Taxas", cooperativas: "Todas", ativo: true },
  { id: "p7", tipo: "Rateio", descricao: "Rateio de Eventos", descricaoBoleto: "RATEIO", exibirBoleto: true, formatoCobranca: "reais", valor: 0, custoInterno: 0, permiteDesconto: false, exibirApp: true, tipoVeiculoElegivel: "Todos", fornecedor: "-", grupo: "Rateios", cooperativas: "Todas", ativo: true },
  { id: "p8", tipo: "Desconto", descricao: "Desconto Fidelidade 12 meses", descricaoBoleto: "DESC FIDELID", exibirBoleto: true, formatoCobranca: "porcentagem", valor: 5, custoInterno: 0, permiteDesconto: false, exibirApp: false, tipoVeiculoElegivel: "Todos", fornecedor: "-", grupo: "Descontos", cooperativas: "Todas", ativo: false },
];

const emptyForm: Omit<Produto, "id"> = {
  tipo: "", descricao: "", descricaoBoleto: "", exibirBoleto: true,
  formatoCobranca: "reais", valor: 0, custoInterno: 0, permiteDesconto: false,
  exibirApp: true, tipoVeiculoElegivel: "Todos", fornecedor: "", grupo: "",
  cooperativas: "Todas", ativo: true,
};

export default function ProdutoVeiculo() {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Produto, "id">>(emptyForm);

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const filtered = produtos.filter(p =>
    !search || p.descricao.toLowerCase().includes(search.toLowerCase()) || p.tipo.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Produto) => { setEditId(p.id); setForm({ ...p }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.tipo || !form.descricao) { toast.error("Preencha tipo e descrição"); return; }
    if (editId) {
      setProdutos(prev => prev.map(p => p.id === editId ? { ...form, id: editId } : p));
      toast.success("Produto atualizado!");
    } else {
      setProdutos(prev => [...prev, { ...form, id: `p${Date.now()}` }]);
      toast.success("Produto cadastrado!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
    toast.success("Produto removido!");
  };

  const tipoColor = (tipo: string) => {
    if (["Crédito", "Desconto"].includes(tipo)) return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (["Débito", "Taxa Administrativa", "Tarifa Bancária"].includes(tipo)) return "bg-destructive/10 text-destructive border-destructive/20";
    if (tipo === "Rateio") return "bg-warning/80/10 text-amber-600 border-amber-200";
    return "bg-primary/60/10 text-blue-600 border-blue-200";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Produto Veículo</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descrição ou tipo" className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Boleto</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline" className={tipoColor(p.tipo)}>{p.tipo}</Badge></TableCell>
                  <TableCell className="text-sm font-medium max-w-[200px] truncate">{p.descricao}</TableCell>
                  <TableCell className="text-xs">{p.formatoCobranca === "reais" ? "R$" : "%"}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {p.formatoCobranca === "reais" ? `R$ ${p.valor.toFixed(2)}` : `${p.valor}%`}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">R$ {p.custoInterno.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{p.tipoVeiculoElegivel}</TableCell>
                  <TableCell>{p.exibirBoleto ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}</TableCell>
                  <TableCell>{p.exibirApp ? <Badge variant="outline" className="bg-primary/60/10 text-blue-600 text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo do Produto *</Label>
                <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tiposProduto.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grupo</Label>
                <Select value={form.grupo} onValueChange={v => set("grupo", v)}>
                  <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
                  <SelectContent>
                    {["Serviços", "Coberturas", "Taxas", "Rateios", "Descontos", "Outros"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Descrição do Produto *</Label>
                <Input value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Assistência 24h Nacional" />
              </div>
              <div>
                <Label>Descrição no Boleto</Label>
                <Input value={form.descricaoBoleto} onChange={e => set("descricaoBoleto", e.target.value)} placeholder="ASSIST 24H" className="uppercase" />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={form.fornecedor} onChange={e => set("fornecedor", e.target.value)} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <Label>Formato de Cobrança</Label>
                <Select value={form.formatoCobranca} onValueChange={v => set("formatoCobranca", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reais">Reais (R$)</SelectItem>
                    <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => set("valor", Number(e.target.value))} />
              </div>
              <div>
                <Label>Custo Interno</Label>
                <Input type="number" step="0.01" value={form.custoInterno} onChange={e => set("custoInterno", Number(e.target.value))} />
              </div>
              <div>
                <Label>Tipo Veículo Elegível</Label>
                <Select value={form.tipoVeiculoElegivel} onValueChange={v => set("tipoVeiculoElegivel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposVeiculoElegivel.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cooperativas</Label>
                <Select value={form.cooperativas} onValueChange={v => set("cooperativas", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    {["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={form.exibirBoleto} onCheckedChange={v => set("exibirBoleto", v)} />
                <Label className="text-xs">Exibir no Boleto</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.exibirApp} onCheckedChange={v => set("exibirApp", v)} />
                <Label className="text-xs">Exibir no App</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.permiteDesconto} onCheckedChange={v => set("permiteDesconto", v)} />
                <Label className="text-xs">Permite Desconto</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={v => set("ativo", v)} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editId ? "Salvar Alterações" : "Cadastrar Produto"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
