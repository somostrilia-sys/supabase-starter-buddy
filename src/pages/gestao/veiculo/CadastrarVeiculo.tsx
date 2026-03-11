import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Car, Plus, Search, Trash2, X, Copy, Eraser, Upload, DollarSign,
  FileText, MapPin, Users, Package, Settings, AlertTriangle, Landmark,
  Receipt, CreditCard, Send, Star, UserPlus, UserCheck, Loader2,
} from "lucide-react";

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0,5)}-${d.slice(5)}`;
};

const maskPlaca = (v: string) => {
  const u = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  return u.length <= 3 ? u : `${u.slice(0,3)}-${u.slice(3)}`;
};

const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

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
interface ProdutoAdicional { descricao: string; valor: string; cobrarAte: string; classificacao: string; }
interface Implemento { descricao: string; valor: string; porcentagem: string; somarProtegido: boolean; }
interface Documento { nome: string; tipo: string; data: string; }

interface AssociadoData {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  status: string;
}

type CategoriaVeiculo = "Leves" | "Pesados" | "Motos" | "Vans";

interface PlanoDisponivel {
  id: string;
  nome: string;
  icone: string;
  valorBase: number;
  categorias: CategoriaVeiculo[];
  coberturas: { id: string; nome: string; grupo: string; valorBase: number }[];
}

const planosDisponiveis: PlanoDisponivel[] = [
  { id: "p1", nome: "Premium", icone: "🏆", valorBase: 249.9, categorias: ["Leves", "Vans"],
    coberturas: [
      { id: "c1", nome: "Proteção Roubo/Furto", grupo: "Proteção", valorBase: 45 },
      { id: "c2", nome: "Proteção Colisão", grupo: "Proteção", valorBase: 55 },
      { id: "c3", nome: "Proteção Incêndio", grupo: "Proteção", valorBase: 25 },
      { id: "c4", nome: "Proteção Enchente/Alagamento", grupo: "Proteção", valorBase: 20 },
      { id: "c5", nome: "Proteção Terceiros", grupo: "Proteção", valorBase: 35 },
      { id: "c6", nome: "Vidros", grupo: "Proteção", valorBase: 18 },
      { id: "c7", nome: "Assistência 24h", grupo: "Assistência", valorBase: 29.9 },
      { id: "c8", nome: "Guincho 200km", grupo: "Assistência", valorBase: 19.9 },
      { id: "c9", nome: "Carro Reserva 7 dias", grupo: "Benefício", valorBase: 35 },
      { id: "c10", nome: "Rastreador Veicular", grupo: "Rastreador", valorBase: 59.9 },
      { id: "c11", nome: "APP (Acidentes Pessoais)", grupo: "Proteção", valorBase: 15 },
      { id: "c12", nome: "Assistência Residencial", grupo: "Assistência", valorBase: 12 },
    ],
  },
  { id: "p3", nome: "Básico", icone: "🛡️", valorBase: 89.9, categorias: ["Leves", "Pesados", "Motos", "Vans"],
    coberturas: [
      { id: "c1", nome: "Proteção Roubo/Furto", grupo: "Proteção", valorBase: 45 },
      { id: "c2", nome: "Proteção Colisão", grupo: "Proteção", valorBase: 55 },
      { id: "c7", nome: "Assistência 24h", grupo: "Assistência", valorBase: 29.9 },
    ],
  },
  { id: "p4", nome: "Objetivo Leve", icone: "🚗", valorBase: 119.9, categorias: ["Leves"],
    coberturas: [
      { id: "c1", nome: "Proteção Roubo/Furto", grupo: "Proteção", valorBase: 45 },
      { id: "c2", nome: "Proteção Colisão", grupo: "Proteção", valorBase: 55 },
      { id: "c3", nome: "Proteção Incêndio", grupo: "Proteção", valorBase: 25 },
      { id: "c5", nome: "Proteção Terceiros", grupo: "Proteção", valorBase: 35 },
      { id: "c7", nome: "Assistência 24h", grupo: "Assistência", valorBase: 29.9 },
      { id: "c8", nome: "Guincho 200km", grupo: "Assistência", valorBase: 19.9 },
    ],
  },
  { id: "p5", nome: "Objetivo Sul", icone: "📍", valorBase: 139.9, categorias: ["Leves", "Vans"],
    coberturas: [
      { id: "c1", nome: "Proteção Roubo/Furto", grupo: "Proteção", valorBase: 45 },
      { id: "c2", nome: "Proteção Colisão", grupo: "Proteção", valorBase: 55 },
      { id: "c3", nome: "Proteção Incêndio", grupo: "Proteção", valorBase: 25 },
      { id: "c4", nome: "Proteção Enchente/Alagamento", grupo: "Proteção", valorBase: 20 },
      { id: "c5", nome: "Proteção Terceiros", grupo: "Proteção", valorBase: 35 },
      { id: "c7", nome: "Assistência 24h", grupo: "Assistência", valorBase: 29.9 },
      { id: "c8", nome: "Guincho 200km", grupo: "Assistência", valorBase: 19.9 },
      { id: "c9", nome: "Carro Reserva 7 dias", grupo: "Benefício", valorBase: 35 },
    ],
  },
];

const categoriasMap: Record<string, CategoriaVeiculo> = {
  "Automóvel": "Leves", "Passeio": "Leves", "Utilitário": "Leves",
  "Caminhão": "Pesados", "Ônibus": "Pesados", "Reboque": "Pesados",
  "Motocicleta": "Motos", "Moto": "Motos", "Ciclomotor": "Motos",
  "Van": "Vans", "Furgão": "Vans", "Microônibus": "Vans",
};

const initialForm = {
  classificacao: "", tipoAdesao: "", chassi: "", placa: "", zeroKm: false, renavam: "",
  cilindrada: "", modelo: "", montadora: "", anoFab: "", anoMod: "", tipo: "", categoria: "",
  codFipe: "", depreciacao: "", valorFipe: "", valorProtegido: "", pctFipe: "",
  cota: "", codAvaliacao: "", tabelaAvaliacao: "", combustivel: "", cor: "",
  nMotor: "", km: "", cambio: "", nPassageiros: "", nPortas: "", alienado: "",
  valorAdesao: "", formaPagtoAdesao: "", tipoFormaPagtoProtecao: "", tipoCarga: "",
  tipoCarroceria: "", valorRepasse: "", dataPagtoAdesao: "",
  premioCasco: "", premioRcf: "", franquia: "", certSeguradora: "", garagem: "", finalidade: "",
  estipulante: "", subEstipulante: "", seguradora: "", corretor: "", responsavel: "", beneficiario: "",
  cobrarRateio: false, formatoCobranca: "", boletoFisico: false, taxaAdm: "",
  banco: "", agencia: "", creditoDebito: "", participacao: "",
  tipoEnvioBoleto: "", vencimento: "",
  tipoCobranca: "",
  tipoBoletoVeiculo: "", tipoBoletobenef: "",
  cep: "", logradouro: "", numero: "", bairro: "", complemento: "", cidade: "", estado: "",
  assocIndicacao: "", pontosPlaca: "", pontosBenef: "",
  grupoProduto: "",
  obsAssociado: "", obsVeiculo: "",
  alerta: "",
};

const mockPreenchido = {
  ...initialForm,
  classificacao: "Automóvel", tipoAdesao: "Normal", chassi: "9BWZZZ377VT004251",
  placa: "BRA-2E19", renavam: "01234567890", cilindrada: "999",
  modelo: "T-Cross 200 TSI Comfortline", montadora: "Volkswagen",
  anoFab: "2023", anoMod: "2024", tipo: "Passeio", categoria: "Particular",
  codFipe: "004399-0", depreciacao: "Normal", valorFipe: "119.500,00",
  valorProtegido: "119.500,00", pctFipe: "100", cota: "Cota 120",
  combustivel: "Flex", cor: "Branco", nMotor: "EA211DKTA012345",
  km: "12500", cambio: "Automático", nPassageiros: "5", nPortas: "4",
  valorAdesao: "350,00", formaPagtoAdesao: "Boleto",
  cobrarRateio: true, formatoCobranca: "Mensal", taxaAdm: "15,00",
  banco: "Bradesco", agencia: "1234", creditoDebito: "Crédito", participacao: "2.500,00",
  tipoEnvioBoleto: "Email", vencimento: "10",
  tipoCobranca: "Boleto",
  tipoBoletoVeiculo: "Único", tipoBoletobenef: "Individual",
  cep: "01310-100", logradouro: "Av. Paulista", numero: "1578",
  bairro: "Bela Vista", complemento: "Apto 42", cidade: "São Paulo", estado: "SP",
};

const initialNovoAssociado = {
  nome: "", cpf: "", rg: "", data_nascimento: "", cep: "", endereco: "", cidade: "", estado: "", telefone: "", email: "",
};

export default function CadastrarVeiculo() {
  const [form, setForm] = useState(initialForm);
  const [produtosVinculados, setProdutosVinculados] = useState<ProdutoVinculado[]>([
    { nome: "Proteção Roubo/Furto", valor: "89,90" },
    { nome: "Assistência 24h", valor: "29,90" },
  ]);
  const [produtosAdicionais, setProdutosAdicionais] = useState<ProdutoAdicional[]>([]);
  const [implementos, setImplementos] = useState<Implemento[]>([
    { descricao: "Som Pioneer AVH-Z9290TV", valor: "2.800,00", porcentagem: "100", somarProtegido: true },
  ]);
  const [documentos, setDocumentos] = useState<Documento[]>([
    { nome: "CRLV_BRA2E19.pdf", tipo: "CRLV", data: "05/03/2026" },
  ]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(["1", "4"]);

  // Associate linking states
  const [associadoId, setAssociadoId] = useState<string | null>(null);
  const [associadoData, setAssociadoData] = useState<AssociadoData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AssociadoData[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoForm, setNovoForm] = useState(initialNovoAssociado);
  const [savingAssociado, setSavingAssociado] = useState(false);
  const [savingVeiculo, setSavingVeiculo] = useState(false);

  const set = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }));

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = searchQuery.trim();
        const { data, error } = await supabase
          .from("associados")
          .select("id, nome, cpf, telefone, email, status")
          .or(`nome.ilike.%${q}%,cpf.ilike.%${q}%`)
          .limit(10);
        if (error) throw error;
        setSearchResults((data as AssociadoData[]) || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectAssociado = (a: AssociadoData) => {
    setAssociadoId(a.id);
    setAssociadoData(a);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    toast.success(`Associado ${a.nome} vinculado!`);
  };

  const desvincularAssociado = () => {
    setAssociadoId(null);
    setAssociadoData(null);
  };

  const handleSalvarNovoAssociado = async () => {
    if (!novoForm.nome.trim()) return toast.error("Nome é obrigatório");
    if (novoForm.cpf.replace(/\D/g, "").length !== 11) return toast.error("CPF inválido");
    setSavingAssociado(true);
    try {
      const { data, error } = await supabase.from("associados").insert({
        nome: novoForm.nome.trim(),
        cpf: novoForm.cpf.replace(/\D/g, ""),
        rg: novoForm.rg || null,
        data_nascimento: novoForm.data_nascimento || null,
        cep: novoForm.cep || null,
        endereco: novoForm.endereco || null,
        cidade: novoForm.cidade || null,
        estado: novoForm.estado || null,
        telefone: novoForm.telefone || null,
        email: novoForm.email || null,
      }).select("id, nome, cpf, telefone, email, status").single();
      if (error) throw error;
      selectAssociado(data as AssociadoData);
      setShowNovoModal(false);
      setNovoForm(initialNovoAssociado);
      toast.success("Associado cadastrado e vinculado!");
    } catch (err: any) {
      toast.error("Erro ao cadastrar associado: " + (err.message || "Erro desconhecido"));
    } finally {
      setSavingAssociado(false);
    }
  };

  const buscarCepNovoAssociado = async () => {
    const cepClean = novoForm.cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return toast.error("CEP inválido");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) return toast.error("CEP não encontrado");
      setNovoForm(p => ({
        ...p,
        endereco: `${data.logradouro || ""}, ${data.bairro || ""}`,
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
      toast.success("Endereço encontrado!");
    } catch {
      toast.error("Erro ao buscar CEP");
    }
  };

  const buscarCep = () => {
    if (form.cep.replace(/\D/g, "").length !== 8) return toast.error("CEP inválido");
    set("logradouro", "Av. Paulista"); set("bairro", "Bela Vista");
    set("cidade", "São Paulo"); set("estado", "SP");
    toast.success("Endereço encontrado!");
  };

  const buscarFipe = () => {
    set("valorFipe", "119.500,00"); set("modelo", "T-Cross 200 TSI Comfortline");
    toast.success("Valor FIPE atualizado!");
  };

  const decodificarVin = () => {
    if (form.chassi.length !== 17) return toast.error("Chassi deve ter 17 caracteres");
    set("montadora", "Volkswagen"); set("modelo", "T-Cross 200 TSI");
    set("anoFab", "2023"); set("anoMod", "2024");
    toast.success("VIN decodificado!");
  };

  const handleSalvar = async () => {
    if (!associadoId) return toast.error("Vincule um associado antes de salvar");
    if (!form.chassi) return toast.error("Chassi é obrigatório");
    if (!form.placa && !form.zeroKm) return toast.error("Placa é obrigatória");
    if (!form.modelo) return toast.error("Modelo é obrigatório");
    if (!form.montadora) return toast.error("Montadora é obrigatória");

    setSavingVeiculo(true);
    try {
      const valorFipeNum = form.valorFipe ? parseFloat(form.valorFipe.replace(/\./g, "").replace(",", ".")) : null;
      const anoNum = form.anoFab ? parseInt(form.anoFab) : null;

      const { error } = await supabase.from("veiculos").insert({
        associado_id: associadoId,
        placa: form.placa.replace("-", "") || "0KM",
        chassi: form.chassi,
        renavam: form.renavam || null,
        marca: form.montadora,
        modelo: form.modelo,
        ano: anoNum,
        cor: form.cor || null,
        valor_fipe: valorFipeNum,
      });
      if (error) throw error;
      toast.success("Veículo cadastrado com sucesso!", { description: `${form.modelo} - ${form.placa || "0KM"}` });
      handleLimpar();
      desvincularAssociado();
    } catch (err: any) {
      toast.error("Erro ao salvar veículo: " + (err.message || "Erro desconhecido"));
    } finally {
      setSavingVeiculo(false);
    }
  };

  const handleLimpar = () => { setForm({ ...initialForm }); toast.info("Formulário limpo"); };
  const carregarMock = () => { setForm(mockPreenchido); toast.info("Dados de exemplo carregados"); };

  const toggleProduto = (id: string) => {
    setProdutosSelecionados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const totalProdutos = produtosVinculados.reduce((s, p) => s + parseFloat(p.valor.replace(",", ".") || "0"), 0);

  const addProdutoAdicional = () => setProdutosAdicionais(p => [...p, { descricao: "", valor: "", cobrarAte: "", classificacao: "" }]);
  const addImplemento = () => setImplementos(p => [...p, { descricao: "", valor: "", porcentagem: "", somarProtegido: false }]);

  const SectionIcon = ({ icon: Icon, label, num }: { icon: any; label: string; num: number }) => (
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">{num}. {label}</span></div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Cadastrar Veículo</h2>
          <p className="text-sm text-muted-foreground">Cadastro completo do veículo com produtos e documentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregarMock} className="gap-1.5 text-xs"><Copy className="h-3.5 w-3.5" />Exemplo</Button>
          <Button variant="outline" size="sm" onClick={handleLimpar} className="gap-1.5 text-xs"><Eraser className="h-3.5 w-3.5" />Limpar</Button>
        </div>
      </div>

      {/* ===== SEÇÃO 0 — ASSOCIADO (obrigatório) ===== */}
      <div className="border rounded-lg p-4 mb-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Associado Vinculado</span>
          <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
        </div>

        {associadoData ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{associadoData.nome}</p>
                    <p className="text-xs text-muted-foreground">CPF: {maskCpf(associadoData.cpf)}</p>
                    <div className="flex gap-3 mt-1">
                      {associadoData.telefone && <span className="text-xs text-muted-foreground">📱 {associadoData.telefone}</span>}
                      {associadoData.email && <span className="text-xs text-muted-foreground">✉️ {associadoData.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={associadoData.status === "ativo" ? "default" : "secondary"} className="text-xs">
                    {associadoData.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={desvincularAssociado}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Buscar associado por nome ou CPF..."
                    className="pl-9"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button variant="outline" onClick={() => setShowNovoModal(true)} className="gap-1.5 shrink-0">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Novo
                </Button>
              </div>

              {showSearch && searchResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(a => (
                    <button
                      key={a.id}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center justify-between border-b last:border-0 transition-colors"
                      onClick={() => selectAssociado(a)}
                    >
                      <div>
                        <p className="text-sm font-medium">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">CPF: {maskCpf(a.cpf)}</p>
                      </div>
                      <Badge variant={a.status === "ativo" ? "default" : "secondary"} className="text-xs">
                        {a.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {showSearch && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum associado encontrado</p>
                  <Button variant="link" size="sm" onClick={() => { setShowNovoModal(true); setShowSearch(false); }}>
                    Cadastrar novo associado
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">⚠️ Vincule um associado para habilitar o salvamento do veículo.</p>
          </div>
        )}
      </div>

      {/* Modal Novo Associado */}
      <Dialog open={showNovoModal} onOpenChange={setShowNovoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Cadastrar Novo Associado
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nome Completo *</Label>
              <Input value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">CPF *</Label>
              <Input value={novoForm.cpf} onChange={e => setNovoForm(p => ({ ...p, cpf: maskCpf(e.target.value) }))} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label className="text-xs">RG</Label>
              <Input value={novoForm.rg} onChange={e => setNovoForm(p => ({ ...p, rg: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Data Nascimento</Label>
              <Input type="date" value={novoForm.data_nascimento} onChange={e => setNovoForm(p => ({ ...p, data_nascimento: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">CEP</Label>
              <div className="flex gap-1">
                <Input value={novoForm.cep} onChange={e => setNovoForm(p => ({ ...p, cep: maskCep(e.target.value) }))} placeholder="00000-000" />
                <Button variant="outline" size="sm" type="button" onClick={buscarCepNovoAssociado}>Buscar</Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input value={novoForm.endereco} onChange={e => setNovoForm(p => ({ ...p, endereco: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Cidade</Label>
              <Input value={novoForm.cidade} onChange={e => setNovoForm(p => ({ ...p, cidade: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Select value={novoForm.estado} onValueChange={v => setNovoForm(p => ({ ...p, estado: v }))}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input value={novoForm.telefone} onChange={e => setNovoForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarNovoAssociado} disabled={savingAssociado} className="gap-1.5">
              {savingAssociado && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar e Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Accordion type="multiple" defaultValue={["sec-1", "sec-10"]} className="space-y-3">

        {/* SEÇÃO 1 */}
        <AccordionItem value="sec-1" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Car} label="Dados do Veículo" num={1} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <SelectWithAdd label="Classificação" value={form.classificacao} onValueChange={v => set("classificacao", v)} options={["Automóvel","Motocicleta","Caminhão","Van","Ônibus","Utilitário"]} />
              <SelectWithAdd label="Tipo Adesão" value={form.tipoAdesao} onValueChange={v => set("tipoAdesao", v)} options={["Normal","Renovação","Transferência","Cortesia"]} />
              <div>
                <Label className="text-xs">Chassi *</Label>
                <div className="flex gap-1"><Input value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase().slice(0,17))} maxLength={17} placeholder="17 caracteres" />
                <Button variant="outline" size="sm" onClick={decodificarVin}>VIN</Button></div>
              </div>
              <div>
                <Label className="text-xs">Placa *</Label>
                <div className="flex gap-1 items-center"><Input value={form.placa} onChange={e => set("placa", maskPlaca(e.target.value))} placeholder="ABC-1234" />
                <div className="flex items-center gap-1 shrink-0"><Checkbox checked={form.zeroKm as boolean} onCheckedChange={v => set("zeroKm", !!v)} /><span className="text-xs whitespace-nowrap">0km</span></div></div>
              </div>
              <div><Label className="text-xs">Renavam *</Label><Input value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="11 dígitos" /></div>
              <div><Label className="text-xs">Cilindrada</Label><Input value={form.cilindrada} onChange={e => set("cilindrada", e.target.value)} placeholder="Ex: 999" /></div>
              <div><Label className="text-xs">Modelo *</Label><Input value={form.modelo} onChange={e => set("modelo", e.target.value)} /></div>
              <SelectWithAdd label="Montadora" value={form.montadora} onValueChange={v => set("montadora", v)} options={["Chevrolet","Fiat","Ford","Honda","Hyundai","Jeep","Nissan","Renault","Toyota","Volkswagen"]} required />
              <div><Label className="text-xs">Ano Fabricação</Label>
                <Select value={form.anoFab} onValueChange={v => set("anoFab", v)}><SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>{Array.from({length:15},(_,i)=>String(2025-i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Ano Modelo</Label>
                <Select value={form.anoMod} onValueChange={v => set("anoMod", v)}><SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>{Array.from({length:15},(_,i)=>String(2026-i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              </div>
              <SelectWithAdd label="Tipo" value={form.tipo} onValueChange={v => set("tipo", v)} options={["Passeio","Utilitário","Carga","Especial"]} />
              <SelectWithAdd label="Categoria" value={form.categoria} onValueChange={v => set("categoria", v)} options={["Particular","Aluguel","Oficial","Missão Diplomática"]} />
              <div><Label className="text-xs">Cód. FIPE *</Label>
                <div className="flex gap-1"><Input value={form.codFipe} onChange={e => set("codFipe", e.target.value)} placeholder="000000-0" />
                <Button variant="outline" size="sm" onClick={buscarFipe}>FIPE</Button></div>
              </div>
              <SelectWithAdd label="Depreciação" value={form.depreciacao} onValueChange={v => set("depreciacao", v)} options={["Normal","Acelerada","Sem Depreciação"]} />
              <div><Label className="text-xs">Valor FIPE (R$) *</Label><Input value={form.valorFipe} onChange={e => set("valorFipe", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Valor Protegido (R$)</Label><Input value={form.valorProtegido} onChange={e => set("valorProtegido", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">% FIPE Protegido</Label><Input value={form.pctFipe} onChange={e => set("pctFipe", e.target.value)} placeholder="100" /></div>
              <SelectWithAdd label="Cota" value={form.cota} onValueChange={v => set("cota", v)} options={["Cota 80","Cota 100","Cota 120","Cota 150"]} />
              <div><Label className="text-xs">Cód. Avaliação</Label><Input value={form.codAvaliacao} onChange={e => set("codAvaliacao", e.target.value)} /></div>
              <div><Label className="text-xs">Tabela Avaliação</Label>
                <Select value={form.tabelaAvaliacao} onValueChange={v => set("tabelaAvaliacao", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["FIPE","Molicar","KBB"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <SelectWithAdd label="Combustível" value={form.combustivel} onValueChange={v => set("combustivel", v)} options={["Flex","Gasolina","Etanol","Diesel","Elétrico","Híbrido","GNV"]} />
              <SelectWithAdd label="Cor" value={form.cor} onValueChange={v => set("cor", v)} options={["Branco","Prata","Preto","Cinza","Vermelho","Azul","Marrom","Verde"]} />
              <div><Label className="text-xs">Nº Motor *</Label><Input value={form.nMotor} onChange={e => set("nMotor", e.target.value)} /></div>
              <div><Label className="text-xs">KM *</Label><Input type="number" value={form.km} onChange={e => set("km", e.target.value)} /></div>
              <div><Label className="text-xs">Câmbio</Label>
                <Select value={form.cambio} onValueChange={v => set("cambio", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Manual","Automático","CVT","Automatizado"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Nº Passageiros</Label>
                <Select value={form.nPassageiros} onValueChange={v => set("nPassageiros", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["2","4","5","7","8","9","10+"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Nº Portas</Label>
                <Select value={form.nPortas} onValueChange={v => set("nPortas", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["2","3","4","5"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
              </div>
              <SelectWithAdd label="Alienado" value={form.alienado} onValueChange={v => set("alienado", v)} options={["Nenhum","Bradesco","Itaú","Santander","BV","Pan"]} />
              <div><Label className="text-xs">Valor Adesão (R$)</Label><Input value={form.valorAdesao} onChange={e => set("valorAdesao", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Forma Pagto Adesão</Label>
                <Select value={form.formaPagtoAdesao} onValueChange={v => set("formaPagtoAdesao", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Boleto","Cartão","PIX","Dinheiro"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Tipo/Forma Pagto Proteção</Label>
                <Select value={form.tipoFormaPagtoProtecao} onValueChange={v => set("tipoFormaPagtoProtecao", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Boleto Mensal","Carnê","Débito Automático","Cartão Recorrente"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
              </div>
              <SelectWithAdd label="Tipo Carga" value={form.tipoCarga} onValueChange={v => set("tipoCarga", v)} options={["N/A","Seca","Refrigerada","Líquida","Granel"]} />
              <SelectWithAdd label="Tipo Carroceria" value={form.tipoCarroceria} onValueChange={v => set("tipoCarroceria", v)} options={["N/A","Baú","Carroceria","Plataforma","Tanque","Sider"]} />
              <div><Label className="text-xs">Valor Repasse (R$)</Label><Input value={form.valorRepasse} onChange={e => set("valorRepasse", e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Data Pagamento Adesão</Label><Input type="date" value={form.dataPagtoAdesao} onChange={e => set("dataPagtoAdesao", e.target.value)} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 2 */}
        <AccordionItem value="sec-2" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Car} label="Dados Adicionais Veículo" num={2} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div><Label className="text-xs">Prêmio Casco</Label><Input value={form.premioCasco} onChange={e => set("premioCasco", e.target.value)} placeholder="R$" /></div>
              <div><Label className="text-xs">Prêmio RCF</Label><Input value={form.premioRcf} onChange={e => set("premioRcf", e.target.value)} placeholder="R$" /></div>
              <div><Label className="text-xs">Franquia</Label><Input value={form.franquia} onChange={e => set("franquia", e.target.value)} placeholder="R$" /></div>
              <div><Label className="text-xs">Certificado Seguradora</Label><Input value={form.certSeguradora} onChange={e => set("certSeguradora", e.target.value)} /></div>
              <div><Label className="text-xs">Garagem</Label>
                <Select value={form.garagem} onValueChange={v => set("garagem", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Sim","Não","Estacionamento Coberto","Estacionamento Descoberto"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Finalidade</Label>
                <Select value={form.finalidade} onValueChange={v => set("finalidade", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Particular","Comercial","Táxi/App","Locação"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 3 */}
        <AccordionItem value="sec-3" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Settings} label="Dados Adicionais Seguro" num={3} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <SelectWithAdd label="Estipulante" value={form.estipulante} onValueChange={v => set("estipulante", v)} options={["Estipulante A","Estipulante B"]} />
              <SelectWithAdd label="Sub-estipulante" value={form.subEstipulante} onValueChange={v => set("subEstipulante", v)} options={["Sub A","Sub B"]} />
              <SelectWithAdd label="Seguradora" value={form.seguradora} onValueChange={v => set("seguradora", v)} options={["Porto Seguro","Allianz","SulAmérica","Tokio Marine"]} />
              <SelectWithAdd label="Corretor" value={form.corretor} onValueChange={v => set("corretor", v)} options={["Corretor A","Corretor B"]} />
              <SelectWithAdd label="Responsável" value={form.responsavel} onValueChange={v => set("responsavel", v)} options={["Ana Beatriz","Ricardo Souza","Camila Oliveira"]} />
              <SelectWithAdd label="Beneficiário" value={form.beneficiario} onValueChange={v => set("beneficiario", v)} options={["Próprio","Cônjuge","Filho(a)"]} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 4 */}
        <AccordionItem value="sec-4" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Landmark} label="Informações Financeiras" num={4} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-3"><Switch checked={form.cobrarRateio as boolean} onCheckedChange={v => set("cobrarRateio", v)} /><Label className="text-xs">Cobrar Rateio</Label></div>
              <div><Label className="text-xs">Formato Cobrança</Label>
                <Select value={form.formatoCobranca} onValueChange={v => set("formatoCobranca", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Mensal","Bimestral","Trimestral","Semestral","Anual"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="flex items-center gap-3"><Switch checked={form.boletoFisico as boolean} onCheckedChange={v => set("boletoFisico", v)} /><Label className="text-xs">Boleto Físico</Label></div>
              <div><Label className="text-xs">Taxa Adm (R$)</Label><Input value={form.taxaAdm} onChange={e => set("taxaAdm", e.target.value)} placeholder="0,00" /></div>
              <SelectWithAdd label="Banco" value={form.banco} onValueChange={v => set("banco", v)} options={["Bradesco","Itaú","Banco do Brasil","Caixa","Santander","Sicredi"]} />
              <div><Label className="text-xs">Agência</Label><Input value={form.agencia} onChange={e => set("agencia", e.target.value)} /></div>
              <div><Label className="text-xs">Crédito/Débito</Label>
                <Select value={form.creditoDebito} onValueChange={v => set("creditoDebito", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Crédito","Débito"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Participação (R$)</Label><Input value={form.participacao} onChange={e => set("participacao", e.target.value)} placeholder="0,00" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 5 */}
        <AccordionItem value="sec-5" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Send} label="Fechamento Veículo" num={5} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div><Label className="text-xs">Tipo Envio Boleto</Label>
                <Select value={form.tipoEnvioBoleto} onValueChange={v => set("tipoEnvioBoleto", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Email","Correio","WhatsApp","SMS"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Vencimento</Label>
                <Select value={form.vencimento} onValueChange={v => set("vencimento", v)}><SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>{Array.from({length:31},(_,i)=>i+1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 6 */}
        <AccordionItem value="sec-6" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={CreditCard} label="Cobrança Recorrente" num={6} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="max-w-xs pt-2">
              <Label className="text-xs">Tipo Cobrança</Label>
              <Select value={form.tipoCobranca} onValueChange={v => set("tipoCobranca", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{["Boleto","Carnê"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 7 */}
        <AccordionItem value="sec-7" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Receipt} label="Emissão Boletos" num={7} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div><Label className="text-xs">Tipo Boleto Veículo</Label>
                <Select value={form.tipoBoletoVeiculo} onValueChange={v => set("tipoBoletoVeiculo", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Único","Individual","Vencimento"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Tipo Boleto Beneficiário</Label>
                <Select value={form.tipoBoletobenef} onValueChange={v => set("tipoBoletobenef", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Individual","Agrupado"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 8 */}
        <AccordionItem value="sec-8" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={MapPin} label="Endereço Correspondência" num={8} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div><Label className="text-xs">CEP</Label>
                <div className="flex gap-1"><Input value={form.cep} onChange={e => set("cep", maskCep(e.target.value))} placeholder="00000-000" />
                <Button variant="outline" size="sm" onClick={buscarCep}>Buscar</Button></div>
              </div>
              <div className="lg:col-span-2"><Label className="text-xs">Logradouro</Label><Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} /></div>
              <div><Label className="text-xs">Nº</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} /></div>
              <div><Label className="text-xs">Bairro</Label><Input value={form.bairro} onChange={e => set("bairro", e.target.value)} /></div>
              <div><Label className="text-xs">Complemento</Label><Input value={form.complemento} onChange={e => set("complemento", e.target.value)} /></div>
              <div><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
              <div><Label className="text-xs">Estado</Label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 9 */}
        <AccordionItem value="sec-9" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Star} label="Indicação" num={9} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div><Label className="text-xs">Associado Indicação</Label><Input value={form.assocIndicacao} onChange={e => set("assocIndicacao", e.target.value)} placeholder="Nome ou código" /></div>
              <div><Label className="text-xs">Pontos/Placa</Label><Input type="number" value={form.pontosPlaca} onChange={e => set("pontosPlaca", e.target.value)} /></div>
              <div><Label className="text-xs">Pontos/Beneficiário</Label><Input type="number" value={form.pontosBenef} onChange={e => set("pontosBenef", e.target.value)} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 10 — PRODUTOS & MENSALIDADE UNIFICADA */}
        <AccordionItem value="sec-10" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Package} label="Produtos & Mensalidade" num={10} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-6">

            {/* --- PLANO SELECIONADO --- */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Plano Selecionado</p>
              <div className="max-w-sm mb-3">
                <Label className="text-xs">Plano</Label>
                <Select value={form.grupoProduto} onValueChange={v => set("grupoProduto", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>
                    {["Premium", "Básico", "Objetivo Leve", "Objetivo Sul"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.grupoProduto && (
                <div className="border rounded-lg p-3 bg-muted/20">
                  <p className="text-xs font-semibold mb-2">Proteções do Plano: <span className="text-primary">{form.grupoProduto}</span></p>
                  <div className="space-y-1">
                    {produtosRegional.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={produtosSelecionados.includes(p.id)} onCheckedChange={() => toggleProduto(p.id)} />
                          <span className="text-sm">{p.nome}</span>
                          <Badge variant="outline" className="text-[10px]">{p.grupo}</Badge>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          R$ {p.grupo === "Proteção" ? "45,00" : p.grupo === "Assistência" ? "29,90" : p.grupo === "Benefício" ? "35,00" : "59,90"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-semibold mt-3 text-right">
                    Subtotal Proteções: R$ {produtosSelecionados.reduce((sum, id) => {
                      const prod = produtosRegional.find(p => p.id === id);
                      if (!prod) return sum;
                      const val = prod.grupo === "Proteção" ? 45 : prod.grupo === "Assistência" ? 29.9 : prod.grupo === "Benefício" ? 35 : 59.9;
                      return sum + val;
                    }, 0).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}
            </div>

            {/* --- TAXA ADMINISTRATIVA --- */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Taxa Administrativa</p>
              <div className="border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faixa FIPE: <span className="font-medium text-foreground">R$ 100.000 a R$ 130.000</span> → Taxa: <span className="font-bold text-foreground">R$ 0,00</span></p>
                    <p className="text-[11px] text-muted-foreground mt-1 italic">Calculado automaticamente pela tabela de cotas</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Automático</Badge>
                </div>
              </div>
            </div>

            {/* --- RATEIO --- */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Rateio</p>
              <div className="border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Valor do Rateio: <span className="font-bold text-foreground">R$ 0,00</span></p>
                    <p className="text-[11px] text-muted-foreground mt-1 italic">Baseado na categoria e regional</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Automático</Badge>
                </div>
              </div>
            </div>

            {/* --- RESUMO DA MENSALIDADE --- */}
            <Card className="border-primary/30 bg-primary/5 shadow-md">
              <CardContent className="p-5">
                <p className="text-xs font-bold mb-3 uppercase tracking-wider text-primary">Resumo da Mensalidade</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proteções</span>
                    <span className="font-medium">R$ {produtosSelecionados.reduce((sum, id) => {
                      const prod = produtosRegional.find(p => p.id === id);
                      if (!prod) return sum;
                      const val = prod.grupo === "Proteção" ? 45 : prod.grupo === "Assistência" ? 29.9 : prod.grupo === "Benefício" ? 35 : 59.9;
                      return sum + val;
                    }, 0).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa administrativa</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rateio</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between items-center">
                    <span className="text-sm font-bold uppercase">Total Mensalidade</span>
                    <span className="text-2xl font-bold text-primary">R$ {produtosSelecionados.reduce((sum, id) => {
                      const prod = produtosRegional.find(p => p.id === id);
                      if (!prod) return sum;
                      const val = prod.grupo === "Proteção" ? 45 : prod.grupo === "Assistência" ? 29.9 : prod.grupo === "Benefício" ? 35 : 59.9;
                      return sum + val;
                    }, 0).toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 11 */}
        <AccordionItem value="sec-11" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={DollarSign} label="Produto Adicional" num={11} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <Table>
              <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Cobrar até</TableHead><TableHead>Classificação</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {produtosAdicionais.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={p.descricao} onChange={e => { const n=[...produtosAdicionais]; n[i].descricao=e.target.value; setProdutosAdicionais(n); }} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={p.valor} onChange={e => { const n=[...produtosAdicionais]; n[i].valor=e.target.value; setProdutosAdicionais(n); }} className="h-8 text-xs w-20" /></TableCell>
                    <TableCell><Input type="date" value={p.cobrarAte} onChange={e => { const n=[...produtosAdicionais]; n[i].cobrarAte=e.target.value; setProdutosAdicionais(n); }} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={p.classificacao} onChange={e => { const n=[...produtosAdicionais]; n[i].classificacao=e.target.value; setProdutosAdicionais(n); }} className="h-8 text-xs" /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setProdutosAdicionais(p => p.filter((_,idx)=>idx!==i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" onClick={addProdutoAdicional} className="mt-2 gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 12 */}
        <AccordionItem value="sec-12" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Package} label="Implementos" num={12} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <Table>
              <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>%</TableHead><TableHead>Somar Protegido</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {implementos.map((imp, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={imp.descricao} onChange={e => { const n=[...implementos]; n[i].descricao=e.target.value; setImplementos(n); }} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={imp.valor} onChange={e => { const n=[...implementos]; n[i].valor=e.target.value; setImplementos(n); }} className="h-8 text-xs w-24" /></TableCell>
                    <TableCell><Input value={imp.porcentagem} onChange={e => { const n=[...implementos]; n[i].porcentagem=e.target.value; setImplementos(n); }} className="h-8 text-xs w-16" /></TableCell>
                    <TableCell><Switch checked={imp.somarProtegido} onCheckedChange={v => { const n=[...implementos]; n[i].somarProtegido=v; setImplementos(n); }} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setImplementos(p => p.filter((_,idx)=>idx!==i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" onClick={addImplemento} className="mt-2 gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 13 */}
        <AccordionItem value="sec-13" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={Upload} label="Upload Documentos" num={13} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="flex gap-3 mb-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Tipo Documento</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["CRLV","CNH","Comprovante","Fotos Veículo","Laudo Vistoria","Outros"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button variant="outline" size="sm">Cadastrar Vistoria</Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center mb-3 hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
            </div>
            {documentos.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {documentos.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{d.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{d.tipo}</Badge></TableCell>
                      <TableCell className="text-xs">{d.data}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDocumentos(p => p.filter((_,idx)=>idx!==i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 14 */}
        <AccordionItem value="sec-14" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={FileText} label="Observações" num={14} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div><Label className="text-xs">Observação Associado</Label><Textarea value={form.obsAssociado} onChange={e => set("obsAssociado", e.target.value)} rows={3} /></div>
              <div><Label className="text-xs">Observação Veículo</Label><Textarea value={form.obsVeiculo} onChange={e => set("obsVeiculo", e.target.value)} rows={3} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 15 */}
        <AccordionItem value="sec-15" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30"><SectionIcon icon={AlertTriangle} label="Alerta" num={15} /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="max-w-sm pt-2">
              <SelectWithAdd label="Alerta" value={form.alerta} onValueChange={v => set("alerta", v)} options={["Nenhum","Atenção Especial","Restrição Judicial","Veículo Sinistrado","Cliente VIP"]} />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      <div className="sticky bottom-0 bg-background border-t py-4 mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={handleLimpar}>Cancelar</Button>
        <Button
          onClick={handleSalvar}
          disabled={!associadoId || savingVeiculo}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          title={!associadoId ? "Vincule um associado para salvar" : ""}
        >
          {savingVeiculo && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar Veículo
        </Button>
      </div>
    </div>
  );
}
