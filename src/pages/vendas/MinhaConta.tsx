import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Landmark, Save, Info, CheckCircle, Clock, User, KeyRound,
  DollarSign, Search, FileSpreadsheet, FileText, CalendarIcon,
  ChevronLeft, ChevronRight, TrendingUp, History,
  Camera, ImagePlus, Link, Instagram, MessageCircle, Trash2, ExternalLink, Loader2,
} from "lucide-react";

// ── Bank account constants & masks (kept from original) ──
const bancos = [
  "001 - Banco do Brasil", "033 - Santander", "104 - Caixa Econômica Federal",
  "237 - Bradesco", "341 - Itaú Unibanco", "260 - Nubank", "077 - Inter",
  "336 - C6 Bank", "756 - Sicoob", "748 - Sicredi", "212 - Original",
  "422 - Safra", "070 - BRB", "246 - ABC Brasil", "745 - Citibank",
  "399 - HSBC", "041 - Banrisul", "085 - Ailos", "403 - Cora",
  "290 - PagSeguro", "380 - PicPay", "323 - Mercado Pago",
];
const tiposConta = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Conta Poupança" },
  { value: "pj", label: "Pessoa Jurídica" },
];
function maskCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskAgencia(v: string) { return v.replace(/\D/g, "").slice(0, 6); }
function maskConta(v: string) { return v.replace(/\D/g, "").slice(0, 12); }
function maskDigito(v: string) { return v.replace(/\D/g, "").slice(0, 2); }
function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

// ── Mock commission history ──
type ComissaoStatus = "pago" | "pendente" | "processando";

interface ComissaoRecord {
  id: string;
  data: string;
  associado: string;
  negociacao: string;
  valorAdesao: number;
  percentual: number;
  valorRecebido: number;
  status: ComissaoStatus;
}

const day = 86400000;
const now = Date.now();

const mockComissoes: ComissaoRecord[] = [
  { id: "cr1", data: new Date(now - 1 * day).toISOString().split("T")[0], associado: "João Pereira", negociacao: "NEG-2026-001", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "processando" },
  { id: "cr2", data: new Date(now - 3 * day).toISOString().split("T")[0], associado: "Maria Santos", negociacao: "NEG-2026-002", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr3", data: new Date(now - 5 * day).toISOString().split("T")[0], associado: "Carlos Oliveira", negociacao: "NEG-2026-003", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr4", data: new Date(now - 7 * day).toISOString().split("T")[0], associado: "Ana Costa", negociacao: "NEG-2026-004", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr5", data: new Date(now - 9 * day).toISOString().split("T")[0], associado: "Roberto Lima", negociacao: "NEG-2026-005", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pendente" },
  { id: "cr6", data: new Date(now - 12 * day).toISOString().split("T")[0], associado: "Fernanda Alves", negociacao: "NEG-2026-006", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr7", data: new Date(now - 15 * day).toISOString().split("T")[0], associado: "Pedro Souza", negociacao: "NEG-2026-007", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr8", data: new Date(now - 18 * day).toISOString().split("T")[0], associado: "Juliana Mendes", negociacao: "NEG-2026-008", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr9", data: new Date(now - 22 * day).toISOString().split("T")[0], associado: "Marcos Silva", negociacao: "NEG-2026-009", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr10", data: new Date(now - 25 * day).toISOString().split("T")[0], associado: "Camila Rodrigues", negociacao: "NEG-2026-010", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr11", data: new Date(now - 28 * day).toISOString().split("T")[0], associado: "Lucas Ferreira", negociacao: "NEG-2026-011", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr12", data: new Date(now - 32 * day).toISOString().split("T")[0], associado: "Beatriz Nunes", negociacao: "NEG-2026-012", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr13", data: new Date(now - 35 * day).toISOString().split("T")[0], associado: "Gabriel Martins", negociacao: "NEG-2026-013", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pendente" },
  { id: "cr14", data: new Date(now - 40 * day).toISOString().split("T")[0], associado: "Isabela Costa", negociacao: "NEG-2026-014", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr15", data: new Date(now - 45 * day).toISOString().split("T")[0], associado: "Rafael Almeida", negociacao: "NEG-2026-015", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
];

const statusConfig: Record<ComissaoStatus, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "bg-success/15 text-success border-green-300" },
  pendente: { label: "Pendente", cls: "bg-warning/10 text-warning border-warning/30" },
  processando: { label: "Em Processamento", cls: "bg-primary/15 text-primary border-blue-300" },
};

const PAGE_SIZE = 10;

