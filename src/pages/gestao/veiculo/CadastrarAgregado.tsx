import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Car, Plus, Search, Trash2, X, Eraser, Upload, ArrowLeft,
  Package, DollarSign, FileText, Settings, Users, MapPin, RefreshCw,
} from "lucide-react";
import { mockVeiculos } from "./mockVeiculos";

const SelectWithAdd = ({ label, value, onValueChange, options, placeholder, required }: {
  label: string; value: string; onValueChange: (v: string) => void;
  options: string[]; placeholder?: string; required?: boolean;
}) => {
  const [items, setItems] = useState(options);
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  return (
    <div>
      <Label className="text-xs">{label}{required && " *"}</Label>
      <div className="flex gap-1">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Selecione"} /></SelectTrigger>
          <SelectContent>{items.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {adding && (
        <div className="flex gap-1 mt-1">
          <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Novo valor" className="h-8 text-xs" />
          <Button size="sm" className="h-8 text-xs" onClick={() => { if (newVal.trim()) { setItems(p => [...p, newVal.trim()]); onValueChange(newVal.trim()); } setAdding(false); setNewVal(""); }}>OK</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAdding(false); setNewVal(""); }}><X className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
};

interface ProdutoVinculado { nome: string; valor: string; }
interface ProdutoAdicional { descricao: string; valor: string; periodo: string; classificacao: string; }

const produtosRegional = [
  { id: "1", nome: "Proteção Roubo/Furto", grupo: "Proteção" },
  { id: "2", nome: "Proteção Colisão", grupo: "Proteção" },
  { id: "3", nome: "Proteção Incêndio", grupo: "Proteção" },
  { id: "4", nome: "Assistência 24h", grupo: "Assistência" },
  { id: "5", nome: "Guincho 200km", grupo: "Assistência" },
  { id: "6", nome: "Carro Reserva 7 dias", grupo: "Benefício" },
  { id: "7", nome: "Vidros", grupo: "Proteção" },
  { id: "8", nome: "Rastreador Veicular", grupo: "Rastreador" },
];

const initialForm = {
  classificacao: "", idExterno: "", situacao: "Ativo", dataContrato: "", modelo: "", montadora: "",
  anoFab: "", anoMod: "", zeroKm: false, placa: "", valorAgregado: "", codAvaliacao: "",
  tabelaAvaliacao: "", tipo: "", categoria: "", cor: "", cota: "", chassi: "", alienado: "",
  renavam: "", participacao: "", valorAdesao: "", valorRepasse: "",
  cobranca: "", cobrarRateio: false, cobrarTaxaAdm: false, vlrFixoBoleto: "", credito: "", pontos: "",
  substituirPlaca: "", implementoTexto: "", tipoDocumento: "", regional: "Regional Capital",
  observacoes: "",
};

const exampleData = {
  classificacao: "Agregado", idExterno: "AGR-2025-001", situacao: "Ativo", dataContrato: "2025-03-01",
  modelo: "Onix Plus 1.0 Turbo", montadora: "Chevrolet", anoFab: "2024", anoMod: "2025",
  zeroKm: false, placa: "DEF-4G56", valorAgregado: "85000", codAvaliacao: "COD-001",
  tabelaAvaliacao: "Tabela Padrão", tipo: "Automóvel", categoria: "Passeio", cor: "Prata",
  cota: "Cota B", chassi: "9BWZZZ377VT004251", alienado: "Não", renavam: "12345678901",
  participacao: "10", valorAdesao: "350,00", valorRepasse: "150,00",
  cobranca: "Boleto", cobrarRateio: true, cobrarTaxaAdm: false, vlrFixoBoleto: "25,00",
  credito: "0,00", pontos: "0", substituirPlaca: "", implementoTexto: "",
  tipoDocumento: "", regional: "Regional Capital", observacoes: "Agregado vinculado ao veículo principal ABC-1D23.",
};

export default function CadastrarAgregado() {
  const [form, setForm] = useState(initialForm);
  const [searchPlaca, setSearchPlaca] = useState("");
  const [searchChassi, setSearchChassi] = useState("");
  const [veiculoPrincipal, setVeiculoPrincipal] = useState<typeof mockVeiculos[0] | null>(null);
  const [produtosVinculados, setProdutosVinculados] = useState<ProdutoVinculado[]>([]);
  const [produtosAdicionais, setProdutosAdicionais] = useState<ProdutoAdicional[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<{ nome: string; tipo: string; data: string }[]>([]);
  const [grupoProduto, setGrupoProduto] = useState("");

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const buscarVeiculoPrincipal = () => {
    const found = mockVeiculos.find(v =>
      (searchPlaca && v.placa.toLowerCase().replace("-", "").includes(searchPlaca.toLowerCase().replace("-", ""))) ||
      (searchChassi && v.chassi.toLowerCase().includes(searchChassi.toLowerCase()))
    );
    if (found) {
      setVeiculoPrincipal(found);
      toast.success("Veículo principal encontrado!");
    } else {
      toast.error("Veículo não encontrado.");
    }
  };

  const toggleProduto = (id: string) => {
    if (selectedProdutos.includes(id)) {
      setSelectedProdutos(p => p.filter(x => x !== id));
      setProdutosVinculados(p => p.filter(x => x.nome !== produtosRegional.find(pr => pr.id === id)?.nome));
    } else {
      setSelectedProdutos(p => [...p, id]);
      const prod = produtosRegional.find(pr => pr.id === id);
      if (prod) setProdutosVinculados(p => [...p, { nome: prod.nome, valor: "45,00" }]);
    }
  };

  const totalProdutos = produtosVinculados.reduce((s, p) => s + parseFloat(p.valor.replace(",", ".") || "0"), 0);

  const carregarExemplo = () => {
    setForm(exampleData as any);
    setSearchPlaca("ABC");
    const v = mockVeiculos[0];
    setVeiculoPrincipal(v);
    setProdutosVinculados([
      { nome: "Proteção Roubo/Furto", valor: "45,00" },
      { nome: "Assistência 24h", valor: "30,00" },
    ]);
    setSelectedProdutos(["1", "4"]);
    toast.success("Dados de exemplo carregados!");
  };

  const limpar = () => {
    setForm(initialForm);
    setVeiculoPrincipal(null);
    setSearchPlaca("");
    setSearchChassi("");
    setProdutosVinculados([]);
    setProdutosAdicionais([]);
    setSelectedProdutos([]);
    setDocumentos([]);
  };

  const salvar = () => {
    if (!veiculoPrincipal) { toast.error("Selecione um veículo principal."); return; }
    if (!form.placa || !form.modelo) { toast.error("Preencha placa e modelo do agregado."); return; }
    toast.success("Agregado cadastrado com sucesso!", { description: `Placa ${form.placa} vinculado a ${veiculoPrincipal.placa}` });
  };

  const now = new Date().toLocaleString("pt-BR");

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Car className="h-5 w-5" /> Cadastrar Agregado</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregarExemplo} className="gap-1"><FileText className="h-3.5 w-3.5" /> Carregar Exemplo</Button>
          <Button variant="outline" size="sm" onClick={limpar} className="gap-1"><Eraser className="h-3.5 w-3.5" /> Limpar</Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["s1", "s3", "s5", "s7"]} className="space-y-2">
        {/* Seção 1 - Veículo Principal */}
        <AccordionItem value="s1" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> 1. Selecionar Veículo Principal</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Placa</Label>
                <Input value={searchPlaca} onChange={e => setSearchPlaca(e.target.value)} placeholder="ABC-1D23" />
              </div>
              <div>
                <Label className="text-xs">Chassi</Label>
                <Input value={searchChassi} onChange={e => setSearchChassi(e.target.value)} placeholder="9BRXXX..." />
              </div>
              <div className="flex items-end">
                <Button onClick={buscarVeiculoPrincipal} className="gap-1"><Search className="h-4 w-4" /> Pesquisar</Button>
              </div>
            </div>
            {veiculoPrincipal && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Associado</span><p className="font-medium">{veiculoPrincipal.associadoNome}</p></div>
                    <div><span className="text-muted-foreground text-xs">CPF</span><p className="font-medium">{veiculoPrincipal.associadoCpf}</p></div>
                    <div><span className="text-muted-foreground text-xs">Matrícula</span><p className="font-medium">{veiculoPrincipal.associadoId}</p></div>
                    <div><span className="text-muted-foreground text-xs">Placa</span><p className="font-medium font-mono">{veiculoPrincipal.placa}</p></div>
                    <div><span className="text-muted-foreground text-xs">Marca</span><p className="font-medium">{veiculoPrincipal.marca}</p></div>
                    <div><span className="text-muted-foreground text-xs">Modelo</span><p className="font-medium">{veiculoPrincipal.modelo}</p></div>
                    <div><span className="text-muted-foreground text-xs">Reg. Associado</span><p className="font-medium">{veiculoPrincipal.regional}</p></div>
                    <div><span className="text-muted-foreground text-xs">Reg. Veículo</span><p className="font-medium">{veiculoPrincipal.regional}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Seção 2 - Cooperativa/Voluntário */}
        <AccordionItem value="s2" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 2. Cooperativa / Voluntário</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectWithAdd label="Cooperativa" value="" onValueChange={() => {}} options={["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul"]} />
              <SelectWithAdd label="Voluntário" value="" onValueChange={() => {}} options={["João Voluntário", "Maria Voluntária", "Pedro Auxiliar"]} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 3 - Dados do Agregado */}
        <AccordionItem value="s3" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> 3. Dados do Agregado</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SelectWithAdd label="Classificação" value={form.classificacao} onValueChange={v => set("classificacao", v)} options={["Agregado", "Substituto", "Reserva"]} />
              <div><Label className="text-xs">Id Externo</Label><Input value={form.idExterno} onChange={e => set("idExterno", e.target.value)} /></div>
              <div><Label className="text-xs">Data/Hora</Label><Input value={now} disabled className="bg-muted" /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select value={form.situacao} onValueChange={v => set("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Data Contrato</Label><Input type="date" value={form.dataContrato} onChange={e => set("dataContrato", e.target.value)} /></div>
              <div><Label className="text-xs">Modelo *</Label><Input value={form.modelo} onChange={e => set("modelo", e.target.value)} /></div>
              <SelectWithAdd label="Montadora" value={form.montadora} onValueChange={v => set("montadora", v)} options={["Chevrolet", "Fiat", "Volkswagen", "Ford", "Hyundai", "Toyota", "Honda", "Renault"]} required />
              <div>
                <Label className="text-xs">Ano Fabricação</Label>
                <Select value={form.anoFab} onValueChange={v => set("anoFab", v)}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 10 }, (_, i) => String(2025 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ano Modelo</Label>
                <Select value={form.anoMod} onValueChange={v => set("anoMod", v)}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 10 }, (_, i) => String(2026 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox checked={form.zeroKm} onCheckedChange={v => set("zeroKm", v)} id="zeroKm" />
                <Label htmlFor="zeroKm" className="text-xs">Placa 0km</Label>
              </div>
              <div><Label className="text-xs">Placa *</Label><Input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1D23" /></div>
              <div><Label className="text-xs">Valor Agregado (R$)</Label><Input value={form.valorAgregado} onChange={e => set("valorAgregado", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Cód. Avaliação</Label><Input value={form.codAvaliacao} onChange={e => set("codAvaliacao", e.target.value)} /></div>
              <div>
                <Label className="text-xs">Tabela Avaliação</Label>
                <Select value={form.tabelaAvaliacao} onValueChange={v => set("tabelaAvaliacao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tabela Padrão">Tabela Padrão</SelectItem>
                    <SelectItem value="Tabela Premium">Tabela Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SelectWithAdd label="Tipo" value={form.tipo} onValueChange={v => set("tipo", v)} options={["Automóvel", "Motocicleta", "Caminhão", "Van", "Ônibus"]} />
              <SelectWithAdd label="Categoria" value={form.categoria} onValueChange={v => set("categoria", v)} options={["Passeio", "Trabalho", "Frota", "Especial"]} />
              <SelectWithAdd label="Cor" value={form.cor} onValueChange={v => set("cor", v)} options={["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul"]} />
              <SelectWithAdd label="Cota" value={form.cota} onValueChange={v => set("cota", v)} options={["Cota A", "Cota B", "Cota C", "Cota D"]} />
              <div><Label className="text-xs">Chassi</Label><Input value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase())} maxLength={17} /></div>
              <div>
                <Label className="text-xs">Alienado</Label>
                <Select value={form.alienado} onValueChange={v => set("alienado", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Renavam</Label><Input value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))} /></div>
              <div><Label className="text-xs">Participação (%)</Label><Input value={form.participacao} onChange={e => set("participacao", e.target.value)} /></div>
              <div><Label className="text-xs">Valor Adesão (R$)</Label><Input value={form.valorAdesao} onChange={e => set("valorAdesao", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Valor Repasse (R$)</Label><Input value={form.valorRepasse} onChange={e => set("valorRepasse", e.target.value)} placeholder="0,00" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 4 - Dados Adicionais */}
        <AccordionItem value="s4" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> 4. Dados Adicionais Veículo</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground italic">Campos adicionais do veículo — Em breve</p>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 5 - Informações Financeiras */}
        <AccordionItem value="s5" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> 5. Informações Financeiras</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Cobrança</Label>
                <Select value={form.cobranca} onValueChange={v => set("cobranca", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Carnê">Carnê</SelectItem>
                    <SelectItem value="Débito Automático">Débito Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5"><Switch checked={form.cobrarRateio} onCheckedChange={v => set("cobrarRateio", v)} /><Label className="text-xs">Cobrar Rateio</Label></div>
              <div className="flex items-center gap-3 pt-5"><Switch checked={form.cobrarTaxaAdm} onCheckedChange={v => set("cobrarTaxaAdm", v)} /><Label className="text-xs">Cobrar Taxa Adm.</Label></div>
              <div><Label className="text-xs">Vlr. Fixo Boleto (R$)</Label><Input value={form.vlrFixoBoleto} onChange={e => set("vlrFixoBoleto", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Crédito (R$)</Label><Input value={form.credito} onChange={e => set("credito", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Pontos</Label><Input type="number" value={form.pontos} onChange={e => set("pontos", e.target.value)} placeholder="0" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 6 - Substituir Veículo */}
        <AccordionItem value="s6" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" /> 6. Substituir Veículo</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div>
              <Label className="text-xs">Placa do veículo a substituir</Label>
              <Select value={form.substituirPlaca} onValueChange={v => set("substituirPlaca", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione veículo" /></SelectTrigger>
                <SelectContent>
                  {mockVeiculos.slice(0, 5).map(v => (
                    <SelectItem key={v.id} value={v.placa}>{v.placa} - {v.marca} {v.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Lista de produtos será carregada ao selecionar o veículo.</p>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 7 - Produtos Agregado */}
        <AccordionItem value="s7" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> 7. Produtos Agregado</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Grupo Produto</Label>
              <Select value={grupoProduto} onValueChange={setGrupoProduto}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Proteção">Proteção</SelectItem>
                  <SelectItem value="Assistência">Assistência</SelectItem>
                  <SelectItem value="Benefício">Benefício</SelectItem>
                  <SelectItem value="Rastreador">Rastreador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Produtos da Regional</p>
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Produto</TableHead><TableHead>Grupo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {produtosRegional.filter(p => !grupoProduto || grupoProduto === "todos" || p.grupo === grupoProduto).map(p => (
                    <TableRow key={p.id}>
                      <TableCell><Checkbox checked={selectedProdutos.includes(p.id)} onCheckedChange={() => toggleProduto(p.id)} /></TableCell>
                      <TableCell className="text-sm">{p.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.grupo}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {produtosVinculados.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Produtos Vinculados</p>
                <Table>
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Valor (R$)</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {produtosVinculados.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{p.nome}</TableCell>
                        <TableCell><Input value={p.valor} onChange={e => { const nv = [...produtosVinculados]; nv[i].valor = e.target.value; setProdutosVinculados(nv); }} className="h-8 w-24 text-xs" /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setProdutosVinculados(p2 => p2.filter((_, j) => j !== i)); setSelectedProdutos(s => s.filter(id => produtosRegional.find(pr => pr.id === id)?.nome !== p.nome)); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-sm">TOTAL</TableCell>
                      <TableCell className="font-semibold text-sm">R$ {totalProdutos.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Seção 8 - Produto Adicional */}
        <AccordionItem value="s8" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> 8. Produto Adicional</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {produtosAdicionais.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Período</TableHead><TableHead>Classificação</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {produtosAdicionais.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{p.descricao}</TableCell>
                      <TableCell className="text-sm">R$ {p.valor}</TableCell>
                      <TableCell className="text-sm">{p.periodo}</TableCell>
                      <TableCell className="text-sm">{p.classificacao}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setProdutosAdicionais(pa => pa.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setProdutosAdicionais(pa => [...pa, { descricao: "", valor: "0,00", periodo: "Mensal", classificacao: "Adicional" }])}>
              <Plus className="h-3.5 w-3.5" /> Adicionar Produto
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 9 - Implemento */}
        <AccordionItem value="s9" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> 9. Implemento</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Textarea value={form.implementoTexto} onChange={e => set("implementoTexto", e.target.value)} placeholder="Descreva os implementos do veículo agregado..." rows={4} />
          </AccordionContent>
        </AccordionItem>

        {/* Seção 10 - Upload Documentos */}
        <AccordionItem value="s10" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> 10. Upload Imagens/Documentos</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Tipo Documento</Label>
                <Select value={form.tipoDocumento} onValueChange={v => set("tipoDocumento", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNH">CNH</SelectItem>
                    <SelectItem value="CRLV">CRLV</SelectItem>
                    <SelectItem value="Vistoria">Vistoria</SelectItem>
                    <SelectItem value="Comprovante">Comprovante</SelectItem>
                    <SelectItem value="Foto Veículo">Foto Veículo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Abrir cadastro de vistoria")}><FileText className="h-3.5 w-3.5" /> Cadastrar Vistoria</Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
              if (form.tipoDocumento) {
                setDocumentos(d => [...d, { nome: `documento_${d.length + 1}.pdf`, tipo: form.tipoDocumento, data: new Date().toLocaleDateString("pt-BR") }]);
                toast.success("Documento adicionado!");
              } else { toast.error("Selecione o tipo de documento."); }
            }}>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clique ou arraste arquivos aqui</p>
            </div>
            {documentos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {documentos.map((d, i) => (
                  <Card key={i} className="p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{d.tipo} • {d.data}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDocumentos(docs => docs.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Seção 11 - Regional */}
        <AccordionItem value="s11" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 11. Regional</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Input value={form.regional} disabled className="bg-muted w-64" />
          </AccordionContent>
        </AccordionItem>

        {/* Seção 12 - Observações */}
        <AccordionItem value="s12" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> 12. Observações Finais</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações gerais sobre o agregado..." rows={4} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer fixo */}
      <div className="sticky bottom-0 bg-background border-t-2 border-[#747474] py-3 flex justify-end gap-3 -mx-6 px-6">
        <Button variant="outline" className="gap-1"><X className="h-4 w-4" /> Voltar</Button>
        <Button variant="outline" onClick={limpar} className="gap-1"><Eraser className="h-4 w-4" /> Limpar</Button>
        <Button onClick={salvar} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"><Car className="h-4 w-4" /> Salvar</Button>
      </div>
    </div>
  );
}
