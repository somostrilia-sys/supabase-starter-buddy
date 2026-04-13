import { useState, useEffect, useRef } from "react";
import { registrarAuditoria } from "@/lib/auditoria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PhoneInput from "@/components/ui/phone-input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DocumentosVendaTab from "@/components/DocumentosVendaTab";
import {
  Search, User, Car, DollarSign, FileText, Clock, AlertTriangle,
  Eye, Pencil, History, ArrowLeft, Save, Upload, Trash2, Plus,
  Download, ChevronLeft, ChevronRight, X, MapPin, Phone, Mail,
  Heart, KeyRound, Landmark, GraduationCap, Loader2,
} from "lucide-react";

// ─── Mock Data ───
const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface Associado {
  id: string; codigo: string; nome: string; cpf: string; rg: string;
  dataNasc: string; sexo: string; estadoCivil: string; profissao: string;
  cnh: string; categoriaCnh: string; escolaridade: string;
  celular: string; telResidencial: string; telComercial: string;
  email: string; emailAux: string; contato: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; estado: string;
  nomeConjuge: string; nomePai: string; nomeMae: string;
  regional: string; cooperativa: string; consultorResp: string;
  banco: string; agencia: string; contaCorrente: string; diaVencimento: string;
  observacoes: string; status: string; plano: string; dataAdesao: string;
  veiculos: { placa: string; modelo: string; marca: string; ano: number; cor: string; situacao: string; plano: string }[];
  lancamentos: { data: string; tipo: string; valor: number; status: string; vencimento: string }[];
  documentos: { nome: string; tipo: string; dataUpload: string }[];
  historico: { dataHora: string; usuario: string; campo: string; anterior: string; novo: string }[];
  ocorrencias: { numero: string; data: string; tipo: string; placa: string; status: string; valorEstimado: number }[];
}

const mockAssociados: Associado[] = [];


// statusBadge replaced by StatusBadge component

const finBadge = (s: string) => {
  const map: Record<string, string> = {
    "Pago": "bg-success/10 text-success border-success/20",
    "Pendente": "bg-warning/10 text-warning border-warning/25",
    "Atrasado": "bg-destructive/8 text-destructive border-red-200",
  };
  return map[s] || "";
};

const ocBadge = (s: string) => {
  const map: Record<string, string> = {
    "Aberto": "bg-primary/8 text-primary border-blue-200",
    "Em Análise": "bg-warning/10 text-warning border-warning/25",
    "Aprovado": "bg-success/10 text-success border-success/20",
    "Negado": "bg-destructive/8 text-destructive border-red-200",
    "Concluído": "bg-muted text-muted-foreground",
  };
  return map[s] || "";
};