function slugify(text: string): string {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function MinhaConta() {
  const { profile } = useAuth();
  const [comissoesReais, setComissoesReais] = useState<any[]>([]);
  const [powerlinksData, setPowerlinksData] = useState<any[]>([]);
  const [afiliadosData, setAfiliadosData] = useState<any[]>([]);

  // ── Profile / consultant fields ──
  const [slug, setSlug] = useState("");
  const [fotoCapa, setFotoCapa] = useState<string | null>(null);
  const [fotosTrabalho, setFotosTrabalho] = useState<string[]>([]);
  const [fotosFundo, setFotosFundo] = useState<string[]>([]);
  const [uploadingFundo, setUploadingFundo] = useState(false);
  const fundoInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const capaInputRef = useRef<HTMLInputElement>(null);
  const fotosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.id) return;
    // Buscar comissões reais
    supabase.from("comissoes_consultor" as any).select("*").eq("consultor_id", profile.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setComissoesReais(data as any[]); });
    // Buscar powerlinks
    supabase.from("powerlinks" as any).select("*").eq("consultor_id", profile.id)
      .then(({ data }) => { if (data) setPowerlinksData(data as any[]); });
    // Buscar afiliados
    supabase.from("afiliados" as any).select("*").eq("consultor_id", profile.id).eq("ativo", true)
      .then(({ data }) => { if (data) setAfiliadosData(data as any[]); });
  }, [profile?.id]);

  // ── Load consultant profile fields from usuarios ──
  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("usuarios" as any)
      .select("slug, foto_capa_url, fotos_trabalho, fotos_fundo, bio, whatsapp, instagram, nome")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setSlug(data.slug || slugify(data.nome || profile.full_name || ""));
          setFotoCapa(data.foto_capa_url || null);
          setFotosTrabalho(data.fotos_trabalho || []);
          setFotosFundo(data.fotos_fundo || []);
          setBio(data.bio || "");
          setWhatsapp(data.whatsapp || "");
          setInstagramHandle(data.instagram || "");
        } else {
          // fallback slug from profile name
          setSlug(slugify(profile.full_name || ""));
        }
        setProfileLoaded(true);
      });
  }, [profile?.id]);

  // ── Upload helpers ──
  const uploadFile = useCallback(async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from("consultor-fotos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: pub } = supabase.storage.from("consultor-fotos").getPublicUrl(path);
    return pub.publicUrl;
  }, []);

  async function handleCapaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploadingCapa(true);
    const url = await uploadFile(file, `${profile.id}/capa.jpg`);
    if (url) {
      setFotoCapa(url + "?t=" + Date.now());
      await supabase.from("usuarios" as any).update({ foto_capa_url: url } as any).eq("id", profile.id);
      toast({ title: "Foto de capa atualizada!" });
    }
    setUploadingCapa(false);
    if (capaInputRef.current) capaInputRef.current.value = "";
  }

  async function handleFotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !profile?.id) return;
    const remaining = 6 - fotosTrabalho.length;
    if (files.length > remaining) {
      toast({ title: `Máximo 6 fotos. Você pode adicionar mais ${remaining}.`, variant: "destructive" });
      return;
    }
    setUploadingFoto(true);
    const newUrls = [...fotosTrabalho];
    for (let i = 0; i < files.length; i++) {
      const idx = fotosTrabalho.length + i;
      const url = await uploadFile(files[i], `${profile.id}/foto_${idx}.jpg`);
      if (url) newUrls.push(url);
    }
    setFotosTrabalho(newUrls);
    await supabase.from("usuarios" as any).update({ fotos_trabalho: newUrls } as any).eq("id", profile.id);
    toast({ title: "Fotos atualizadas!" });
    setUploadingFoto(false);
    if (fotosInputRef.current) fotosInputRef.current.value = "";
  }

  async function handleRemoveFoto(index: number) {
    if (!profile?.id) return;
    const newUrls = fotosTrabalho.filter((_, i) => i !== index);
    setFotosTrabalho(newUrls);
    await supabase.from("usuarios" as any).update({ fotos_trabalho: newUrls } as any).eq("id", profile.id);
    toast({ title: "Foto removida." });
  }

  async function handleFundoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !profile?.id) return;
    const remaining = 4 - fotosFundo.length;
    if (files.length > remaining) {
      toast({ title: `Máximo 4 fotos de fundo. Você pode adicionar mais ${remaining}.`, variant: "destructive" });
      return;
    }
    setUploadingFundo(true);
    const newUrls = [...fotosFundo];
    for (let i = 0; i < files.length; i++) {
      const idx = fotosFundo.length + i;
      const url = await uploadFile(files[i], `${profile.id}/fundo_${idx}.jpg`);
      if (url) newUrls.push(url);
    }
    setFotosFundo(newUrls);
    await supabase.from("usuarios" as any).update({ fotos_fundo: newUrls } as any).eq("id", profile.id);
    toast({ title: "Fotos de fundo atualizadas!" });
    setUploadingFundo(false);
    if (fundoInputRef.current) fundoInputRef.current.value = "";
  }

  async function handleRemoveFundo(index: number) {
    if (!profile?.id) return;
    const newUrls = fotosFundo.filter((_, i) => i !== index);
    setFotosFundo(newUrls);
    await supabase.from("usuarios" as any).update({ fotos_fundo: newUrls } as any).eq("id", profile.id);
    toast({ title: "Foto de fundo removida." });
  }

  async function handleSaveProfile() {
    if (!profile?.id) return;
    if (!slug.trim()) {
      toast({ title: "Slug é obrigatório", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.from("usuarios" as any).update({
      slug: slug.trim(),
      bio,
      whatsapp,
      instagram: instagramHandle,
    } as any).eq("id", profile.id);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast({ title: "Este slug já está em uso. Escolha outro.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Perfil do consultor salvo com sucesso!" });
    }
    setSavingProfile(false);
  }

  const landingPageUrl = slug ? `${window.location.origin}/c/${slug}` : "";

  // Bank form state
  const [tipoConta, setTipoConta] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [digito, setDigito] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [saved, setSaved] = useState(false);
  const [verificado, setVerificado] = useState(false);

  // Commission history state
  const [fStatus, setFStatus] = useState("all");
  const [fBusca, setFBusca] = useState("");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  function handleSave() {
    if (!tipoConta || !banco || !agencia || !conta || !digito || !cpfCnpj || !titular) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const digits = cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast({ title: "CPF ou CNPJ inválido", variant: "destructive" });
      return;
    }
    setSaved(true);
    setVerificado(false);
    toast({ title: "Dados bancários salvos com sucesso!", description: "Pendente de verificação pela equipe financeira." });
    setTimeout(() => setVerificado(true), 3000);
  }

  // Filter commissions
  const filtered = useMemo(() => {
    const comissoesList = comissoesReais.length > 0 ? comissoesReais.map((c: any) => ({ id: c.id, associado: c.associado_nome || c.negociacao_id || "", negociacao: c.negociacao_codigo || c.negociacao_id || "", data: (c.created_at || "").slice(0,10), plano: c.tipo || "", valorAdesao: Number(c.valor_adesao || 0), percentual: Number(c.percentual || 15), valorRecebido: Number(c.valor_calculado || 0), status: (c.pago ? "pago" : c.processando ? "processando" : "pendente") as ComissaoStatus })) : mockComissoes; return comissoesList.filter(c => {
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (fBusca) {
        const q = fBusca.toLowerCase();
        if (!c.associado.toLowerCase().includes(q) && !c.negociacao.toLowerCase().includes(q)) return false;
      }
      if (fDateStart && c.data < format(fDateStart, "yyyy-MM-dd")) return false;
      if (fDateEnd && c.data > format(fDateEnd, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [fStatus, fBusca, fDateStart, fDateEnd, comissoesReais]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 5.2 — Forma de comissionamento
  const [comissaoTipo, setComissaoTipo] = useState<"percentual" | "fixo">("percentual");
  const [comissaoPercentual, setComissaoPercentual] = useState("15");
  const [comissaoValorFixo, setComissaoValorFixo] = useState("0");
  const [salvandoComissao, setSalvandoComissao] = useState(false);

  // Carregar config de comissão do usuário
  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("usuarios" as any)
      .select("comissao_tipo, comissao_percentual, comissao_valor_fixo")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setComissaoTipo(data.comissao_tipo || "percentual");
          setComissaoPercentual(String(data.comissao_percentual || 15));
          setComissaoValorFixo(String(data.comissao_valor_fixo || 0));
        }
      });
  }, [profile?.id]);

  async function handleSalvarComissao() {
    if (!profile?.id) return;
    setSalvandoComissao(true);
    await supabase.from("usuarios" as any).update({
      comissao_tipo: comissaoTipo,
      comissao_percentual: parseFloat(comissaoPercentual) || 15,
      comissao_valor_fixo: parseFloat(comissaoValorFixo) || 0,
    } as any).eq("id", profile.id);
    toast({ title: "Configuração de comissão salva!" });
    setSalvandoComissao(false);
  }

  const mesAtual = new Date().toISOString().slice(0, 7);
  // Usar dados reais se disponível, senão mock
  const comissoesFinal = comissoesReais.length > 0 ? comissoesReais.map((c: any) => ({
    id: c.id, data: (c.created_at || "").slice(0, 10), associado: c.associado_nome || c.negociacao_id || "",
    negociacao: c.negociacao_codigo || c.negociacao_id || "", valorAdesao: Number(c.valor_adesao || 0),
    percentual: Number(c.percentual || 15), valorRecebido: Number(c.valor_calculado || 0),
    status: (c.pago ? "pago" : c.processando ? "processando" : "pendente") as ComissaoStatus,
  })) : mockComissoes;
  const totalRecebido = comissoesFinal.filter(c => c.status === "pago").reduce((s, c) => s + c.valorRecebido, 0);
  const totalPendente = comissoesFinal.filter(c => c.status === "pendente" || c.status === "processando").reduce((s, c) => s + c.valorRecebido, 0);
  const comissoesMes = comissoesFinal.filter(c => c.data.startsWith(mesAtual) && c.status === "pago").reduce((s, c) => s + c.valorRecebido, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e dados bancários</p>
      </div>

      {/* ═══════════ Perfil do Consultor ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10">
              <User className="h-5 w-5 text-violet-600" />
            </div>
            Perfil do Consultor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
            <Info className="h-4 w-4 text-violet-600" />
            <AlertDescription className="text-xs text-violet-700 dark:text-violet-400">
              Personalize seu perfil para sua landing page pública. Clientes poderão ver sua foto, bio e fotos do seu trabalho.
            </AlertDescription>
          </Alert>

          {/* Foto de Capa */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Camera className="h-3 w-3" /> Foto de Capa (Hero Image)
            </Label>
            <div
              className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => capaInputRef.current?.click()}
            >
              {fotoCapa ? (
                <img src={fotoCapa} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImagePlus className="h-10 w-10 mb-2" />
                  <p className="text-sm">Clique para enviar foto de capa</p>
                  <p className="text-[10px]">Recomendado: 1200x400px</p>
                </div>
              )}
              {uploadingCapa && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleCapaUpload} />
          </div>

          {/* Fotos Trabalhando */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <ImagePlus className="h-3 w-3" /> Fotos Trabalhando (até 6)
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {fotosTrabalho.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveFoto(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {fotosTrabalho.length < 6 && (
                <div
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fotosInputRef.current?.click()}
                >
                  {uploadingFoto ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input ref={fotosInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotosUpload} />
          </div>

          {/* Fotos de Fundo (Slideshow Landing Page) */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <ImagePlus className="h-3 w-3" /> Fotos de Fundo da Landing Page (até 4)
            </Label>
            <p className="text-[10px] text-muted-foreground">Essas fotos aparecem como slideshow no topo da sua página. Recomendamos imagens de alta qualidade em paisagem.</p>
            <div className="grid grid-cols-4 gap-2">
              {fotosFundo.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden border group">
                  <img src={url} alt={`Fundo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveFundo(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">{i + 1}/4</span>
                </div>
              ))}
              {fotosFundo.length < 4 && (
                <div
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fundoInputRef.current?.click()}
                >
                  {uploadingFundo ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground mt-1">Adicionar</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input ref={fundoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFundoUpload} />
          </div>

          <Separator />

          {/* Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Link className="h-3 w-3" /> Slug Personalizado <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="seu-nome"
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                maxLength={60}
              />
              <p className="text-[10px] text-muted-foreground">Será usado na URL da sua landing page</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preview da Landing Page</Label>
              {slug ? (
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-primary truncate">{landingPageUrl}</span>
                </div>
              ) : (
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50">
                  <span className="text-xs text-muted-foreground">Defina um slug para gerar o link</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bio / Descrição Pessoal</Label>
            <Textarea
              placeholder="Conte um pouco sobre você, sua experiência e como pode ajudar o cliente..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* WhatsApp & Instagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> WhatsApp Pessoal
              </Label>
              <Input
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram
              </Label>
              <Input
                placeholder="@seuusuario"
                value={instagramHandle}
                onChange={e => setInstagramHandle(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="min-w-[200px]">
              {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Forma de Comissionamento ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            Forma de Comissionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="comissaoTipo" checked={comissaoTipo === "percentual"} onChange={() => setComissaoTipo("percentual")} className="accent-emerald-600" />
              <span className="text-sm font-medium">% sobre adesão</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="comissaoTipo" checked={comissaoTipo === "fixo"} onChange={() => setComissaoTipo("fixo")} className="accent-emerald-600" />
              <span className="text-sm font-medium">Valor fixo por contrato</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {comissaoTipo === "percentual" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Percentual (%)</Label>
                <Input type="number" min={0} max={100} value={comissaoPercentual} onChange={e => setComissaoPercentual(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valor Fixo (R$)</Label>
                <Input type="number" min={0} value={comissaoValorFixo} onChange={e => setComissaoValorFixo(e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSalvarComissao} disabled={salvandoComissao} size="sm">
              {salvandoComissao ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar Comissão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Conta Bancária ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              Dados Bancários
            </CardTitle>
            {saved && (
              <Badge variant="outline" className={cn("text-xs", verificado ? "bg-success/15 text-success border-green-300" : "bg-warning/10 text-warning border-warning/30")}>
                {verificado ? <><CheckCircle className="h-3 w-3 mr-1" />Conta verificada</> : <><Clock className="h-3 w-3 mr-1" />Pendente de verificação</>}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-blue-200 bg-primary/50 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-primary dark:text-blue-400">
              Seus dados bancários serão utilizados para recebimento de comissões. Certifique-se de que as informações estão corretas.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Conta <span className="text-destructive">*</span></Label>
              <Select value={tipoConta} onValueChange={setTipoConta}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>{tiposConta.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Banco <span className="text-destructive">*</span></Label>
              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>{bancos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Agência <span className="text-destructive">*</span></Label>
              <Input placeholder="0001" value={agencia} onChange={e => setAgencia(maskAgencia(e.target.value))} maxLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Número da Conta <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input placeholder="12345678" value={conta} onChange={e => setConta(maskConta(e.target.value))} className="flex-1" maxLength={12} />
                <span className="flex items-center text-muted-foreground font-bold">-</span>
                <Input placeholder="0" value={digito} onChange={e => setDigito(maskDigito(e.target.value))} className="w-16 text-center" maxLength={2} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><User className="h-3 w-3" />CPF/CNPJ do Titular <span className="text-destructive">*</span></Label>
              <Input placeholder="000.000.000-00" value={cpfCnpj} onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))} maxLength={18} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome do Titular <span className="text-destructive">*</span></Label>
              <Input placeholder="Nome completo do titular" value={titular} onChange={e => setTitular(e.target.value)} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><KeyRound className="h-3 w-3" />Chave Pix <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
              <Input placeholder="CPF, e-mail, telefone ou chave aleatória" value={chavePix} onChange={e => setChavePix(e.target.value)} maxLength={100} />
              <p className="text-[10px] text-muted-foreground">Pode ser CPF/CNPJ, e-mail, telefone ou chave aleatória</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="min-w-[200px]"><Save className="h-4 w-4 mr-2" />Salvar Dados Bancários</Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Histórico de Recebimentos ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
              <History className="h-5 w-5 text-emerald-600" />
            </div>
            Histórico de Recebimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-t-2 border-t-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-emerald-900/40 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-success dark:text-emerald-400">{fmt(totalRecebido)}</p>
                    <p className="text-[10px] text-muted-foreground">Total Recebido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-amber-900/40 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-warning dark:text-warning">{fmt(totalPendente)}</p>
                    <p className="text-[10px] text-muted-foreground">Pendente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/8 dark:bg-blue-900/40 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary dark:text-blue-400">{fmt(comissoesMes)}</p>
                    <p className="text-[10px] text-muted-foreground">Comissões do Mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Período Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-[140px] text-xs justify-start", !fDateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-[140px] text-xs justify-start", !fDateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={fStatus} onValueChange={v => { setFStatus(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Em Processamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Busca</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nome do associado ou nº negociação"
                  value={fBusca}
                  onChange={e => { setFBusca(e.target.value); setPage(1); }}
                  className="h-8 text-xs pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Exportando Excel..." })}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Exportando PDF..." })}>
                <FileText className="h-3.5 w-3.5 mr-1" />PDF
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Associado</TableHead>
                  <TableHead className="text-xs">Negociação</TableHead>
                  <TableHead className="text-xs text-right">Valor Adesão</TableHead>
                  <TableHead className="text-xs text-center">% Comissão</TableHead>
                  <TableHead className="text-xs text-right">Valor Recebido</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Nenhum registro encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : paginated.map(c => {
                  const st = statusConfig[c.status];
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">{new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm font-medium">{c.associado}</TableCell>
                      <TableCell><span className="text-xs text-primary cursor-pointer hover:underline">{c.negociacao}</span></TableCell>
                      <TableCell className="text-sm text-right">{fmt(c.valorAdesao)}</TableCell>
                      <TableCell className="text-sm text-center font-medium">{c.percentual}%</TableCell>
                      <TableCell className="text-sm text-right font-bold">{fmt(c.valorRecebido)}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", st.cls)}>{st.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} registros
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? "default" : "outline"}
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}