export default function AlterarAssociado() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ cpf: "", nome: "", placa: "", situacao: "Todos", regional: "Todos", cooperativa: "Todos" });
  const [results, setResults] = useState<Associado[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Associado | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [regionaisOpts, setRegionaisOpts] = useState<string[]>([]);
  const [cooperativasOpts, setCooperativasOpts] = useState<string[]>([]);

  const [regionaisMap, setRegionaisMap] = useState<Record<string, string>>({});
  const [cooperativasMap, setCooperativasMap] = useState<Record<string, { nome: string; regional_id: string }>>({});

  useEffect(() => {
    supabase.from("regionais").select("id, nome").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) {
        setRegionaisOpts(data.map((r: any) => r.nome));
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.id] = r.nome; });
        setRegionaisMap(map);
      }
    });
    supabase.from("cooperativas").select("id, nome, regional_id").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) {
        setCooperativasOpts(data.map((c: any) => c.nome));
        const map: Record<string, { nome: string; regional_id: string }> = {};
        data.forEach((c: any) => { map[c.id] = { nome: c.nome, regional_id: c.regional_id }; });
        setCooperativasMap(map);
      }
    });
  }, []);
  const [ocModal, setOcModal] = useState(false);
  const [newOc, setNewOc] = useState({ tipo: "", veiculo: "", data: "", descricao: "", valor: "" });
  const [veicModal, setVeicModal] = useState(false);
  const [veicDetail, setVeicDetail] = useState<any>(null);
  const [veicLoading, setVeicLoading] = useState(false);
  const [veicSaving, setVeicSaving] = useState(false);
  const [veicForm, setVeicForm] = useState<Record<string, string>>({});
  const [veicFiles, setVeicFiles] = useState<{ nome: string; preview?: string; file: File }[]>([]);
  const veicFileRef = useRef<HTMLInputElement>(null);

  const openVeicDetail = async (placa: string) => {
    setVeicModal(true);
    setVeicLoading(true);
    setVeicFiles([]);
    try {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*, contratos(*, planos(nome)), associados(nome, cpf, regional_id, cooperativa_id, endereco_cidade, endereco_uf)")
        .ilike("placa", placa)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("Veículo não encontrado"); setVeicModal(false); return; }
      setVeicDetail(data);

      // Buscar taxa administrativa e rateio da faixas_fipe (mesma lógica do LAPS)
      let taxaAdm = "";
      let rateioVal = "";
      let regId = data.associados?.regional_id || null;

      // Resolver regional pela cidade de circulação
      if (!regId && data.associados?.endereco_cidade && data.associados?.endereco_uf) {
        const { data: mun } = await (supabase as any).from("municipios")
          .select("id").eq("uf", data.associados.endereco_uf).ilike("nome", data.associados.endereco_cidade).limit(1).maybeSingle();
        if (mun) {
          const { data: rc } = await (supabase as any).from("regional_cidades")
            .select("regional_id").eq("municipio_id", mun.id).limit(1).maybeSingle();
          if (rc) regId = rc.regional_id;
        }
      }

      if (regId && data.valor_fipe > 0) {
        const modelo = (data.modelo || "").toLowerCase();
        let tipoSga = "AUTOMOVEL";
        if (/moto|cg |cb |honda cg/i.test(modelo)) tipoSga = "MOTOCICLETA";
        else if (/scania|volvo fh|iveco|cargo|constellation/i.test(modelo)) tipoSga = "PESADOS";
        else if (/sprinter|daily|ducato|master/i.test(modelo)) tipoSga = "VANS E PESADOS P.P";
        else if (/fiorino|kangoo|doblo|strada|saveiro/i.test(modelo)) tipoSga = "UTILITARIOS";

        const { data: faixa } = await (supabase as any).from("faixas_fipe")
          .select("taxa_administrativa, rateio")
          .eq("regional_id", regId).eq("tipo_veiculo", tipoSga)
          .lte("fipe_min", data.valor_fipe).gte("fipe_max", data.valor_fipe)
          .limit(1).maybeSingle();
        if (faixa) {
          taxaAdm = `R$ ${Number(faixa.taxa_administrativa || 0).toFixed(2).replace(".", ",")}`;
          rateioVal = `R$ ${Number(faixa.rateio || 0).toFixed(2).replace(".", ",")}`;
        }
      }

      // Buscar produtos vinculados para calcular cota (subtotal)
      const { data: veicProds } = await (supabase as any).from("veiculo_produtos")
        .select("produto_id, produtos_gia(valor, nome)").eq("veiculo_id", data.id);
      const subtotal = (veicProds || []).reduce((s: number, vp: any) => s + (Number(vp.produtos_gia?.valor) || 0), 0);
      const cotaVal = subtotal > 0 ? `R$ ${subtotal.toFixed(2).replace(".", ",")}` : data.cota || "";

      setVeicForm({
        placa: data.placa || "",
        modelo: data.modelo || "",
        marca: data.marca || "",
        ano: String(data.ano || ""),
        chassi: data.chassi || "",
        cor: data.cor || "",
        status: data.status || "Ativo",
        plano: data.contratos?.[0]?.planos?.nome || ((veicProds || []).length > 0 ? `${(veicProds || []).length} produtos` : "Sem plano vinculado"),
        renavam: data.renavam || "",
        combustivel: data.combustivel || "",
        categoria: data.categoria || "",
        cota: cotaVal,
        valor_fipe: data.valor_fipe || "",
        taxa_adm: taxaAdm,
        rateio: rateioVal,
      });
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar veículo");
      setVeicModal(false);
    } finally {
      setVeicLoading(false);
    }
  };

  const saveVeicDetail = async () => {
    if (!veicDetail) return;
    setVeicSaving(true);
    try {
      const { error } = await supabase
        .from("veiculos")
        .update({
          placa: veicForm.placa,
          modelo: veicForm.modelo,
          marca: veicForm.marca,
          ano: veicForm.ano ? parseInt(veicForm.ano) : null,
          chassi: veicForm.chassi,
          cor: veicForm.cor,
          status: veicForm.status,
        })
        .eq("id", veicDetail.id);
      if (error) throw error;
      toast.success("Veículo atualizado com sucesso!");
      setVeicModal(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar veículo");
    } finally {
      setVeicSaving(false);
    }
  };

  const handleVeicFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({
      nome: f.name,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      file: f,
    }));
    setVeicFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} arquivo(s) adicionado(s)`);
    e.target.value = "";
  };

  const setF = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const buscar = async () => {
    setSearching(true);
    try {
      // Select enxuto pra listagem — joins pesados (veiculos/contratos/planos) são lazy-loaded quando o user clica num associado
      let query = supabase
        .from("associados")
        .select("id, nome, cpf, data_nascimento, telefone, email, status, regional_id, cooperativa_id, endereco_cep, endereco_logradouro, endereco_bairro, endereco_cidade, endereco_uf, codigo_sga, regionais(id, nome), cooperativas(id, nome)")
        .order("nome")
        .limit(50);

      if (filters.cpf) {
        const docClean = filters.cpf.replace(/\D/g, "");
        if (docClean.length >= 3) query = query.eq("cpf", docClean as any);
      }
      if (filters.nome && filters.nome.trim().length >= 3) query = query.ilike("nome", `%${filters.nome.trim()}%`);
      if (filters.situacao === "Inadimplente") {
        query = query.in("status", ["inativo", "inativo_pendencia"] as any[]);
      } else if (filters.situacao === "Cancelado") {
        query = query.eq("status", "cancelado" as any);
      } else if (filters.situacao !== "Todos") {
        query = query.eq("status", filters.situacao.toLowerCase() as any);
      }

      // Filtrar por regional (busca id pelo nome selecionado)
      if (filters.regional !== "Todos") {
        const regId = Object.entries(regionaisMap).find(([, nome]) => nome === filters.regional)?.[0];
        if (regId) query = query.eq("regional_id", regId as any);
      }
      // Filtrar por cooperativa
      if (filters.cooperativa !== "Todos") {
        const coopId = Object.entries(cooperativasMap).find(([, c]) => c.nome === filters.cooperativa)?.[0];
        if (coopId) query = query.eq("cooperativa_id", coopId as any);
      }

      const { data: supabaseData, error } = await query;

      if (error) throw error;

      if (supabaseData && supabaseData.length > 0) {
        // Map Supabase data to Associado format
        const mapped: Associado[] = supabaseData.map((a: any) => ({
          id: a.id,
          codigo: a.codigo || a.cpf || a.id.slice(0, 6).toUpperCase(),
          nome: a.nome,
          cpf: a.cpf,
          rg: a.rg || "",
          dataNasc: a.data_nascimento || "",
          sexo: "",
          estadoCivil: "",
          profissao: "",
          cnh: a.cnh || "",
          categoriaCnh: "",
          escolaridade: "",
          celular: a.telefone || "",
          telResidencial: "",
          telComercial: "",
          email: a.email || "",
          emailAux: "",
          contato: "",
          cep: a.endereco_cep || "",
          logradouro: a.endereco_logradouro || "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: a.endereco_cidade || "",
          estado: a.endereco_uf || "",
          nomeConjuge: "",
          nomePai: "",
          nomeMae: "",
          regional: a.regionais?.nome || (a.regional_id ? regionaisMap[a.regional_id] : "") || "",
          cooperativa: a.cooperativas?.nome || (a.cooperativa_id ? cooperativasMap[a.cooperativa_id]?.nome : "") || "",
          consultorResp: a.consultor_responsavel || "Não Identificado",
          banco: "",
          agencia: "",
          contaCorrente: "",
          diaVencimento: a.dia_vencimento ? String(a.dia_vencimento) : (a.veiculos?.[0]?.dia_vencimento ? String(a.veiculos[0].dia_vencimento) : "10"),
          observacoes: "",
          status: a.status === "ativo" ? "Ativo" : a.status === "suspenso" ? "Suspenso" : a.status === "cancelado" ? "Cancelado" : (a.status === "inativo" || a.status === "inativo_pendencia") ? "Inadimplente" : "Ativo",
          plano: a.contratos?.[0]?.planos?.nome || "",
          dataAdesao: a.data_adesao || "",
          veiculos: (a.veiculos || []).map((v: any) => ({
            placa: v.placa,
            modelo: v.modelo,
            marca: v.marca,
            ano: v.ano || 0,
            cor: v.cor || "",
            situacao: "Ativo",
            plano: a.contratos?.[0]?.planos?.nome || "",
          })),
          lancamentos: [],
          documentos: [],
          historico: [],
          ocorrencias: [],
        }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar associados");
      setResults([]);
    } finally {
      setSearching(false);
    }
    setSearched(true);
    setPage(1);
  };

  const limpar = () => {
    setFilters({ cpf: "", nome: "", placa: "", situacao: "Todos", regional: "Todos", cooperativa: "Todos" });
    setResults([]);
    setSearched(false);
  };

  const openEdit = async (a: Associado) => {
    setSelected(a);
    setEditForm({
      nome: a.nome, cpf: a.cpf, rg: a.rg, dataNasc: a.dataNasc, sexo: a.sexo,
      estadoCivil: a.estadoCivil, profissao: a.profissao, cnh: a.cnh, categoriaCnh: a.categoriaCnh,
      escolaridade: a.escolaridade, celular: a.celular, telResidencial: a.telResidencial,
      telComercial: a.telComercial, email: a.email, emailAux: a.emailAux, contato: a.contato,
      cep: a.cep, logradouro: a.logradouro, numero: a.numero, complemento: a.complemento,
      bairro: a.bairro, cidade: a.cidade, estado: a.estado,
      nomeConjuge: a.nomeConjuge, nomePai: a.nomePai, nomeMae: a.nomeMae,
      regional: a.regional, cooperativa: a.cooperativa, consultorResp: a.consultorResp,
      banco: a.banco, agencia: a.agencia, contaCorrente: a.contaCorrente,
      diaVencimento: a.diaVencimento, observacoes: a.observacoes, status: a.status, plano: a.plano,
    });
    // Carregar histórico do audit_log (ERR-010)
    const isRealId = a.id.includes("-") && a.id.length > 10;
    if (isRealId) {
      try {
        const { data: logs } = await supabase
          .from("audit_log")
          .select("campo_alterado, acao, created_at, dados_anteriores, dados_novos, usuario_nome, usuario_id")
          .or(`entidade_id.eq.${a.id},associado_id.eq.${a.id}`)
          .order("created_at", { ascending: false })
          .limit(50);
        if (logs && logs.length > 0) {
          const hist = logs.map((l: any) => ({
            campo: l.campo_alterado || l.acao || "Alteração",
            dataHora: new Date(l.created_at).toLocaleString("pt-BR"),
            anterior: l.dados_anteriores?.valor ?? l.valor_antigo ?? "",
            novo: l.dados_novos?.valor ?? l.valor_novo ?? "",
            usuario: l.usuario_nome || l.usuario_id?.slice(0, 8) || "Sistema",
          }));
          setSelected(prev => prev ? { ...prev, historico: hist } : prev);
        }
      } catch (e) { console.warn("Erro ao carregar histórico:", e); }
    }
  };

  const setE = (k: string, v: string) => setEditForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!selected) return;
    const isRealId = selected.id.includes("-") && selected.id.length > 10;
    // Validação: Telefone obrigatório (ERR-003)
    if (!editForm.celular?.trim()) {
      toast.error("O campo Telefone Principal é obrigatório.");
      return;
    }
    // Validação: Consultor Responsável obrigatório (ERR-004)
    if (!editForm.consultorResp?.trim() || editForm.consultorResp === "Não Identificado") {
      toast.error("O campo Consultor Responsável é obrigatório. Informe o consultor vinculado.");
      return;
    }
    setSaving(true);
    try {
      // Only attempt Supabase save if it looks like a real UUID
      const isRealId = selected.id.includes("-") && selected.id.length > 10;
      if (isRealId) {
        const statusDbMap: Record<string, string> = {
          "Ativo": "ativo", "Inadimplente": "inativo", "Cancelado": "cancelado", "Suspenso": "suspenso",
          "Inativo": "inativo",
        };
        const { error } = await supabase
          .from("associados")
          .update({
            nome: editForm.nome,
            telefone: editForm.celular || null,
            email: editForm.email || null,
            endereco_logradouro: editForm.logradouro || null,
            endereco_cidade: editForm.cidade || null,
            endereco_uf: editForm.estado || null,
            endereco_cep: editForm.cep || null,
            status: (statusDbMap[editForm.status] || "ativo") as any,
            rg: editForm.rg || null,
            cnh: editForm.cnh || null,
            consultor_responsavel: editForm.consultorResp || "Não Identificado",
            dia_vencimento: editForm.diaVencimento ? parseInt(editForm.diaVencimento) : null,
          })
          .eq("id", selected.id);
        if (error) throw error;
      }
      // Registrar alterações no histórico (ERR-010) - batch
      if (isRealId) {
        const camposParaAuditar: [string, string, string][] = [
          ["nome", selected.nome, editForm.nome],
          ["telefone", selected.celular, editForm.celular],
          ["email", selected.email, editForm.email],
          ["rg", selected.rg, editForm.rg],
          ["cnh", selected.cnh, editForm.cnh],
          ["status", selected.status, editForm.status],
          ["consultor_responsavel", selected.consultorResp, editForm.consultorResp],
          ["dia_vencimento", selected.diaVencimento || "", editForm.diaVencimento || ""],
          ["endereco_cidade", selected.cidade, editForm.cidade],
          ["endereco_uf", selected.estado, editForm.estado],
          ["endereco_cep", selected.cep, editForm.cep],
        ];
        const { data: { user } } = await supabase.auth.getUser();
        const auditRows = camposParaAuditar
          .filter(([, antigo, novo]) => (antigo || "") !== (novo || ""))
          .map(([campo, antigo, novo]) => ({
            entidade: "associado", entidade_id: selected.id, associado_id: selected.id,
            campo_alterado: campo, valor_antigo: antigo || "", valor_novo: novo || "",
            origem_modulo: "gestao", usuario_id: user?.id,
            dados_anteriores: { valor: antigo || "" }, dados_novos: { valor: novo || "" },
            acao: "UPDATE_ASSOCIADO", tabela: "associado", registro_id: selected.id,
          }));
        if (auditRows.length > 0) {
          supabase.from("audit_log").insert(auditRows as any).then(({ error }) => {
            if (error) console.warn("Erro ao registrar auditoria:", error);
          });
        }
      }
      toast.success("Alterações salvas com sucesso!", { description: `${editForm.nome} - Histórico registrado automaticamente.` });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };


  const paged = results.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(results.length / perPage);

  const totalMens = selected ? selected.lancamentos.reduce((s, l) => s + l.valor, 0) : 0;
  const inadimpl = selected ? selected.lancamentos.filter(l => l.status === "Atrasado").length : 0;
  const ultimoPag = selected ? selected.lancamentos.find(l => l.status === "Pago") : null;

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Consultar / Alterar Associado</h2>
          <p className="text-sm text-muted-foreground">Busque e edite cadastros de associados</p>
        </div>

        {/* Busca Avançada */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div><Label className="text-xs">CPF/CNPJ</Label><Input value={filters.cpf} onChange={e => setF("cpf", e.target.value)} placeholder="Ex: 000.000.000-00 ou 00.000.000/0001-00" /></div>
              <div><Label className="text-xs">Nome Completo do Associado</Label><Input value={filters.nome} onChange={e => setF("nome", e.target.value)} placeholder="Ex: João da Silva" /></div>
              <div><Label className="text-xs">Placa do Veículo</Label><Input value={filters.placa} onChange={e => setF("placa", e.target.value)} placeholder="Ex: ABC1D23 ou ABC-1234" /></div>
              <div>
                <Label className="text-xs">Status do Cadastro</Label>
                <Select value={filters.situacao} onValueChange={v => setF("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos","Ativo","Inadimplente","Cancelado","Suspenso"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Regional Responsável</Label>
                <Select value={filters.regional} onValueChange={v => setF("regional", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos",...regionaisOpts].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cooperativa Vinculada</Label>
                <Select value={filters.cooperativa} onValueChange={v => setF("cooperativa", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos",...cooperativasOpts].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buscar} disabled={searching} className="gap-1.5">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {searching ? "Buscando..." : "Buscar"}
              </Button>
              <Button variant="outline" onClick={limpar}>Limpar Filtros</Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {searched && (
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Nenhum associado encontrado com os filtros informados.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Regional</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                          <TableCell className="font-medium text-sm">{a.nome}</TableCell>
                          <TableCell className="text-sm">{a.cpf}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell className="text-sm">{a.regional}</TableCell>
                          <TableCell className="text-sm">{a.celular}</TableCell>
                          <TableCell className="text-sm font-mono">{a.veiculos[0]?.placa || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => openEdit(a)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Histórico" onClick={() => openEdit(a)}><History className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between p-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{results.length} resultado(s)</span>
                      <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10,25,50].map(n => <SelectItem key={n} value={String(n)}>{n}/pág</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-sm px-2">{page}/{totalPages || 1}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── EDIT VIEW ──
  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{selected.nome}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">{selected.codigo} • {selected.cpf} • <StatusBadge status={selected.status} /></p>
        </div>
      </div>

      <Tabs defaultValue="pessoal">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="pessoal" className="gap-1 text-xs"><User className="h-3.5 w-3.5" />Dados</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-1 text-xs"><Car className="h-3.5 w-3.5" />Veículos</TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1 text-xs"><DollarSign className="h-3.5 w-3.5" />Financeiro</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" />Documentos</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1 text-xs"><Clock className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="ocorrencias" className="gap-1 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Ocorrências</TabsTrigger>
          <TabsTrigger value="venda" className="gap-1 text-xs"><Eye className="h-3.5 w-3.5" />Processo de Venda</TabsTrigger>
        </TabsList>

        {/* TAB 1 - DADOS PESSOAIS */}
        <TabsContent value="pessoal" className="mt-4">
          <Accordion type="multiple" defaultValue={["sec-dados","sec-endereco","sec-telefones"]} className="space-y-3">
            <AccordionItem value="sec-dados" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Dados do Associado</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="lg:col-span-2"><Label className="text-xs">Nome Completo do Associado</Label><Input value={editForm.nome||""} onChange={e => setE("nome", e.target.value)} placeholder="Nome completo" /></div>
                  <div><Label className="text-xs">CPF/CNPJ</Label><Input value={editForm.cpf||""} disabled className="bg-muted/50" placeholder="000.000.000-00" /></div>
                  <div><Label className="text-xs">RG</Label><Input value={editForm.rg||""} onChange={e => setE("rg", e.target.value)} /></div>
                  <div><Label className="text-xs">Data Nascimento</Label><Input type="date" value={editForm.dataNasc||""} onChange={e => setE("dataNasc", e.target.value)} /></div>
                  <div><Label className="text-xs">Sexo</Label>
                    <Select value={editForm.sexo} onValueChange={v => setE("sexo", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Profissão</Label><Input value={editForm.profissao||""} onChange={e => setE("profissao", e.target.value)} /></div>
                  <div><Label className="text-xs">CNH</Label><Input value={editForm.cnh||""} onChange={e => setE("cnh", e.target.value)} /></div>
                  <div><Label className="text-xs">Categoria CNH</Label>
                    <Select value={editForm.categoriaCnh} onValueChange={v => setE("categoriaCnh", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["A","B","C","D","E","AB","AC","AD","AE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Status do Cadastro</Label>
                    <Select value={editForm.status} onValueChange={v => setE("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Ativo","Inativo","Suspenso","Cancelado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Plano</Label>
                    <Select value={editForm.plano} onValueChange={v => setE("plano", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Básico","Intermediário","Completo","Premium","Executivo"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-endereco" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Endereço</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">CEP</Label><Input value={editForm.cep||""} onChange={e => setE("cep", e.target.value)} placeholder="00000-000" /></div>
                  <div className="lg:col-span-2"><Label className="text-xs">Logradouro</Label><Input value={editForm.logradouro||""} onChange={e => setE("logradouro", e.target.value)} placeholder="Rua, Avenida, etc." /></div>
                  <div><Label className="text-xs">Nº</Label><Input value={editForm.numero||""} onChange={e => setE("numero", e.target.value)} placeholder="Nº" /></div>
                  <div><Label className="text-xs">Complemento</Label><Input value={editForm.complemento||""} onChange={e => setE("complemento", e.target.value)} placeholder="Apto, Bloco, etc." /></div>
                  <div><Label className="text-xs">Bairro</Label><Input value={editForm.bairro||""} onChange={e => setE("bairro", e.target.value)} placeholder="Bairro" /></div>
                  <div><Label className="text-xs">Cidade</Label><Input value={editForm.cidade||""} onChange={e => setE("cidade", e.target.value)} placeholder="Cidade" /></div>
                  <div><Label className="text-xs">UF</Label>
                    <Select value={editForm.estado} onValueChange={v => setE("estado", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-escolaridade" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Escolaridade</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="max-w-xs pt-2">
                  <Label className="text-xs">Nível</Label>
                  <Select value={editForm.escolaridade} onValueChange={v => setE("escolaridade", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Fundamental","Médio","Superior","Pós-graduação","Mestrado","Doutorado"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-telefones" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Telefones</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Telefone Principal <span className="text-destructive">*</span></Label><PhoneInput value={editForm.celular||""} onChange={v => setE("celular", v)} /></div>
                  <div><Label className="text-xs">Tel. Residencial</Label><PhoneInput value={editForm.telResidencial||""} onChange={v => setE("telResidencial", v)} /></div>
                  <div><Label className="text-xs">Tel. Comercial</Label><PhoneInput value={editForm.telComercial||""} onChange={v => setE("telComercial", v)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-emails" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Emails e Contatos</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">E-mail do Associado</Label><Input value={editForm.email||""} onChange={e => setE("email", e.target.value)} placeholder="email@exemplo.com" /></div>
                  <div><Label className="text-xs">E-mail Secundário</Label><Input value={editForm.emailAux||""} onChange={e => setE("emailAux", e.target.value)} placeholder="email@exemplo.com" /></div>
                  <div><Label className="text-xs">Contato de Referência</Label><Input value={editForm.contato||""} onChange={e => setE("contato", e.target.value)} placeholder="Nome e telefone" /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-familiares" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Informações Familiares</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div><Label className="text-xs">Estado Civil</Label>
                    <Select value={editForm.estadoCivil} onValueChange={v => setE("estadoCivil", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Solteiro","Casado","Divorciado","Viúvo","União Estável"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Nome Cônjuge</Label><Input value={editForm.nomeConjuge||""} onChange={e => setE("nomeConjuge", e.target.value)} /></div>
                  <div><Label className="text-xs">Nome do Pai</Label><Input value={editForm.nomePai||""} onChange={e => setE("nomePai", e.target.value)} /></div>
                  <div><Label className="text-xs">Nome da Mãe</Label><Input value={editForm.nomeMae||""} onChange={e => setE("nomeMae", e.target.value)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-acesso" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Acesso e Categorização</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Regional Responsável</Label>
                    <Select value={editForm.regional || ""} onValueChange={v => setE("regional", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                      <SelectContent>{regionaisOpts.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Cooperativa Vinculada</Label>
                    <Select value={editForm.cooperativa || ""} onValueChange={v => setE("cooperativa", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione a cooperativa" /></SelectTrigger>
                      <SelectContent>{cooperativasOpts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Consultor Responsável <span className="text-destructive">*</span></Label><Input value={editForm.consultorResp||""} onChange={e => setE("consultorResp", e.target.value)} placeholder="Nome do consultor" /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-financeiro" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Informações Financeiras</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Banco</Label><Input value={editForm.banco||""} onChange={e => setE("banco", e.target.value)} placeholder="Ex: Bradesco, Itaú" /></div>
                  <div><Label className="text-xs">Agência</Label><Input value={editForm.agencia||""} onChange={e => setE("agencia", e.target.value)} placeholder="0000" /></div>
                  <div><Label className="text-xs">Conta Corrente</Label><Input value={editForm.contaCorrente||""} onChange={e => setE("contaCorrente", e.target.value)} placeholder="00000-0" /></div>
                  <div><Label className="text-xs">Dia de Vencimento</Label>
                    <Select value={editForm.diaVencimento} onValueChange={v => setE("diaVencimento", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 10, 20].map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-obs" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Dados Complementares</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                <div>
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={editForm.observacoes||""} onChange={e => setE("observacoes", e.target.value)} rows={3} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </TabsContent>

        {/* TAB 2 - VEÍCULOS */}
        <TabsContent value="veiculos" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Vincular Novo Veículo</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.veiculos.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{v.placa}</TableCell>
                      <TableCell className="text-sm">{v.modelo}</TableCell>
                      <TableCell className="text-sm">{v.marca}</TableCell>
                      <TableCell className="text-sm">{v.ano}</TableCell>
                      <TableCell className="text-sm">{v.cor}</TableCell>
                      <TableCell><StatusBadge status={v.situacao} /></TableCell>
                      <TableCell className="text-sm">{v.plano}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openVeicDetail(v.placa)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary" title="Ver LAPS / Produtos" onClick={() => navigate(`/gestao?tab=veiculo&placa=${v.placa}&vtab=laps`)}>LAPS</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Desvincular"><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 - FINANCEIRO */}
        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Mensalidades</p><p className="text-xl font-bold text-primary">R$ {totalMens.toFixed(2).replace(".", ",")}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Inadimplência</p><p className="text-xl font-bold text-destructive">{inadimpl} parcela(s)</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Último Pagamento</p><p className="text-xl font-bold">{ultimoPag ? new Date(ultimoPag.data).toLocaleDateString("pt-BR") : "-"}</p></CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.lancamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum valor gerado</TableCell>
                    </TableRow>
                  ) : selected.lancamentos.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{new Date(l.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{l.tipo}</TableCell>
                      <TableCell className="text-sm font-medium">R$ {l.valor.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell><Badge variant="outline" className={finBadge(l.status)}>{l.status}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(l.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 - DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-4 space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">CNH, CRLV, Comprovante de Residência, Contrato</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Upload</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.documentos.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{d.nome}</TableCell>
                      <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                      <TableCell className="text-sm">{d.dataUpload}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download"><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 - HISTÓRICO */}
        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {selected.historico.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma alteração registrada no histórico.</p>
                )}
                {selected.historico.map((h, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
                      {i < selected.historico.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{h.campo}</span>
                        <span className="text-xs text-muted-foreground">• {h.dataHora}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">De:</span> <span className="line-through text-destructive/70">{h.anterior || "(vazio)"}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="text-emerald-600 font-medium">{h.novo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">por {h.usuario}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6 - OCORRÊNCIAS */}
        <TabsContent value="ocorrencias" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setOcModal(true)}><Plus className="h-3.5 w-3.5" />Nova Ocorrência</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Estimado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.ocorrencias.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhuma ocorrência registrada.</TableCell></TableRow>
                  ) : selected.ocorrencias.map((o, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                      <TableCell className="text-sm">{new Date(o.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{o.tipo}</TableCell>
                      <TableCell className="font-mono text-sm">{o.placa}</TableCell>
                      <TableCell><Badge variant="outline" className={ocBadge(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell className="text-sm">R$ {o.valorEstimado.toLocaleString("pt-BR",{minimumFractionDigits:2})}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Modal Nova Ocorrência */}
          <Dialog open={ocModal} onOpenChange={setOcModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newOc.tipo} onValueChange={v => setNewOc(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{["Roubo","Furto","Colisão","Incêndio","Alagamento","Outros"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Veículo</Label>
                  <Select value={newOc.veiculo} onValueChange={v => setNewOc(p => ({ ...p, veiculo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{selected.veiculos.map(v => <SelectItem key={v.placa} value={v.placa}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={newOc.data} onChange={e => setNewOc(p => ({ ...p, data: e.target.value }))} /></div>
                <div><Label>Descrição</Label><Textarea value={newOc.descricao} onChange={e => setNewOc(p => ({ ...p, descricao: e.target.value }))} rows={3} /></div>
                <div><Label>Valor Estimado (R$)</Label><Input value={newOc.valor} onChange={e => setNewOc(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" /></div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs">Upload de fotos</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOcModal(false)}>Cancelar</Button>
                <Button onClick={() => { toast.success("Ocorrência registrada!"); setOcModal(false); setNewOc({ tipo:"",veiculo:"",data:"",descricao:"",valor:"" }); }}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Aba Processo de Venda — docs da negociação de origem */}
        <TabsContent value="venda" className="mt-4">
          {(selected as any).negociacao_origem_id ? (
            <DocumentosVendaTab negociacaoId={(selected as any).negociacao_origem_id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Associado sem negociação de origem vinculada.</p>
              <p className="text-xs mt-1">Associados cadastrados manualmente ou migrados do sistema antigo não possuem documentos de venda.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Detalhes do Veículo */}
      <Dialog open={veicModal} onOpenChange={setVeicModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Detalhes do Veículo</DialogTitle></DialogHeader>
          {veicLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : veicDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Placa</Label><Input value={veicForm.placa || ""} onChange={e => setVeicForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} /></div>
                <div><Label className="text-xs">Modelo</Label><Input value={veicForm.modelo || ""} onChange={e => setVeicForm(p => ({ ...p, modelo: e.target.value }))} /></div>
                <div><Label className="text-xs">Marca</Label><Input value={veicForm.marca || ""} onChange={e => setVeicForm(p => ({ ...p, marca: e.target.value }))} /></div>
                <div><Label className="text-xs">Ano</Label><Input value={veicForm.ano || ""} onChange={e => setVeicForm(p => ({ ...p, ano: e.target.value }))} /></div>
                <div><Label className="text-xs">Chassi</Label><Input value={veicForm.chassi || ""} onChange={e => setVeicForm(p => ({ ...p, chassi: e.target.value.toUpperCase() }))} /></div>
                <div><Label className="text-xs">Cor</Label><Input value={veicForm.cor || ""} onChange={e => setVeicForm(p => ({ ...p, cor: e.target.value }))} /></div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={veicForm.status || ""} onValueChange={v => setVeicForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Ativo","Inativo","Pendente","Negado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Renavam</Label><Input value={veicForm.renavam || ""} onChange={e => setVeicForm(p => ({ ...p, renavam: e.target.value }))} /></div>
                <div><Label className="text-xs">Combustível</Label><Input value={veicForm.combustivel || ""} onChange={e => setVeicForm(p => ({ ...p, combustivel: e.target.value }))} /></div>
                <div><Label className="text-xs">Categoria</Label><Input value={veicForm.categoria || ""} onChange={e => setVeicForm(p => ({ ...p, categoria: e.target.value }))} /></div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-semibold mb-2">Plano e Valores</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label className="text-xs">Plano</Label><Input value={veicForm.plano || ""} disabled className="bg-muted/50" /></div>
                  <div><Label className="text-xs">Cota</Label><Input value={veicForm.cota || "Não encontrado"} disabled className="bg-muted/50" /></div>
                  <div><Label className="text-xs">Taxa Administrativa</Label><Input value={veicForm.taxa_adm || "-"} disabled className="bg-muted/50" /></div>
                  <div><Label className="text-xs">Rateio</Label><Input value={veicForm.rateio || "-"} disabled className="bg-muted/50" /></div>
                  <div><Label className="text-xs">Valor FIPE</Label><Input value={veicForm.valor_fipe ? `R$ ${String(veicForm.valor_fipe).replace(".", ",")}` : "-"} disabled className="bg-muted/50" /></div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { setVeicModal(false); navigate(`/gestao?tab=veiculo&placa=${veicForm.placa}&vtab=laps`); }}>
                  <Eye className="h-3.5 w-3.5" /> Ver Produtos (LAPS)
                </Button>
              </div>

              {/* Upload de Arquivos */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">Documentos / Fotos</Label>
                <input type="file" ref={veicFileRef} className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={handleVeicFileSelect} />
                <Button variant="outline" size="sm" className="gap-1.5 mb-3" onClick={() => veicFileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Adicionar Arquivos
                </Button>
                {veicFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {veicFiles.map((f, i) => (
                      <div key={i} className="border rounded-lg p-2 text-center relative">
                        {f.preview ? (
                          <img src={f.preview} alt={f.nome} className="w-full h-16 object-cover rounded mb-1" />
                        ) : (
                          <div className="w-full h-16 bg-muted flex items-center justify-center rounded mb-1"><FileText className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                        <p className="text-[10px] truncate">{f.nome}</p>
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-5 w-5" onClick={() => setVeicFiles(prev => prev.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVeicModal(false)}>Cancelar</Button>
            <Button onClick={saveVeicDetail} disabled={veicSaving || veicLoading} className="gap-1.5">
              {veicSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {veicSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
